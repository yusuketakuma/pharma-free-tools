# project-management latest report

**更新時刻**: 2026-03-22 00:10 JST

---

## status: alert

## scope checked
- reports/company/*.md（全部門レポート）
- CURRENT_STATUS.md
- homecare/status.md
- homecare/outputs/2026-03-21-daily-action-summary.md
- memory/2026-03-21.md

---

## top findings

1. **🔴 経過措置患者抽出 推奨期間終了** - 3/22がMCS操作推奨期間の最終日。实际期限は3/31だが、早めの抽出が推奨。ゆうすけMCS操作未確認。
2. **⚠️ テリパラチド返品 残7日** - 期限3/28。Day1-2（在庫確認・仕入先電話）の進捗がdispatch未更新のため不明。
3. **🆕 組織再編完了** - 新体制（CEO たまAI、部門代表ジョブ）への移行完了。旧homecare/sidebiz/trainer系は停止対象。
4. **⚠️ ikitama.comドメイン消失** - Whois確認済み。再取得要否判断待ち。
5. **📊 Brave Search API上限継続** - 4月初旬復旧予定。web_search不可。

---

## next actions

| 優先度 | アクション | 担当 | 期限 |
|--------|-----------|------|------|
| P0 | 経過措置患者抽出リマインド（推奨期間最終日） | CEO → ゆうすけ | 3/22 |
| P1 | テリパラチド返品進捗確認 | CEO → ゆうすけ | 3/22 |
| P2 | ikitama.com再取得判断確認 | ゆうすけ | 随時 |
| P3 | 旧30m系ジョブ停止処理 | engineering | 次サイクル |

---

## blockers / dependencies

- **Brave Search API**: 月次上限到達中（4月初旬復旧見込）
- **MCS操作**: ゆうすけ現場操作必須
- **dispatch未更新**: 前回3/19 06:01。ゆうすけ進捗フィードバックなし

---

## CEO handoff

経過措置患者抽出の推奨期間が本日最終日。早朝へのリマインド推奨（实际期限は3/31）。
テリパラチド返品は残7日、Day1-2進捗が不透明なため状況確認が必要。
新組織体制への移行は完了、各部門レポート線が稼働開始。
