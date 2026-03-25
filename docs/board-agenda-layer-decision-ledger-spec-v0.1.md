# Board Agenda Layer / Decision Ledger / 3-Lane Risk Scoring 仕様書 v0.1

## 0. この仕様の目的

この仕様の目的は、次の運用原則を崩さずに governance を高速化することです。

- CEO ↔ 取締役会 ↔ 各エージェントの責務境界は維持する
- 各エージェントと取締役会は高頻度で情報共有してよい
- ただし Board 自体は重くしない
- Routine は precedent と lane で流す
- Board は例外・新規性・境界変更・high-risk を裁く
- 報告は Board の再演ではなく decision ledger の編集とする

この仕様の設計原則は一言で言うと、**dense communication, sparse deliberation** です。

情報共有は密にしてよいが、審議は希少化する。ここが全体設計の芯です。

---

## 1. 全体アーキテクチャ

```text
CEO
 ↓
Board Context / Signal Bus
 ↓
Board Agenda Layer
 ├─ Signal intake / candidate intake
 ├─ Normalize
 ├─ Dedupe / cluster
 ├─ Precedent match
 ├─ Risk scoring
 ├─ Lane routing
 └─ Agenda assembly
 ↓
Board Decision Engine
 ├─ Fast auto / Chair ack
 ├─ Review quorum
 └─ Deep full-board review
 ↓
Decision Ledger
 ├─ Decision records
 ├─ Precedent records
 ├─ Standing approvals
 ├─ Deferred queue
 └─ Reopen queue
 ↓
Execution Layer
 ├─ Directives
 ├─ Guardrail-constrained rollout
 └─ Monitoring / follow-up
 ↓
Reporting Layer
 ├─ Board summary view
 ├─ Active unresolved items
 ├─ Last-cycle diff
 └─ Risk / deferred / rejected views
```

### 1.1 境界の考え方

- Signal は高頻度でよい。Board の知覚更新に使う。
- Proposal / agenda candidate は裁定を求める入力であり、Board Agenda Layer を必ず通す。
- Directive は Board 決定の下流指示であり、実行層はこれを基準に動く。

重要なのは、**agent ↔ board の頻繁な通信が、そのまま頻繁な Board 会議を意味しない**ことです。

---

## 2. Board Agenda Layer 仕様

### 2.1 役割

Board Agenda Layer は、Board 本体の前処理層です。役割は「会議を増やすこと」ではなく、「Board が裁定すべき案件だけを抽出すること」です。

#### やること

- 各 cron / agent / monitor / CEO から signal と candidate を受ける
- 入力を標準化する
- 重複排除と束ねを行う
- precedent と standing approval を照合する
- risk score を計算する
- fast / review / deep に振り分ける
- Board に上げるべき案件だけ agenda 化する

#### やらないこと

- 実行層の生判断をそのまま採用する
- 毎回フル Board 相当の議論を内包する
- 生ログや断片進捗をそのまま Board に流す
- regular report のための文章整形を担う

### 2.2 入力モデル

#### A. signal_event

高頻度の知覚共有用です。Board を重くしないため、signal 自体は審議要求を意味しません。

```yaml
signal_event:
  signal_id: string
  occurred_at: timestamp
  source:
    type: agent | cron | monitor | ceo | board
    name: string
  category: metric | anomaly | lesson | conflict | dependency | suggestion | risk_hint
  domain: prompt | staffing | routing | auth | reporting | policy | execution | monitoring
  summary: string
  severity: low | medium | high
  evidence:
    metrics: []
    refs: []
  related_entities:
    agents: []
    repos: []
    layers: []
  candidate_hint: true | false
```

#### B. agenda_candidate

裁定候補です。各 cron は原則としてこれを出します。Board 本体には直接上げません。

```yaml
agenda_candidate:
  proposal_id: string
  created_at: timestamp
  source:
    type: cron | agent | monitor | ceo | board_followup
    name: string
  title: string
  summary: string
  requested_action:
    type: adopt | defer | reject | investigate | tune | escalate
    target: string
  change_scope:
    domains: [prompt, staffing, routing, auth, reporting, policy, execution, monitoring]
    repos: []
    agents: []
    layers: [ceo, board, execution, infra, user-facing]
  why_now: string
  expected_benefit: string
  possible_harm: string
  boundary_impact:
    ceo_board: none | low | medium | high
    board_execution: none | low | medium | high
    trust_boundary: none | low | medium | high
    approval_boundary: none | low | medium | high
  reversibility:
    level: high | medium | low
    rollback_path: string
  blast_radius:
    users: none | low | medium | high
    agents: none | low | medium | high
    production: none | low | medium | high
  novelty:
    level: low | medium | high
  evidence:
    metrics: []
    signals: []
    refs: []
  recommendation:
    proposed_lane: fast | review | deep | unknown
    proposed_disposition: adopt | defer | reject | investigate | unknown
```

