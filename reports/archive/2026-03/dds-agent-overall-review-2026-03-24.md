# DDS agent overall review — 2026-03-24

## 結論
DDS-agents 連携は、register / heartbeat / claim / callback / report / E2E まで通っており、実運用へ進める土台はできている。
ただし、そのまま本番運用に入る前に **運用安全性と後片付け** の観点で直したい点がある。

## 検証結果
- `npm run typecheck` → OK
- `npm run lint -- --no-cache` → OK
- runner scripts `node --check` → OK
- launchd `ai.dds-agent-runner` → 登録済み、StartInterval=60、last exit code=0
- runner state → callbackUrl/reportUrl/claimUrl/heartbeatUrl を保持

## 主な確認済み強み
- DeadStockSolution 側の DDS remote agent 受け口と runner が接続済み
- `DDS-agents` 表示名統一済み
- question / failed / pr_opened を含む E2E 検証済み
- reportUrl も live 送信成功

## レビュー所見
### Security
- `~/.openclaw/agents/dds-agent-runner/runtime/.env.local` に bootstrap token / webhook secret が平文で残る
- `state.json` に control token が平文で残る
- 現状でも `chmod 600` で最低限守っているが、長期運用では secret の居場所を減らしたい

### Correctness
- runner state が `status: idle` なのに `activeWorkItemId` / `activeRequestId` を保持したままになるケースがある
- callback / complete 成功後に active fields を明示クリアした方がよい

### Maintainability
- repo に tmp script が残っている
- DeadStockSolution server repo に unrelated な dirty changes が多く、今回の DDS 差分だけを見通しにくい
- migration で補ったテーブル群と schema の正本を後で揃えるべき

### Performance / Scale
- 60秒ごとの単発 tick は現状妥当
- ただし複数ジョブや一時障害時に backoff / jitter がまだ弱い

### Operational hazards
- bootstrap token を env に残したままだと、state ロスト時に消費済み token で再 register し続ける可能性がある
- launchd 競合で register と heartbeat が重なると一時的な 401 が出ることがある

## 推奨修正
1. register 成功後に `.env.local` から `DDS_AGENT_BOOTSTRAP_TOKEN` を消す
2. complete / failed / blocked の終了時に state の active* fields をクリアする
3. tmp-*.ts を削除する
4. DDS 変更に直接関係ない dirty changes を分離する
5. report / callback / claim の retry/backoff に jitter を足す

## 残リスク
- secret 平文保存
- stale state
- repo の dirty state による将来の差分混線
