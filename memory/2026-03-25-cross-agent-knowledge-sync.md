# 2026-03-25 cross-agent knowledge sync

## 結論
- 直近の共有価値が高い知見は、**OpenClaw の queue 滞留の見え方の改善**、**DDS-agents の接続済み前提での運用安全化**、**OpenClaw CLI の PATH/呼び出し経路の固定** の3本に集約できる。
- Supervisor Core の次の判断は、観測の追加ではなく **dominant prefix ごとの triage / remediation** に寄せるべき。
- DDS は「接続できるか」ではなく「secret / state / retry の後片付けをどう標準化するか」が次の再利用ポイント。

## 今回共有すべき知識

### 1) OpenClaw queue は「観測 → triage」に移す段階
- 直近の queue では `waiting_auth=476`、`waiting_manual_review=343` で、24h delta は 0。
- dominant prefix は次の通り。
  - `waiting_auth`: `step6-dedupe` / `step6-plan-auth-runtime` / `lane-runtime-auth-ng`
  - `waiting_manual_review`: `step6-lane-write-blocked` / `lane-runtime-partial-write` / `step6-acp-mock-contract`
- すでに telemetry 自体は揃っており、次は **各 dominant prefix の切り分け順・成功条件・owner を固定した triage checklist** が必要。
- 提案が telemetry 系で重複しやすいので、次回は「新しい根拠」か「新しい対象範囲」がない限り再提案しない。

### 2) DDS-agents は接続済み、次は安全運用化
- register / heartbeat / claim / callback / report / E2E の接続は通っている。
- ただし運用上の残課題は明確。
  - `.env.local` に bootstrap token / secret が残る
  - `state.json` に control token が残る
  - `status: idle` なのに `active*` が残る stale state が起きうる
  - retry/backoff に jitter が弱い
  - `reportUrl` は register response で null のことがあり、未接続と誤判定しない
- 次の再利用先は、**secret/state cleanup、終了時の active field クリア、retry/backoff 標準化**。

### 3) OpenClaw CLI の不安定さはバージョンではなく経路問題
- `openclaw` は `2026.3.13` に統一されていると見てよい。
- 対話シェルでは `~/.local/bin/openclaw` を経由し、LaunchAgent も同じ版を参照している。
- 不安定さの本質は古い版混在ではなく、**PATH / 呼び出し元 / shell 起動時警告** だった。
- 再調査は version ではなく `which openclaw` / `launchctl print ...` / symlink を先に確認する。

### 4) Supervisor Core の判断品質改善ポイント
- 直近レビューでは、観測精度は高いが **提案の重複** と **impact-first の弱さ** が指摘された。
- 次回判断では以下を必須化する。
  - 直近1〜2回との重複判定
  - backlog削減効果 / blocked件数への効き / 再発防止効果の比較
  - 1提案 = 1次アクション + 1成功条件

## 再利用先エージェント
- `supervisor-core`: 優先順位付け、重複抑制、triage への移行判断
- `research-analyst`: queue / DDS / CLI の調査結果を比較表やチェックリストに整形
- `doc-editor`: queue triage checklist、DDS runbook、CLI確認手順の文書化
- `ops-automator`: DDS secret/state cleanup、自動後片付け、retry/backoff の実装・運用化
- `dss-manager`: DDS 接続済み前提の実運用、終了時クリーンアップ、E2E 実行確認

## 重複回避示唆
- queue telemetry は、次回から「新しい数字を取る」だけでは価値が薄い。**dominant prefix ごとの対処** に進む。
- DDS は「接続できたか」を再確認するより、**運用安全性と後片付け** を先に直す。
- OpenClaw CLI は版数確認を繰り返さず、**PATH と launchd の参照先固定** を確認する。
- Supervisor Core は同系統提案の再掲を抑え、差分がある場合だけ出す。

## 成果物/共有メモ
- 参照レポート:
  - `reports/supervisor-core-scan-2026-03-24.md`
  - `reports/supervisor-core-triage-2026-03-25.md`
  - `reports/supervisor-core-decision-quality-review-2026-03-25.md`
  - `reports/dds-agent-overall-review-2026-03-24.md`
  - `reports/dds-agent-live-run-2026-03-24.md`
  - `reports/openclaw-cli-stability-2026-03-23.md`
- 共有メモ:
  - `memory/2026-03-25-cross-agent-knowledge-sync.md`

## 次アクション
1. `supervisor-core` 向けに dominant prefix triage checklist を runbook 化する。
2. `ops-automator` 向けに DDS secret/state cleanup の標準手順を切る。
3. `doc-editor` 向けに OpenClaw CLI 確認手順と DDS 終了時クリーンアップを短文マニュアル化する。
4. 次回の共有では、telemetry の再掲ではなく **triage / remediation の実施結果** を集約する。
