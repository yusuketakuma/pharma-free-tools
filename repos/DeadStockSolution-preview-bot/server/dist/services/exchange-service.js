"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createProposal = createProposal;
exports.acceptProposal = acceptProposal;
exports.rejectProposal = rejectProposal;
exports.completeProposal = completeProposal;
const drizzle_orm_1 = require("drizzle-orm");
const database_1 = require("../config/database");
const schema_1 = require("../db/schema");
const notification_service_1 = require("./notification-service");
const matching_score_service_1 = require("./matching-score-service");
const logger_1 = require("./logger");
const MIN_EXCHANGE_VALUE = 10000;
const VALUE_TOLERANCE = 10;
const RESERVATION_ACTIVE_STATUSES = ['proposed', 'accepted_a', 'accepted_b', 'confirmed'];
async function createNotificationSafely(input) {
    const created = await (0, notification_service_1.createNotification)(input);
    if (created)
        return;
    logger_1.logger.warn('Proposal notification could not be persisted', {
        pharmacyId: input.pharmacyId,
        type: input.type,
        referenceType: input.referenceType ?? null,
        referenceId: input.referenceId ?? null,
    });
}
function parseProposalItems(items, fieldName) {
    if (!Array.isArray(items) || items.length === 0) {
        throw new Error(`${fieldName} が不正です`);
    }
    const normalized = items.map((item) => {
        if (!item || typeof item !== 'object') {
            throw new Error(`${fieldName} に不正な要素が含まれています`);
        }
        const id = Number(item.deadStockItemId);
        const quantityRaw = Number(item.quantity);
        const quantity = Math.round(quantityRaw * 1000) / 1000;
        if (!Number.isInteger(id) || id <= 0) {
            throw new Error(`${fieldName} に不正な在庫IDが含まれています`);
        }
        if (!Number.isFinite(quantity) || quantity <= 0) {
            throw new Error(`${fieldName} に不正な数量が含まれています`);
        }
        return { deadStockItemId: id, quantity };
    });
    const idSet = new Set();
    for (const item of normalized) {
        if (idSet.has(item.deadStockItemId)) {
            throw new Error(`${fieldName} に重複した在庫IDが含まれています`);
        }
        idSet.add(item.deadStockItemId);
    }
    return normalized;
}
function parseCandidate(pharmacyAId, rawCandidate) {
    if (!rawCandidate || typeof rawCandidate !== 'object') {
        throw new Error('候補データが不正です');
    }
    const candidate = rawCandidate;
    const pharmacyBId = Number(candidate.pharmacyId);
    if (!Number.isInteger(pharmacyBId) || pharmacyBId <= 0 || pharmacyBId === pharmacyAId) {
        throw new Error('交換先薬局IDが不正です');
    }
    return {
        pharmacyBId,
        itemsFromA: parseProposalItems(candidate.itemsFromA, 'itemsFromA'),
        itemsFromB: parseProposalItems(candidate.itemsFromB, 'itemsFromB'),
    };
}
// Valid state transitions for exchange proposals
const VALID_TRANSITIONS = {
    proposed: ['accepted_a', 'accepted_b', 'rejected'],
    accepted_a: ['confirmed', 'rejected'],
    accepted_b: ['confirmed', 'rejected'],
    confirmed: ['completed'],
};
async function createProposal(pharmacyAId, rawCandidate) {
    const candidate = parseCandidate(pharmacyAId, rawCandidate);
    return database_1.db.transaction(async (tx) => {
        const [pharmacyB] = await tx.select({ id: schema_1.pharmacies.id, isActive: schema_1.pharmacies.isActive })
            .from(schema_1.pharmacies)
            .where((0, drizzle_orm_1.eq)(schema_1.pharmacies.id, candidate.pharmacyBId))
            .limit(1);
        if (!pharmacyB || !pharmacyB.isActive) {
            throw new Error('交換先薬局が見つからないか、無効です');
        }
        const [blockedRelationship] = await tx.select({ id: schema_1.pharmacyRelationships.id })
            .from(schema_1.pharmacyRelationships)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.pharmacyRelationships.relationshipType, 'blocked'), (0, drizzle_orm_1.or)((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.pharmacyRelationships.pharmacyId, pharmacyAId), (0, drizzle_orm_1.eq)(schema_1.pharmacyRelationships.targetPharmacyId, candidate.pharmacyBId)), (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.pharmacyRelationships.pharmacyId, candidate.pharmacyBId), (0, drizzle_orm_1.eq)(schema_1.pharmacyRelationships.targetPharmacyId, pharmacyAId)))))
            .limit(1);
        if (blockedRelationship) {
            throw new Error('ブロック中の薬局には提案できません');
        }
        const allIds = [...candidate.itemsFromA, ...candidate.itemsFromB].map((item) => item.deadStockItemId);
        const sortedUniqueIds = [...new Set(allIds)].sort((a, b) => a - b);
        if (sortedUniqueIds.length === 0) {
            throw new Error('提案対象の在庫がありません');
        }
        await tx.execute((0, drizzle_orm_1.sql) `
      SELECT ${schema_1.deadStockItems.id}
      FROM ${schema_1.deadStockItems}
      WHERE ${(0, drizzle_orm_1.inArray)(schema_1.deadStockItems.id, sortedUniqueIds)}
      FOR UPDATE
    `);
        const stockRows = await tx.select({
            id: schema_1.deadStockItems.id,
            pharmacyId: schema_1.deadStockItems.pharmacyId,
            quantity: schema_1.deadStockItems.quantity,
            yakkaUnitPrice: schema_1.deadStockItems.yakkaUnitPrice,
            isAvailable: schema_1.deadStockItems.isAvailable,
        })
            .from(schema_1.deadStockItems)
            .where((0, drizzle_orm_1.inArray)(schema_1.deadStockItems.id, sortedUniqueIds));
        const stockMap = new Map();
        for (const row of stockRows) {
            stockMap.set(row.id, row);
        }
        const reservationRows = sortedUniqueIds.length > 0
            ? await tx.select({
                deadStockItemId: schema_1.deadStockReservations.deadStockItemId,
                reservedQty: (0, drizzle_orm_1.sql) `coalesce(sum(${schema_1.deadStockReservations.reservedQuantity}), 0)`,
            })
                .from(schema_1.deadStockReservations)
                .innerJoin(schema_1.exchangeProposals, (0, drizzle_orm_1.eq)(schema_1.deadStockReservations.proposalId, schema_1.exchangeProposals.id))
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.inArray)(schema_1.deadStockReservations.deadStockItemId, sortedUniqueIds), (0, drizzle_orm_1.inArray)(schema_1.exchangeProposals.status, RESERVATION_ACTIVE_STATUSES)))
                .groupBy(schema_1.deadStockReservations.deadStockItemId)
            : [];
        const reservedByStockId = new Map();
        for (const row of reservationRows) {
            reservedByStockId.set(row.deadStockItemId, Number(row.reservedQty ?? 0));
        }
        const validatedA = candidate.itemsFromA.map((item) => {
            const stock = stockMap.get(item.deadStockItemId);
            if (!stock)
                throw new Error('提案対象の在庫が見つかりません');
            if (stock.pharmacyId !== pharmacyAId)
                throw new Error('自薬局の在庫のみ提案できます');
            if (!stock.isAvailable)
                throw new Error('提案対象の在庫が既に利用不可です');
            const availableQty = Number(stock.quantity) - (reservedByStockId.get(item.deadStockItemId) ?? 0);
            if (item.quantity > availableQty)
                throw new Error('提案数量が利用可能在庫数を超えています');
            const unitPrice = Number(stock.yakkaUnitPrice);
            if (!unitPrice || unitPrice <= 0)
                throw new Error('薬価が設定されていない在庫は提案できません');
            return {
                deadStockItemId: item.deadStockItemId,
                fromPharmacyId: pharmacyAId,
                toPharmacyId: candidate.pharmacyBId,
                quantity: item.quantity,
                yakkaValue: (0, matching_score_service_1.roundTo2)(unitPrice * item.quantity),
            };
        });
        const validatedB = candidate.itemsFromB.map((item) => {
            const stock = stockMap.get(item.deadStockItemId);
            if (!stock)
                throw new Error('提案対象の在庫が見つかりません');
            if (stock.pharmacyId !== candidate.pharmacyBId)
                throw new Error('交換先薬局の在庫のみ指定できます');
            if (!stock.isAvailable)
                throw new Error('提案対象の在庫が既に利用不可です');
            const availableQty = Number(stock.quantity) - (reservedByStockId.get(item.deadStockItemId) ?? 0);
            if (item.quantity > availableQty)
                throw new Error('提案数量が利用可能在庫数を超えています');
            const unitPrice = Number(stock.yakkaUnitPrice);
            if (!unitPrice || unitPrice <= 0)
                throw new Error('薬価が設定されていない在庫は提案できません');
            return {
                deadStockItemId: item.deadStockItemId,
                fromPharmacyId: candidate.pharmacyBId,
                toPharmacyId: pharmacyAId,
                quantity: item.quantity,
                yakkaValue: (0, matching_score_service_1.roundTo2)(unitPrice * item.quantity),
            };
        });
        const totalValueA = (0, matching_score_service_1.roundTo2)(validatedA.reduce((sum, item) => sum + item.yakkaValue, 0));
        const totalValueB = (0, matching_score_service_1.roundTo2)(validatedB.reduce((sum, item) => sum + item.yakkaValue, 0));
        const valueDifference = (0, matching_score_service_1.roundTo2)(Math.abs(totalValueA - totalValueB));
        if (Math.min(totalValueA, totalValueB) < MIN_EXCHANGE_VALUE) {
            throw new Error('交換金額が最低金額に達していません');
        }
        if (valueDifference > VALUE_TOLERANCE) {
            throw new Error('交換金額差が許容範囲を超えています');
        }
        const [proposal] = await tx.insert(schema_1.exchangeProposals).values({
            pharmacyAId,
            pharmacyBId: candidate.pharmacyBId,
            status: 'proposed',
            totalValueA: String(totalValueA),
            totalValueB: String(totalValueB),
            valueDifference: String(valueDifference),
        }).returning({ id: schema_1.exchangeProposals.id });
        await tx.insert(schema_1.exchangeProposalItems).values([...validatedA, ...validatedB].map((item) => ({
            proposalId: proposal.id,
            deadStockItemId: item.deadStockItemId,
            fromPharmacyId: item.fromPharmacyId,
            toPharmacyId: item.toPharmacyId,
            quantity: item.quantity,
            yakkaValue: String(item.yakkaValue),
        })));
        await tx.insert(schema_1.deadStockReservations).values([...validatedA, ...validatedB].map((item) => ({
            deadStockItemId: item.deadStockItemId,
            proposalId: proposal.id,
            reservedQuantity: item.quantity,
        })));
        await createNotificationSafely({
            pharmacyId: candidate.pharmacyBId,
            type: 'proposal_received',
            title: '交換提案が届きました',
            message: `新しい交換提案（${validatedA.length + validatedB.length}品目）`,
            referenceType: 'proposal',
            referenceId: proposal.id,
        });
        return proposal.id;
    });
}
async function acceptProposal(proposalId, pharmacyId) {
    return database_1.db.transaction(async (tx) => {
        const [proposal] = await tx.select({
            pharmacyAId: schema_1.exchangeProposals.pharmacyAId,
            pharmacyBId: schema_1.exchangeProposals.pharmacyBId,
            status: schema_1.exchangeProposals.status,
        })
            .from(schema_1.exchangeProposals)
            .where((0, drizzle_orm_1.eq)(schema_1.exchangeProposals.id, proposalId))
            .limit(1);
        if (!proposal)
            throw new Error('マッチングが見つかりません');
        const isA = proposal.pharmacyAId === pharmacyId;
        const isB = proposal.pharmacyBId === pharmacyId;
        if (!isA && !isB)
            throw new Error('このマッチングにアクセスする権限がありません');
        let newStatus;
        if (proposal.status === 'proposed') {
            newStatus = isA ? 'accepted_a' : 'accepted_b';
        }
        else if (proposal.status === 'accepted_a' && isB) {
            newStatus = 'confirmed';
        }
        else if (proposal.status === 'accepted_b' && isA) {
            newStatus = 'confirmed';
        }
        else {
            throw new Error('この仮マッチングは現在承認できる状態ではありません');
        }
        if (!VALID_TRANSITIONS[proposal.status]?.includes(newStatus)) {
            throw new Error('この仮マッチングは現在承認できる状態ではありません');
        }
        // Optimistic lock: only update if status hasn't changed since read
        const updated = await tx.update(schema_1.exchangeProposals)
            .set({ status: newStatus })
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.exchangeProposals.id, proposalId), (0, drizzle_orm_1.eq)(schema_1.exchangeProposals.status, proposal.status)))
            .returning({ id: schema_1.exchangeProposals.id });
        if (updated.length === 0) {
            throw new Error('状態が変更されたため、操作を完了できません。再読み込みしてください');
        }
        const otherPartyId = proposal.pharmacyAId === pharmacyId
            ? proposal.pharmacyBId
            : proposal.pharmacyAId;
        await createNotificationSafely({
            pharmacyId: otherPartyId,
            type: 'proposal_status_changed',
            title: '交換提案のステータスが更新されました',
            message: `提案が${newStatus === 'confirmed' ? '確定' : '承認'}されました`,
            referenceType: 'proposal',
            referenceId: proposalId,
        });
        return newStatus;
    });
}
async function rejectProposal(proposalId, pharmacyId) {
    return database_1.db.transaction(async (tx) => {
        const [proposal] = await tx.select({
            pharmacyAId: schema_1.exchangeProposals.pharmacyAId,
            pharmacyBId: schema_1.exchangeProposals.pharmacyBId,
            status: schema_1.exchangeProposals.status,
        })
            .from(schema_1.exchangeProposals)
            .where((0, drizzle_orm_1.eq)(schema_1.exchangeProposals.id, proposalId))
            .limit(1);
        if (!proposal)
            throw new Error('マッチングが見つかりません');
        const isParty = proposal.pharmacyAId === pharmacyId || proposal.pharmacyBId === pharmacyId;
        if (!isParty)
            throw new Error('このマッチングにアクセスする権限がありません');
        if (!VALID_TRANSITIONS[proposal.status]?.includes('rejected')) {
            throw new Error('このマッチングは拒否できる状態ではありません');
        }
        const updated = await tx.update(schema_1.exchangeProposals)
            .set({ status: 'rejected' })
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.exchangeProposals.id, proposalId), (0, drizzle_orm_1.eq)(schema_1.exchangeProposals.status, proposal.status)))
            .returning({ id: schema_1.exchangeProposals.id });
        if (updated.length === 0) {
            throw new Error('状態が変更されたため、操作を完了できません。再読み込みしてください');
        }
        await tx.delete(schema_1.deadStockReservations)
            .where((0, drizzle_orm_1.eq)(schema_1.deadStockReservations.proposalId, proposalId));
        const rejectOtherPartyId = proposal.pharmacyAId === pharmacyId
            ? proposal.pharmacyBId
            : proposal.pharmacyAId;
        await createNotificationSafely({
            pharmacyId: rejectOtherPartyId,
            type: 'proposal_status_changed',
            title: '交換提案が却下されました',
            message: '相手薬局が提案を却下しました',
            referenceType: 'proposal',
            referenceId: proposalId,
        });
    });
}
async function completeProposal(proposalId, pharmacyId) {
    await database_1.db.transaction(async (tx) => {
        const [proposal] = await tx.select({
            pharmacyAId: schema_1.exchangeProposals.pharmacyAId,
            pharmacyBId: schema_1.exchangeProposals.pharmacyBId,
            status: schema_1.exchangeProposals.status,
            totalValueA: schema_1.exchangeProposals.totalValueA,
            totalValueB: schema_1.exchangeProposals.totalValueB,
        })
            .from(schema_1.exchangeProposals)
            .where((0, drizzle_orm_1.eq)(schema_1.exchangeProposals.id, proposalId))
            .limit(1);
        if (!proposal)
            throw new Error('マッチングが見つかりません');
        if (proposal.status !== 'confirmed')
            throw new Error('このマッチングはまだ確定されていません');
        const isParty = proposal.pharmacyAId === pharmacyId || proposal.pharmacyBId === pharmacyId;
        if (!isParty)
            throw new Error('このマッチングにアクセスする権限がありません');
        const completedAt = new Date().toISOString();
        const [claimedProposal] = await tx.update(schema_1.exchangeProposals)
            .set({ status: 'completed', completedAt })
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.exchangeProposals.id, proposalId), (0, drizzle_orm_1.eq)(schema_1.exchangeProposals.status, 'confirmed')))
            .returning({
            pharmacyAId: schema_1.exchangeProposals.pharmacyAId,
            pharmacyBId: schema_1.exchangeProposals.pharmacyBId,
            totalValueA: schema_1.exchangeProposals.totalValueA,
            totalValueB: schema_1.exchangeProposals.totalValueB,
        });
        if (!claimedProposal) {
            throw new Error('状態が変更されたため、操作を完了できません。再読み込みしてください');
        }
        const items = await tx.select({
            deadStockItemId: schema_1.exchangeProposalItems.deadStockItemId,
            fromPharmacyId: schema_1.exchangeProposalItems.fromPharmacyId,
            quantity: schema_1.exchangeProposalItems.quantity,
        })
            .from(schema_1.exchangeProposalItems)
            .where((0, drizzle_orm_1.eq)(schema_1.exchangeProposalItems.proposalId, proposalId));
        if (items.length === 0) {
            throw new Error('提案アイテムが存在しません');
        }
        const itemIds = [...new Set(items.map((item) => item.deadStockItemId))];
        const stockRows = await tx.select({
            id: schema_1.deadStockItems.id,
            pharmacyId: schema_1.deadStockItems.pharmacyId,
            quantity: schema_1.deadStockItems.quantity,
            isAvailable: schema_1.deadStockItems.isAvailable,
        })
            .from(schema_1.deadStockItems)
            .where((0, drizzle_orm_1.inArray)(schema_1.deadStockItems.id, itemIds));
        const stockMap = new Map(stockRows.map((row) => [row.id, row]));
        for (const item of items) {
            const stock = stockMap.get(item.deadStockItemId);
            if (!stock || stock.pharmacyId !== item.fromPharmacyId || !stock.isAvailable) {
                throw new Error('在庫状態が変更されているため、交換を完了できません');
            }
            if (Number(stock.quantity) < Number(item.quantity)) {
                throw new Error('在庫数量が不足しているため、交換を完了できません');
            }
        }
        for (const item of items) {
            const updated = await tx.update(schema_1.deadStockItems)
                .set({
                quantity: (0, drizzle_orm_1.sql) `${schema_1.deadStockItems.quantity} - ${item.quantity}`,
                isAvailable: (0, drizzle_orm_1.sql) `CASE WHEN (${schema_1.deadStockItems.quantity} - ${item.quantity}) <= 0 THEN false ELSE true END`,
            })
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.deadStockItems.id, item.deadStockItemId), (0, drizzle_orm_1.eq)(schema_1.deadStockItems.isAvailable, true), (0, drizzle_orm_1.sql) `${schema_1.deadStockItems.quantity} >= ${item.quantity}`))
                .returning({ id: schema_1.deadStockItems.id });
            if (updated.length === 0) {
                throw new Error('在庫状態が変更されているため、交換を完了できません');
            }
        }
        const totalValue = Number(claimedProposal.totalValueA ?? 0) + Number(claimedProposal.totalValueB ?? 0);
        await tx.insert(schema_1.exchangeHistory).values({
            proposalId,
            pharmacyAId: claimedProposal.pharmacyAId,
            pharmacyBId: claimedProposal.pharmacyBId,
            totalValue: String(totalValue),
            completedAt,
        });
        await tx.delete(schema_1.deadStockReservations)
            .where((0, drizzle_orm_1.eq)(schema_1.deadStockReservations.proposalId, proposalId));
    });
}
//# sourceMappingURL=exchange-service.js.map