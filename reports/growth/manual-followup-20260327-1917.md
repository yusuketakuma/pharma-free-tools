# Manual follow-up report — 2026-03-27 19:17 JST

## 結論
- supervisor boundary proposal は low-risk handoff preflight と boundary manual review の2本に分割した。
- manual_paths の優先上位は手動反映し、state separation / proof-path / live receipt split の wording を report 側へ波及させた。
- exec-side live receipt は board-side completion から分離維持する方針を report に固定した。

## 実行したこと
1. agenda / premeeting / business report に、review / apply / live receipt / freshness を別状態で扱う注意書きを追加。
2. lesson / performance review に、exact target / owner / due / success criteria の preflight と状態分離を再明文化。
3. safe-close audit と dispatch verification に、close record 必須項目と proof-path の要件を追記。
4. 欠けていた cross-agent sync の 04:35 記録を追加し、board complete と exec unresolved の分離を記録。
5. supervisor proposal を low-risk と manual review の2本へ分割して再投入できる形にした。

## 反映した要点
- agenda submission の `ok / exit: 0` は完了ではなく、論点入力の成功にすぎない。
- Board の裁定、apply の進行、exec の live receipt、artifact freshness は別レーンで報告する。
- `apply-applied` は effect-confirmed ではない。
- close record には owner / next_action / success_criteria / review_after / linked_evidence を固定する。
- exec 側は safe temporary file 配信成功でも `sent` 止まりで、live receipt 未観測なら done にしない。

## 残件
- manual_paths 全件を潰し切ったわけではなく、今回の優先上位を先に反映した。
- verification latest の件数集計は次回 verification sweep で更新される前提。
- boundary manual review proposal は人手裁定が必要。
