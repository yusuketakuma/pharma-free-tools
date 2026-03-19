/**
 * タイムライン未読 COUNT クエリ
 *
 * テーブルごとに軽量な COUNT(*) クエリを発行し、全行フェッチを回避する。
 */
import type { DbClient } from '../types/timeline';
/** notifications: isRead=false OR createdAt > lastViewed */
export declare function countUnreadNotifications(db: DbClient, pharmacyId: number, lastViewed: string | null): Promise<number>;
/** matchNotifications: isRead=false OR createdAt > lastViewed */
export declare function countUnreadMatchNotifications(db: DbClient, pharmacyId: number, lastViewed: string | null): Promise<number>;
/** proposalComments: 参加中提案のみ + readByRecipient=false OR createdAt > lastViewed */
export declare function countUnreadComments(db: DbClient, pharmacyId: number, lastViewed: string | null): Promise<number>;
/** adminMessages: LEFT JOIN adminMessageReads → IS NULL (未読) + lastViewed */
export declare function countUnreadAdminMessages(db: DbClient, pharmacyId: number, lastViewed: string | null): Promise<number>;
/** exchangeProposals: 常に unread → COUNT(*) */
export declare function countUnreadProposals(db: DbClient, pharmacyId: number): Promise<number>;
/** exchangeFeedback: 常に unread → COUNT(*) */
export declare function countUnreadFeedback(db: DbClient, pharmacyId: number): Promise<number>;
/** deadStockItems: 常に unread (期限リスク条件付き) → COUNT(*) */
export declare function countUnreadExpiryRisk(db: DbClient, pharmacyId: number): Promise<number>;
/** uploads: 常に read → createdAt > lastViewed のみ */
export declare function countUnreadUploads(db: DbClient, pharmacyId: number, lastViewed: string | null): Promise<number>;
/** exchangeHistory: 常に read → completedAt > lastViewed のみ */
export declare function countUnreadExchangeHistory(db: DbClient, pharmacyId: number, lastViewed: string | null): Promise<number>;
/**
 * 全未読数を単一 SQL で集計する（1 round trip 版）。
 *
 * 9テーブルの COUNT をスカラーサブクエリで結合し、DBへの
 * ラウンドトリップを10回から1回に削減する。
 * last_timeline_viewed_at は外側クエリの `pharmacies` 行を再利用し、
 * 各サブクエリでの重複参照を避ける。
 */
export declare function countAllUnread(db: DbClient, pharmacyId: number): Promise<number>;
//# sourceMappingURL=timeline-unread-counts.d.ts.map