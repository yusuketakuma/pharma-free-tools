/**
 * タイムラインサービス
 *
 * 全 aggregator を並列実行し、優先度付与・ページネーションを行うメイン API。
 */
import type { TimelineEvent, TimelinePriority, TimelineResponse, DbClient, TimelineCursor } from '../types/timeline';
export interface TimelineQueryOptions {
    limit?: number;
    priority?: TimelinePriority;
    since?: string;
    cursor?: TimelineCursor | null;
}
/**
 * タイムライン取得（メイン関数）
 *
 * - 全9 fetcher を Promise.all() で並列実行
 * - 優先度付与、timestamp 降順ソート
 * - priority フィルタ（任意）
 * - cursor-based ページネーション
 */
export declare function getTimeline(db: DbClient, pharmacyId: number, options?: TimelineQueryOptions): Promise<TimelineResponse>;
/**
 * 未読数取得
 *
 * 全テーブルの COUNT を単一 SQL で集計する（1 round trip）。
 */
export declare function getTimelineUnreadCount(db: DbClient, pharmacyId: number): Promise<number>;
/**
 * 閲覧済みマーク
 *
 * pharmacies.lastTimelineViewedAt を現在時刻に更新する。
 */
export declare function markTimelineViewed(db: DbClient, pharmacyId: number): Promise<void>;
/**
 * スマートダイジェスト
 *
 * Critical/High のイベントのみ抽出（最大5件）、timestamp 降順。
 */
export declare function getSmartDigest(db: DbClient, pharmacyId: number): Promise<TimelineEvent[]>;
//# sourceMappingURL=timeline-service.d.ts.map