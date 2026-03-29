# studio-operations report (archived)

- status: done
- scope checked: infrastructure / monitoring / legal / finance / analytics
- timestamp: 2026-03-22 00:30 JST

## top findings

1. **Infrastructure**: 29 cron jobs configured, all department cycles running normally. No consecutive errors detected in this cycle.
2. **API Status**: Brave Search API は月次上限到達中（4月初旬復旧見込）。MHLW後発医薬品URL特定は Brave API 復旧後へ延期。
3. **Monitoring URLs**: PMDA 新URL群は全て稼働確認済み。watchlist.json で管理中。
4. **Finance**: Gumroad 週間取引高 $2,056,687/週（2026-03-21確認）。Merchant of Record 機能で税務自動処理継続。
5. **Git Activity**: 抗がん薬・免疫抑制薬の相互作用36組追加、併用禁忌チェッカー追加（直近12時間）。

## next actions

1. テリパラチド返品（3/28期限）の進捗確認 → ゆうすけ依存
2. MHLW後発医薬品URL特定（Brave API復旧後）
3. 相互リンク404（3件）削除実施 → engineering または project-management へ引き継ぎ

## blockers / dependencies

- Brave API 月次上限 → 4月初旬復旧
- 経過措置患者抽出（3/22期限）→ MCS操作はゆうすけ依存

## CEO handoff

インフラ・監視は正常稼働。Brave API制限がリサーチ系タスクのボトルネック。3/22期限の経過措置患者抽出は未着手（ゆうすけMCS操作待ち）。テリパラチド返品（3/28）を次の注意項目として追跡継続。
