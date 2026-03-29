# Cross-Agent Knowledge Sync Memo

Date: 2026-03-25
Scope: Supervisor Core / cross-agent-knowledge-sync
Status: No reusable cross-agent knowledge detected in the currently visible recent sessions.

## 結論
- 直近で確認できたエージェント実行は本クロノセッションのみで、他エージェントの成功・失敗・学び・成果物は取得できなかった。
- そのため、今回は新規の共有知識は生成せず、次回の定期報告で再利用できる収集テンプレを残す。

## 今回共有すべき知識
- 共有対象の実データなし。
- 監督レイヤーは、次回以降「recent success / failure / lesson / next_change / artifact」を定型収集してから統合する。
- Opportunity Scout 系の知見が出た場合は、研究・文書化・自動化・意思決定で再利用できる粒度に正規化する。

## 再利用先エージェント
- research-analyst: 調査結果の要約・比較軸化
- doc-editor: 再利用可能な手順書・共有メモ化
- ops-automator: 反復可能な運用手順への落とし込み
- dss-manager: 再配置判断・優先度判断の材料化

## 重複回避示唆
- 直近の横断確認で実データがない場合は、無理に一般論を増やさず「未検出」と明記する。
- 同じ探索を再実行する前に、まず sessions_list / sessions_history / memory_search で既出確認する。
- 共有メモは「誰が何に使うか」まで書く。用途が曖昧な知識は共有しない。

## 成果物/共有メモ
- 本ファイル: `artifacts/shared-memos/2026-03-25-cross-agent-knowledge-sync.md`
- 次回の報告フォーマット:
  - 結論
  - 今回共有すべき知識
  - 再利用先エージェント
  - 重複回避示唆
  - 成果物/共有メモ
  - 次アクション

## 次アクション
- 次回 cron では、直近 24h の sessions_list を確認し、必要なら各 session の history から success/failure/lesson/next_change を抽出する。
- Opportunity Scout の出力がある場合は、research-analyst / doc-editor / ops-automator / dss-manager 向けに変換して保存する。
