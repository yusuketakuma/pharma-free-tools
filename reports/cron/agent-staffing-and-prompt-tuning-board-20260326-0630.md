# Agent Staffing & Prompt Tuning — Board Report

Date: 2026-03-26 06:30 JST

## 結論
- 最近の成績を見る限り、ボトルネックは「モデル不足」より **役割の広さ・重複・受け渡し不足**。
- したがって、今回の最適化は **supervisor-core の縮退 / Queue Triage Analyst への分離 / scout→research→execution の接続固定** が中心。
- **高リスク** に当たる CEO↔board↔execution 構造変更、auth / trust boundary / routing の変更は今回 **自動適用しない**。
- 通常通知は行わず、**7:00 / 12:00 / 17:00 / 23:00** の定期報告へ集約する。

## board の主要論点
### 1) 発明家
- いちばんレバレッジが高いのは「広い役割を細い役割に割る」こと。
- 特に `supervisor-core` は観測・triage・品質レビューが混ざっており、重複の温床になっている。

### 2) 利用者代表
- 出力は短く、再利用しやすく、次アクションが一目で分かるべき。
- `owner / due / success criteria` がない handoff は止まりやすい。

### 3) 推進者
- `opportunity-scout → research-analyst → ops-automator / dss-manager` の受け渡しを固定すると前に進みやすい。
- `github-operator` と `doc-editor` は役割を狭く保つほど強い。

### 4) 監査者
- 役割境界の大変更や board 構造の変更は high-risk。
- `queue-triage-analyst` は低リスク追加だが、これ以上の構造変更は deep review が必要。

## 再配置案
### 案1: supervisor-core を board 集約に寄せ、triage を Queue Triage Analyst に切り出す
- ねらい: 重複再掲を減らし、dominant-prefix triage を専任化する。
- 割当:
  - `supervisor-core`: 例外の集約、最終 triage、board への橋渡し
  - `queue-triage-analyst`: dominant-prefix triage / 再掲抑制 / owner-next action 抽出
- 評価: 効果大。既に lesson と整合。

### 案2: 探索と実行接続を分離する
- ねらい: scout だけで完結させず、PoC / 実行に落とす。
- 割当:
  - `opportunity-scout`: broad exploration
  - `research-analyst`: rubric 化、PoC 化、比較整理
- 評価: 中リスク低。再利用性が高い。

### 案3: 運用実行をペア固定する
- ねらい: live integration と運用 cleanup を分けすぎない。
- 割当:
  - `ops-automator`: cleanup / retry / state hygiene / cron runner
  - `dss-manager`: live integration / E2E / callback / report
- 評価: 低〜中リスク。実務インパクトが高い。

## 性能最適化案
### 案1: handoff preflight を必須化
- `exact target / owner / due / success criteria` を軽微タスクと scout handoff にも入れる。
- exact-target mismatch の retry cost を下げる。

### 案2: routine board を signal-only に固定
- board / heartbeat / scorecard は定常時は signal-only。
- candidate 化は anomaly-delta のみ。

### 案3: 出力テンプレを短文化
- `github-operator` と `doc-editor` の出力を、runbook / checklist / PR cleanup の短文テンプレに固定。
- `ops-automator` は read-only 監視、`dss-manager` は E2E / receipt に固定し、board-level の背景説明は削る。
- 形式は原則 `結論 / 理由 / 次アクション` の 5 行以内に寄せる。
- 役割逸脱を抑える。

## モデル/推論度見直し案
### 1) ceo-tama
- model: **full**
- thinkingDefault: **medium**
- subagents.thinking: **low〜medium**
- 理由: 最終集約と意思決定の一貫性が必要。

### 2) supervisor-core
- model: **mini** への縮小を検討
- thinkingDefault: **low〜medium**
- subagents.thinking: **low**
- 理由: 役割を narrow にするなら、重い推論は不要。重複抑制と記述圧縮に寄せる。

### 3) queue-triage-analyst
- model: **mini**
- thinkingDefault: **medium**
- subagents.thinking: **medium**
- 理由: triage は軽量だが、クラスタリングと next action 抽出に一定の推論が要る。

### 4) research-analyst / opportunity-scout / ops-automator / dss-manager
- model: **full か mini の中間ではなく、役割に応じて full 寄りを維持**
- thinkingDefault: **medium**
- subagents.thinking: **low〜medium**
- 理由: ここは判断と接続の質が成果に直結する。

### 5) github-operator / doc-editor
- model: **mini**
- thinkingDefault: **low**
- subagents.thinking: **low**
- 理由: repo hygiene と文書圧縮に集中させる。

### 補足
- **nano は原則おすすめしない**。
- 使うなら、純粋な整形・機械的 cleanup に限定。

## 次アクション
1. `Queue Triage Analyst` を優先経路に置き、`supervisor-core` は集約役へ寄せる。
2. すべての scout / handoff に `owner / due / success criteria` を必須化する。
3. `github-operator` と `doc-editor` のテンプレを短く固定する。
4. `ops-automator` ↔ `dss-manager` のペア運用を標準化する。
5. 高リスクの構造変更は deep review に回し、自動適用しない。
