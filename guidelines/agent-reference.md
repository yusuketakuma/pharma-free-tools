# agent-reference

このファイルは step2（agent 定義）と step3 / step5 の接続点です。

## 使い方
- 役割の意味は `agents/*.md` を読む
- 共通判断ルールは `guidelines/*.md` を読む
- 出力形式は `templates/*.md|json` を使う

## 代表的な対応
- CEO / Board 系 → `templates/board-decision.md`, `templates/regular-progress-report.md`
- 実務 handoff → `templates/execution-handoff.md`
- receipt / verification 系 → `templates/receipt-reconciliation.md`
- backlog 整理 → `templates/backlog-triage.md`
- DDS 応答 → `templates/dds-work-item-response.json`
- 新役設計審査 → `templates/board-decision.md` を設計判断の型として使う

## 運用ルール
- 新しい agent を追加する時は、まず `agents/<id>.md` を作る
- その agent が参照する guideline と template を明示する
- runtime config を変える前に、役割・anti-scope・判断基準を文書化する
