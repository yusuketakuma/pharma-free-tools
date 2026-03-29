status: done
updated_at: 2026-03-29T09:27:00Z
summary: eslint 10 + react-hooks 7 をrevert。main CIが回復中（install SUCCESS）。
executed:
  - eslint 10.1.0をrevert（9.39.4に復帰）
  - eslint-plugin-react-hooks 7.0.1をrevert（5.2.0に復帰）
  - CI workflowの--legacy-peer-depsを削除
  - main push → CI実行中（install SUCCESS、test全件進行中）
blocked: なし
next: main CI全通過確認 → PR #41（audit fix）をrebaseして再CI → マージ
