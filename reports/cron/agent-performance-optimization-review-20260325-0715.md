# Agent Performance Optimization Review — 2026-03-25 07:15 JST

## 前提
- 直近の scorecard / lesson / workflow expansion / domain specialization を参照した。
- workspace 上では各対象エージェントの明示的な `model / thinkingDefault / subagents.thinking` 定義は見つからなかったため、以下は **行動証跡ベースの推奨**。
- auth / trust boundary / Telegram 設定は変更しない。

## 結論
- 全体の方向性は正しい。特に **ceo-tama / supervisor-core / ops-automator / dss-manager / opportunity-scout** は強い。
- いまのボトルネックは「モデルが弱い」よりも、**役割が広すぎる / 重複する / 次工程へ渡しきれない** こと。
- 最優先は **supervisor-core の重複抑制** と、**探索→研究→実行→文書化** の受け渡しを固定すること。
- 低リスクの最適化は、**doc-editor / github-operator の軽量化** と **supervisor-core の triage 専任化**。

## エージェント別性能所見

### ceo-tama
- 所見: 集約・優先順位付け・対ユーザー報告は安定。速度と具体性は高い。
- モデル: **重すぎない。現状維持寄り**。
- thinkingDefault: **medium 相当が適正**。
- subagents.thinking: **medium まで**。
- 役割境界: 最終集約に固定。低レベル探索は渡しすぎない。

### supervisor-core
- 所見: 具体性は高いが、`queue telemetry → triage → decision-quality` が重複しやすい。
- モデル: **現状維持〜やや軽量化でもよい**。問題の主因は役割の広さ。
- thinkingDefault: **medium**。
- subagents.thinking: **low〜medium**。
- 役割境界: 観測・triage・品質レビューを同居させない。dominant-prefix triage に寄せる。

### research-analyst
- 所見: 痛点抽出と整理は強い。PoC 接続が弱い。
- モデル: **medium**。
- thinkingDefault: **medium**。
- subagents.thinking: **low〜medium**。
- 役割境界: 研究専任。`owner / due / success criteria` を必須化。

### github-operator
- 所見: 直近専用 run の証跡が薄い。repo hygiene 以外に広げるとぼやける。
- モデル: **mini〜low medium**。
- thinkingDefault: **low**。
- subagents.thinking: **low**。
- 役割境界: GitHub / PR / link cleanup 専任。

### ops-automator
- 所見: 実接続・cleanup・retry の運用が強い。実務インパクトは高い。
- モデル: **medium**。
- thinkingDefault: **medium**。
- subagents.thinking: **low〜medium**。
- 役割境界: cron / runner / cleanup / state hygiene に固定。設計はやりすぎない。

### doc-editor
- 所見: runbook / checklist 圧縮が強い。長文より短い手順向き。
- モデル: **mini**。
- thinkingDefault: **low**。
- subagents.thinking: **low**。
- 役割境界: 文書化専任。実行判断を抱えない。

### dss-manager
- 所見: register / heartbeat / claim / callback / report の実接続が通っている。
- モデル: **medium**。
- thinkingDefault: **medium**。
- subagents.thinking: **medium**。
- 役割境界: live integration / E2E / cleanup の検証役。ops-automator と組ませる。

### opportunity-scout
- 所見: 需要探索の再利用性が高い。`pain point → customer → Japan fit → OpenClaw fit → difficulty` に落とせる。
- モデル: **medium**。
- thinkingDefault: **medium**。
- subagents.thinking: **low〜medium**。
- 役割境界: 探索専任。PoC 設計は research-analyst / doc-editor へ渡す。

## 最適化案
1. **supervisor-core の再編**
   - 観測・triage・品質レビューを分離
   - dominant-prefix triage は専任の `Queue Triage Analyst` に寄せる
2. **repo / docs の軽量化**
   - `github-operator` は repo hygiene に限定
   - `doc-editor` は runbook / checklist に限定
3. **探索の集約**
   - broad exploration は `opportunity-scout` に集約
   - `research-analyst` は scout 結果の評価と PoC 化に限定
4. **実装と運用の接続**
   - `ops-automator` → `dss-manager` のペアを標準化
5. **CEO 系は維持**
   - `ceo-tama` は最終集約役として維持。低レベル作業は増やさない

## 自動適用候補
- `doc-editor` の thinking を低めに固定する
- `github-operator` を mini 系に寄せる
- `supervisor-core` の重複抑制ルールを必須化する
- broad scouting を `opportunity-scout` に集約し、research-analyst 側の再探索を抑える

## 要判断事項
- `supervisor-core` をどこまで縮退するか
  - 候補: triage 専任化まで落とす / decision-quality を残す
- `research-analyst` のモデルを medium のまま維持するか
  - 需要抽出は強いので、まずは維持が無難
- `ops-automator` と `dss-manager` の境界をどこまで固定するか
  - 現状はペア運用が最も安全
- `opportunity-scout` の subagents.thinking をどこまで抑えるか
  - 探索の深さを保ちつつ、暴走を抑える必要あり

## 次アクション
1. 次回の定期報告から、`supervisor-core` の dominant-prefix 重複件数を追う
2. `Queue Triage Analyst` を優先経路に載せる
3. `github-operator` と `doc-editor` の直近専用 run を 1 件ずつ確保する
4. `research-analyst` には scout 結果への owner / due / success criteria 付与を強制する
5. `ops-automator` → `dss-manager` の E2E を 1 件以上継続実行する
