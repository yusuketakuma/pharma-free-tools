# Board Agenda Layer Assembly — 2026-03-25 16:35 JST

## 結論
Board に上げるべき案件は **1件 בלבד** だった。
直近の signal / candidate / review は、ほとんどが **同じ supervisor / queue / triage 論点の反復** か、既に runbook 化できる routine だったため、Board では裁かず、運用レーンへ落とした。

## intake 件数
- 主要入力: **10件**
  - `autonomy-loop-health-review`
  - `supervisor-core-decision-quality-review`
  - `autonomy-escalation-rule-review`
  - `agent-scorecard-review`
  - `agent-performance-optimization-review`
  - `cross-agent-knowledge-sync`
  - `domain-specialization-growth-review`
  - `proactive-idle-work-discovery`
  - `sidebiz-project-scout`
  - `workspace-project-priority-review`

## dedupe / cluster 後の case 件数
- **3件** に収束

### Cluster A — supervisor-core / queue triage 重複抑制
- 代表論点:
  - `queue telemetry → triage → decision-quality` の反復
  - supervisor-core の観測・triage・品質レビュー同居
  - dominant-prefix 単位の再掲抑制
- 判定: **Board に上げる**
- lane: **review**

### Cluster B — 実運用の安全化・軽量化
- 代表論点:
  - `ops-automator` / `dss-manager` の cleanup 標準化
  - `doc-editor` / `github-operator` の軽量役割化
  - `pharma-free-tools` の exact-match retry / 低リスク修正
- 判定: **Board に上げない**
- lane: **fast**

### Cluster C — 探索→PoC 接続と scout 運用
- 代表論点:
  - `research-analyst` の PoC 接続強化
  - `opportunity-scout` の model alias / preflight 安定化
  - `sidebiz` の owner / due / success criteria 固定
- 判定: **Board に上げない**
- lane: **fast**

## precedent 適用件数
- **正式 ledger precedent: 0件**
- **運用上の precedent / standing approval 相当の抑制: 2件**
  - routine ops は runbook / checklist 側へ送る
  - scout / PoC は既存 rubric と owner / due / success criteria で処理する

## lane 別件数
- fast: **2件**
- review: **1件**
- deep: **0件**

## Board に上げた case
### 1) supervisor-core を観測主体から triage/remediation 主体へ再配置する
- root issue: 同じ queue / telemetry 論点が複数ジョブから再掲され、Board の実審議が膨らみやすい
- desired change: supervisor-core の役割を「観測・triage・品質レビューの分離」に寄せ、dominant-prefix triage を優先経路化する
- why now: autonomy loop health / decision-quality / escalation review が同じ方向の警告を出している
- risk lane: **review**
- score: **6**
- board mode: **quorum_review**（chair + operator 中心）
- proposed disposition: **adopt**
- guardrail: 
  - telemetry 再掲は新しい根拠か新しい対象範囲がない限り抑制
  - 1提案 = 1次アクション + 1成功条件
  - owner / next action / success criteria を必須化
- follow-up owner: **supervisor-core / Queue Triage Analyst**
- reopen condition: 同系統の telemetry / triage 再掲が次サイクルでも増える場合

## Board に上げなかった理由
### Cluster B
- routine で reversible
- 単一領域または局所多領域に収まる
- trust / approval / routing の根幹変更ではない
- 既存 runbook / checklist に落とせる

### Cluster C
- 既に rubric とテンプレで処理可能
- ベースライン不足の状態で model / thinking を触る必要がない
- PoC 接続は重要だが、Board の裁定より先に運用整備で進められる

## unresolved / reopen 候補
1. **supervisor-core の縮退範囲**
   - どこまで triage 専任化するか
   - decision-quality を残すか、別役割へ寄せるか
2. **research-analyst の PoC 接続**
   - scout 出力に owner / due / success criteria を必須化する運用の定着待ち
3. **ops-automator と dss-manager の境界**
   - 現状はペア運用が安全だが、役割の重なりをどこまで固定するか未決
4. **opportunity-scout の preflight**
   - 利用可能モデル / 外部到達性の事前確認を標準化するか

## 次アクション
1. `supervisor-core` の再掲抑制ルールを Board 由来の decision として固定する
2. `Queue Triage Analyst` を優先経路として扱う
3. routine ops は `runbook / checklist / standing approval` 側へ送る
4. 次回の Board では、telemetry の追加報告ではなく **triage / remediation の実施結果** を見る
5. 7:00 / 12:00 / 17:00 / 23:00 の定期報告に集約し、通常通知は出さない
