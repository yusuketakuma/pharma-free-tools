# DDS agent runner progress — 2026-03-24

## 今回の進捗
- `~/.openclaw/agents/dds-agent-runner/` の scaffold を作成
- `register.mjs` を実 HTTP 登録対応へ更新
- `heartbeat.mjs` を実 HTTP heartbeat 対応へ更新
- `claim-and-dispatch.mjs` を実 HTTP claim + OpenClaw bridge 対応へ更新
- `question.mjs` / `pr.mjs` を追加
- `callback.mjs` / `report.mjs` を追加

## 実装済み
### register.mjs
- env 読み込み
- register URL 解決
- POST `/api/openclaw/connect/register`
- response の state 保存
- control token のマスク表示
- runner.log への追記

### heartbeat.mjs
- state 読み込み
- heartbeat URL 解決
- control token を使った Bearer 認証
- POST `/api/openclaw/connect/heartbeat`
- 成功時の `lastHeartbeatAt` 更新
- 未登録状態では `missing_state` で安全停止

### claim-and-dispatch.mjs
- state 読み込み
- claim URL 解決
- control token を使った Bearer 認証
- POST `/api/openclaw/connect/jobs/claim`
- 204 no content の idle 処理
- claim 成功時の state 更新
- `job-history.jsonl` への claimed / empty 記録
- `openclaw agent --agent dss-manager --json` bridge
- strict JSON dispatch contract の解析
- `question` / `pr` / `report` / `callback` helper 呼び出し

### callback helpers
- `question.mjs`: `/api/openclaw/connect/work-items/:id/question`
- `pr.mjs`: `/api/openclaw/connect/work-items/:id/pr`
- `callback.mjs`: HMAC 署名つき `/api/openclaw/callback`
- `report.mjs`: HMAC 署名つき `/api/openclaw/report`

## 確認結果
- すべての script に対して `node --check` → OK
- env / state 不足時は安全停止する
- live register / live heartbeat / live claim は未実行（token / URL / webhook secret 未投入のため）

## 残タスク
1. live register 実行
2. live claim + dispatch 実行
3. preview 接続テスト
4. 必要なら retry/backoff の常駐 loop 化

## 評価
- コード上の runner 骨格は一通り揃った
- 以後の主タスクは「実接続テスト」と「本番前の運用磨き」
