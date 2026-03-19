"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handoffImportFailureAlertToOpenClaw = handoffImportFailureAlertToOpenClaw;
const drizzle_orm_1 = require("drizzle-orm");
const database_1 = require("../config/database");
const schema_1 = require("../db/schema");
const logger_1 = require("./logger");
const openclaw_service_1 = require("./openclaw-service");
const openclaw_log_context_service_1 = require("./openclaw-log-context-service");
const number_utils_1 = require("../utils/number-utils");
const request_utils_1 = require("../utils/request-utils");
const AUTO_REQUEST_TEXT_PREFIX = '[自動通知] 取込失敗が閾値を超えました。';
const OPENCLAW_PENDING_STATUS = 'pending_handoff';
function readConfig() {
    return {
        enabled: process.env.IMPORT_FAILURE_ALERT_OPENCLAW_AUTO_HANDOFF === 'true',
        pharmacyId: (0, request_utils_1.parsePositiveInt)(process.env.IMPORT_FAILURE_ALERT_OPENCLAW_PHARMACY_ID),
        dedupMinutes: (0, number_utils_1.parseBoundedInt)(process.env.IMPORT_FAILURE_ALERT_OPENCLAW_DEDUP_MINUTES, 120, 1, 24 * 30),
    };
}
function buildRequestText(payload) {
    const reasonText = payload.failureByReason
        .slice(0, 3)
        .map((reason) => `${reason.reason}(${reason.count})`)
        .join(', ');
    const message = [
        AUTO_REQUEST_TEXT_PREFIX,
        `直近${payload.windowMinutes}分で ${payload.totalFailures} 件（閾値: ${payload.threshold}）。`,
        reasonText ? `主要理由: ${reasonText}。` : '主要理由: 情報なし。',
        '運用ログを確認し、原因分析・修正方針・実装ステップを提示してください。',
    ].join(' ');
    return message.slice(0, 2000);
}
function buildContext(payload, operationLogs) {
    return {
        source: 'import_failure_alert_scheduler',
        alertSnapshot: {
            generatedAt: payload.detectedAt,
            importFailures: {
                windowMinutes: payload.windowMinutes,
                threshold: payload.threshold,
                total: payload.totalFailures,
                monitoredActions: payload.monitoredActions,
                latestFailureAt: payload.latestFailureAt,
                byAction: payload.failureByAction,
                byReason: payload.failureByReason,
            },
        },
        ...(operationLogs ? { operationLogs } : {}),
    };
}
async function hasRecentAutoHandoff(pharmacyId, dedupMinutes) {
    const dedupStart = new Date(Date.now() - dedupMinutes * 60_000).toISOString();
    const [row] = await database_1.db.select({ id: schema_1.userRequests.id })
        .from(schema_1.userRequests)
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.userRequests.pharmacyId, pharmacyId), (0, drizzle_orm_1.like)(schema_1.userRequests.requestText, `${AUTO_REQUEST_TEXT_PREFIX}%`), (0, drizzle_orm_1.inArray)(schema_1.userRequests.openclawStatus, ['pending_handoff', 'in_dialogue', 'implementing']), (0, drizzle_orm_1.gte)(schema_1.userRequests.createdAt, dedupStart)))
        .orderBy((0, drizzle_orm_1.desc)(schema_1.userRequests.createdAt))
        .limit(1);
    return Boolean(row);
}
function formatError(err) {
    return err instanceof Error ? err.message : String(err);
}
function skippedAutoHandoff(reason) {
    return {
        triggered: false,
        accepted: false,
        requestId: null,
        status: OPENCLAW_PENDING_STATUS,
        reason,
    };
}
async function collectOperationLogs(pharmacyId) {
    try {
        return await (0, openclaw_log_context_service_1.buildOpenClawLogContext)(pharmacyId);
    }
    catch (contextErr) {
        logger_1.logger.warn('OpenClaw auto handoff: context collection failed', {
            pharmacyId,
            error: formatError(contextErr),
        });
        return null;
    }
}
async function handoffImportFailureAlertToOpenClaw(payload) {
    const config = readConfig();
    if (!config.enabled) {
        return skippedAutoHandoff('disabled');
    }
    if (!config.pharmacyId) {
        logger_1.logger.warn('OpenClaw auto handoff skipped: invalid IMPORT_FAILURE_ALERT_OPENCLAW_PHARMACY_ID');
        return skippedAutoHandoff('invalid_pharmacy_id');
    }
    try {
        if (await hasRecentAutoHandoff(config.pharmacyId, config.dedupMinutes)) {
            logger_1.logger.info('OpenClaw auto handoff skipped: recent request already exists', {
                pharmacyId: config.pharmacyId,
                dedupMinutes: config.dedupMinutes,
            });
            return skippedAutoHandoff('duplicate_inflight');
        }
        const requestText = buildRequestText(payload);
        const operationLogs = await collectOperationLogs(config.pharmacyId);
        const [created] = await database_1.db.insert(schema_1.userRequests)
            .values({
            pharmacyId: config.pharmacyId,
            requestText,
            openclawStatus: 'pending_handoff',
        })
            .returning({
            id: schema_1.userRequests.id,
        });
        const handoff = await (0, openclaw_service_1.handoffToOpenClaw)({
            requestId: created.id,
            pharmacyId: config.pharmacyId,
            requestText,
            context: buildContext(payload, operationLogs),
        });
        if (handoff.accepted) {
            await database_1.db.update(schema_1.userRequests)
                .set({
                openclawStatus: handoff.status,
                openclawThreadId: handoff.threadId,
                openclawSummary: handoff.summary,
                updatedAt: new Date().toISOString(),
            })
                .where((0, drizzle_orm_1.eq)(schema_1.userRequests.id, created.id));
        }
        logger_1.logger.info('OpenClaw auto handoff completed from import failure alert', {
            requestId: created.id,
            pharmacyId: config.pharmacyId,
            accepted: handoff.accepted,
            status: handoff.status,
        });
        return {
            triggered: true,
            accepted: handoff.accepted,
            requestId: created.id,
            status: handoff.status,
            reason: handoff.note,
        };
    }
    catch (err) {
        logger_1.logger.error('OpenClaw auto handoff failed from import failure alert', {
            error: formatError(err),
        });
        return skippedAutoHandoff('error');
    }
}
//# sourceMappingURL=openclaw-auto-handoff-service.js.map