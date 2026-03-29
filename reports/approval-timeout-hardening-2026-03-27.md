# approval-timeout hardening

## 実行したこと
- Telegram で approval が返せない前提の運用ルールを明文化した
- `tools-manual` に、approval が絡みやすい exec を避ける優先順位と代替策を追加した
- Telegram 専用の approval runbook を追加し、原因・影響・回避策・説明テンプレを整理した

## 追加した要点
- Telegram では `exec` を最後の手段にする
- `ls` / `find` / `rg` のような確認だけの exec は特に timeout を起こしやすい
- config 確認は schema lookup / config get を優先する
- approval が必要な CLI 作業は Web UI / terminal UI でまとめて処理する

## 期待する改善
- approval-timeout の再発を減らす
- 「コマンドが壊れた」のか「承認経路がない」のかを混同しない
- Telegram 会話中の無駄な診断ループを減らす

## 次に行うこと
- 新しい専用エージェントを追加する時も、この runbook を前提に tool routing を設計する
- Receipt / Delivery Reconciler を追加するなら、approval 不要の first-class tool 優先で設計する
