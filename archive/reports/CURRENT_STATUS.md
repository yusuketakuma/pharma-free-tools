# CURRENT_STATUS.md - Portfolio Index

_最終更新: 2026-03-28 10:25 JST_

---

## 役割
このファイルは **workspace 全体の portfolio index** です。

- global source of truth の所在を示す
- 各 project の現在地 (`docs/status.md`) へ誘導する
- global と local の責務を混ぜない

## Global source of truth
- 実行基盤: `.openclaw/README.md`
- 組織定義: `org/organization.md`
- 運用モデル: `org/operating-model.md`
- レポートフロー: `org/reporting-flow.md`
- portfolio manifest: `.openclaw/config/project-manifest.yaml`
- project運用ルール / 文書移行方針: `projects/PORTFOLIO_RULES.md`

## Portfolio projects
### OpenClaw Core
- definition: `projects/openclaw-core/project.yaml`
- status: `projects/openclaw-core/docs/status.md`
- backlog: `projects/openclaw-core/backlog/queue.md`
- runbook: `projects/openclaw-core/ops/RUNBOOK.md`
- learn: `projects/openclaw-core/learn/improvement-ledger.md`

### CareRoute-RX
- definition: `projects/careroute-rx/project.yaml`
- status: `projects/careroute-rx/docs/status.md`
- backlog: `projects/careroute-rx/backlog/queue.md`
- runbook: `projects/careroute-rx/ops/RUNBOOK.md`
- learn: `projects/careroute-rx/learn/improvement-ledger.md`
- source: `/Users/yusuke/careroute-rx`

### DeadStockSolution
- definition: `projects/deadstocksolution/project.yaml`
- status: `projects/deadstocksolution/docs/status.md`
- backlog: `projects/deadstocksolution/backlog/queue.md`
- runbook: `projects/deadstocksolution/ops/RUNBOOK.md`
- learn: `projects/deadstocksolution/learn/improvement-ledger.md`

### Pharma Free Tools
- definition: `projects/pharma-free-tools/project.yaml`
- status: `projects/pharma-free-tools/docs/status.md`
- backlog: `projects/pharma-free-tools/backlog/queue.md`
- runbook: `projects/pharma-free-tools/ops/RUNBOOK.md`
- learn: `projects/pharma-free-tools/learn/improvement-ledger.md`
- source: `/Users/yusuke/pharma-free-tools`
- deploy: GitHub Pages
- cadence: 定期リサーチ起点で高ニーズ案件のみ開発・改善

## Responsibility split
- root `CURRENT_STATUS.md`: portfolio-wide index only
- `projects/*/docs/status.md`: project-local goal / risk / active task / approval status
- `.openclaw/**`: execution system and routing / approval policy
- `org/**`: organization-wide rules and reporting model

## Current portfolio notes
- Step 5 で project-local status / backlog / runbook / learn の固定位置を作成済み
- 旧エージェント運用と旧 cron 定義は削除済み。現在は**定期実行なし / オンデマンド前提**の最小構成
- project-owned 文書は段階移行とし、大規模移動はまだ実施しない
- protected path の正本は approval policy に従う
- `openclaw-core/ops/RUNBOOK.md` に queue triage / artifact retention / stale-report / baseline-smoke / report verification の playbooks を整備済み（2026-03-28）
- `deadstocksolution/ops/RUNBOOK.md` に DDS Agent Runner の connection lifecycle / post-register safety / known hazards を要約済み（2026-03-28）
