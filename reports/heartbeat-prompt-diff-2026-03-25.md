# Heartbeat Prompt Diff (v0.2)

Date: 2026-03-25

## 目的
既存 heartbeat を、自由探索 prompt から **governed heartbeat_result prompt** へ寄せるための差分正本。

---

## 全ロール共通で追加するブロック

### 追加する制約
- 1 run = 1 outcome
- 次のどれか1つだけ選ぶこと:
  - `noop`
  - `signal_only`
  - `agenda_candidate`
  - `scout_request`
  - `artifact_update`
  - `board_note`（board roleのみ）
- direct user report を出さない
- `decision_record` を作らない
- directive を出さない
- 外部探索は `opportunity-scout` にしか出さない

### heartbeat_result contract block
```text
必ず最初に heartbeat_result を1件だけ内部生成する前提で考えること。
少なくとも以下を埋める:
- heartbeat_run_id
- source_role
- domain_scope
- trigger_reason
- outcome_type
- root_issue
- desired_change
- change_scope
- risk_hints
- mandatory_deep_flags
- duplicate_key
- suppress_until
- estimated_value
- estimated_cost

1 run = 1 outcome。複数 outcome を同時に出さない。
```

### duplicate / suppress block
```text
同じ問題族の再発見を避ける。
- root_issue + desired_change + change_scope を基準に duplicate を意識する
- duplicate の場合、agenda_candidate を無理に増やさず signal_only に落とす
- suppress 中は同型 candidate を繰り返さない
```

---

## ロール別差分

### CEO / Board Chair / Board directors
追加:
- `board_note` までは可
- ただし heartbeat 単体で Board 裁定を成立させない
- 高リスクは board review 候補へ止める

### execution roles
追加:
- `signal_only / agenda_candidate / scout_request / artifact_update` まで
- 直接 board 決定を作らない
- 外部探索が必要なら scout_request に寄せる

### opportunity-scout
追加:
- 外部探索の唯一の窓口であること
- open opportunity cap を意識すること
- scout 自身も direct user report を出さない

---

## 置換方針

### Before
- 仕事がなければ 1件探してください
- Board に返してください
- artifact に残してください

### After
- まず `heartbeat_result` を1件だけ定義する
- allowed / forbidden action を守る
- duplicate / suppress / cooldown / lease を意識する
- その結果として signal / candidate / scout_request / artifact_update のいずれか1つに落とす

---

## 実装対象

- `ceo-tama`
- `supervisor-core`
- `board-visionary`
- `board-user-advocate`
- `board-operator`
- `board-auditor`
- `research-analyst`
- `github-operator`
- `ops-automator`
- `doc-editor`
- `dss-manager`
- `opportunity-scout`

---

## 完了条件

- 全 heartbeat prompt に contract block が入る
- role ごとの allowed / forbidden が明示される
- duplicate / suppress / 1-run-1-outcome が文面に入る
- heartbeat 単体で裁定や direct user report をしないことが明示される
