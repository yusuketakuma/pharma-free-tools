# 定期報告用ダッシュボード（固定入口）

> このファイルは定期報告（tama-regular-progress-report）の唯一の入力正本です。
> 各エージェントの10分ループartifactとBoard系artifactを集約します。
> 更新: 定期報告ジョブの実行直前に自動または手動で最新化すること。

## 最終更新
- generated_at: 2026-03-28T12:12:00+09:00
- source: ceo-tama 手動集約

---

## 1. Board系アーティファクト

### agenda-seed-latest
- board_cycle_slot_id: 20260328-1120
- generated_at: 2026-03-28 11:20 JST
- source_agents: 11, generated_count: 12, deduped_count: 9
- freshness: ✅ ready

### board-premeeting-brief-latest
- board_cycle_slot_id: 20260327-1835
- checked_at: 2026-03-27 20:33 JST
- input_gate: ready
- freshness: ⚠️ 古い（前回スロット）。最新サイクル正規化が未反映の可能性あり

### self-improvement-verification-latest
- generated_at: 2026-03-28 11:52 JST
- status: success 8 / blocked 2 / rejected 2
- freshness: ✅ ready

---

## 2. 本部・担当ループアーティファクト（14件）

| # | ファイル | ステータス | 更新時刻(JST) | サマリ |
|---|----------|-----------|--------------|--------|
| 1 | secretariat-latest | running | 12:08 | direct-support 12:10再確認待ち、mail 1通集中、homecare 待機、schedule 具体1件待ち |
| 2 | direct-support-latest | running | 12:11 | 12:10再確認の未着を記録、12:20に再確認 |
| 3 | backlog-latest | diminishing_returns | 10:15 | queue.md item 9 重複修正。ループ停止推奨継続 |
| 4 | product-ops-latest | cycle_complete | 12:08 | 全担当終了条件到達、変化なし。人の判断待ち |
| 5 | monetization-latest | blocked | 11:58 | offer側候補先未提示、analysis収束済み。HTML反映が残課題 |
| 6 | offer-strategy-latest | blocked | 12:11 | 有償初回診断の実送待ち継続 |
| 7 | monetization-analysis-latest | converged | 11:51 | 収益分析収束済み。HTML反映が唯一の残課題 |
| 8 | ops-latest | in_progress | 11:51 | フィードバック履歴参照不可。観測候補1件に絞る運用継続 |
| 9 | docs-latest | done | 11:41 | 文書整理対象枯渇、停止提案中 |
| 10 | github-ops-latest | blocked | 12:08 | gh承認待ち。未着手 |
| 11 | homecare-support-latest | waiting_input | 12:02 | 待機継続、訪問予定1件受領待ち |
| 12 | mail-latest | ok | 12:11 | 返信支援1通集中。実メール本文未確認 |
| 13 | receipt-latest | pending | 11:58 | 受理対象未提示、約12時間空回り。サイクル停止推奨 |
| 14 | schedule-latest | blocked | 12:11 | 具体的な予定・期限1件未提示 |

---

## 3. クローンジョブ健全性サマリ

- 総ジョブ数: 38（分散後）
- 全体 consecutiveErrors=0: ✅（直近の手動修復でクリア）
- 直近エラー: なし
- ceo-tama配下: 2件（board-agenda-assembly, tama-regular-progress-report）
- 主要分散先: supervisor-core(22), board-auditor(4), board-operator(3), board-visionary(1), pharmacy-hq(4), research-analyst(3), ops-automator(1)

---

## 4. 自己改善状態

| 指標 | 値 |
|------|-----|
| 総proposal数 | 12 |
| success | 8 |
| blocked | 2（guardrail/trust-boundary） |
| rejected | 2 |
| pending_artifact | 0 |
| manual_required | 0 |

---

## 5. 停止・縮小済みジョブ（autonomy-job-tuning-review で決定）

| ジョブ | 状態 | 理由 |
|--------|------|------|
| pharma-free-tools-needs-research-and-build | 停止 | theme-extractionと完全重複 |
| board-dispatch-verification | 停止 | verificationと重複 |
| continuous-research-portfolio | 週1回化 | 頻度過多 |
| autonomy-escalation-rule-review | 週1回化 | 頻度過多 |

---

## 6. ユーザー確認待ち事項

1. **収益化本部のHTML反映** — pharmacy-rejection-template.htmlの改善（exec approval必要）
2. **GitHub担当のgh承認** — gh CLI実行の承認待ち
3. **受理確認担当のサイクル調整** — 12時間超の空回り、停止または間隔調整の判断
4. **文書整理担当の継続/停止判断** — 対象枯渇のため停止提案中
5. **backlog担当のループ継続/停止判断** — diminishing_returns状態

---

## 7. artifact鮮度 / input gate

- board系: ⚠️ partially stale（premeeting-briefが前日スロット）
- ループ系: ✅ 全14件が60分以内に更新
- 自己改善系: ✅ fresh
- 総合判定: **degraded**（board premeeting briefの鮮度が低下）
