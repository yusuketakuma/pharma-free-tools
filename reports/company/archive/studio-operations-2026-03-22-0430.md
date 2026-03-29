# studio-operations latest report

- status: done
- scope checked: infrastructure / monitoring / legal / finance / analytics
- timestamp: 2026-03-22 04:30 JST

## top findings

1. **Infrastructure**: 8 new department cycle jobs running normally, all consecutiveErrors: 0. Old 30m jobs (trainer-30m, homecare-30m, sidebiz-30m, brave-api-monitor) flagged for decommission per CURRENT_STATUS.md.
2. **API Status**: Brave Search API 月次上限到達中（4月初旬復旧見込）。MHLW後発医薬品URL特定は Brave API 復旧後へ延期継続。
3. **Monitoring URLs**: PMDA 新URL群4件は全て active。MHLW後発医薬品2件は404（新URL特定保留）。Legacy GitHub Pages 3件は404確認済み。
4. **Finance**: Gumroad 週間取引高 $2,056,687/週（2026-03-21確認）。Merchant of Record 機能で税務自動処理継続。Noteヘルプセンター403アクセス制限継続。
5. **Git Activity**: 抗がん薬・免疫抑制薬の相互作用36組追加、組織再編インフラ完成（直近24時間）。

## next actions

1. 旧30m系cronジョブの停止・削除（engineeringへ引き継ぎ）
2. テリパラチド返品（3/28期限）進捗確認 → ゆうすけ依存
3. MHLW後発医薬品URL特定（Brave API復旧後4月初旬）
4. 相互リンク404（3件）削除実施 → engineering または project-management へ引き継ぎ済み

## blockers / dependencies

- Brave API 月次上限 → 4月初旬復旧
- 経過措置患者抽出（実期限3/31）→ MCS操作はゆうすけ依存
- 販売プラットフォーム開設 → ゆうすけ依存

## CEO handoff

インフラ・監視は正常稼働。新組織cron 8ジョブ全てconsecutiveErrors: 0。Brave API制限継続でリサーチ系タスク保留。旧30m系ジョブの停止をengineeringへ引き継ぎ推奨。経過措置患者抽出（実期限3/31）とテリパラチド返品（3/28）はゆうすけ依存で進捗不明。
