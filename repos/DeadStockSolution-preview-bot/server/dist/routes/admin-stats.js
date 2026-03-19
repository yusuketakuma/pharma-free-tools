"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const drizzle_orm_1 = require("drizzle-orm");
const database_1 = require("../config/database");
const schema_1 = require("../db/schema");
const db_utils_1 = require("../utils/db-utils");
const observability_service_1 = require("../services/observability-service");
const monitoring_kpi_service_1 = require("../services/monitoring-kpi-service");
const admin_utils_1 = require("./admin-utils");
const router = (0, express_1.Router)();
router.get('/stats', async (_req, res) => {
    try {
        const [[pharmacyCount], [activePharmacyCount], [uploadCount], [proposalCount], [historyCount], [pickupCount], [exchangeAmount],] = await Promise.all([
            database_1.db.select({ count: db_utils_1.rowCount }).from(schema_1.pharmacies),
            database_1.db.select({ count: db_utils_1.rowCount })
                .from(schema_1.pharmacies)
                .where((0, drizzle_orm_1.eq)(schema_1.pharmacies.isActive, true)),
            database_1.db.select({ count: db_utils_1.rowCount }).from(schema_1.uploads),
            database_1.db.select({ count: db_utils_1.rowCount }).from(schema_1.exchangeProposals),
            database_1.db.select({ count: db_utils_1.rowCount }).from(schema_1.exchangeHistory),
            database_1.db.select({ count: db_utils_1.rowCount })
                .from(schema_1.exchangeProposalItems)
                .innerJoin(schema_1.exchangeProposals, (0, drizzle_orm_1.eq)(schema_1.exchangeProposalItems.proposalId, schema_1.exchangeProposals.id))
                .where((0, drizzle_orm_1.eq)(schema_1.exchangeProposals.status, 'completed')),
            database_1.db.select({
                total: (0, drizzle_orm_1.sql) `coalesce(sum(${schema_1.exchangeHistory.totalValue}), 0)`,
            }).from(schema_1.exchangeHistory),
        ]);
        res.json({
            totalPharmacies: pharmacyCount.count,
            activePharmacies: activePharmacyCount.count,
            inactivePharmacies: pharmacyCount.count - activePharmacyCount.count,
            totalUploads: uploadCount.count,
            totalProposals: proposalCount.count,
            totalExchanges: historyCount.count,
            totalPickupItems: pickupCount.count,
            totalExchangeValue: Number(exchangeAmount.total ?? 0),
        });
    }
    catch (err) {
        (0, admin_utils_1.handleAdminError)(err, 'Admin stats error', '統計情報の取得に失敗しました', res);
    }
});
router.get('/alerts', async (_req, res) => {
    try {
        const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const [[failedUploadJobs], [stalledUploadJobs], [unreadNotificationsCount], [unreadMatchNotificationsCount], [pendingProposalsCount],] = await Promise.all([
            database_1.db.select({ count: db_utils_1.rowCount })
                .from(schema_1.uploadConfirmJobs)
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.uploadConfirmJobs.status, 'failed'), (0, drizzle_orm_1.gte)(schema_1.uploadConfirmJobs.createdAt, since))),
            database_1.db.select({ count: db_utils_1.rowCount })
                .from(schema_1.uploadConfirmJobs)
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.uploadConfirmJobs.status, 'pending'), (0, drizzle_orm_1.gte)(schema_1.uploadConfirmJobs.createdAt, since))),
            database_1.db.select({ count: db_utils_1.rowCount })
                .from(schema_1.notifications)
                .where((0, drizzle_orm_1.eq)(schema_1.notifications.isRead, false)),
            database_1.db.select({ count: db_utils_1.rowCount })
                .from(schema_1.matchNotifications)
                .where((0, drizzle_orm_1.eq)(schema_1.matchNotifications.isRead, false)),
            database_1.db.select({ count: db_utils_1.rowCount })
                .from(schema_1.exchangeProposals)
                .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.gte)(schema_1.exchangeProposals.proposedAt, since), (0, drizzle_orm_1.sql) `${schema_1.exchangeProposals.status} IN ('proposed', 'accepted_a', 'accepted_b')`)),
        ]);
        res.json({
            failedUploadJobs24h: failedUploadJobs.count,
            stalledUploadJobs24h: stalledUploadJobs.count,
            unreadNotifications: unreadNotificationsCount.count + unreadMatchNotificationsCount.count,
            pendingProposalActions24h: pendingProposalsCount.count,
        });
    }
    catch (err) {
        (0, admin_utils_1.handleAdminError)(err, 'Admin alerts error', 'アラート集計の取得に失敗しました', res);
    }
});
router.get('/kpis', async (req, res) => {
    try {
        const minutesRaw = Number(req.query.minutes);
        const minutes = Number.isFinite(minutesRaw) ? minutesRaw : 60;
        const snapshot = await (0, monitoring_kpi_service_1.getMonitoringKpiSnapshot)(minutes);
        res.json(snapshot);
    }
    catch (err) {
        (0, admin_utils_1.handleAdminError)(err, 'Admin KPI snapshot error', 'KPI監視情報の取得に失敗しました', res);
    }
});
router.get('/observability', async (req, res) => {
    try {
        const minutesRaw = Number(req.query.minutes);
        const minutes = Number.isFinite(minutesRaw) ? minutesRaw : 60;
        const snapshot = (0, observability_service_1.getObservabilitySnapshot)(minutes);
        res.json(snapshot);
    }
    catch (err) {
        (0, admin_utils_1.handleAdminError)(err, 'Admin observability error', '監視情報の取得に失敗しました', res);
    }
});
exports.default = router;
//# sourceMappingURL=admin-stats.js.map