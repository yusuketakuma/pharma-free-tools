# Agent Workforce Expansion Review — 2026-03-27 06:45 JST

## 結論
**追加不要。**

今回の論点は、`supervisor-core` 周辺の重複・再掲・境界の広さだが、これは新 agent 追加よりも **runbook / dispatch / prompt 分割** で吸収できる段階にある。

## expansion 必要性
**現時点では不要。**

理由:
1. 既存の `Queue Triage Analyst` 路線で、dominant-prefix triage は既に役割分離の入口がある
2. 直近の改善テーマは、agent 数の不足ではなく **state separation / owner-due-success criteria / proof-path** の整理
3. `supervisor-core` の重複は、境界固定と signal-only 化でまず減らすべき
4. 新規追加は、複雑さ増加の方が先に立つ

## growth proposal 生成有無
**生成しない。**

## proposal_id
**none**

## 次アクション
1. `supervisor-core` は観測集約に寄せ、triage の再掲を止める
2. 同一 prefix の反復は `Queue Triage Analyst` へ流す
3. `owner / due / success criteria / evidence` を handoff の必須項目にする
4. board / heartbeat / scorecard は平常時 signal-only を維持する
5. 2回連続で差分不足が残る場合のみ、次回以降に新 agent 候補を再検討する
