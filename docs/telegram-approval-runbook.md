# Telegram approval runbook

## 目的
Telegram 会話中に `exec approval is required` / `approval-timeout` が出た時、何が起きているかと、どう回避するかを短く判断できるようにする。

## 何が起きているか
- `exec` コマンドが gateway 側で manual approval 必須として扱われた
- しかし現在の Telegram surface では chat 内承認が有効ではない
- そのため、Web UI / terminal UI など承認可能な面で承認されない限り実行されず、最終的に timeout で deny される

## これは何を意味するか
- コマンド自体が危険だったとは限らない
- コマンドが壊れていたとも限らない
- 承認経路が Telegram 会話面にないため、実行に進めなかっただけである

## 実務上の扱い
- Telegram では approval 必須の `exec` を細かく連打しない
- まず first-class tool で代替できるか確認する
- approval が必要な CLI 作業は、まとめて Web UI / terminal UI で処理する

## 優先ルーティング
1. `read` / `edit` / `write`
2. `gateway.config.schema.lookup` / `gateway.config.get` / `gateway.config.patch`
3. `browser` / `web_fetch` / `web_search`
4. `sessions_*` / `cron`
5. `exec`

## 典型的な置き換え例
- `find` / `ls` で場所確認 → 既知パスなら `read` / `write` で代替
- config を grep → `gateway.config.get` / `config.schema.lookup`
- ログを shell で tail → 既に status / doctor / report があればそちらを優先

## ユーザー向け説明テンプレ
- 起きたこと: exec に手動承認が必要だったが、この Telegram では承認できず timeout した
- 影響: 実行結果はない。コマンド自体の成否ではなく承認経路の問題
- 次の対応: 再実行が必要なら Web UI / terminal UI でまとめて承認する。Telegram では代替手段を優先する
