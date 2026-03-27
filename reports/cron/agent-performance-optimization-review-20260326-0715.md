# Agent Performance Optimization Review — 2026-03-26 07:15 JST

## 前提
- 直近の `scorecard` / `lesson` / `health` / `workforce expansion` / `performance optimization` を参照した。
- 各エージェントの明示的な `thinkingDefault` / `subagents.thinking` の正本設定は workspace 上で見つからなかったため、以下は **session log と実行証跡ベースの推定** を含む。
- `auth` / `trust boundary` / `Telegram` 設定は変更しない。

## 結論
- いちばん効くのは **モデルを闇雲に強くすることではなく、役割の幅を狭くすること**。
- **ライト役**（`board-user-advocate` / `board-operator` / `doc-editor` / `github-operator`）は、今の mini + low 思考でほぼ適正。
- **重いのはモデルより境界**。特に `supervisor-core` は観測・triage・品質レビューを同居させすぎている。
- **やや弱いのは探索→研究→PoC 接続**。`research-analyst` と `opportunity-scout` は、深掘りが必要な場面だけ上げる余地がある。
- **高リスク**な `CEO ↔ board ↔ execution` 境界変更、権限再配分、大きな委任構造変更は **deep review 対象**で、自動適用しない。

## board の主要論点
1. **Routine は signal-only で十分**
   - 直近の scorecard は新規 anomaly なし。
   - lesson は「board / heartbeat / scorecard は steady-state では signal-only」に収束。

2. **Supervisor 系の重複は役割の広さが原因**
   - 監視・triage・品質レビューが同じレーンで反復しやすい。
   - `Queue Triage Analyst` への分離が最も効く。

3. **探索→研究→実行→文書化の handoff を固定する**
   - `opportunity-scout` は発見専任。
   - `research-analyst` は評価・比較・PoC 入口。
   - `doc-editor` は runbook / checklist 圧縮。

4. **exact target と owner/due/success criteria の preflight が必要**
   - 軽微タスクでも mismatch が retry cost を押し上げる。

5. **状態分離を先に固定する方が運用品質に効く**
   - review / apply / live receipt / freshness を混ぜると、モデル強化より先に報告誤読が増える。

6. **ops-automator と dss-manager はペア固定が安定**
   - cleanup / retry / state hygiene と live integration / E2E を分けるのが安全。

## エージェント別性能所見

### ceo-tama
- **観測**: `gpt-5.4-mini`、thinking は実務上 `medium` 相当が機能している。
- **所見**: 集約・優先順位付け・対ユーザー報告は安定。
- **評価**: モデルは重すぎない。現状維持でよい。
- **境界**: 最終集約に固定。低レベル探索を持ちすぎない。
- **委任**: 良い。board の裁定をまとめる役割に向いている。
- **ボード連携**: 良好。

### supervisor-core
- **観測**: `gpt-5.4`（main / heartbeat）。subagent は `gpt-5.4-mini`。
- **所見**: 具体性は高いが、`queue telemetry → triage → decision-quality` が重複しやすい。
- **評価**: **モデルはやや重いが、主因は役割の広さ**。
- **thinkingDefault**: `medium` で妥当。
- **subagents.thinking**: `low〜medium` が妥当。
- **境界**: 観測・triage・品質レビューを同居させない。ここは縮退余地が大きい。
- **委任**: 無駄が出やすい。dominant-prefix triage を切り出すべき。
- **ボード連携**: 機能しているが、Board noise の温床になりやすい。

### board-visionary
- **観測**: `gpt-5.4`。
- **所見**: 戦略・再配置の大局判断に向く。
- **評価**: 重大な過剰感はない。現状維持でよい。
- **thinkingDefault**: `medium〜high` が妥当（推定）。
- **subagents.thinking**: `low〜medium` で十分。
- **境界**: 例外・新規性・長期レバレッジに集中。
- **委任**: 適切。
- **ボード連携**: 良好。

### board-user-advocate
- **観測**: `gpt-5.4-mini`、thinking `low`。
- **所見**: かなり適正。分かりやすさと導入負荷の低さに寄っている。
- **評価**: ほぼ現状維持。
- **thinkingDefault**: `low` でよい。
- **subagents.thinking**: `low` でよい。
- **境界**: ユーザー視点の短い判断に限定。
- **委任**: 無駄が少ない。
- **ボード連携**: 良好。

### board-operator
- **観測**: `gpt-5.4-mini`、thinking `low`。
- **所見**: 最小実行可能案に寄っていて、役割とモデルが合っている。
- **評価**: 現状維持。
- **thinkingDefault**: `low` でよい。
- **subagents.thinking**: `low` でよい。
- **境界**: 実行判断を広げない。
- **委任**: 適切。
- **ボード連携**: 良好。

### board-auditor
- **観測**: `gpt-5.4`。
- **所見**: boundary / risk / precedent の観点で強い。
- **評価**: やや重いが、監査役としては許容。
- **thinkingDefault**: `medium〜high` が妥当（推定）。
- **subagents.thinking**: `low〜medium` で十分。
- **境界**: 境界変更・安全性・誤クローズに集中。
- **委任**: 適切。
- **ボード連携**: 良好。

