/**
 * タイムラインイベントの優先度判定エンジン
 *
 * Pure Function のみ。DB アクセス・外部 API 呼び出し禁止。
 */
import type { RawTimelineEvent, TimelinePriority } from '../types/timeline';
/**
 * ルールベースでイベントの優先度を判定する。
 *
 * 優先度（高い順）:
 *   critical > high > medium > low
 *
 * @param event - 優先度を判定する生のタイムラインイベント
 * @param now   - 現在時刻（省略時は new Date()）。テストで固定時刻を注入する用途に使用。
 * @returns 判定された優先度
 */
export declare function assignPriority(event: RawTimelineEvent, now?: Date): TimelinePriority;
//# sourceMappingURL=timeline-priority-engine.d.ts.map