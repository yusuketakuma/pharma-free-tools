# Workspace Project Priority Review — 2026-03-23 03:30 JST

## Quick comparison

| Project | 変更量 | 未整理度 | 業務/収益インパクト | 次の1手の明確さ | Notes |
|---|---:|---:|---:|---:|---|
| openclaw-core | 5 | 5 | 5 | 4 | workspace 全体に効く。stale-report / fallback / evidence-based verification が明確 |
| careroute-rx | 4 | 4 | 5 | 4 | active 開発。PHI 配慮は必要だが FE-DISPLAY 系の次タスクが具体的 |
| pharma-free-tools | 3 | 2 | 4 | 5 | 優先テーマが整理済み。既存改善で前進しやすい |
| deadstocksolution | 4 | 5 | 4 | 2 | maintenance-first。実体 repo の変更量は大きいが次の安全な1手はまだ曖昧 |
| careviax-pharmacy | 1 | 4 | 3 | 1 | bootstrap 段階で、まだ具体タスク不足 |

## Recommended top 3
1. openclaw-core
2. careroute-rx
3. pharma-free-tools

## Why
- openclaw-core: 全案件の実行品質に直結。今は stale-report / fallback / evidence verification の整備が最もレバレッジ大。
- careroute-rx: active 開発で事業インパクトが高く、FE-DISPLAY-002/003/005/006 へ素直に落とせる。
- pharma-free-tools: 既存改善優先へ方針転換済みで、最小改善を積みやすい。

## Not top 3 this time
- deadstocksolution: dirty worktree は大きいが、maintenance-first で feature expansion は止める方針。まずは棚卸し/差分整理が必要。
- careviax-pharmacy: project slot は整っているが、まだ実行候補が薄い。

## Safe fixes applied
- `projects/pharma-free-tools/project.yaml`
  - summary を旧方針（毎日1ツール新規作成）から、現行方針（実需リサーチ起点・既存改善優先）へ更新
- `projects/openclaw-core/backlog/queue.md`
  - Ready の優先順を 1〜4 で明示
- `projects/careroute-rx/docs/status.md`
  - generic な status を、P0 security fixes 完了後の UI 改善フェーズ中心へ更新
- `projects/careroute-rx/backlog/queue.md`
  - FE-DISPLAY-002/003 を Active、005/006 を Queued として同期
- cron job `workspace-project-priority-review`
  - 次回以降、`source_repo` の確認・4観点の軽い採点・Top3 以外の除外理由まで出すよう文面を明確化

## Delta vs previous notes
- dedicated な前回 priority review は未発見
- ただし 2026-03-22〜23 のメモとの差分として:
  - pharma-free-tools は project 内優先候補は維持
  - openclaw-core は stale-report / fallback / verification の論点が具体化し、横断優先度が上昇
  - careroute-rx は source repo の WIP と project docs のズレを埋め、次の1手が明確化
  - deadstocksolution は large diff の割に、maintenance-first 方針のため着手優先度は上げすぎない判断