### 2.3 正規化後の内部モデル

```yaml
agenda_case:
  case_id: string
  source_proposals: []
  source_signals: []
  canonical_title: string
  canonical_summary: string
  root_issue: string
  desired_change: string
  impact_profile:
    domains: []
    agents: []
    repos: []
    layers: []
  precedent_match:
    matched: true | false
    precedent_id: string | null
    standing_approval: true | false
    confidence: low | medium | high
  risk:
    score: integer
    lane: fast | review | deep
    mandatory_deep: true | false
    reasons: []
  disposition_options: [adopt, defer, reject, investigate]
  routing:
    board_mode: auto | chair_ack | quorum_review | deep_review
    quorum_profile: user_impact | ops_audit | strategy_ops | full_board | null
  state: intake | normalized | clustered | precedent_applied | routed | queued | decided | executed | closed | reopened
```

### 2.4 処理パイプライン

```text
signal / candidate intake
 → normalize
 → dedupe
 → cluster
 → precedent match
 → risk scoring
 → mandatory deep check
 → lane routing
 → agenda assembly / auto disposition
 → ledger write
```

### 2.5 dedupe / cluster ルール

同一論点を何度も Board に上げないため、以下のキーで重複判定・束ねを行います。

- 同じ対象領域
- 同じ desired change
- 同じ root cause
- 同じ impact profile
- 同じ precedent 参照先
- 同じ時間窓内の再発

推奨 dedupe key:

```text
hash(
  normalized_domain_set,
  normalized_target,
  normalized_change_type,
  normalized_root_issue,
  major_impact_profile
)
```

### 2.6 Board に上げる条件

Board Agenda Layer は、次のどれかを満たすケースのみ Board に上げます。

- precedent がない、または信頼度が不十分
- risk lane が review 以上
- mandatory deep flag が立っている
- fast だが standing approval 範囲外
- guardrail の設計判断が必要
- reopen 条件に該当した

逆に、次は Board に上げません。

- exact precedent match で standing approval の範囲内
- 完全可逆で単一領域、かつ user trust 影響が軽微
- 生ログや平常値のサマリのみ

---

## 3. Decision Ledger 仕様

### 3.1 役割

Decision Ledger は Board 裁定の唯一の正本です。以後の routine 処理、regular report、precedent 生成はすべて Ledger を起点に行います。

### 3.2 decision_record スキーマ

```yaml
decision_record:
  decision_id: string
  case_id: string
  proposal_ids: []
  decided_at: timestamp
  board_mode:
    type: fast_auto | chair_ack | quorum_review | deep_review
    participants: [chair, visionary, user_advocate, operator, auditor]
    quorum_profile: user_impact | ops_audit | strategy_ops | full_board | null
  lane:
    risk_lane: fast | review | deep
    risk_score: integer
    mandatory_deep: true | false
    score_breakdown:
      boundary_impact: 0 | 1 | 2
      blast_radius: 0 | 1 | 2
      reversibility: 0 | 1 | 2
      novelty: 0 | 1 | 2
      trust_user_impact: 0 | 1 | 2
      dependency_spread: 0 | 1 | 2
  ruling:
    result: adopted | deferred | rejected | investigate
    confidence: low | medium | high
  reason:
    accepted_because: []
    deferred_because: []
    rejected_because: []
    tradeoffs: []
  guardrail:
    constraints: []
    forbidden_actions: []
    required_checks: []
    rollout_mode: direct | staged | canary | flag_only | simulation
  followup:
    owner: string
    target_agents: []
    monitor_metrics: []
    checkpoint_at: timestamp | null
    reopen_condition: []
  precedent:
    creates_precedent: true | false
    precedent_id: string | null
    standing_approval_candidate: true | false
    precedent_scope: string | null
  reporting:
    board_summary: string
    adopted_summary: string
    deferred_summary: string
    rejected_summary: string
```

