# Board Governance Model

## 結論
OpenClaw の組織構造を次の 3 層で運用する。

- CEO (`ceo-tama`)
- 取締役会 (`board layer`)
- 各種実行エージェント (`supervisor-core`, `research-analyst`, `github-operator`, `ops-automator`, `doc-editor`, `dss-manager`, `opportunity-scout` など)

基本構造:

```text
CEO ↔ 取締役会 ↔ 各実行エージェント
```

ユーザーへの報告は、原則として **取締役会での議論・整理・裁定を経由してから** 行う。

---

## 目的

1. CEO の判断を直接実行層へ流して散らからせない
2. 各エージェントの知見・失敗・提案を取締役会で統合する
3. ユーザー報告の質を上げる
4. 実行エージェントが勝手に部分最適へ走るのを抑える
5. 情報共有と意思決定の間に、批判的検討と優先順位づけを入れる

---

## Layer Definitions

### 1. CEO
役割:
- 全体目標の設定
- 優先順位の最終決定
- board への諮問
- board の裁定を承認または差し戻し
- ユーザー要求の最終解釈

責務:
- 何を目指すか決める
- 何をやらないか決める
- board に判断課題を渡す

### 2. 取締役会
役割:
- CEO と実行層の間に立つ意思決定・監督・統合レイヤー
- 情報共有の集約点
- 議論・反対意見・代替案・優先順位づけ・実行計画化
- ユーザー報告の前処理

責務:
- 各エージェントの進捗・提案・失敗・リスクを統合する
- 争点を明確化する
- 必要な追加調査や比較を指示する
- 採用 / 却下 / 保留を裁定案としてまとめる
- ユーザーへの報告案を作る

### 3. 実行エージェント
役割:
- 専門業務の実行
- 調査、実装、運用、文書化、監査

責務:
- 生の進捗、失敗、提案、成果物を board に上げる
- 直接ユーザー報告を完結させない
- board の追加質問や再整理依頼に従う

---

## Board Operating Rules

### Rule 1: 情報は board に集約する
各実行エージェントは、重要情報を次の形式で board へ上げる。

- status
- success
- failure
- lesson
- risk
- proposal
- next action

### Rule 2: ユーザー報告は board 経由
ユーザーへの報告は原則、以下の流れを取る。

1. 実行エージェントが board に報告
2. board が比較・統合・議論
3. board が推奨結論を作る
4. CEO が最終承認
5. ユーザーへ報告

### Rule 3: board は単なる転送係ではない
board は必ず次を行う。

- 争点の整理
- 反対意見の提示
- 代替案の提示
- リスク評価
- 優先順位づけ
- 実行/保留/却下の明確化

### Rule 4: 生ログをそのまま上げない
ユーザーへは内部イベントをそのまま投げず、board が次の形に整える。

- 結論
- 根拠
- 実際に起きたこと
- リスク
- 次アクション

### Rule 5: 例外は緊急時のみ
緊急時のみ、board を短縮経由して速報を出してよい。
ただしその場合も事後に board review を残す。

---

## Board Internal Discussion Model

取締役会は、内部で次の役割を持つ議論フレームを使ってよい。

- 発明家: 高レバレッジ案
- 利用者代表: 分かりやすさ・運用容易性
- 推進者: 最小実行可能案
- 監査者: リスク・失敗条件
- 裁定者: 結論、優先順位、採否

この議論は、**実行を前に進めるためのもの** とし、長文化自体を目的にしない。

---

## Reporting Contract

ユーザーへの報告は最低限次を含める。

1. 結論
2. 何が起きたか
3. board がどう評価したか
4. 採用 / 保留 / 却下
5. 次アクション

禁止:
- 実行エージェントの生出力を無加工で転送
- board の裁定抜きの断片報告
- 単なる進捗羅列

---

## Recommended Role Mapping

### CEO
- `ceo-tama`

### Board layer
推奨:
- `supervisor-core` を board の母体にする
- 必要なら将来 `board-secretariat` / `board-chair` を追加

### Execution agents
- `research-analyst`
- `github-operator`
- `ops-automator`
- `doc-editor`
- `dss-manager`
- `opportunity-scout`
- その他専門エージェント

---

## Rollout Policy

### Phase 1
- board governance を文書で固定
- ユーザー報告は board review 必須にする

### Phase 2
- 主要 cron の出力を board review 経由に寄せる
- cross-agent knowledge sync を board 集約へ寄せる

### Phase 3
- 取締役会の議論テンプレートを標準化
- 高リスク判断では board deep review を発火

---

## Definition of Done

1. CEO ↔ board ↔ execution agents の構造が文書化されている
2. ユーザー報告は board review 経由と定義されている
3. 実行エージェントの報告フォーマットが定義されている
4. board が統合・批判・裁定を行うことが明記されている
