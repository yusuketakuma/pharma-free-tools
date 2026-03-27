# Board Auditor Audit Memo — 2026-03-26 08:44 JST

## 結論
`investigate` 継続。safe-close 後の silent failure と reopen 条件は、**policy / template には載っているが、運用上の発火条件はまだ抽象的**。

## 確認できたこと
- `stale-queue-safe-close-reopen-policy.md` で safe-close / reopen / hold / escalate の4分岐は定義済み。
- `queue-dominant-prefix-triage.md` で owner / next action / success criteria の分離方針は定義済み。
- ただし、close record 側の必須項目として **owner / next action / success criteria / review_after / linked_evidence** を固定する明示は、まだ運用文面で弱い。

## 監査メモ
- silent failure の主因は「close できたこと」ではなく、**close 後に再燃したときの判定基準が曖昧なこと**。
- reopen は「新しい evidence」がある場合に限定し、それ以外の同一 prefix 再燃は **まず close 判定の妥当性確認** として扱うのがよい。
- 2回以上続く再燃は reopen ではなく board 再判断へ上げるのが安全。

## 推奨
1. safe-close 記録の必須項目を `owner / next_action / success_criteria / review_after / linked_evidence` に固定する
2. reopen トリガーを `new evidence / new owner / due / success criteria / blocked dependency` に限定する
3. 同一 prefix の反復は silent failure 監査として board 再判断へ送る

## close record テンプレート
- owner:
- next_action:
- success_criteria:
- review_after:
- linked_evidence:
- close_reason:
- reopen_condition:
