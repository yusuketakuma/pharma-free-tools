"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SOURCE_KEY_PACKAGE = exports.SOURCE_KEY_INDEX = exports.SOURCE_KEY_SINGLE = void 0;
exports.getSourceState = getSourceState;
exports.upsertSourceState = upsertSourceState;
exports.getAllSourceStates = getAllSourceStates;
exports.sourceKeyForFile = sourceKeyForFile;
exports.persistSourceHeaders = persistSourceHeaders;
exports.getSourceStatesByPrefix = getSourceStatesByPrefix;
const drizzle_orm_1 = require("drizzle-orm");
const database_1 = require("../config/database");
const schema_1 = require("../db/schema");
async function getSourceState(sourceKey) {
    const [row] = await database_1.db
        .select()
        .from(schema_1.drugMasterSourceState)
        .where((0, drizzle_orm_1.eq)(schema_1.drugMasterSourceState.sourceKey, sourceKey))
        .limit(1);
    return row ?? null;
}
async function upsertSourceState(sourceKey, data) {
    await database_1.db
        .insert(schema_1.drugMasterSourceState)
        .values({
        sourceKey,
        url: data.url,
        etag: data.etag ?? null,
        lastModified: data.lastModified ?? null,
        contentHash: data.contentHash ?? null,
        lastCheckedAt: data.lastCheckedAt ?? null,
        lastChangedAt: data.lastChangedAt ?? null,
        metadataJson: data.metadataJson ?? null,
    })
        .onConflictDoUpdate({
        target: schema_1.drugMasterSourceState.sourceKey,
        set: {
            url: data.url,
            ...(data.etag !== undefined ? { etag: data.etag } : {}),
            ...(data.lastModified !== undefined ? { lastModified: data.lastModified } : {}),
            ...(data.contentHash !== undefined ? { contentHash: data.contentHash } : {}),
            ...(data.lastCheckedAt !== undefined ? { lastCheckedAt: data.lastCheckedAt } : {}),
            ...(data.lastChangedAt !== undefined ? { lastChangedAt: data.lastChangedAt } : {}),
            ...(data.metadataJson !== undefined ? { metadataJson: data.metadataJson } : {}),
        },
    });
}
async function getAllSourceStates() {
    return database_1.db.select().from(schema_1.drugMasterSourceState);
}
// ── Source key 定数（全スケジューラ共通） ──────────────────
/** 薬価基準: 単一ファイルモード */
exports.SOURCE_KEY_SINGLE = 'drug:single';
/** 薬価基準: インデックスページ */
exports.SOURCE_KEY_INDEX = 'drug:index_page';
/** 包装単位 */
exports.SOURCE_KEY_PACKAGE = 'package:main';
/** 薬価基準: カテゴリファイル別キー */
function sourceKeyForFile(category) {
    return `drug:file:${category}`;
}
/**
 * ソースのヘッダー情報（ETag/Last-Modified/contentHash）を永続化する共通ヘルパー。
 * drug-master-scheduler / drug-package-scheduler から呼び出される。
 */
async function persistSourceHeaders(sourceKey, sourceUrl, data, changed) {
    const now = new Date().toISOString();
    await upsertSourceState(sourceKey, {
        url: sourceUrl,
        etag: data.etag,
        lastModified: data.lastModified,
        ...(data.contentHash !== undefined ? { contentHash: data.contentHash } : {}),
        lastCheckedAt: now,
        ...(changed ? { lastChangedAt: now } : {}),
    });
}
async function getSourceStatesByPrefix(prefix) {
    return database_1.db
        .select()
        .from(schema_1.drugMasterSourceState)
        .where((0, drizzle_orm_1.like)(schema_1.drugMasterSourceState.sourceKey, `${prefix}%`));
}
//# sourceMappingURL=drug-master-source-state-service.js.map