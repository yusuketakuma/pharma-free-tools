# Growth Proposal

- proposal_id: GP-2026-03-28-staffing-prompt-routing-wording-01
- title: Dispatch前の wording 正規化で staffing / prompt / routing 判定の曖昧さを減らす
- status: proposed
- risk: low
- requires_manual_approval: false

## Summary

現状の運用文書では、staffing / prompt / routing / dispatch の判断材料が複数ファイルに重複して存在し、意味は近いが表現が少しずつ異なる。そのため、軽微な依頼でも「OpenClaw-only で処理すべきか」「Claude/ACP に送るべきか」「task-dispatch skill を使うべきか」の wording 判定がぶれやすい。

routing root の根幹変更は避けつつ、dispatch 前に使う wording を 1 枚の短い正規化ルールへ寄せることで、過剰 staffing・prompt 冗長化・dispatch 失敗の再発要因を減らせる。

## Observed Signals

1. OpenClaw-only / Claude Code の境界が AGENTS.md と TOOLS.md の両方にあり、表現が近いが完全一致ではない。
2. developer instructions では、一般 coding task は skill/task-dispatch を使う文脈と、ACP harness 指示は sessions_spawn(runtime="acp") を使う文脈があり、routing wording によって分岐が変わる。
3. coding-agent skill と task-dispatch skill の説明領域が近く、特に「実装・修正・調査」系で wording 次第で迷いやすい。
4. dispatch failure の再発要因として、root policy そのものよりも「依頼文の分類語彙が散っている」ことが効いている可能性が高い。

## Proposed Change

dispatch 前判定に使う短い canonical wording を追加する。

### Canonical routing wording

- "軽い単発編集・要約・整理・軽微 docs 更新" → OpenClaw-only
- "複数ファイル変更・テスト・repo-wide 調査・実装・重い修正" → task-dispatch を第一候補
- "ユーザーが codex / claude code / gemini で実行してと言った" → ACP harness (sessions_spawn, runtime="acp")
- "チャット内 thread-bound 実行要求" → ACP harness を優先
- "protected path / auth / trust boundary / routing root" → manual review

### Staffing wording

- 既定 staffing は single lead
- advisory は観点補助のみ、原則別実行なし
- active subroles は成果物が複数ある時だけ
- swarm は高リスク横断 task に限定

### Prompt wording hygiene

- 同義反復を減らし、判断に効く文だけ残す
- "OpenClaw は control plane / Claude Code は execution plane" を routing 判定の正本表現として固定
- "どの条件で skill/task-dispatch を使うか" と "どの条件で ACP harness を使うか" を1箇所に短く並置

## Expected Benefits

- dispatch 前の迷い減少
- 過剰 staffing の抑制
- prompt 長文化による判定ノイズ低下
- routing wording 由来の失敗再発防止

## Non-Goals

- routing root の変更
- auth / trust boundary の変更
- protected path の自動変更

## Suggested Next Step

1. dispatch 前 canonical wording を 1 箇所に追加
2. AGENTS / TOOLS / skill descriptions の重複表現は、意味変更なしで wording のみ寄せる
3. 次回以降、dispatch failure を見たら "分類語彙の不一致" を first check にする
