# Heartbeat Governance / Report Snapshot / Anomaly-Delta Migration 仕様書 v0.2

## 0. 目的

この仕様は、heartbeat 追加後に内部探索量が増えても、Board の希少性・ledger-first report・anomaly/delta 駆動の governance を崩さないための運用仕様である。

今回固定する芯は次の4つ。

1. heartbeat は `heartbeat_result` を正本にする
2. `tama-regular-progress-report` には `heartbeat_governance_snapshot` を補助入力として入れる
3. `agent-scorecard-review` は anomaly / delta の時だけ candidate 化する
4. `autonomy-loop-health-review` も anomaly / delta monitor にする

設計原則:
- 探索は密
- 裁定は希少
- 報告は静かで明瞭
- 外部探索は `opportunity-scout` に集約

---

## 1. heartbeat_result を正本にする

各 heartbeat は、毎回まず `heartbeat_result` を **1件だけ** 出す前提に固定する。

### 1.1 1 run = 1 outcome
heartbeat 1回の実行につき、結果は次のどれか1つだけ。

- `noop`
- `signal_only`
- `agenda_candidate`
- `scout_request`
- `artifact_update`
- `board_note`（Board メンバーのみ）

### 1.2 禁止
heartbeat 単体では以下を行わない。

- direct user report
- `decision_record` 作成
- execution directive 発行
- 外部探索の分散実行（`opportunity-scout` 以外への外部探索依頼）

### 1.3 必須フィールド

- `heartbeat_run_id`
- `source_role`
- `domain_scope`
- `trigger_reason`
- `outcome_type`
- `root_issue`
- `desired_change`
- `change_scope`
- `risk_hints`
- `mandatory_deep_flags`
- `duplicate_key`
- `suppress_until`
- `estimated_value`
- `estimated_cost`

### 1.4 実装手順

1. 全 heartbeat prompt に schema block を追加
2. allowed / forbidden actions を追加
3. duplicate / suppress rule を追加
4. 1-run-1-outcome 制約を追加
5. validator で `heartbeat_result` を必須化

---

## 2. report に heartbeat_governance_snapshot を補助入力で入れる

### 2.1 位置づけ
`snapshot` は **採否の根拠ではなく運用健全性の補助情報** としてだけ使う。

### 2.2 report の情報源順位

1. `decision_record`
2. `deferred / unresolved / deep_review_status / reopen`
3. `last_cycle_diff`
4. `heartbeat_governance_snapshot`
5. `raw logs / raw signals`

### 2.3 snapshot が持つもの

- heartbeat 総数
- noop / signal / candidate / scout_request 比率
- duplicate suppression 率
- board-origin candidate 数
- candidate→case 比率
- candidate→board-touch 比率
- scout backlog
- warnings
- `board_overload_risk`
- `scout_saturation_risk`
- `duplicate_spike_risk`
- `exploration_drift_risk`

### 2.4 report で使ってよい場所

- 取締役会サマリの補足
- 運用健全性 / 探索活動サマリ
- 前回からの差分の補足

### 2.5 report で使ってはいけない場所

- 今回採用
- 今回保留
- 今回却下
- deep review 判定そのもの

### 2.6 完了条件

- report が heartbeat 後でも長文化しない
- snapshot は補助情報に留まる
- 採否は ledger 由来のみで書かれる

---

## 3. agent-scorecard-review を anomaly / delta monitor にする

### 3.1 役割変更
`agent-scorecard-review` は routine score の説明係ではなく、**異常抽出 monitor** に寄せる。

### 3.2 監視軸

#### delivery
- completion rate
- SLA miss
- backlog age
- execution wait

#### quality
- reopen
- correction
- retry / failure
- artifact defect

#### governance / stability
- manual override
- precedent hit
- guardrail near miss

#### efficiency
- turnaround
- wasted attempt
- cost/token 効率

### 3.3 判定カテゴリ

- hard threshold breach
- significant delta
- persistent degradation
- cross-agent divergence
- precedent gap
- unresolved recurrence

### 3.4 出力ルール

- 平常: `signal_event digest` のみ
- 異常あり: `agenda_candidate`
- artifact 更新だけ: `artifact_update`

### 3.5 cap / cluster

- 1 agent あたり `0〜1件`
- 1 run あたり `total 3件まで`
- 超過分は `root_issue` 単位で cluster

---

## 4. autonomy-loop-health-review を anomaly / delta monitor にする

### 4.1 役割変更
system-level の健康診断 monitor とする。

### 4.2 監視対象

- heartbeat run 数
- noop 率
- candidate 率
- duplicate suppression 率
- board touch rate
- full board 率
- deep review 率
- decision latency
- execution wait ratio
- unresolved backlog
- reopen 率
- precedent hit rate
- auto disposition 率
- scout backlog

### 4.3 異常カテゴリ

- board overload
- discovery flood
- execution starvation
- precedent miss / governance inefficiency
- scout saturation
- loop oscillation

### 4.4 出力ルール

- 健全なら digest signal
- system anomaly の時だけ `agenda_candidate`
- routing / approval / trust boundary 根幹変更を伴う時だけ mandatory deep

---

## 5. 実装順

### Phase 1: heartbeat governed output 化
1. heartbeat prompt に `heartbeat_result contract` 追加
2. validator / parser 実装
3. duplicate suppression / cooldown / lease 接続
4. `heartbeat_result -> signal/candidate/scout/artifact` mapper 実装

### Phase 2: report 補助入力化
5. `build_heartbeat_governance_snapshot()` 実装
6. report read model に snapshot loader 追加
7. `tama-regular-progress-report` prompt に usage rule 追加
8. coverage / raw-fallback check 実装

### Phase 3: review 系 cron 載せ替え
9. `agent-scorecard-review` anomaly classifier 実装
10. candidate cap / cluster 実装
11. `autonomy-loop-health-review` anomaly classifier 実装
12. candidate cap / cluster 実装

### Phase 4: 観測と微調整
13. 2 cycle 観測
14. candidate rate / board touch / duplicate suppress を確認
15. 閾値と cap を微調整

---

## 6. 狙い

- heartbeat は増えても Board は重くならない
- report は ledger-first のまま保たれる
- review 系 cron は routine narrative をやめる
- anomaly / delta の時だけ Board に上がる
- scout は唯一の外部探索窓口として安定する
