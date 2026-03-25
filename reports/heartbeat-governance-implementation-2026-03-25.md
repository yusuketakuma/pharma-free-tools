# Heartbeat governance implementation

Date: 2026-03-25

## 結論
heartbeat を増やすのではなく、heartbeat を governed pipeline にするための土台を追加した。

今回入れたもの:
- heartbeat_result schema
- exploration_lease schema
- heartbeat governance policy config
- heartbeat runtime helpers
- duplicate suppression / exploration lease / cooldown の基礎実装

---

## 追加ファイル

### schemas
- `.openclaw/schemas/heartbeat-result.schema.json`
- `.openclaw/schemas/exploration-lease.schema.json`

### config
- `.openclaw/config/heartbeat-governance.json`

### scripts
- `.openclaw/scripts/heartbeat_runtime.py`

---

## 実装したこと

### 1. 出力権限の固定
role kind ごとに許可 outcome を分けた。

- execution → noop / signal_only / agenda_candidate / scout_request / artifact_update
- board → noop / signal_only / agenda_candidate / board_note / artifact_update
- scout → noop / signal_only / agenda_candidate / artifact_update
- ceo → noop / signal_only / agenda_candidate / board_note / artifact_update

decision_record は heartbeat runtime から出さない。

### 2. duplicate suppression
`root_issue + desired_change + change_scope` から duplicate_key を作る。
同種 duplicate は 12 時間抑制し、agenda_candidate は signal_only に落とす。

### 3. exploration lease
同一 issue family に 1 owner の lease を与える。
lease が他 owner に保持されている間は agenda_candidate を signal_only に落とす。

### 4. cooldown / backoff
- 2 回連続 noop で 1 時間 cooldown
- Board role は 2h window で agenda_candidate 1 件まで
- Opportunity Scout は open opportunity 1 件まで

### 5. governance snapshot
heartbeat の流量確認用に snapshot を出せるようにした。

---

## 次にやるべきこと

1. heartbeat prompt から heartbeat_result 形式をより明示する
2. regular report に heartbeat governance snapshot を補助入力として渡す
3. agent-scorecard-review / autonomy-loop-health-review を anomaly-delta 駆動へ寄せる

---

## Recommendation

次は heartbeat を増やさず、1〜2 サイクル観測して duplicate / noop / candidate rate を見て調整するのが良い。
