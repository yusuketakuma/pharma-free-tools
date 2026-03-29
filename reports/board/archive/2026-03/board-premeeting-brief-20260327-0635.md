# Board premeeting brief

- board_cycle_slot_id: `20260327-0635`
- checked_at: 2026-03-27 06:35 JST
- source_artifact: board-premeeting-brief-20260327-0635.md

- input_gate: ready
- freshness_check: OK

## 1. Freshness verdict
- `reports/board/agenda-seed-latest.md`: board_cycle_slot_id が今回の本会議 slot（20260327-0635）と一致。
- `reports/board/claude-code-precheck-latest.md`: board_cycle_slot_id が一致。
- `reports/board/board-premeeting-brief-latest.md`: 今回 slot に合わせて再整理済み。
- 判定: **stale・欠落なし**

## 2. 通常論点（最大3件）
1. **stale backlog triage / safe-close / reopen / escalate / record contract を固定する**
2. **triage と boundary / security review を混ぜず、lane を分ける**
3. **review-approved / apply-blocked / live-receipt / artifact-freshness を別状態として報告する**

## 3. 自己改善 proposal の扱い
- 自己改善 proposal inbox 件数: **3件**
- Board が深掘りした自己改善 proposal 件数: **2件**
- Board が判定した自己改善 proposal 件数: **3件**

### 判定一覧
- `proposal-20260327-stale-backlog-triage-contract` → **approve + assisted**
- `proposal-20260327-status-taxonomy-separate-reporting` → **approve + assisted**
- `proposal-20260326-supervisor-boundary-preflight` → **revise / manual approval required**

### 低リスク候補
- docs / runbook / cron wording に限定できるものは `approve + assisted` 候補。
- routing root / trust boundary / protected path に触れるものは `revise` か `manual approval required`。

### 会議後 review/apply ジョブへ渡す proposal_id
- `proposal-20260327-stale-backlog-triage-contract`
- `proposal-20260327-status-taxonomy-separate-reporting`
- `proposal-20260326-supervisor-boundary-preflight`（revise 側）

## 4. 5分前運用メモ
- いまの主症状は「新規施策不足」ではなく、同じ queue / boundary / reporting の論点が反復していること。
- したがって board では、個別案件を増やすより **1) queue の閉じ方**、**2) 境界の切り方**、**3) 状態の見せ方** を先に決めるのが妥当。
- 自己改善 proposal は通常論点と分け、長く議論しない。
- 最重要の自己改善 proposal は最大2件までに絞る。
