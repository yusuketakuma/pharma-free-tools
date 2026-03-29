# agents

このディレクトリは、現在のたまAI仮想組織における step2（エージェント定義）を人間が読める形で表現したものです。

目的:
- 今の agent 配置を役割・連携・判断基準つきで明文化する
- step3 の `guidelines/` と step5 の `templates/` を、どの agent が使うかを整理する
- 新しい専用エージェントを追加する時の基準面として使う

## 組織の大枠
- CEO レイヤー: 1名
- Board レイヤー: 4名
- 実務レイヤー: 6名
- 共通探索サービス: 1名
- 専門補助レイヤー: 3名

## 共通参照
- guidelines/company-overview.md
- guidelines/board-governance.md
- guidelines/collaboration-protocol.md
- guidelines/reporting-standards.md
- templates/regular-progress-report.md
- templates/execution-handoff.md

## 注意
- ここは運用定義の正本であり、runtime config の完全な代替ではない
- 実際の model / cadence / allowlist は openclaw.json が正本
- ただし役割・anti-scope・判断基準はこの定義を先に読む方が早い
