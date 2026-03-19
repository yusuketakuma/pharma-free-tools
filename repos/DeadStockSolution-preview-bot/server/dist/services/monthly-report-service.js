"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveDefaultTargetMonth = resolveDefaultTargetMonth;
exports.validateYearMonth = validateYearMonth;
exports.buildMonthlyReportMetrics = buildMonthlyReportMetrics;
exports.generateMonthlyReport = generateMonthlyReport;
exports.listMonthlyReports = listMonthlyReports;
exports.getMonthlyReportById = getMonthlyReportById;
exports.monthlyReportToCsv = monthlyReportToCsv;
const drizzle_orm_1 = require("drizzle-orm");
const database_1 = require("../config/database");
const schema_1 = require("../db/schema");
function to2(value) {
    return Math.round(value * 100) / 100;
}
function toMonthStart(year, month) {
    return new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
}
function resolveDefaultTargetMonth(now = new Date()) {
    const year = now.getUTCFullYear();
    const month = now.getUTCMonth() + 1;
    if (month === 1) {
        return { year: year - 1, month: 12 };
    }
    return { year, month: month - 1 };
}
function validateYearMonth(year, month) {
    if (!Number.isInteger(year) || year < 2000 || year > 2100) {
        throw new Error('年の指定が不正です');
    }
    if (!Number.isInteger(month) || month < 1 || month > 12) {
        throw new Error('月の指定が不正です');
    }
}
async function buildMonthlyReportMetrics(year, month) {
    validateYearMonth(year, month);
    const start = toMonthStart(year, month);
    const end = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0));
    const startIso = start.toISOString();
    const endIso = end.toISOString();
    const today = new Date();
    const todayDate = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
    const nearExpiryLimit = new Date(todayDate.getTime() + (120 * 24 * 60 * 60 * 1000)).toISOString().slice(0, 10);
    const todayIsoDate = todayDate.toISOString().slice(0, 10);
    const [[proposalCountRow], [rejectedCountRow], [confirmedCountRow], [historyCountRow], [totalExchangeValueRow], [uploadCountRow], [deadStockUploadCountRow], [usedMedUploadCountRow], [nearExpiryCountRow], [expiredCountRow],] = await Promise.all([
        database_1.db.select({ count: (0, drizzle_orm_1.sql) `count(*)` })
            .from(schema_1.exchangeProposals)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.gte)(schema_1.exchangeProposals.proposedAt, startIso), (0, drizzle_orm_1.lt)(schema_1.exchangeProposals.proposedAt, endIso))),
        database_1.db.select({ count: (0, drizzle_orm_1.sql) `count(*)` })
            .from(schema_1.exchangeProposals)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.gte)(schema_1.exchangeProposals.proposedAt, startIso), (0, drizzle_orm_1.lt)(schema_1.exchangeProposals.proposedAt, endIso), (0, drizzle_orm_1.eq)(schema_1.exchangeProposals.status, 'rejected'))),
        database_1.db.select({ count: (0, drizzle_orm_1.sql) `count(*)` })
            .from(schema_1.exchangeProposals)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.gte)(schema_1.exchangeProposals.proposedAt, startIso), (0, drizzle_orm_1.lt)(schema_1.exchangeProposals.proposedAt, endIso), (0, drizzle_orm_1.eq)(schema_1.exchangeProposals.status, 'confirmed'))),
        database_1.db.select({ count: (0, drizzle_orm_1.sql) `count(*)` })
            .from(schema_1.exchangeHistory)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.gte)(schema_1.exchangeHistory.completedAt, startIso), (0, drizzle_orm_1.lt)(schema_1.exchangeHistory.completedAt, endIso))),
        database_1.db.select({ total: (0, drizzle_orm_1.sql) `coalesce(sum(${schema_1.exchangeHistory.totalValue}), 0)` })
            .from(schema_1.exchangeHistory)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.gte)(schema_1.exchangeHistory.completedAt, startIso), (0, drizzle_orm_1.lt)(schema_1.exchangeHistory.completedAt, endIso))),
        database_1.db.select({ count: (0, drizzle_orm_1.sql) `count(*)` })
            .from(schema_1.uploads)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.gte)(schema_1.uploads.createdAt, startIso), (0, drizzle_orm_1.lt)(schema_1.uploads.createdAt, endIso))),
        database_1.db.select({ count: (0, drizzle_orm_1.sql) `count(*)` })
            .from(schema_1.uploads)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.gte)(schema_1.uploads.createdAt, startIso), (0, drizzle_orm_1.lt)(schema_1.uploads.createdAt, endIso), (0, drizzle_orm_1.eq)(schema_1.uploads.uploadType, 'dead_stock'))),
        database_1.db.select({ count: (0, drizzle_orm_1.sql) `count(*)` })
            .from(schema_1.uploads)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.gte)(schema_1.uploads.createdAt, startIso), (0, drizzle_orm_1.lt)(schema_1.uploads.createdAt, endIso), (0, drizzle_orm_1.eq)(schema_1.uploads.uploadType, 'used_medication'))),
        database_1.db.select({ count: (0, drizzle_orm_1.sql) `count(*)` })
            .from(schema_1.deadStockItems)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.deadStockItems.isAvailable, true), (0, drizzle_orm_1.gte)(schema_1.deadStockItems.expirationDateIso, todayIsoDate), (0, drizzle_orm_1.lte)(schema_1.deadStockItems.expirationDateIso, nearExpiryLimit))),
        database_1.db.select({ count: (0, drizzle_orm_1.sql) `count(*)` })
            .from(schema_1.deadStockItems)
            .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.deadStockItems.isAvailable, true), (0, drizzle_orm_1.lt)(schema_1.deadStockItems.expirationDateIso, todayIsoDate))),
    ]);
    return {
        year,
        month,
        periodStart: startIso,
        periodEnd: endIso,
        proposalCount: Number(proposalCountRow?.count ?? 0),
        completedExchangeCount: Number(historyCountRow?.count ?? 0),
        rejectedProposalCount: Number(rejectedCountRow?.count ?? 0),
        confirmedProposalCount: Number(confirmedCountRow?.count ?? 0),
        totalExchangeValue: to2(Number(totalExchangeValueRow?.total ?? 0)),
        uploadCount: Number(uploadCountRow?.count ?? 0),
        deadStockUploadCount: Number(deadStockUploadCountRow?.count ?? 0),
        usedMedicationUploadCount: Number(usedMedUploadCountRow?.count ?? 0),
        nearExpiryItemCount: Number(nearExpiryCountRow?.count ?? 0),
        expiredItemCount: Number(expiredCountRow?.count ?? 0),
    };
}
async function generateMonthlyReport(year, month, generatedBy) {
    const metrics = await buildMonthlyReportMetrics(year, month);
    const now = new Date().toISOString();
    const payload = JSON.stringify(metrics);
    const [saved] = await database_1.db.insert(schema_1.monthlyReports).values({
        year,
        month,
        status: 'success',
        reportJson: payload,
        generatedBy,
        generatedAt: now,
    }).onConflictDoUpdate({
        target: [schema_1.monthlyReports.year, schema_1.monthlyReports.month],
        set: {
            status: 'success',
            reportJson: payload,
            generatedBy,
            generatedAt: now,
        },
    }).returning({
        id: schema_1.monthlyReports.id,
        year: schema_1.monthlyReports.year,
        month: schema_1.monthlyReports.month,
        generatedAt: schema_1.monthlyReports.generatedAt,
    });
    return {
        id: saved.id,
        year: saved.year,
        month: saved.month,
        generatedAt: saved.generatedAt,
        metrics,
    };
}
async function listMonthlyReports(page, limit) {
    const offset = (page - 1) * limit;
    const [rows, [totalRow]] = await Promise.all([
        database_1.db.select({
            id: schema_1.monthlyReports.id,
            year: schema_1.monthlyReports.year,
            month: schema_1.monthlyReports.month,
            status: schema_1.monthlyReports.status,
            generatedBy: schema_1.monthlyReports.generatedBy,
            generatedAt: schema_1.monthlyReports.generatedAt,
        })
            .from(schema_1.monthlyReports)
            .orderBy((0, drizzle_orm_1.desc)(schema_1.monthlyReports.year), (0, drizzle_orm_1.desc)(schema_1.monthlyReports.month), (0, drizzle_orm_1.desc)(schema_1.monthlyReports.id))
            .limit(limit)
            .offset(offset),
        database_1.db.select({ count: (0, drizzle_orm_1.sql) `count(*)` }).from(schema_1.monthlyReports),
    ]);
    return {
        data: rows,
        total: Number(totalRow?.count ?? 0),
    };
}
async function getMonthlyReportById(id) {
    const [row] = await database_1.db.select({
        id: schema_1.monthlyReports.id,
        year: schema_1.monthlyReports.year,
        month: schema_1.monthlyReports.month,
        status: schema_1.monthlyReports.status,
        generatedAt: schema_1.monthlyReports.generatedAt,
        reportJson: schema_1.monthlyReports.reportJson,
    })
        .from(schema_1.monthlyReports)
        .where((0, drizzle_orm_1.eq)(schema_1.monthlyReports.id, id))
        .limit(1);
    return row ?? null;
}
function escapeCsv(value) {
    const raw = value === null || value === undefined ? '' : String(value);
    if (/[",\n]/.test(raw)) {
        return `"${raw.replace(/"/g, '""')}"`;
    }
    return raw;
}
function monthlyReportToCsv(metrics) {
    const rows = [
        ['year', metrics.year],
        ['month', metrics.month],
        ['periodStart', metrics.periodStart],
        ['periodEnd', metrics.periodEnd],
        ['proposalCount', metrics.proposalCount],
        ['completedExchangeCount', metrics.completedExchangeCount],
        ['rejectedProposalCount', metrics.rejectedProposalCount],
        ['confirmedProposalCount', metrics.confirmedProposalCount],
        ['totalExchangeValue', metrics.totalExchangeValue],
        ['uploadCount', metrics.uploadCount],
        ['deadStockUploadCount', metrics.deadStockUploadCount],
        ['usedMedicationUploadCount', metrics.usedMedicationUploadCount],
        ['nearExpiryItemCount', metrics.nearExpiryItemCount],
        ['expiredItemCount', metrics.expiredItemCount],
    ];
    return [
        'key,value',
        ...rows.map(([key, value]) => `${escapeCsv(key)},${escapeCsv(value)}`),
    ].join('\n');
}
//# sourceMappingURL=monthly-report-service.js.map