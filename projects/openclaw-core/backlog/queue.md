# Backlog Queue

> **Triage date: 2026-03-29** — queue-backlog-triage-clerk

## Ready（実行可能・優先順位順）

### P1: 運用安定性に直結
1. **Board freshness gate** (#12) — `board_cycle_slot_id` / `generated_at` の不一致で下流chainを停止する実装。progress over-reporting防止。Spec: `docs/board-freshness-gate-spec.md`。次: Claude Codeで実装。
2. **Fallback notification path** (#2) — 報告ジョブ停止時の代替通知経路。#1 (stale-report detection) が完了済みで前提条件クリア。Spec: `docs/stale-report-detection-spec.md`。次: Claude Codeで設計→実装。
3. **Read-only queue telemetry snapshot** (#5) — `waiting_auth` / `waiting_manual_review` の滞留観測。count, oldest/newest, top prefixes, 24h delta。次: Claude Codeで実装。#8の前提。

### P2: 標準化・整備
4. **Pre/Post update checklists** (#6+#7 統合) — `docs/pre-update-baseline-smoke-checklist.md` に両方のsourceがある。運用checklistとして独立したファイルに分離・標準化。次: Claude Codeで分割・整備。
5. **Dominant-prefix triage checklist 運用化** (#8) — draft/runbookは完成済み (`docs/queue-dominant-prefix-triage.md`, `docs/queue-triage-analyst-runbook.md`)。運用に乗せるには #5 telemetryとの連携が必要。次: telemetry完了後に整合確認。
6. **Artifact retention policy 確定** (#4) — draftとchecklistが存在。最終化して運用開始。次: 内容確認→閉じるか微修正。
7. **Metric claim verification checklist** (#3) — 報告前の品質指標検証手順。`docs/metric-claim-verification-checklist.md`。次: 確認→必要なら拡充。

### P3: モデル・仕様確定
8. **Report verification state model** (#11) — `review-approved` / `apply-applied` / `effect-confirmed` 等の状態遷移を明文化。Draft: `docs/report-verification-state-model.md`。次: 内容レビュー→確定。
9. **Bundle manifest + dry-run sync** (#10) — workspace ↔ live のcontract同期。部分同期リスク回避。Spec: `docs/bundle-sync-dry-run-smoke.md`。次: Claude Codeで実装（影響範囲大、慎重に）。

## Waiting Approval
- **Safe-close/reopen policy for stale queue** (#9) — board決定待ち。runtime queue stateはread-only維持。Draft: `docs/stale-queue-safe-close-reopen-policy.md`。次: boardで議題に上げる。

## Blocked
（現在なし）

## Archived
1. ~~Stale-report detection for CEO / department jobs~~ ✅ **Done 2026-03-29**. Implementation: `scripts/stale-report-detection.sh`. Config: `config/stale-report-jobs.json`. Spec: `docs/stale-report-detection-spec.md`, `docs/stale-report-snapshot-spec.md`.
