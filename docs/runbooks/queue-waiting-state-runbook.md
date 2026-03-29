# Queue waiting-state runbook（draft）

## 目的
`waiting_auth` / `waiting_manual_review` を **safe-close / reopen / escalate の3択だけ** で扱う。  
この runbook は item-level 判断の手順であり、runtime queue state は read-only のままにする。  
`auth` / `routing` / `approval` / `trust boundary` そのものは変更しない。

## 使い方
- **age だけでは close しない**。比較可能な evidence を確認する。
- **hold や新しい例外分岐は作らない**。証拠が足りなければ止めて escalate する。
- **同じ prefix が繰り返し出る場合は item-level で粘らず、別枠の dominant-prefix triage に切る。**
- `route_decision_id` / `dispatch_id` / `approval_id` は勝手に再採番しない。

## 1) Item-level decision table

| queue | safe-close | reopen | escalate | owner | next action | due | success criteria | evidence | linked evidence | stop condition | reopen condition |
|---|---|---|---|---|---|---|---|---|---|---|---|
| `waiting_auth` | auth 回復済み、`queue_reason=waiting_auth` が解消、同じ route で続行可能、partial execution / side effect / protected path の疑いなし | 同じ item / route を新 evidence で続行でき、直前 close が一時停止扱いだと確認できる | auth 状態と artifact が矛盾、回復が未確認、再燃、partial execution / trust boundary の疑い | supervisor-core | auth snapshot と比較可能 snapshot を確認して 1 行で decision を残す | 次の queue sweep。すでに stale なら検知から 24h 以内 | 同じ item / route が evidence 一致で再開でき、追加の手戻りなしに継続可能 | `auth-status.json`, `queue-status.json`, `state.json`, `lane-selection.json` / `dispatch` 記録, 最新の比較可能 snapshot | `reports/cron/` の最新 queue snapshot, 直近の decision record, route / dispatch 参照先 | artifact 不整合、partial execution、side effect、protected path / trust boundary の確認要、証拠不足 | 新 evidence で同じ item / route を安全に再開でき、前回 close が暫定だったと示せる |
| `waiting_manual_review` | review 結論が記録済み、durable note / decision record がある、同じ item を手動レビューに置き続ける必要がない、partial execution / side effect / protected path の懸念なし | 新 evidence で結論が変わる、または owner / due / criteria が更新され、依存タスクがまだ止まっている | review 結論が割れる、publish 可否や trust boundary を board 判断に戻す必要がある、prefix-level recurrence が item-level を超えている | supervisor-core | review report と diff / validation logs を照合して 1 行で decision を残す | 次の review sweep。すでに stale なら検知から 24h 以内 | review 結論と evidence が一致し、再レビューせずに close か reopen かを選べる | `review-report.json`, `manual_review_status.json`, `state.json`, diff, validation logs, 最新の比較可能 snapshot | `reports/cron/` の review snapshot, 直近の decision record, validation / diff 参照先 | partial execution、side effect、diff と review の不整合、protected path / trust boundary 要確認、証拠不足 | 新 evidence が追加され、owner / due / criteria 更新や blocked dependency の解消が確認できる |

## 2) Decision record の最小項目
各 item について、以下を 1 行で残す。

- queue:
- item / prefix:
- owner:
- next action:
- due:
- success criteria:
- evidence:
- linked evidence:
- stop condition:
- reopen condition:
- review after:
- decision: `safe-close` / `reopen` / `escalate`

## 3) Dominant-prefix triage（別枠）

この runbook の本体から分離する。詳細は `projects/openclaw-core/docs/queue-dominant-prefix-triage.md` を使う。

- **owner:** Queue Triage Analyst
- **entry:** 同じ prefix が複数の comparable snapshot で支配的、または item-level の owner / next action / success criteria がまだ曖昧
- **exit:** 各 dominant prefix に owner / next action / success criteria が入る。そうでなければ 1 回だけ board decision として上げる
- **rule:** telemetry は read-only のまま。item-level の close / reopen を繰り返して prefix-level 問題を隠さない
- **handoff:** `waiting_auth` / `waiting_manual_review` の再掲が prefix-level に収束したら、Queue Triage Analyst にまとめて渡す

## 4) 迷ったら
- evidence が足りないなら **close しない**
- reopen の根拠が「古いから」だけなら **reopen しない**
- same prefix の再燃なら **dominant-prefix triage** に切る
- protected path / trust boundary に触れるなら **escalate** して止める
