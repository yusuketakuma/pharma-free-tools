# project-management latest report

**更新時刻**: 2026-03-22 16:10 JST

---

## status: alert

---

## scope checked
- ceo-tama-latest.md（CEO集約結果）
- engineering-latest.md（技術基盤状況）
- CURRENT_STATUS.md（portfolio index）
- sidebiz/status.md（副業進捗）
- memory/2026-03-21.md（直近ログ）
- git status（workspace差分）
- projects/*/docs/status.md（各project状況）

---

## top findings

1. **🔴 経過措置患者抽出（実期限残9日）** - 推奨期限（3/22）超過済み。MCS操作はゆうすけ依存。最優先アラート継続。
2. **🟡 テリパラチド返品（残6日）** - 3/28期限。進捗不透明。次回確認で要追跡。
3. **✅ 副業技術準備100%完了** - 89ツール/100プロンプト/Notionテンプレ3種。販売プラットフォーム開設のみ待ち。
4. **✅ 新組織インフラ安定稼働** - 8部門cron全て正常（consecutiveErrors: 0）。移行完了確認。
5. **⚠️ 未コミット変更多数** - 18 modified + 61+ untracked files。整理後コミット推奨。

---

## next actions

| 優先度 | アクション | 担当 | 期限 |
|--------|-----------|------|------|
| **P0** | 経過措置患者抽出実施 | ゆうすけ（MCS） | 3/31 |
| P1 | テリパラチド返品進捗確認 | ゆうすけ | 3/28 |
| P2 | 販売プラットフォーム開設 | ゆうすけ | 判断待ち |
| P2 | 未コミット変更整理・コミット | engineering | 随時 |

---

## blockers / dependencies

| blocker | 状況 | 復旧見込 |
|---------|------|----------|
| MCS操作 | ゆうすけ現場依存 | - |
| 販売プラットフォーム開設 | ゆうすけ判断待ち | - |
| Brave Search API | 月次上限到達中 | 4月初旬 |
| X API取得 | ゆうすけ依存 | - |

---

## CEO handoff

経過措置（残9日）・テリパラチド返品（残6日）の2件が進捗不透明で要フォロー。
副業は技術準備完了、販売開始はプラットフォーム開設のみ待ち。
新組織インフラ16時間安定稼働継続中。
