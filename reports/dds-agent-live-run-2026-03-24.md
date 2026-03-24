# DDS agent live run — 2026-03-24

## 実施内容
- DeadStockSolution の Vercel env に以下を設定
  - `OPENCLAW_CONNECTOR_MODE=managed_remote_agent`
  - `OPENCLAW_PUBLIC_BASE_URL=https://dead-stock-solution.vercel.app`
  - `OPENCLAW_WEBHOOK_SECRET=<set>`
- DDS 用 migration 不足を発見し、`0037_dds_remote_agent.sql` を追加
- DDS timestamp 即時失効バグを修正
  - `consumeBootstrapToken()` を DB 時刻比較へ変更
  - DDS timestamp を timestamptz 化する migration `0038_dds_timestamptz_fix.sql` を追加
- production DB に migration 適用
- production 再デプロイ
- bootstrap token 発行
- `dds-agent-runner` で live register 成功
- live heartbeat 成功
- live claim 成功（pending job なし）
- LaunchAgent `ai.dds-agent-runner` を登録し、60秒ごとの tick 実行を開始

## 成功確認
### register
- `ok: true`
- `claimUrl`, `heartbeatUrl`, `callbackUrl` を取得
- `controlToken` を state に保存

### heartbeat
- `ok: true`
- `lastHeartbeatAt` 更新

### claim
- `ok: true`
- `claimed: false`
- 現時点では pending job なし

### launchd
- `ai.dds-agent-runner` 登録済み
- RunAtLoad + StartInterval=60
- 実行ログで heartbeat / claim の継続成功を確認

## 残課題
- server 側 `reportUrl` が register response にまだ含まれていないため null
- 実際の DDS work item を 1件流して end-to-end 実行確認が必要
- callback / report の live 動作は job 発生後に確認

## 現在の判断
- DDS remote runner は **実接続済み**
- いま不足しているのは接続ではなく、**実ジョブを流したときの E2E 検証**
