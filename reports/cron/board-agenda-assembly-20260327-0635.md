# Board Agenda Assembly — 2026-03-27 06:35 JST

## 結論
**input_gate=ready**。`agenda-seed-latest`、`claude-code-precheck-latest`、`board-premeeting-brief-latest` を再確認し、今回の board は **最大3件に圧縮** して運用するのが妥当。

自己改善 proposal は通常論点と分離し、**approve / reject / revise** を 1 件ずつ明示する。

## board_cycle_slot_id / input_gate
- `board_cycle_slot_id`: **20260327-0635**
- `input_gate`: **ready**
- 縮退理由: なし

## OpenClaw 再レビュー要約
- 反復している論点は **queue の閉じ方**、**boundary の切り方**、**状態の見せ方**。
- いま board で増やすべきは新規施策ではなく、既存の反復論点の収束である。
- 自己改善 proposal は低リスク文書系を優先し、routing root / trust boundary / protected path に触れるものは別サイクルへ分離する。

## 主要論点（最大3件）
1. **stale backlog triage / safe-close / reopen / escalate / record contract を固定する**
   - 判定: **採用**
   - 理由: `waiting_auth` / `waiting_manual_review` の滞留を毎回個別判断で裁くより、owner / next action / success criteria / evidence を固定した方が再発コストを下げられるため。

2. **triage と boundary / security review を分離し、同じ lane に混ぜない**
   - 判定: **採用**
   - 理由: triage に Gateway / ホスト防御 / routing root の論点が混ざると、判断が鈍り、次アクションの責任分界が曖昧になるため。

3. **review-approved / apply-blocked / live-receipt / artifact-freshness を別状態として報告する**
   - 判定: **採用**
   - 理由: review の承認、apply の阻害、live 受理、成果物 freshness は別レーンなので、completion を潰すと誤解が増えるため。

## 採用 / 調査継続 / 却下 / 保留
- **採用**: 3
- **調査継続**: 0
- **却下**: 0
- **保留**: 0

## 自己改善 proposal（別枠）
- self-improvement proposal inbox 件数: **3**
- Board が深掘りした自己改善 proposal 件数: **2**
- Board が判定した自己改善 proposal 件数: **3**

### 1件ごとの見立て
- `proposal-20260327-stale-backlog-triage-contract` → **approve + assisted**
  - 理由: docs / runbook / cron wording に限定できる低リスク案件で、queue の閉じ方を標準化できるため。

- `proposal-20260327-status-taxonomy-separate-reporting` → **approve + assisted**
  - 理由: reports / templates の状態分離に留まり、apply / freshness / live receipt の誤読を減らせるため。

- `proposal-20260326-supervisor-boundary-preflight` → **revise / manual approval required**
  - 理由: low-risk docs/runbook 意図はあるが、routing root / trust boundary / protected path と混在しているため、scope を狭めて再提出が必要。

## 会議後 review/apply ジョブへ渡す proposal_id
- `proposal-20260327-stale-backlog-triage-contract`
- `proposal-20260327-status-taxonomy-separate-reporting`
- `proposal-20260326-supervisor-boundary-preflight`（revise 側）

## 指示
1. `proposal-20260327-stale-backlog-triage-contract` と `proposal-20260327-status-taxonomy-separate-reporting` を review/apply に引き渡す。
2. `proposal-20260326-supervisor-boundary-preflight` は revise 側として、low-risk docs/runbook 部分だけを分離して再提出を待つ。
3. Board では backlog triage / boundary separation / status taxonomy の 3 点に論点を固定し、自己改善 proposal を長く議論しない。
4. 通常通知は行わず、定期報告に集約する。
