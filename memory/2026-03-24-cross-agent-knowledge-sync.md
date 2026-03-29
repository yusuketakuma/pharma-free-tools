# 2026-03-24 cross-agent knowledge sync

## 結論
- DDS-agents 連携は、register / heartbeat / claim / callback / report / E2E の接続が通っており、実運用の土台はできている。
- OpenClaw CLI の不安定さはバージョン差ではなく PATH / 呼び出し経路の曖昧さが主因で、現状は 2026.3.13 に統一済み。
- 次の再利用価値が高いのは、DDS runner の運用安全化と、OpenClaw / DeadStockSolution 間の接続手順のテンプレ化。

## 今回共有すべき知識

### 1) DDS-agents の実運用前提
- 表示名は `DDS-agents` に統一し、内部 id / agentDir は当面 `dss-manager` を維持するのが安全。
- DeadStockSolution 側には `register -> jobs/claim -> heartbeat -> question/pr/callback/report` の API 契約と DB モデルが揃っている。
- OpenClaw 側には runner 実体が必要で、`dds-agent-runner` が実 HTTP register / heartbeat / claim に対応する形で使える。

### 2) DDS runner の有効だった実装・運用知見
- live register / heartbeat / claim は成功確認済み。
- JSON-only の応答契約で `completed / blocked / failed / pr` が流せる。
- 終了ステータス後は runner state の `active*` を明示クリアするのが安全。
- register 成功後に bootstrap token を `.env.local` から消すのが望ましい。
- `reportUrl` は register response に常に入る前提にしない方がよい。live report/callback は別途確認する。

### 3) DDS の再発防止・保守ポイント
- secret を `.env.local` と state に残しっぱなしにしない。
- stale state（status=idle なのに active* が残る）を避ける。
- repo の dirty changes と DDS 差分は分離して見る。
- `tmp-*.ts` の残骸は削除対象。

### 4) OpenClaw CLI の安定化知見
- `openclaw` は `2026.3.13` に統一されていると見てよい。
- 問題は古い版の混在ではなく、PATH / 呼び出し元の不安定さだった。
- 次回確認コマンドは固定化して使える。

## 再利用先エージェント
- `dss-manager`: DDS 受け口の実行、JSON-only 契約、blocked/question/pr/report 分岐の実務。
- `ops-automator`: runner の常駐化、secret / state cleanup、retry/backoff、運用安全化。
- `research-analyst`: DDS や OpenClaw の仕様確認、接続経路の調査、比較表の作成。
- `doc-editor`: DDS runbook / onboarding / checklist の整備、契約仕様の文章化。
- `supervisor-core`: 次の優先度判断、重複探索の抑制、運用健全性レビュー。

## 重複回避示唆
- もう一度ゼロから「DDS 連携があるか」を調べ直す必要は薄い。現在は「接続済み、次は安全運用化」に寄せる。
- OpenClaw CLI の不安定さを再調査する場合は、version ではなく PATH / launchd / symlink を先に確認する。
- DDS の実装面では、register/claim/heartbeat の実装有無を探すより、state cleanup と secret 管理の改善に時間を使う。
- reportUrl が null だった点だけを見て「未接続」と判断しない。live report の成否を別で確認する。

## 成果物/共有メモ
- `reports/dds-agent-overall-review-2026-03-24.md`
- `reports/dds-agent-live-run-2026-03-24.md`
- `reports/dds-agent-integration-audit-2026-03-24.md`
- `reports/dds-agent-review-remediation-2026-03-24.md`
- `reports/dds-agent-runner-progress-2026-03-24.md`
- `reports/openclaw-cli-stability-2026-03-23.md`
- `memory/2026-03-24.md`
- 本メモ: `memory/2026-03-24-cross-agent-knowledge-sync.md`

## 次アクション
1. `ops-automator` 向けに DDS runner の secret/state cleanup を標準手順化する。
2. `doc-editor` 向けに DDS 接続・終了ステータス・PR/質問経路の契約を短い runbook に落とす。
3. `supervisor-core` 向けに「DDS は接続済み、次は運用安全化」という判断軸を固定する。
4. `research-analyst` 向けに OpenClaw / DDS の再調査時チェックリストを再利用可能な形で整える。