### research-analyst
- **観測**: `gpt-5.4-mini`。
- **所見**: 痛点抽出・整理は強いが、PoC 接続が弱い。
- **評価**: **やや軽い**。比較・評価・PoC 入口まで持つなら、もう一段深さが欲しい。
- **thinkingDefault**: `medium` が妥当。
- **subagents.thinking**: `low〜medium` が妥当。
- **境界**: 研究専任。探索を延々続けない。
- **委任**: scout からの受け取りで owner/due/success criteria を必須化したい。
- **ボード連携**: 及第だが、handoff 強化が必要。

### github-operator
- **観測**: `gpt-5.4-mini`、thinking `low`。
- **所見**: repo hygiene / PR / link cleanup に限定するなら適正。
- **評価**: 現状維持でよい。
- **thinkingDefault**: `low`。
- **subagents.thinking**: `low`。
- **境界**: repo hygiene を超えない。
- **委任**: 適切。
- **ボード連携**: 証跡が薄いので、役割を広げない方が良い。

### ops-automator
- **観測**: `gpt-5.4-mini`、thinking `medium` 相当。
- **所見**: cleanup / retry / state hygiene に強い。
- **評価**: おおむね適正。複雑な運用に入ると少し軽い可能性はある。
- **thinkingDefault**: `medium`。
- **subagents.thinking**: `low〜medium`。
- **境界**: 設計を抱えすぎない。
- **委任**: `dss-manager` とのペア固定が安定。
- **ボード連携**: 良好。

### doc-editor
- **観測**: `gpt-5.4-mini`、thinking `low`。
- **所見**: runbook / checklist 圧縮に特化していて、最もコスパが良い一角。
- **評価**: 現状維持。軽いままでよい。
- **thinkingDefault**: `low`。
- **subagents.thinking**: `low`。
- **境界**: 文書化専任。実行判断を抱えない。
- **委任**: 無駄が少ない。
- **ボード連携**: 良好。

### dss-manager
- **観測**: `gpt-5.4`。
- **所見**: register / heartbeat / claim / callback / report の E2E 接続が通っている。
- **評価**: 現状維持。
- **thinkingDefault**: `medium`。
- **subagents.thinking**: `medium`。
- **境界**: live integration / E2E / cleanup の検証役。
- **委任**: `ops-automator` とのペアが最適。
- **ボード連携**: 良好。

### opportunity-scout
- **観測**: `gpt-5.4-mini`、thinking `low`。subagent は `gpt-5.4-nano` の記録あり。
- **所見**: 発見専任としては十分だが、比較・PoC 接続が必要な場面では浅い。
- **評価**: **やや軽い**。初期スキャンは良いが、深い比較には上げたい。
- **thinkingDefault**: `low〜medium` が妥当。探索の深さが要る回だけ上げる。
- **subagents.thinking**: `low` は可、`low〜medium` までが上限。`nano` 固定は浅すぎる場面がある。
- **境界**: 発見専任。PoC 設計は `research-analyst` に渡す。
- **委任**: handoff を強制すればかなり良くなる。
- **ボード連携**: 使えるが、次工程への接続が弱い。

## 最適化案
1. **supervisor-core を triage 寄りに縮退する前提を固める**
   - 観測・triage・品質レビューを分離。
   - `Queue Triage Analyst` を優先経路にして、supervisor-core の重複を減らす。

2. **探索→研究→実行→文書化の handoff を固定する**
   - `opportunity-scout` → `research-analyst` → `doc-editor` の順で役割を狭くする。
   - `owner / due / success criteria` を途中で必須化する。

3. **軽量 board 役は今のままでよい**
   - `board-user-advocate` / `board-operator` / `doc-editor` / `github-operator` は、今の mini + low 思考が適正。
   - ここをさらに強くするより、scope を広げないことが重要。

4. **ops-automator と dss-manager はペア固定を継続**
   - 運用安全化と E2E を分ける。
   - これはコスト削減にも、再現性にも効く。

5. **必要なら heartbeat だけを軽くする**
   - `board-visionary` / `board-auditor` の main は維持しつつ、heartbeat が narrative 化しすぎるなら軽量化余地あり。
   - ただし、先に role boundary を整理してから。

## 自動適用候補
- `doc-editor` の `thinkingDefault` を `low` に固定する。
- `github-operator` を `gpt-5.4-mini` / `low` に固定する。
- `board-user-advocate` と `board-operator` の `thinkingDefault` を `low` に固定する。
- `opportunity-scout` の subagent は `nano` 固定にせず、必要時は `low` 以上へ上げる。

## 要判断事項
- `supervisor-core` を triage 専任化まで落とすか、decision-quality を残すか。
- `research-analyst` を `gpt-5.4-mini` のままにするか、PoC 接続が必要な回だけ `gpt-5.4` に上げるか。
- `opportunity-scout` の subagent 深度をどこまで許すか。
- `board-visionary` / `board-auditor` の heartbeat を軽くするか。

## 次アクション
1. 次回の定期報告で、`supervisor-core` の重複件数と `Queue Triage Analyst` への流量を確認する。
2. `research-analyst` には scout 結果の `owner / due / success criteria` 付与を強制する。
3. `opportunity-scout` は探索専任に戻し、PoC 設計は研究側へ渡す。
4. 高リスクな境界変更は deep review に回し、自動適用しない。
