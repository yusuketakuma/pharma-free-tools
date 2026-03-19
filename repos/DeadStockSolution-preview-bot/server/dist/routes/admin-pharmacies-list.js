"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const drizzle_orm_1 = require("drizzle-orm");
const database_1 = require("../config/database");
const schema_1 = require("../db/schema");
const path_utils_1 = require("../utils/path-utils");
const db_utils_1 = require("../utils/db-utils");
const openclaw_service_1 = require("../services/openclaw-service");
const admin_utils_1 = require("./admin-utils");
const router = (0, express_1.Router)();
router.get('/pharmacies/options', async (_req, res) => {
    try {
        const rows = await database_1.db.select({
            id: schema_1.pharmacies.id,
            name: schema_1.pharmacies.name,
            isActive: schema_1.pharmacies.isActive,
            isTestAccount: schema_1.pharmacies.isTestAccount,
        })
            .from(schema_1.pharmacies)
            .orderBy((0, drizzle_orm_1.desc)(schema_1.pharmacies.createdAt));
        res.json({
            data: rows,
        });
    }
    catch (err) {
        (0, admin_utils_1.handleAdminError)(err, 'Admin pharmacy options error', '薬局候補の取得に失敗しました', res);
    }
});
router.get('/pharmacies', async (req, res) => {
    try {
        const { page, limit, offset } = (0, admin_utils_1.parseListPagination)(req);
        const rows = await database_1.db.select({
            id: schema_1.pharmacies.id,
            email: schema_1.pharmacies.email,
            name: schema_1.pharmacies.name,
            prefecture: schema_1.pharmacies.prefecture,
            phone: schema_1.pharmacies.phone,
            fax: schema_1.pharmacies.fax,
            isActive: schema_1.pharmacies.isActive,
            isAdmin: schema_1.pharmacies.isAdmin,
            isTestAccount: schema_1.pharmacies.isTestAccount,
            createdAt: schema_1.pharmacies.createdAt,
        })
            .from(schema_1.pharmacies)
            .orderBy((0, drizzle_orm_1.desc)(schema_1.pharmacies.createdAt))
            .limit(limit)
            .offset(offset);
        const [total] = await database_1.db.select({ count: db_utils_1.rowCount }).from(schema_1.pharmacies);
        (0, admin_utils_1.sendPaginated)(res, rows, page, limit, total.count);
    }
    catch (err) {
        (0, admin_utils_1.handleAdminError)(err, 'Admin pharmacies error', '薬局一覧の取得に失敗しました', res);
    }
});
router.get('/history', async (req, res) => {
    try {
        const { page, limit, offset } = (0, admin_utils_1.parseListPagination)(req);
        const rows = await database_1.db.select({
            id: schema_1.exchangeHistory.id,
            proposalId: schema_1.exchangeHistory.proposalId,
            pharmacyAId: schema_1.exchangeHistory.pharmacyAId,
            pharmacyBId: schema_1.exchangeHistory.pharmacyBId,
            totalValue: schema_1.exchangeHistory.totalValue,
            completedAt: schema_1.exchangeHistory.completedAt,
        })
            .from(schema_1.exchangeHistory)
            .orderBy((0, drizzle_orm_1.desc)(schema_1.exchangeHistory.completedAt))
            .limit(limit)
            .offset(offset);
        const pharmacyIds = [...new Set(rows.flatMap((row) => [row.pharmacyAId, row.pharmacyBId]))];
        const pharmacyRows = pharmacyIds.length > 0
            ? await database_1.db.select({
                id: schema_1.pharmacies.id,
                name: schema_1.pharmacies.name,
            })
                .from(schema_1.pharmacies)
                .where((0, drizzle_orm_1.inArray)(schema_1.pharmacies.id, pharmacyIds))
            : [];
        const pharmacyMap = new Map(pharmacyRows.map((row) => [row.id, row.name]));
        const [total] = await database_1.db.select({ count: db_utils_1.rowCount }).from(schema_1.exchangeHistory);
        const mappedRows = rows.map((row) => ({
            ...row,
            pharmacyAName: pharmacyMap.get(row.pharmacyAId) ?? '',
            pharmacyBName: pharmacyMap.get(row.pharmacyBId) ?? '',
        }));
        (0, admin_utils_1.sendPaginated)(res, mappedRows, page, limit, total.count);
    }
    catch (err) {
        (0, admin_utils_1.handleAdminError)(err, 'Admin history error', '交換履歴の取得に失敗しました', res);
    }
});
router.get('/messages', async (req, res) => {
    try {
        const { page, limit, offset } = (0, admin_utils_1.parseListPagination)(req);
        const rows = await database_1.db.select({
            id: schema_1.adminMessages.id,
            senderAdminId: schema_1.adminMessages.senderAdminId,
            targetType: schema_1.adminMessages.targetType,
            targetPharmacyId: schema_1.adminMessages.targetPharmacyId,
            title: schema_1.adminMessages.title,
            body: schema_1.adminMessages.body,
            actionPath: schema_1.adminMessages.actionPath,
            createdAt: schema_1.adminMessages.createdAt,
        })
            .from(schema_1.adminMessages)
            .orderBy((0, drizzle_orm_1.desc)(schema_1.adminMessages.createdAt))
            .limit(limit)
            .offset(offset);
        const [total] = await database_1.db.select({ count: db_utils_1.rowCount }).from(schema_1.adminMessages);
        const mappedRows = rows.map((row) => ({
            ...row,
            actionPath: (0, path_utils_1.sanitizeInternalPath)(row.actionPath) ?? null,
        }));
        (0, admin_utils_1.sendPaginated)(res, mappedRows, page, limit, total.count);
    }
    catch (err) {
        (0, admin_utils_1.handleAdminError)(err, 'Admin messages list error', '管理者メッセージ一覧の取得に失敗しました', res);
    }
});
router.get('/requests', async (req, res) => {
    try {
        const { page, limit, offset } = (0, admin_utils_1.parseListPagination)(req);
        const rows = await database_1.db.select({
            id: schema_1.userRequests.id,
            pharmacyId: schema_1.userRequests.pharmacyId,
            pharmacyName: schema_1.pharmacies.name,
            requestText: schema_1.userRequests.requestText,
            openclawStatus: schema_1.userRequests.openclawStatus,
            openclawThreadId: schema_1.userRequests.openclawThreadId,
            openclawSummary: schema_1.userRequests.openclawSummary,
            createdAt: schema_1.userRequests.createdAt,
            updatedAt: schema_1.userRequests.updatedAt,
        })
            .from(schema_1.userRequests)
            .innerJoin(schema_1.pharmacies, (0, drizzle_orm_1.eq)(schema_1.userRequests.pharmacyId, schema_1.pharmacies.id))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.userRequests.createdAt))
            .limit(limit)
            .offset(offset);
        const [total] = await database_1.db.select({ count: db_utils_1.rowCount }).from(schema_1.userRequests);
        (0, admin_utils_1.sendPaginated)(res, rows, page, limit, total.count, {
            connector: {
                configured: (0, openclaw_service_1.isOpenClawConnectorConfigured)(),
                webhookConfigured: (0, openclaw_service_1.isOpenClawWebhookConfigured)(),
                implementationBranch: (0, openclaw_service_1.getOpenClawImplementationBranch)(),
            },
        });
    }
    catch (err) {
        (0, admin_utils_1.handleAdminError)(err, 'Admin user requests list error', '要望一覧の取得に失敗しました', res);
    }
});
exports.default = router;
//# sourceMappingURL=admin-pharmacies-list.js.map