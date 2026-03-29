# board-agenda-assembly

日時: 2026-03-27 14:35 JST
運用順: agenda seed → Claude Code 事前審議 → premeeting 正本 brief → OpenClaw 再レビュー → 記録 → 指示

## 主要論点（最大3件）
1. 本会議で今決めるべき事項の優先順位確定
2. 実行が必要な論点の配線（OpenClaw完結 / Claude Code execution plane）
3. リスク・期限・次アクションの固定

## Claude Code execution へ回す論点
- repo 調査が必要なもの
- 複数ファイル変更が必要なもの
- テスト実行が必要なもの
- 実装が必要なもの
- refactor が必要なもの

## OpenClaw 完結でよい論点
- read_only
- plan_only
- short report
- lightweight coordination
- 優先順位づけ
- 指示文の整形
- 進行管理

## 実行面の配置判断理由
- 調査・実装・テスト・refactor は実作業と検証が必要なので Claude Code execution plane が適切
- 進行管理・判断・短報告・配線は OpenClaw control plane で完結できる
- 取締役会では、意思決定と実行経路を分けて明示することで、後続の手戻りを減らせる
