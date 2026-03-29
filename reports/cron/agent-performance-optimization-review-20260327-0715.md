# Agent Performance Optimization Review — 2026-03-27 07:15 JST

## 結論
**model の引き上げは不要。**
今回の durable レバーは、モデル強化ではなく **role boundary の縮小と wording の圧縮**。
`board / heartbeat / scorecard` の signal-only 化と状態 taxonomy 分離は既に別 proposal で前進しており、今サイクルで新しく足すべきなのは、軽量 role の出力を細くして再掲と role drift を減らすこと。

## performance 観測
- **ライト役は現状維持で妥当**: `board-user-advocate` / `board-operator` / `doc-editor` / `github-operator` は mini + low 帯が合っている。
- **重い論点はモデルより scope**: `supervisor-core` は観測・triage・品質レビューが重なりやすく、ここは scope 縮小の方が効く。ただしこれは routing / trust boundary 近傍なので、今回の low-risk proposal には入れない。
- **board touch 過多は一部解消済み**: signal-only / status taxonomy 系はすでに別 proposal で対応済みで、steady-state の再掲圧は下がる見込み。
- **verification 遅延の主因は state 混同**: apply / blocked / live-receipt / freshness を分けないと、完了と証跡確認が混ざって滞る。
- **探索→研究の handoff はまだやや浅い**: `opportunity-scout` と `research-analyst` は、deep PoC が必要な回だけ深さを上げる運用がよい。

## growth proposal 生成有無
**あり。**

## proposal_id
`proposal-20260327-narrow-role-prompt-templates`

## 次アクション
1. `proposal-20260327-narrow-role-prompt-templates` を review 対象として維持し、軽量 operator の prompt を 1 行 remit + anti-scope に圧縮する。
2. `supervisor-core` の scope 縮小は、既存の revise/manual proposal を分離再提出する前提で別サイクルに回す。
3. 次回レビューでは、軽量 role の出力長・再掲率・handoff の clarifying question 数を観測し、効果確認できるかを見る。
4. board / heartbeat / scorecard は steady-state で signal-only を維持し、異常 delta がある時だけ candidate 化する。
