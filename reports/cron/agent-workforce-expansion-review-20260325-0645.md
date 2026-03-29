# Agent Workforce Expansion Review — 2026-03-25 06:45 JST

## 結論
**追加する。**  
ただし追加対象は 1 つに絞る。今回の反復は主に **queue telemetry → dominant-prefix triage → 再掲抑制** に集中しており、ここを専任化するのが最も効果が高い。

新規エージェント名は **Queue Triage Analyst**。  
Supervisor Core の広すぎる役割のうち、観測を triage に変換する部分を切り出す。

## 反復業務の分析
### 反復しているもの
- `supervisor-core-scan`
- `supervisor-core-triage`
- `supervisor-core-decision-quality-review`
- `autonomy-loop-health-review`
- `project-kpi-registry-maintenance`
- `workspace-report-learning-review`

### 反復の中身
- queue telemetry の再観測
- `waiting_auth` / `waiting_manual_review` の dominant prefix 分析
- stale-report / 同系統提案の重複確認
- telemetry の次に何を triage するかの整理
- owner / next action / success criteria の補完

### どこが広すぎるか
- **Supervisor Core** は、観測・triage・品質レビュー・ガバナンス寄り判断を横断していて広い。
- その結果、報告が安全だが似通いやすく、実務インパクトが薄まりやすい。
- いま頭打ちなのは「何を見たか」ではなく「見たものをどう切るか」。

### 既存エージェントで足りない理由
- `queue-manager` は queue state を持つが、triage checklist の生成までは担当しない。
- `analytics-reporter` / `sprint-prioritizer` は有用だが、control-plane の queue 停滞に特化していない。
- `supervisor-core` に続けて同じ論点を回すより、専任の triage specialist を置いた方が重複が減る。

## 追加 / 不要の判断
**追加する。**  
理由は次の 4 条件を満たすため。
1. 同種業務が反復している
2. 既存エージェントでは役割が広く、重複が増えている
3. 新規エージェントの境界を queue triage に狭く切れる
4. Telegram 設定・auth 根幹・trust boundary を触らない低リスク追加である

## 追加した場合の新エージェント定義
- id: `queue-triage-analyst`
- name: `Queue Triage Analyst`
- purpose: queue telemetry と supervisor review 出力を dominant-prefix triage checklist に変換する
- scope:
  - blocked queue telemetry snapshots
  - dominant-prefix clustering and ranking
  - stale-report / repeated-review detection
  - owner / next-action / success-criteria extraction
- boundary:
  - advisory only
  - queue state 変更なし
  - approval / auth / routing / Telegram 設定変更なし
  - governance の最終決裁はしない
- model: `mini`
- thinkingDefault: `medium`
- subagents.thinking: `medium`
- fastModeDefault: `true`
- allowAgents:
  - `queue-manager`
  - `doc-editor`
  - `supervisor-core`
- expected_artifact: dominant-prefix triage checklist または runbook draft
- success_metric: 再掲レポートが減り、各高頻度 prefix に owner と next action が付く

## 期待効果
- Supervisor Core の重複感を下げる
- queue telemetry の出力を「観測」から「triage」へ進める
- 停滞 cluster ごとの次アクションを固定しやすくする
- 7:00 / 12:00 / 17:00 / 23:00 の定期報告に載せる材料を、より短く再利用しやすくする

## 次アクション
1. `queue-triage-analyst` を優先利用対象として扱う
2. 次回の queue / supervisor レビューでは、telemetry ではなく dominant-prefix triage を先に出す
3. もし重複がまだ残るなら、次は `decision-quality` 側の役割分離を検討する

## 実施状況
- 低リスク範囲で新規エージェント定義を追加済み
- Telegram 設定、auth 根幹、trust boundary は変更なし
