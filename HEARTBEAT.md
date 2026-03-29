# HEARTBEAT.md

## Purpose

Heartbeat は、短く・冪等に・安全に、ワークスペースの健全性を点検するための定期チェックである。

## Every Heartbeat

1. auth の確認
- Claude subscription auth が有効か確認
- auth drift がないか確認

2. lane health の確認
- acp_compat / cli / safety net の健康状態を確認
- 直近失敗と連続失敗を確認

3. queue の確認
- waiting_auth
- waiting_approval
- waiting_capacity
- waiting_manual_review
の件数と滞留を確認

4. growth signal の確認
- fallback 増加
- degraded success 増加
- 同種エラー再発
- queue 偏り
がないか確認

5. stale task の確認
- 長時間止まっている task を抽出
- 再開条件が満たされていれば rebalance 候補にする

6. memory 更新候補の確認
- 繰り返し現れる学び
- 安定した運用ルール
- よく使う verification command
を MEMORY 候補として抽出

## Never Do Automatically

- Telegram「たまAI」設定の変更
- SOUL / AGENTS / TOOLS / IDENTITY / USER の無承認更新
- auth / routing / trust boundary / approval の根幹変更
- partial write task の自動再開
- manual review 必須 task の自動 publish

## Output

Heartbeat 実行時は、必要に応じて次のいずれかを残す。
- metrics 更新
- growth proposal
- stale queue report
- memory update proposal
- no-op（異常なし）
