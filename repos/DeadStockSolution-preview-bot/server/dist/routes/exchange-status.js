"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const exchange_service_1 = require("../services/exchange-service");
const log_service_1 = require("../services/log-service");
const exchange_utils_1 = require("./exchange-utils");
const router = (0, express_1.Router)();
function sanitizeProposalActionError(err) {
    const message = err instanceof Error ? err.message : '';
    if (message.includes('見つかりません') || message.includes('アクセス権限')) {
        return { status: 404, message: 'マッチングが見つかりません' };
    }
    if (message.includes('状態が変更された')) {
        return { status: 409, message: '状態が変更されたため、再読み込みして再試行してください' };
    }
    return { status: 400, message: '操作に失敗しました' };
}
// Accept proposal
router.post('/proposals/:id/accept', async (req, res) => {
    try {
        const id = (0, exchange_utils_1.parseExchangeIdOrBadRequest)(res, req.params.id);
        if (!id)
            return;
        const newStatus = await (0, exchange_service_1.acceptProposal)(id, req.user.id);
        const msg = newStatus === 'confirmed' ? '仮マッチングが確定しました' : '仮マッチングを承認しました（相手薬局の承認待ち）';
        void (0, log_service_1.writeLog)('proposal_accept', {
            pharmacyId: req.user.id,
            detail: `proposalId=${id}|status=${newStatus}`,
            ipAddress: (0, log_service_1.getClientIp)(req),
        });
        res.json({ message: msg, status: newStatus });
    }
    catch (err) {
        const failure = sanitizeProposalActionError(err);
        res.status(failure.status).json({ error: failure.message });
    }
});
// Reject proposal
router.post('/proposals/:id/reject', async (req, res) => {
    try {
        const id = (0, exchange_utils_1.parseExchangeIdOrBadRequest)(res, req.params.id);
        if (!id)
            return;
        await (0, exchange_service_1.rejectProposal)(id, req.user.id);
        void (0, log_service_1.writeLog)('proposal_reject', {
            pharmacyId: req.user.id,
            detail: `proposalId=${id}|status=rejected`,
            ipAddress: (0, log_service_1.getClientIp)(req),
        });
        res.json({ message: '仮マッチングを拒否しました' });
    }
    catch (err) {
        const failure = sanitizeProposalActionError(err);
        res.status(failure.status).json({ error: failure.message });
    }
});
// Complete exchange
router.post('/proposals/:id/complete', async (req, res) => {
    try {
        const id = (0, exchange_utils_1.parseExchangeIdOrBadRequest)(res, req.params.id);
        if (!id)
            return;
        await (0, exchange_service_1.completeProposal)(id, req.user.id);
        void (0, log_service_1.writeLog)('proposal_complete', {
            pharmacyId: req.user.id,
            detail: `proposalId=${id}|status=completed`,
            ipAddress: (0, log_service_1.getClientIp)(req),
        });
        res.json({ message: '交換を完了しました' });
    }
    catch (err) {
        const failure = sanitizeProposalActionError(err);
        res.status(failure.status).json({ error: failure.message });
    }
});
exports.default = router;
//# sourceMappingURL=exchange-status.js.map