"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const node_fs_1 = __importDefault(require("node:fs"));
const node_path_1 = __importDefault(require("node:path"));
const migrator_1 = require("drizzle-orm/vercel-postgres/migrator");
const database_1 = require("../config/database");
const logger_1 = require("../services/logger");
const performance_scale_indexes_1 = require("./performance-scale-indexes");
function assertMonotonicMigrationJournal(migrationsFolder) {
    // Legacy migrations contain historical out-of-order timestamps (e.g. idx 15).
    // Guard only newer entries to prevent reintroducing the skip bug on recent migrations.
    const ENFORCE_FROM_IDX = 28;
    const journalPath = node_path_1.default.resolve(migrationsFolder, 'meta/_journal.json');
    const raw = node_fs_1.default.readFileSync(journalPath, 'utf8');
    const journal = JSON.parse(raw);
    const entries = journal.entries ?? [];
    for (let i = 1; i < entries.length; i += 1) {
        const prev = entries[i - 1];
        const curr = entries[i];
        if (curr.idx >= ENFORCE_FROM_IDX && curr.when <= prev.when) {
            throw new Error(`Migration journal timestamp order is invalid: idx ${curr.idx} (${curr.tag}) has when=${curr.when}, ` +
                `but previous idx ${prev.idx} (${prev.tag}) has when=${prev.when}`);
        }
    }
}
async function main() {
    logger_1.logger.info('Running migrations...');
    const migrationsFolder = './drizzle';
    assertMonotonicMigrationJournal(migrationsFolder);
    await (0, migrator_1.migrate)(database_1.db, { migrationsFolder });
    await (0, performance_scale_indexes_1.applyPerformanceScaleIndexes)();
    logger_1.logger.info('Migrations complete.');
    process.exit(0);
}
main().catch((err) => {
    logger_1.logger.error('Migration failed', { error: err instanceof Error ? err.message : String(err) });
    process.exit(1);
});
//# sourceMappingURL=migrate.js.map