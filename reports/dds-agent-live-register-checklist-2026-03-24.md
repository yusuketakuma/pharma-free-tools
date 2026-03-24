# DDS agent live register checklist — 2026-03-24

## 結論
`dds-agent-runner` のコード骨格は揃っている。次の本丸は **live register / live claim の実接続**。
現時点の主ボトルネックはコードではなく、**env / token / server-side mode / webhook secret**。

## 必須前提
### DeadStockSolution / Vercel 側
- `OPENCLAW_CONNECTOR_MODE=managed_remote_agent`
- `OPENCLAW_PUBLIC_BASE_URL` または正しい `VERCEL_URL`
- `OPENCLAW_WEBHOOK_SECRET` 設定済み
- DDS 関連 migration 適用済み

### runner 側
- `DDS_AGENT_SERVER_BASE_URL`
- `DDS_AGENT_BOOTSTRAP_TOKEN`
- `DDS_AGENT_LABEL=DDS-agents`
- `DDS_AGENT_OPENCLAW_AGENT_ID=dss-manager`
- （必要なら）`OPENCLAW_WEBHOOK_SECRET` も runner 側に渡す

## まだ未確認なもの
- bootstrap token の実発行手段
- Vercel 上の `managed_remote_agent` 有効化状態
- 本番/preview の `OPENCLAW_WEBHOOK_SECRET` 実値
- migration 適用済みか

## 最短の次手順
1. Vercel 側 env を確認
2. bootstrap token を発行
3. runner 側 env を投入
4. `register.mjs` を live 実行
5. `state.json` に connectionId / controlToken / claimUrl / heartbeatUrl が入ることを確認
6. `heartbeat.mjs` を live 実行
7. `claim-and-dispatch.mjs` を live 実行

## 実行コマンド候補
```bash
export DDS_AGENT_SERVER_BASE_URL="https://<your-app>.vercel.app"
export DDS_AGENT_BOOTSTRAP_TOKEN="<bootstrap-token>"
export DDS_AGENT_LABEL="DDS-agents"
export DDS_AGENT_OPENCLAW_AGENT_ID="dss-manager"
export OPENCLAW_WEBHOOK_SECRET="<same-secret-as-vercel>"

node ~/.openclaw/agents/dds-agent-runner/scripts/register.mjs
node ~/.openclaw/agents/dds-agent-runner/scripts/heartbeat.mjs
node ~/.openclaw/agents/dds-agent-runner/scripts/claim-and-dispatch.mjs
```

## 成功条件
- `register.mjs` が 201 相当で成功
- `state.json` に `connectionId` と `controlToken` が入る
- `heartbeat.mjs` が `ok: true`
- `claim-and-dispatch.mjs` が `claimed: false` か `claimed: true` のいずれかで正常応答
- `runner.log` に register/heartbeat/claim の成功記録が残る

## 失敗時の主原因候補
- `bootstrap token` 不正/期限切れ
- `OPENCLAW_PUBLIC_BASE_URL` / `VERCEL_URL` 不整合
- `OPENCLAW_CONNECTOR_MODE` が `managed_remote_agent` でない
- `OPENCLAW_WEBHOOK_SECRET` 不一致
- DDS migration 未適用

## 推奨
次は **env を揃えて live register**。
ここから先は、コード追加より先に実接続で事実確認した方が早い。
