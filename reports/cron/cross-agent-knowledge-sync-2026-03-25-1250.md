# cross-agent-knowledge-sync 共有メモ（2026-03-25 12:50 JST）

## 結論
直近の実行結果から、**OpenClaw core の主ボトルネックは queue 滞留の観測不足ではなく、prefix 単位で triage できる運用不足** だと分かった。
特に `waiting_auth` / `waiting_manual_review` の長期滞留が継続しており、これ以上の重複調査より **runbook / checklist / retention policy / baseline smoke** に落とすのが最優先。

## 今回共有すべき知識

### 1) queue の実態は「重複した滞留」
- Heartbeat 系の確認で、`waiting_auth` と `waiting_manual_review` が長時間滞留。
- 最新確認では概数として:
  - `waiting_auth`: 476件、最古およそ 68.6時間
  - `waiting_manual_review`: 343件、最古およそ 68.6時間
  - `waiting_approval`: 0件
  - `waiting_capacity`: 0件
- auth は有効、`acp_compat` / `cli` は healthy、`cli_backend_safety_net` は unhealthy のまま。

### 2) 価値が高いのは「観測」ではなく「triage 可能化」
- 既に `projects/openclaw-core/docs/queue-dominant-prefix-triage.md` が作られている。
- 追加で有効なのは、
  - prefix ごとの切り分け手順
  - retry / delete / hold / manual-review の判定軸
  - backlog への接続方法
- これにより「同じ queue を眺める」状態から「次アクションに落とす」状態へ移れる。

### 3) 運用物として再利用価値が高いもの
- `projects/openclaw-core/docs/artifact-retention-policy.md`
- `projects/openclaw-core/docs/queue-dominant-prefix-triage.md`
- `projects/openclaw-core/docs/stale-report-detection-spec.md`
- `projects/openclaw-core/backlog/queue.md`
- `reports/cron/openclaw-queue-telemetry-2026-03-24.md`
- `reports/cron/proactive-idle-work-discovery-2026-03-24.md`

### 4) 更新前後チェックは標準化した方がよい
- OpenClaw 更新や運用切替時に早く見つけたいのは:
  - PATH drift
  - LaunchAgent drift
  - auth scope mismatch
- 低リスクで効く標準手順として、pre-update baseline / post-update smoke checklist が有効。

### 5) レポートは「0件でも内部稼働を見せる」べき
- `tama-regular-progress-report` では、独立したジョブが無い場合でも
  - 何を内部確認したか
  - 何件実行したか
  - 何が未解決か
  を明示する方針が有効。
- これにより、停止しているように見えない。

## 再利用先エージェント
- **research-analyst**: queue 停滞の要因分析、triage 観点の整理
- **doc-editor**: runbook / checklist / retention policy の文書化
- **ops-automator**: queue 滞留の自動棚卸し、baseline smoke の自動化
- **dss-manager**: domain 固有の検証手順・既知障害の蓄積
- **supervisor-core**: 再配置判断、改善ループの統合
- **opportunity-scout**: 新規探索よりも、既存成果物の接続先を探すとき

## 重複回避示唆
- 直近24時間で同種テーマを扱ったら、**再調査より差分確認** を優先。
- queue telemetry を繰り返すだけでは新規性が薄い。
- すでに triage / retention / smoke の成果物がある論点は、**更新なし / 既存成果物へ統合 / 最小差分追記** に倒す。
- Telegram 設定、auth / routing / trust boundary、課金や対外送信には触れない。

## 成果物 / 共有メモ
### 既存成果物
- `projects/openclaw-core/docs/queue-dominant-prefix-triage.md`
- `projects/openclaw-core/docs/artifact-retention-policy.md`
- `projects/openclaw-core/docs/stale-report-detection-spec.md`
- `projects/openclaw-core/backlog/queue.md`

### 共有メモとしての要点
- queue は「量」ではなく「prefix で切れるか」が重要
- retention は掃除ではなく、判断コスト削減の仕組み
- baseline smoke は更新失敗の早期検知装置
- 0件報告でも内部稼働を明示すると運用が止まって見えない

## 次アクション
1. `queue-dominant-prefix-triage.md` を runbook 形式に寄せる
2. `artifact-retention-policy.md` を cleanup 手順に接続する
3. pre-update baseline / post-update smoke checklist を1枚化する
4. 必要なら `ops-automator` 向けに queue 棚卸し自動化案を切り出す
