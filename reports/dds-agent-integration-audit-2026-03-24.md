# DDS agent integration audit — 2026-03-24

## 結論
- DeadStockSolution / Vercel 側には、DDS remote agent を前提にした API 契約と DB モデルがある。
- ただし OpenClaw 側には、`register -> jobs claim -> heartbeat -> question/pr callback` を常駐で回す **DDS queue worker の実体** は現時点で確認できなかった。
- したがって、現状は **受け口はあるが、実行主体は未完成寄り** と判断する。
- 名称はユーザー向けには **DDS-agents** に統一し、内部 id は当面 `dss-manager` のまま維持するのが安全。

## 確認できたもの
### DeadStockSolution 側
- `server/src/routes/openclaw-connect.ts`
  - `/register`
  - `/jobs/claim`
  - `/heartbeat`
  - `/work-items/:id/question`
  - `/work-items/:id/pr`
- `server/src/services/dds-agent-service.ts`
  - bootstrap TTL / lease 秒数 / public base URL / claim / heartbeat / callback ロジック
- `server/src/services/openclaw-handoff.ts`
  - managed remote agent 前提の handoff 分岐
- `server/src/services/openclaw-status.ts`
  - `OPENCLAW_CONNECTOR_MODE=managed_remote_agent` 判定
- `server/src/db/schema-openclaw.ts`
  - `dds_bootstrap_tokens`
  - `dds_agent_connections`
  - `dds_agent_jobs`
  - `dds_work_items`

### OpenClaw 側
- 存在:
  - `~/.openclaw/agents/dss-manager/agent`
  - `~/.openclaw/agents/dss-manager/BOOT.md`
  - `~/.openclaw/agents/dss-manager/runtime/README.md`
- ほぼ空:
  - `~/.openclaw/agents/dds-manager`
- 見つからなかったもの:
  - register runner
  - claim loop daemon
  - heartbeat loop daemon
  - question / pr callback executor

## 現状の解釈
### できている
- API 契約
- queue / work item データモデル
- handoff の managed remote agent 分岐
- DSS 実務担当の OpenClaw エージェント文脈

### まだ足りない可能性が高い
- OpenClaw 側の remote worker 実体
- bootstrap token を使って接続開始するランナー
- control token を保持して lease 更新するループ
- work item を claim して処理結果を返す常駐処理

## 名称方針
### 推奨
- 表示名: `DDS-agents`
- 内部 id / agentDir: `dss-manager` を維持

### 理由
- 既存 config / agentDir / runtime 参照を壊しにくい
- ユーザー向け名称だけ先に統一できる
- 実行主体が固まる前に内部 id を変えるのは危険

## 不足チェックリスト
### A. 接続開始
- [ ] bootstrap token を誰が発行するか
- [ ] bootstrap token を誰が消費して register するか
- [ ] control token の保存先をどこにするか

### B. 実行ループ
- [ ] poll 間隔をどうするか
- [ ] `jobs/claim` を誰が回すか
- [ ] `heartbeat` を誰が回すか
- [ ] lease 切れ時の再取得手順

### C. 作業ループ
- [ ] claimed work item を OpenClaw へどう渡すか
- [ ] 途中質問を `/question` に返す実装
- [ ] 完了報告 / PR を `/pr` に返す実装
- [ ] 失敗時の再試行 / 中断ルール

### D. 環境と本番前提
- [ ] `OPENCLAW_CONNECTOR_MODE=managed_remote_agent`
- [ ] `OPENCLAW_PUBLIC_BASE_URL` または正しい `VERCEL_URL`
- [ ] DDS テーブル migration が本番 DB に適用済みか
- [ ] webhook / callback 認証の整合

## 次の推奨アクション
1. OpenClaw 側の表示名を `DDS-agents` に統一する
2. `dss-manager` を remote worker にするか、別途 `dds-agent-runner` を作るか決める
3. その決定に応じて、register / claim / heartbeat / callback を回す最小 runner を実装する
