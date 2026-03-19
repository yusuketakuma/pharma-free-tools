"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.__testables = void 0;
exports.applyPerformanceScaleIndexes = applyPerformanceScaleIndexes;
const drizzle_orm_1 = require("drizzle-orm");
const database_1 = require("../config/database");
const logger_1 = require("../services/logger");
const PERFORMANCE_SCALE_INDEX_DEFINITIONS = [
    {
        name: 'idx_dead_stock_items_drug_name_trgm_available',
        statement: `
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_dead_stock_items_drug_name_trgm_available"
        ON "dead_stock_items" USING gin ("drug_name" gin_trgm_ops)
        WHERE "is_available" = true;
    `,
    },
    {
        name: 'idx_used_medication_items_drug_name_trgm',
        statement: `
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_used_medication_items_drug_name_trgm"
        ON "used_medication_items" USING gin ("drug_name" gin_trgm_ops);
    `,
    },
    {
        name: 'idx_pharmacies_name_trgm_active',
        statement: `
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_pharmacies_name_trgm_active"
        ON "pharmacies" USING gin ("name" gin_trgm_ops)
        WHERE "is_active" = true;
    `,
    },
    {
        name: 'idx_system_events_event_type_trgm',
        statement: `
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_system_events_event_type_trgm"
        ON "system_events" USING gin ("event_type" gin_trgm_ops);
    `,
    },
    {
        name: 'idx_system_events_message_trgm',
        statement: `
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_system_events_message_trgm"
        ON "system_events" USING gin ("message" gin_trgm_ops);
    `,
    },
    {
        name: 'idx_notifications_pharmacy_created_id',
        statement: `
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_notifications_pharmacy_created_id"
        ON "notifications" ("pharmacy_id", "created_at" DESC, "id" DESC);
    `,
    },
    {
        name: 'idx_match_notifications_pharmacy_created_id',
        statement: `
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_match_notifications_pharmacy_created_id"
        ON "match_notifications" ("pharmacy_id", "created_at" DESC, "id" DESC);
    `,
    },
    {
        name: 'idx_admin_message_reads_pharmacy_message',
        statement: `
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_admin_message_reads_pharmacy_message"
        ON "admin_message_reads" ("pharmacy_id", "message_id");
    `,
    },
    {
        name: 'idx_upload_confirm_jobs_pending_fifo',
        statement: `
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_upload_confirm_jobs_pending_fifo"
        ON "upload_confirm_jobs" ("status", "next_retry_at", "created_at", "id")
        WHERE "status" = 'pending' AND "cancel_requested_at" IS NULL AND "canceled_at" IS NULL;
    `,
    },
    {
        name: 'idx_matching_refresh_jobs_ready_fifo',
        statement: `
      CREATE INDEX CONCURRENTLY IF NOT EXISTS "idx_matching_refresh_jobs_ready_fifo"
        ON "matching_refresh_jobs" ("next_retry_at", "created_at", "id")
        WHERE "attempts" < 5;
    `,
    },
];
async function applyPerformanceScaleIndexes(executor = database_1.db) {
    let appliedCount = 0;
    for (const definition of PERFORMANCE_SCALE_INDEX_DEFINITIONS) {
        try {
            await executor.execute(drizzle_orm_1.sql.raw(definition.statement));
            appliedCount += 1;
        }
        catch (err) {
            logger_1.logger.error('Performance scale index rollout failed', {
                indexName: definition.name,
                error: err instanceof Error ? err.message : String(err),
            });
            throw err;
        }
    }
    logger_1.logger.info('Performance scale index rollout completed', {
        appliedCount,
    });
    return appliedCount;
}
exports.__testables = {
    PERFORMANCE_SCALE_INDEX_DEFINITIONS,
};
//# sourceMappingURL=performance-scale-indexes.js.map