### 3.3 precedent_record スキーマ

```yaml
precedent_record:
  precedent_id: string
  created_from_decision_id: string
  title: string
  applies_if: []
  excludes_if: []
  default_lane: fast | review
  default_ruling: adopted | deferred | rejected | investigate
  required_guardrails: []
  monitoring_requirements: []
  expires_at: timestamp | null
  revoked: true | false
  revoke_reason: string | null
```

### 3.4 standing_approval スキーマ

```yaml
standing_approval:
  approval_id: string
  based_on_precedent_id: string
  scope: string
  allowed_actions: []
  forbidden_conditions: []
  required_checks: []
  max_blast_radius: low | medium
  expires_at: timestamp | null
  auto_archive_to_ledger: true | false
```

### 3.5 deferred / reopen キュー

```yaml
deferred_item:
  item_id: string
  decision_id: string
  reason: string
  required_investigation: []
  reopen_if: []
  review_after: timestamp | null
  status: open | satisfied | expired | reopened
```

### 3.6 regular report の入力制約

regular-progress-report は原則として次だけを読みます。

- decision ledger
- deferred / reopen queue
- active unresolved items
- last cycle diff
- execution follow-up status

regular-progress-report は新しい重い審議をしません。報告は **Board の再演**ではなく、**ledger の編集ビュー**です。

---

## 4. 3-Lane Risk Scoring 仕様

### 4.1 目的

3-lane risk scoring の目的は、Board の関与をゼロか100かではなく、**濃淡付きで制御すること**です。

### 4.2 レーン定義

#### Fast lane

条件:
- precedent あり、または standing approval あり
- 可逆
- 単一領域または局所多領域
- trust / approval / routing 根幹変更なし
- user-facing 影響が限定的
- 既存方針の範囲内

扱い:
- 自動処理または Chair ack
- ledger 記録は必須
- Board には事後 digest

#### Review lane

条件:
- precedent が不十分
- 中影響
- 複数 agent や複数領域にまたがる
- 新規性はあるが境界変更は根幹ではない
- guardrail を付ければ制御可能
- rollout を段階化できる

扱い:
- Chair + 関連 director の quorum で裁定
- adopt / defer / reject / investigate を明示
- guardrail 付き rollout を前提とする

#### Deep lane

条件:
- auth / trust boundary / approval / routing root の変更
- CEO ↔ Board ↔ Execution 境界変更
- 大きな権限再配分
- 破壊的変更
- rollback が困難
- 複数 repo / agent / layers へ大きく波及
- user trust への重大影響

扱い:
- Full Board Deep Review 必須
- 自動適用しない
- staged / canary / flag_only を原則検討する

### 4.3 6 軸スコア

各軸 0〜2 点で採点します。

- boundary_impact
- blast_radius
- reversibility
- novelty
- trust_user_impact
- dependency_spread

### 4.4 lane 判定

- 0–3: Fast
- 4–7: Review
- 8–12: Deep

### 4.5 mandatory deep flags

以下はいずれもスコアに関わらず Deep 強制です。

- auth の根幹変更
- trust boundary の再定義
- approval logic / routing root policy の変更
- CEO↔Board↔Execution の責務境界変更
- 大きな権限再配分
- irreversible な本番変更
- user trust を大きく毀損しうる変更
- 複数 repo / agent / layers をまたぐ root governance 変更

### 4.6 Review quorum ルール

- user impact 中心 → Chair / User Advocate / Operator
- reliability / performance / cost → Chair / Operator / Auditor
- strategy / expansion / new capability → Chair / Visionary / Operator
- policy / boundary / trust / approval / authority → Full Board

### 4.7 Fast auto の条件

Fast に落ちても、次のすべてを満たす場合だけ自動適用します。

- exact precedent or standing approval match
- mandatory deep flag なし
- rollback path 明記済み
- monitoring metric 設定済み
- user trust 重大影響なし

それ以外の Fast は chair_ack を通します。

---

## 5. cron 再設計仕様

### 5.1 新しい cron の責務分類

#### Sensor cron

観測・差分抽出・候補生成に特化します。

対象:
- proactive-idle-work-discovery-and-activation
- cross-agent-knowledge-sync
- autonomy-loop-health-review
- agent-scorecard-review
- agent-lesson-capture

#### Governance cron

