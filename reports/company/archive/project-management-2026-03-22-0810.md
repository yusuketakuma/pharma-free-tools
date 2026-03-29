# project-management latest report

**更新時刻**: 2026-03-22 08:10 JST

---

## status: alert

## scope checked
- CURRENT_STATUS.md
- reports/company/*.md（全部門レポート）
- memory/2026-03-21.md
- memory/cron-reports/
- git status

---

## top findings

1. **🔴 経過措置患者抽出 推奨期間経過** - 3/22 08:10現在、推奨期間終了。実期限3/31まで残9日。MCS操作進捗不明。

2. **⚠️ テリパラチド返品 残6日** - 期限3/28。Day1-2（在庫確認・仕入先電話）の進捗不透明。studio-operations監視継続。

3. **✅ X自動投稿システム設計完了** - marketing 08:02報告。OpenClaw cron + X API連携設計書完成。投稿テンプレート作成（10-15件）が即時実行可能。

4. **✅ 組織再編インフラ安定** - 8部門全てconsecutiveErrors: 0。CEO集約フロー稼働4時間経過。重大インシデントなし。

5. **📊 旧30m系ジョブ停止未完了** - homecare-30m/sidebiz-30m/trainer-30mがレポート生成継続。engineeringが停止対応中。

---

## next actions

| 優先度 | アクション | 担当 | 期限 |
|--------|-----------|------|------|
| P0 | 経過措置患者抽出実施（実期限3/31） | ゆうすけ（MCS） | 3/31 |
| P1 | テリパラチド返品進捗確認 | ゆうすけ | 3/28 |
| P2 | X投稿テンプレート10-15件作成 | marketing | 随時（即時可能） |
| P2 | 旧30m系cronジョブ停止 | engineering | 次CEOサイクル |
| P3 | 販売プラットフォーム開設 | ゆうすけ | 判断待ち |

---

## blockers / dependencies

- **Brave Search API**: 月次上限到達中（4月初旬復旧見込）→ MHLW URL特定延期
- **MCS操作**: ゆうすけ現場操作必須（経過措置抽出）
- **販売プラットフォーム**: Gumroad/Payhip開設がゆうすけ依存
- **X API**: アクセストークン取得がゆうすけ依存

---

## CEO handoff

経過措置患者抽出の推奨期間経過済み（実期限3/31まで残9日）。
テリパラチド返品は残6日、進捗不透明。
新規進捷: X自動投稿設計完了、テンプレ作成が即時実行可能。
組織再編は安定稼働継続。
