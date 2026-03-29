# studio-operations latest report

- status: done
- scope checked: infrastructure / monitoring / legal / finance / analytics
- timestamp: 2026-03-22 16:30 JST

## top findings

1. **Infrastructure**: 新組織cron 8ジョブ全て正常稼働（12時間連続）。consecutiveErrors: 0全ジョブ。CEO集約フロー正常動作継続（16:00実行・Telegram配信完了）。
2. **API Status**: Brave Search API 月次上限到達継続（4月初旬復旧見込）。外部リサーチ系タスクは引き続き保留。
3. **Monitoring URLs**: PMDA新URL群4件はactive。MHLW後発医薬品2件は404継続（Brave API復旧後に再調査）。Legacy GitHub Pages 3件は404確認済み・削除対応待ち。
4. **Finance**: 変化なし。Gumroad週間取引高 $2,056,687/週。Noteヘルプセンター403継続。
5. **Git Activity**: 過去4時間の新規コミットなし。未コミット変更是前回レポートと同様。

## next actions

1. テリパラチド返品（3/28期限残6日）進捗確認 → ゆうすけ依存
2. 経過措置患者抽出（実期限3/31残9日）進捗 → ゆうすけMCS操作依存
3. MHLW後発医薬品URL再特定 → Brave API復旧後（4月初旬）
4. Legacy GitHub Pages 404リンク3件削除 → sidebiz対応

## blockers / dependencies

- Brave API月次上限 → 4月初旬復旧までリサーチ系保留
- 経過措置患者抽出 → MCS操作はゆうすけ依存（推奨期間経過済み・実期限残9日）
- テリパラチド返品 → 3/28期限、現場進捗不明（残6日）
- 販売プラットフォーム開設 → ゆうすけ依存

## CEO handoff

インフラ12時間安定稼働継続。8部門cron全て正常・エラー0。
監視系・財務に変化なし。
要注目: 経過措置（推奨期限超過・実期限3/31残9日）、テリパラチド返品（3/28残6日）の進捗が不透明で継続監視必要。
