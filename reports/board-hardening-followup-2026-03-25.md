# Board hardening follow-up

Date: 2026-03-25

## 今回追加したこと

1. heartbeat_governance_snapshot を本実装化
2. board report read model に snapshot を統合
3. regular report が snapshot を補助入力として扱うルールを明文化

---

## heartbeat_governance_snapshot に追加した指標

- heartbeat 総数
- noop / signal / candidate / scout_request 比率
- duplicate suppression 率
- board-origin candidate 数
- candidate→case 比率
- candidate→board-touch 比率
- scout backlog
- warnings
- board_overload_risk
- scout_saturation_risk
- duplicate_spike_risk
- exploration_drift_risk
- deep_review_rate

---

## 期待する改善

- Board が止まっているのか、細いのか、重複しているのかを見分けやすくなる
- report が ledger-first を維持したまま、内部探索の健康状態を短く伝えられる
- 次の 1〜2 サイクルで cap / cooldown / cadence を調整しやすくなる

---

## 次の観測ポイント

- heartbeat_run_count
- candidate_rate
- duplicate_suppression_rate
- candidate_to_board_touch_ratio
- board_overload_risk
- scout_saturation_risk
- deep_review_rate
- decision_count

---

## Recommendation

次は新しい job を増やさず、まず 1〜2 サイクル回して snapshot 指標を観測し、必要なら heartbeat cadence / cap / cooldown を微調整するのが良い。
