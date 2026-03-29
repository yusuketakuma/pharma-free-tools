# Board Agenda Layer Report

## 結論
Board に上げる case は 1 件。対象は stale queue backlog の再調整方針で、precedent 未整備のため chair_ack ではなく board 論点として保持する。

## Intake 件数
- signal: 1
- candidate: 1
- review / case: 1

## Dedupe / Cluster 後の case 件数
- case: 1
- cluster: 1

## Precedent 適用件数
- precedent match: 0
- standing approval: 0
- precedent registry entries: 0
- standing approval registry entries: 0

## Lane 別件数
- fast: 1
- review: 0
- deep: 0

## Board に上げた case
1. **stale queue backlog の再調整方針を board 論点化する**
   - case_id: case-20260325073850-45542b6b41dd
   - lane: fast
   - risk_score: 3
   - precedent: none
   - board_mode: chair_ack
   - quorum_profile: null
   - root_issue: stale queue backlog に対する board-approved triage / closure / reopen ルールがまだ無く、auth recovery 後も queue が自動で健全化しない。
   - desired_change: board で backlog triage policy を定義し、safe-close / reopen / escalate の分岐基準と follow-up artifact を決める。
   - rationale: no precedent, stale backlog is already causing operational drag, and a board-approved triage / closure / reopen policy is needed before any safe drain

## Board に上げなかった理由
- exact precedent match が 0 件
- standing approval 範囲内に収まる既存ルールがない
- 他の intake はこの 1 件に cluster 可能で、個別に Board へ分割する必要がない
- waiting_auth / waiting_manual_review の大量件数は重要な evidence だが、raw backlog のまま Board に流す対象ではない

## Unresolved / Reopen 候補
- waiting_auth backlog: 476 件
- waiting_manual_review backlog: 343 件
- waiting_approval backlog: 0 件
- waiting_capacity backlog: 0 件
- reopen 候補: なし（ledger/precedent/standing approval 未整備のため）

## 次アクション
1. この 1 case を定期報告へ載せる前提で board review に保持する
2. backlog triage の safe-close / reopen / escalate の guardrail 案を別 candidate として作る
3. precedence / standing approval の初回登録を整備して、次回以降の重複上程を減らす
