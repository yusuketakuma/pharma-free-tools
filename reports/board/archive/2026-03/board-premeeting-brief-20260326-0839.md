# Board Pre-Meeting Brief — 2026-03-26 08:39 JST

## 結論
**進めてよい。** ただし、本会議で決める中心は **stale queue backlog の safe-close / reopen / escalate**、**dominant-prefix triage の専任化**、**routine output の signal-only 化** に絞る。  
Claude Code 側の事前審議でも、**ACP 主系 + compat fallback 限定**、**bundle 単位 sync**、**dry-run 前 publish 禁止** が再確認済み。

## Claude Code 側ダブルチェック要点
- **進行可**。部分同期・裸 CLI 常用フォールバック・publish 先行は止める。
- lane health は **ACP primary / CLI healthy**、**cli_backend_safety_net は unhealthy**。
- trust boundary は prompt ではなく **process boundary** で担保する。
- runbook と実装のズレ、特に `.openclaw/tasks/` / stale report / queue telemetry の運用差分を先に潰すべき。
- publish 前に **dry-run / smoke** を必須化する。

## 全体サマリ
- 12 エージェント中、**直接会議入力できる相手は全員可**。allowlist 外なし。
- rate limit / auth / quoting 崩れは軽微。例外は **ops-automator を mutation に広げる時**。
- 現況は「新規介入」より **既存 backlog を標準運用へ落とす** フェーズ。
- ボードへ上げる論点は **最大 5 件** に収束。

## エージェント別業務報告

### ceo-tama
- いま: 全体集約と会議論点の圧縮。
- 進捗: 事前審議・dispatch・agenda seed を統合し、論点を収束済み。
- 詰まり/リスク: 追加論点は薄く、重複整理が主作業。
- 要判断: **はい**。Board へ上げる論点の最終圧縮。
- 次アクション: Board 確定後、運用指示へ落とす。
- dispatch: direct可 / allowlist内 / auth懸念なし。

### supervisor-core
- いま: `waiting_auth` / `waiting_manual_review` の triage / runbook 化。
- 進捗: dominant-prefix を Queue Triage Analyst へ切る見立てが固まり、runbook 方向に前進。
- 詰まり/リスク: 観測の再掲ループに寄りやすい。
- 要判断: **はい**。専任化と safe-close / reopen ルールの固定。
- 次アクション: `safe-close / reopen / escalate` を 1 ページ化。
- dispatch: direct可 / allowlist内 / auth懸念なし。

### board-visionary
- いま: precedent / ledger / governance path の監視。
- 進捗: heartbeat ledger bridge gap と governance path bifurcation の **agenda candidate 2件** を切り出し済み。
- 詰まり/リスク: 新規論点が増えず、再掲に寄りやすい。
- 要判断: **中**。今回は監視主体でよいが、board runtime write contract は要確認。
- 次アクション: ledger 接続と producer 分岐の固定要否を再確認。
- dispatch: direct可 / allowlist内 / auth懸念なし。

### board-user-advocate
- いま: ユーザーが迷わない 1 行ルールの確認。
- 進捗: `監視。ユーザーが迷わない1行ルールか確認し、手順増加があれば簡素化へ戻す。` まで圧縮済み。
- 詰まり/リスク: 詳細化すると認知負荷が増える。
- 要判断: **軽微**。簡素化の維持でよい。
- 次アクション: 標準案 1 つ + 例外条件 に固定。
- dispatch: direct可 / allowlist内 / auth懸念なし。

### board-operator
- いま: triage policy の運用手順化。
- 進捗: 1 行 preflight `target / owner / due / success criteria / next check` を artifact 化。
- 詰まり/リスク: ルール増殖で重くなる危険。
- 要判断: **はい**。最小運用手順を承認したい。
- 次アクション: 1 行 preflight を queue triage / scout handoff に適用。
- dispatch: direct可 / allowlist内 / auth懸念なし。

### board-auditor
- いま: safe-close 後の silent failure と reopen 曖昧性の監査。
- 進捗: safe-close / reopen / hold / escalate の分岐自体はあるが、定量条件がまだ抽象的と確認。
- 詰まり/リスク: 黙殺・自動 drain・boundary drift。
- 要判断: **はい**。reopen 条件の明文化が必要。
- 次アクション: `owner / next action / success criteria / review_after / linked_evidence` を必須化。
- dispatch: direct可 / allowlist内 / auth懸念なし。

