"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const performance_scale_indexes_1 = require("./performance-scale-indexes");
const logger_1 = require("../services/logger");
async function main() {
    logger_1.logger.info('Applying performance scale indexes...');
    await (0, performance_scale_indexes_1.applyPerformanceScaleIndexes)();
    logger_1.logger.info('Performance scale indexes complete.');
    process.exit(0);
}
main().catch((err) => {
    logger_1.logger.error('Performance scale index rollout failed', {
        error: err instanceof Error ? err.message : String(err),
    });
    process.exit(1);
});
//# sourceMappingURL=apply-performance-scale-indexes.js.map