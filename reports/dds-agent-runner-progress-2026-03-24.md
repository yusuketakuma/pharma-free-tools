# DDS agent runner progress — 2026-03-24

## 今回の進捗
- `~/.openclaw/agents/dds-agent-runner/` の scaffold を作成
- `register.mjs` を実 HTTP 登録対応へ更新
- `heartbeat.mjs` を実 HTTP heartbeat 対応へ更新

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

## 確認結果
- `node --check .../register.mjs` → OK
- `node --check .../heartbeat.mjs` → OK
- env 未設定時の register は `missing_env` で停止
- 未登録状態の heartbeat は `missing_state` で停止
- `runner.log` へ記録追記できた

## 残タスク
1. `claim-and-dispatch.mjs` の実 HTTP 化
2. `dss-manager` bridge 実装
3. `question` / `pr` callback 実装
4. preview 接続テスト
