# studio-operations latest report

- status: done
- scope checked: infrastructure / monitoring / legal / finance / analytics
- timestamp: 2026-03-22 08:30 JST

## top findings

1. **Infrastructure**: 新組織cron 8ジョブ全て正常稼働、consecutiveErrors: 0。旧30m系ジョブ（trainer-30m, homecare-30m, sidebiz-30m, brave-api-monitor）は現在も実行中だが停止対象として継続フラグ。
2. **API Status**: Brave Search API 月次上限到達継続（4月初旬復旧見込）。web_search依存タスクは引き続き保留。
3. **Monitoring URLs**: PMDA新URL群4件はactive。MHLW後発医薬品2件は404（新URL特定保留中）。Legacy GitHub Pages 3件は404確認済み。
4. **Finance**: Gumroad週間取引高 $2,056,687/週（前回確認時から変化なし）。Noteヘルプセンター403継続。
5. **Git Activity**: 直近4時間で新規コミットなし。18ファイルmodified（sidebiz中心）。アーカイブ/レポート系ファイル増加。

## next actions

1. ~~旧30m系cronジョブの停止・削除~~ → engineering引き継ぎ済み（CURRENT_STATUS.md反映待ち）
2. テリパラチド返品（3/28期限）進捗確認 → ゆうすけ依存
3. 経過措置患者抽出（実期限3/31）進捗 → ゆうすけMCS操作依存
4. MHLW後発医薬品URL特定 → Brave API復旧後（4月初旬）

## blockers / dependencies

- Brave API月次上限 → 4月初旬復旧までリサーチ系保留
- 経過措置患者抽出 → MCS操作はゆうすけ依存（今日3/22が推奨期間期限）
- テリパラチド返品 → 3/28期限、現場進捗不明
- 販売プラットフォーム開設 → ゆうすけ依存

## CEO handoff

インフラ正常・監視系に変化なし。新cron 8ジョブ安定稼働継続（4時間経過）。Brave API制限継続で外部リサーチ不可。要注目：経過措置患者抽出の推奨期間期限が**今日3/22**。テリパラチド返品（3/28）も期限近づく。両タスクともゆうすけ依存で進捗不明。
