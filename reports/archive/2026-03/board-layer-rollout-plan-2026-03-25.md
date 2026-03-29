# Board layer rollout plan

Date: 2026-03-25

## 結論
今後の運用は、**CEO ↔ 取締役会 ↔ 各実行エージェント** の 3 層構造に寄せる。

ユーザー報告は、原則として **取締役会での議論・整理・裁定を必ず経由** する。

---

## この方針の意味

### 以前
- CEO が実行層へ直接近く、報告も断片化しやすい
- 各エージェントの知見がそのままユーザーへ近い形で出やすい

### 今後
- 実行層の生情報は board に集約
- board が争点整理・反対意見・代替案・優先順位づけを行う
- CEO は board の裁定を受けて最終判断
- ユーザーへは board review 済みの形で報告

---

## 推奨ロール配置

### CEO
- `ceo-tama`

### Board
- 当面は `supervisor-core` を board 中核にする
- 将来的に board 専用 agent を分離してもよい

### Execution
- 既存専門エージェント群

---

## 直近で変えるべき運用

### 1. report 生成
定期報告・臨時報告は、内部的に board review を経由した要約として扱う。

### 2. cross-agent knowledge sync
単なる共有ではなく、board での統合・再配置示唆を含む形に寄せる。

### 3. proactive discovery
自律探索で見つかった候補は、board の採否を経てからユーザー報告へ載せる。

### 4. high-risk judgment
高リスク変更は board deep review を必須にする。

---

## 次アクション

1. board governance model を正本化
2. `supervisor-core` を board role として再定義する artifact を追加
3. 主要 cron prompt を "board review required" 前提に更新
4. 定期報告 prompt を board 裁定ベースへ更新

---

## Recommendation

次は、`supervisor-core` と主要 cron を **board 前提の wording** に更新するのが最も効果が高い。
