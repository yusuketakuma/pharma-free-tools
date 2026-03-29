# tools-manual

## tool の使い分け
- read / edit / write: 軽い文書・設定反映
- exec: ローカル診断・検証・CLI 実行
- gateway: config schema lookup / patch / restart
- sessions_*: 他セッションや sub-agent 連携
- cron: reminder / scheduled operation

## 実務ルール
- config を触る前に schema を確認する
- long wait は poll loop ではなく適切な wait を使う
- first-class tool があれば exec/curl で代用しない
- cross-agent visibility 制限がある時は、直接 send 前提で設計しない
- Telegram では exec approval を chat 上で返せない前提で設計する
- 事前確認だけの用途では approval が絡む exec を増やさず、read / write / edit / gateway で済むか先に見る
- 承認が必要な CLI 作業は Web UI / terminal UI 前提でまとめて実施し、Telegram 会話では approval-timeout を起こしやすい細かい exec を避ける

## Telegram 運用での優先順位
1. read / edit / write
2. gateway(config.schema.lookup / config.patch / restart)
3. browser / web_fetch / web_search
4. sessions_* / cron
5. exec（本当に必要な時だけ）

## approval が詰まりやすいケース
- `ls`, `find`, `rg` などの確認だけの exec
- git / shell / local CLI の状態確認
- cross-session 診断のためのローカルコマンド

## 推奨回避策
- ディレクトリ確認は、既知パスなら直接 read / write して存在確認を兼ねる
- 設定確認は config.get / config.schema.lookup を優先する
- 実行ログの把握は status / doctor / first-class report を優先する
