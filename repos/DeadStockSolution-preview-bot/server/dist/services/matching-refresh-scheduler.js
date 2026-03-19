"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startMatchingRefreshScheduler = startMatchingRefreshScheduler;
exports.stopMatchingRefreshScheduler = stopMatchingRefreshScheduler;
exports.resetMatchingRefreshSchedulerForTests = resetMatchingRefreshSchedulerForTests;
const number_utils_1 = require("../utils/number-utils");
const logger_1 = require("./logger");
const matching_refresh_service_1 = require("./matching-refresh-service");
const DEFAULT_INTERVAL_MS = 30_000;
const DEFAULT_BATCH_SIZE = 20;
const INITIAL_DELAY_MS = 1_500;
let schedulerTimer = null;
let schedulerInterval = null;
let schedulerActive = false;
let jobRunning = false;
function readConfig() {
    return {
        intervalMs: (0, number_utils_1.parseBoundedInt)(process.env.MATCHING_REFRESH_SCHEDULER_INTERVAL_MS, DEFAULT_INTERVAL_MS, 1_000, 10 * 60 * 1000),
        batchSize: (0, number_utils_1.parseBoundedInt)(process.env.MATCHING_REFRESH_SCHEDULER_BATCH_SIZE, DEFAULT_BATCH_SIZE, 1, 100),
    };
}
async function runScheduledMatchingRefresh(batchSize) {
    if (jobRunning) {
        logger_1.logger.info('Matching refresh scheduler: previous run is still in progress, skipping');
        return;
    }
    jobRunning = true;
    try {
        const processed = await (0, matching_refresh_service_1.processPendingMatchingRefreshJobs)(batchSize);
        if (processed > 0) {
            logger_1.logger.info('Matching refresh scheduler processed pending jobs', {
                processed,
                batchSize,
            });
        }
    }
    catch (err) {
        logger_1.logger.error('Matching refresh scheduler run failed', {
            error: err instanceof Error ? err.message : String(err),
        });
    }
    finally {
        jobRunning = false;
    }
}
function clearScheduledTimers() {
    if (schedulerTimer) {
        clearTimeout(schedulerTimer);
        schedulerTimer = null;
    }
    if (schedulerInterval) {
        clearInterval(schedulerInterval);
        schedulerInterval = null;
    }
}
function scheduleLoop(intervalMs, batchSize) {
    if (!schedulerActive)
        return;
    clearScheduledTimers();
    schedulerTimer = setTimeout(() => {
        schedulerTimer = null;
        if (!schedulerActive)
            return;
        void runScheduledMatchingRefresh(batchSize);
    }, INITIAL_DELAY_MS);
    schedulerTimer.unref();
    schedulerInterval = setInterval(() => {
        if (!schedulerActive)
            return;
        void runScheduledMatchingRefresh(batchSize);
    }, intervalMs);
    schedulerInterval.unref();
}
function startMatchingRefreshScheduler() {
    const config = readConfig();
    if (schedulerActive) {
        logger_1.logger.warn('Matching refresh scheduler already running');
        return;
    }
    schedulerActive = true;
    logger_1.logger.info('Matching refresh scheduler started', {
        intervalMs: config.intervalMs,
        batchSize: config.batchSize,
    });
    scheduleLoop(config.intervalMs, config.batchSize);
}
function stopMatchingRefreshScheduler() {
    const wasActive = schedulerActive || schedulerTimer !== null || schedulerInterval !== null;
    schedulerActive = false;
    jobRunning = false;
    clearScheduledTimers();
    if (wasActive) {
        logger_1.logger.info('Matching refresh scheduler stopped');
    }
}
function resetMatchingRefreshSchedulerForTests() {
    schedulerActive = false;
    jobRunning = false;
    clearScheduledTimers();
}
//# sourceMappingURL=matching-refresh-scheduler.js.map