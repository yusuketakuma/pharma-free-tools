# Reports Cron — 蒸馏済み index

## このファイルの目的
`reports/cron/` 配下の反復レポートから、安定知見をどこに蒸留したかを記録する。
生レポートは参照用として残す。

## Board Agenda Assembly
| File | 主要論点 | 蒸馏先 |
|---|---|---|
| `board-agenda-assembly-20260325-1635.md` | supervisor / queue triage 反復 → routine | `openclaw-core/ops/RUNBOOK.md` |
| `board-agenda-assembly-20260325-1835.md` | stale queue backlog → Board candidate | `artifacts/board/2026-03-25-stale-queue-reconciliation-candidate.md` |
| `board-agenda-assembly-20260325-2035.md` | stale queue backlog 再掲 → 同上 | 同上 |
| `board-agenda-assembly-20260325-2035.md` | baseline/smoke 1枚化 → routine | `openclaw-core/ops/RUNBOOK.md` |

## Proactive Idle Work Discovery
| File | 主要論点 | 蒸馏先 |
|---|---|---|
| `proactive-idle-work-discovery-20260325-1420.md` | RUNBOOK に playbook 接続 | `openclaw-core/ops/RUNBOOK.md` |
| `proactive-idle-work-discovery-20260325-2020.md` | stale backlog safe-close → Board candidate | `artifacts/board/` |

## Agent Scorecard Review
| File | 主要論点 | 蒸馏先 |
|---|---|---|
| `agent-scorecard-review-20260325-0600.md` | エージェント評価・改善点 | 要約なし — 一次情報 |

## 重複傾向
- `stale queue backlog` 論点は 2026-03-25 に 4 回以上反復 → Board candidate に集約済み
- `baseline/smoke 1枚化` は RUNBOOK に反映済み
- `dominant prefix triage` は RUNBOOK playbook に反映済み