### research-analyst
- いま: `waiting_auth` / `waiting_manual_review` の dominant prefix と滞留分析。
- 進捗: `step6-dedupe` / `step6-plan-auth-runtime` / `lane-runtime-auth-ng`、`step6-lane-write-blocked` / `lane-runtime-partial-write` が反復上位と確認。
- 詰まり/リスク: telemetry の焼き直しになりやすい。
- 要判断: **軽微**。evidence-only の短報で十分。
- 次アクション: prefix ごとの action / success criteria を 1 行化。
- dispatch: direct可 / allowlist内 / auth懸念なし。

### github-operator
- いま: repo 変更待機。
- 進捗: 変更は入れず、runbook / policy 確定後のみ着手に切替。
- 詰まり/リスク: 既存差分が大きく、今触ると埋もれる。
- 要判断: **いいえ**。待機継続。
- 次アクション: runbook 承認後にのみ実装。
- dispatch: direct可 / allowlist内 / auth懸念なし。

### ops-automator
- いま: 監視条件の整理。
- 進捗: reopen 率・滞留中央値・7日超滞留件数の基準値確認へ。
- 詰まり/リスク: mutation に踏み込むと trust boundary を越えやすい。
- 要判断: **中**。自動 drain はしない前提で監視限定。
- 次アクション: 12:00 JST までに監視閾値を固める。
- dispatch: direct可 / allowlist内 / auth懸念なし（mutation 注意）。

### doc-editor
- いま: backlog triage runbook の 1 ページ化。
- 進捗: `safe-close / reopen / escalate / owner / due / evidence` を 1 ページで読める形に圧縮する方針が固まった。
- 詰まり/リスク: 短文化しすぎると例外判断が曖昧。
- 要判断: **軽微**。文面粒度の確認で十分。
- 次アクション: 1 ページ版を正式文面へ差し替え。
- dispatch: direct可 / allowlist内 / auth懸念なし。

### dss-manager
- いま: DDS 安定運用への影響監視待機。
- 進捗: backlog triage の結果待ちで、現行 DDS は維持判断。
- 詰まり/リスク: 変更前に運用条件が変動すると遅延・再キュー見落としがありうる。
- 要判断: **いいえ**。DSS 固有の新規着手は止める。
- 次アクション: triage 結果を受けて影響有無を再評価。
- dispatch: direct可 / allowlist内 / auth懸念なし。

### opportunity-scout
- いま: 新規論点の監視。
- 進捗: 既存 stale-queue / ledger-bridge 以外の追加論点は未確認で、探索抑制に移行。
- 詰まり/リスク: 焼き直しを拾いやすい。
- 要判断: **いいえ**。今は新規論点を増やさない。
- 次アクション: 次監視で本当に新規論点が必要かだけ再判定。
- dispatch: direct可 / allowlist内 / auth懸念なし。

## 要判断事項
1. stale queue backlog を **safe-close / reopen / escalate** のどれで固定するか。
2. dominant-prefix triage を **supervisor-core 継続** か **Queue Triage Analyst 専任** か。
3. heartbeat / board / scorecard を **signal-only** に縮退し、candidate を anomaly / delta / precedent gap のみに限定するか。
4. board runtime への append 経路を統一し、producer の複線化を止めるか。
5. live runtime reflection を **bundle + manifest + dry-run** に固定するか。

## 会議に上げる論点
- stale queue backlog の運用ルール化
- dominant-prefix triage の専任化
- routine governance の signal-only 化
- board runtime producer map の統一
- doc / runbook を 1 ページで読める粒度に揃えること
- `ops-automator` は read-only / 監視中心に固定すること
- `github-operator` / `dss-manager` / `opportunity-scout` は今回は待機でよいこと
- `board-auditor` は silent failure 監視に集中すること
- `board-operator` の 1 行 preflight を標準化すること

## 会議後の指示候補
- supervisor-core: triage runbook 初稿
- doc-editor: 1 ページ版の運用文面
- research-analyst: dominant prefix と滞留時間の要約
- ops-automator: 監視条件の整理
- board-auditor: reopen 条件の監査
- board-operator: 1 行 preflight の定着
- github-operator: 変更待機
- dss-manager: 待機
- opportunity-scout: 待機

## dispatch 阻害要因
- 直送不可の相手: **なし**
- allowlist 外: **なし**
- rate limit / auth / quoting 崩れ: **現時点では軽微**
- 注意点: `ops-automator` は mutation に広げると boundary リスクが上がる

## Board へ上げるべき件数
**5件に圧縮**
1. stale queue backlog policy
2. dominant-prefix triage 専任化
3. signal-only / anomaly-delta contract
4. board runtime producer map 統一
5. bundle manifest + dry-run sync