Agenda 整理、risk scoring、Board ルーティング、precedent 運用に特化します。

新設推奨:
- board-agenda-assembly
- board-precedent-maintenance
- board-review-router
- board-deep-review

#### Reporting cron

ledger 編集ビュー生成に特化します。

対象:
- tama-regular-progress-report

---

## 6. 実装タスク分解

### Phase 0. 共通 ID と shared types を入れる
- proposal_id, case_id, decision_id, precedent_id, approval_id の採番規則を定義する
- signal_event, agenda_candidate, agenda_case, decision_record の共通スキーマを作る
- 各 cron で共有できる schema package / prompt fragment を用意する

### Phase 1. Decision Ledger を先に作る
- decision_record 永続化
- precedent_record 永続化
- standing_approval 永続化
- deferred_item 永続化
- ledger writer / ledger reader を用意する
- reporting 用の read model を用意する

### Phase 2. Board Agenda Layer の intake / reducer を作る
- candidate intake 実装
- signal intake 実装
- normalize 実装
- dedupe 実装
- cluster 実装
- agenda_case 生成実装

### Phase 3. precedent match + risk scoring + lane router
- precedent matcher 実装
- 6 軸 risk scorer 実装
- mandatory deep flag 判定実装
- lane router 実装
- review quorum profile 実装
- fast auto / chair ack 判定実装

### Phase 4. report を ledger reader 化する
- tama-regular-progress-report の入力を ledger 中心へ変更する
- board summary / adopted / deferred / rejected の定型出力を作る
- active unresolved items と last cycle diff を report に統合する
- report 側で新たな審議をしない制約を入れる

### Phase 5. 既存 cron を candidate producer 化する
- cross-agent-knowledge-sync を conflict / novelty 抽出中心に変更する
- agent-lesson-capture を lesson signal + policy candidate 分離に変更する
- agent-scorecard-review を threshold breach / trend deterioration candidate 中心に変更する
- autonomy-loop-health-review を anomaly / recurrence / system risk candidate 中心に変更する
- proactive-idle-work-discovery-and-activation を candidate 出力型に変更する

### Phase 6. standing approval / precedent 運用
- precedent 自動候補生成
- standing approval テンプレート導入
- precedent coverage レポート導入
- approval の expiration / revoke 条件導入

### Phase 7. quorum 制の最適化
- review lane の quorum mapping 実装
- Chair + 2 director での裁定手順定義
- escalation ルール定義
- stalemate 時の deep 昇格ルール定義

---

## 7. 受け入れ基準

- すべての Board 裁定が Ledger に残る
- すべての審議候補が Agenda Layer を通る
- すべての案件が fast / review / deep のいずれかになる
- same-topic proposal が 1 case に束ねられる
- regular report が ledger reader として動作する
- routine ケースの大半が precedent / standing approval 経由で処理される
- mandatory deep 対象が fast / review に漏れない
- review 案件で不要な full Board が減る
- reopen 条件が decision record に明記される

---

## 8. 観測指標

- board_touch_rate
- full_board_rate
- deep_review_rate
- decision_latency
- duplicate_agenda_rate
- execution_wait_ratio
- reopen_rate
- overturn_rate
- precedent_hit_rate
- report_compression_ratio

良い状態の目安:
- signal は多い
- agenda は少ない
- fast 比率が高い
- review は必要十分
- deep は希少
- reopen と overturn は低い
- report は短いが採否が明確

---

## 9. 導入後 1〜2 サイクルで調整すべき点

- deep が重すぎるサイン
- deep が緩すぎるサイン
- precedent が弱すぎるサイン
- precedent が強すぎるサイン

---

## 10. いま着手すべき最短順

1. decision ledger schema を確定する
2. agenda_candidate / agenda_case schema を確定する
3. risk score + mandatory deep を確定する
4. tama-regular-progress-report を ledger reader 化する
5. 4 本の sensor cron を candidate producer 化する
6. precedent / standing approval を運用開始する
7. quorum 制を適用する

---

## 11. 実務上の一言定義

Board を情報から遠ざけるのではなく、裁定だけに集中させる。

そのために、
- signal は密に流す
- proposal は Agenda Layer で整える
- routine は precedent と lane で流す
- 例外・新規性・境界変更だけ Board が裁く
- 判断は Ledger を唯一の正本にする
- 報告は Ledger の編集にする

という形に固定します。
