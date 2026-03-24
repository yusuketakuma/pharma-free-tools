# DDS agent runner progress — 2026-03-24

## 今回の進捗
- `~/.openclaw/agents/dds-agent-runner/` の scaffold を作成
- `register.mjs` を実 HTTP 登録対応へ更新
- `heartbeat.mjs` を実 HTTP heartbeat 対応へ更新
- `claim-and-dispatch.mjs` を実 HTTP claim 対応へ更新

## register.mjs
実装済み:
- env 読み込み
- register URL 解決
- POST `/api/openclaw/connect/register`
- response の state 保存
- control token のマスク表示
- runner.log への追記

## heartbeat.mjs
実装済み:
- state 読み込み
- heartbeat URL 解決
- control token を使った Bearer 認証
- POST `/api/openclaw/connect/heartbeat`
- 成功時の `lastHeartbeatAt` 更新
- runner.log への追記
- 未登録状態では `missing_state` で安全停止

## claim-and-dispatch.mjs
実装済み:
- state 読み込み
- claim URL 解決
- control token を使った Bearer 認証
- POST `/api/openclaw/connect/jobs/claim`
- 204 no content の idle 処理
- claim 成功時の state 更新
- `job-history.jsonl` への claimed / empty 記録
- 未登録状態では `missing_state` で安全停止

## 確認結果
- `node --check .../register.mjs` → OK
- `node --check .../heartbeat.mjs` → OK
- `node --check .../claim-and-dispatch.mjs` → OK
- env 未設定時の register は `missing_env` で停止
- 未登録状態の heartbeat / claim は `missing_state` で停止
- `runner.log` へ記録追記できた

## 残タスク
1. `dss-manager` bridge 実装
2. `question` / `pr` callback 実装
3. live register 実行と state 取得確認
4. preview 接続テスト
