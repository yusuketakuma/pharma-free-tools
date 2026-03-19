"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const monthly_report_service_1 = require("../services/monthly-report-service");
const admin_utils_1 = require("./admin-utils");
const router = (0, express_1.Router)();
router.get('/reports/monthly', async (req, res) => {
    try {
        const { page, limit } = (0, admin_utils_1.parseListPagination)(req);
        const result = await (0, monthly_report_service_1.listMonthlyReports)(page, limit);
        (0, admin_utils_1.sendPaginated)(res, result.data, page, limit, result.total);
    }
    catch (err) {
        (0, admin_utils_1.handleAdminError)(err, 'Admin monthly reports list error', '月次レポート一覧の取得に失敗しました', res);
    }
});
router.post('/reports/monthly/generate', async (req, res) => {
    try {
        const defaultTarget = (0, monthly_report_service_1.resolveDefaultTargetMonth)();
        const yearRaw = Number(req.body?.year ?? defaultTarget.year);
        const monthRaw = Number(req.body?.month ?? defaultTarget.month);
        (0, monthly_report_service_1.validateYearMonth)(yearRaw, monthRaw);
        const result = await (0, monthly_report_service_1.generateMonthlyReport)(yearRaw, monthRaw, req.user?.id ?? null);
        res.status(201).json({
            message: `${result.year}年${result.month}月のレポートを生成しました`,
            report: {
                id: result.id,
                year: result.year,
                month: result.month,
                generatedAt: result.generatedAt,
            },
            metrics: result.metrics,
        });
    }
    catch (err) {
        if (err instanceof Error && err.message.includes('不正')) {
            res.status(400).json({ error: err.message });
            return;
        }
        (0, admin_utils_1.handleAdminError)(err, 'Admin monthly report generate error', '月次レポート生成に失敗しました', res);
    }
});
router.get('/reports/monthly/:id/download', async (req, res) => {
    try {
        const id = (0, admin_utils_1.parseIdOrBadRequest)(res, req.params.id);
        if (!id)
            return;
        const report = await (0, monthly_report_service_1.getMonthlyReportById)(id);
        if (!report) {
            res.status(404).json({ error: 'レポートが見つかりません' });
            return;
        }
        const formatRaw = typeof req.query.format === 'string' ? req.query.format : 'json';
        const format = formatRaw === 'csv' ? 'csv' : 'json';
        const filenameBase = `monthly-report-${report.year}-${String(report.month).padStart(2, '0')}`;
        if (format === 'csv') {
            const parsed = JSON.parse(report.reportJson);
            const csv = (0, monthly_report_service_1.monthlyReportToCsv)(parsed);
            res.setHeader('Content-Type', 'text/csv; charset=utf-8');
            res.setHeader('Content-Disposition', `attachment; filename="${filenameBase}.csv"`);
            res.send(`\uFEFF${csv}`);
            return;
        }
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${filenameBase}.json"`);
        res.send(report.reportJson);
    }
    catch (err) {
        (0, admin_utils_1.handleAdminError)(err, 'Admin monthly report download error', '月次レポートのダウンロードに失敗しました', res);
    }
});
exports.default = router;
//# sourceMappingURL=admin-reports.js.map