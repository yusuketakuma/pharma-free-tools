# Workspace Project Priority Review — 2026-03-24 03:30 JST

## Conclusion
今回は **Top3 の顔ぶれは維持**。ただし、優先度の見方は少し変わった。
- **openclaw-core**: 横断レバレッジが最大。今の Ready がそのまま安全に前進しやすい。
- **careroute-rx**: 事業インパクトは最強クラス。source repo の未コミット差分が大きく、まず WIP 棚卸しを差し込む必要がある。
- **pharma-free-tools**: 優先テーマ整理がかなり進んでおり、低リスクで成果化しやすい。

判断では、4観点のうち **業務/収益インパクト** と **次の1手の明確さ** をやや重めに見た。

## Quick comparison

| Project | 変更量 | 未整理度 | 業務/収益インパクト | 次の1手の明確さ | Notes |
|---|---:|---:|---:|---:|---|
| openclaw-core | 3 | 4 | 5 | 5 | `source_repo` なし。project docs / backlog ベース評価。横断影響が最大で Ready 7件が具体的 |
| careroute-rx | 5 | 4 | 5 | 4 | source repo 356 changed。active 開発だが、まず差分棚卸しが必要 |
| pharma-free-tools | 3 | 2 | 4 | 5 | source repo 20 changed。優先テーマが十分整理済みで次アクションが明快 |
| deadstocksolution | 5 | 5 | 3 | 3 | source repo 225 changed の大半が deletion。maintenance-first なので先に棚卸し |
| careviax-pharmacy | 1 | 4 | 3 | 1 | bootstrap 段階。project slot はあるが executable backlog が薄い |

## Source repo check
- `careroute-rx` → `/Users/yusuke/careroute-rx`
  - branch: `main`
  - changed: 356 files（modified/deleted 312, untracked 44）
  - last commit: `2026-03-18 282f37895 fix: レビュー指摘4件修正`
- `deadstocksolution` → `/Users/yusuke/.openclaw/workspace/DeadStockSolution`
  - branch: `preview`
  - changed: 225 files（modified/deleted 220, deleted 215, untracked 5）
  - last commit: `2026-03-21 19b2b48 test: add coverage for stripe and route edge cases`
- `pharma-free-tools` → `/Users/yusuke/pharma-free-tools`
  - branch: `main`
  - changed: 20 files（modified 10, untracked 10）
  - last commit: `2026-03-22 0d29ed91 fix: ツール数表記を74選→72選に修正（実ファイル数に合わせて正確化）`

## Recommended top 3
1. openclaw-core
2. careroute-rx
3. pharma-free-tools

## Why

### 1) openclaw-core
- 現状: status / backlog が今日更新され、stale-report detection、fallback notification、evidence-based verification、queue telemetry、pre/post-update checklist まで Ready が具体化している。
- 優先すべき理由: ここを整えると workspace 全体の自律実行品質・レビュー品質・更新安全性が底上げされる。
- 次の最小アクション: Ready #1 `stale-report detection for CEO / department jobs` の仕様を 1 枚に固める。

### 2) careroute-rx
- 現状: P0 security fixes 完了後の UI 正常表示改善フェーズ。project backlog は FE-DISPLAY-002/003/005/006 で整理済みだが、source repo は 356 changed とかなり大きい。
- 優先すべき理由: 直接の事業/運用インパクトが高く、放置すると差分肥大化で review / rollback / security 確認コストが増える。
- 次の最小アクション: source repo を `FE-DISPLAY 系 / security follow-up / unrelated WIP` に棚卸しして、次 commit 単位を切り出す。

### 3) pharma-free-tools
- 現状: 2026-03-24 の調査でトップ候補が再整理され、既存改善優先の方針が docs / backlog に反映済み。source repo 変更量も中程度で制御しやすい。
- 優先すべき理由: 実需リサーチ→既存改善の流れが噛み合っており、低リスクで成果を積みやすい。
- 次の最小アクション: 優先1位 `薬歴下書き・要点整理支援` のワイヤーと出力要件（SOAP / 次回確認事項 / 患者説明メモ）を 1 枚に固定する。

## Not top 3 this time
- deadstocksolution: 差分量は大きいが maintenance-first。いきなり実装に入るより、削除差分の棚卸しを先にやる方が安全。
- careviax-pharmacy: まだ requirements capture 用の project slot 段階で、今すぐ着手できる最小タスクが薄い。

## Safe fixes applied
- `projects/careroute-rx/docs/status.md`
  - source repo の大きい未コミット差分リスクを追記
  - `WIP-TRIAGE-001` を Active Tasks に追加
  - Last Updated を `2026-03-24` に更新
- `projects/careroute-rx/backlog/queue.md`
  - `WIP-TRIAGE-001` を Active 先頭に追加
- `projects/deadstocksolution/docs/status.md`
  - `preview` branch の deletion-heavy diff リスクを追記
  - worktree triage を Active Tasks に追加
  - Last Updated を `2026-03-24` に更新
- `projects/deadstocksolution/backlog/queue.md`
  - `DS-MAINT-001` / `DS-MAINT-002` を Ready に追加

## Delta vs previous review (2026-03-23)
- Top3 の並びは **維持**（`openclaw-core` → `careroute-rx` → `pharma-free-tools`）
- `careroute-rx`
  - 前回より source repo の巨大 WIP を明示的な priority risk として扱うようにした
  - docs / backlog に `WIP-TRIAGE-001` を追加し、次の1手をより具体化
- `deadstocksolution`
  - 前回は「dirty worktree は大きいが次の安全な1手は曖昧」だった
  - 今回は `DS-MAINT-001/002` を追加し、曖昧さを一段減らした
- `pharma-free-tools`
  - Top3 内の位置は維持
  - 2026-03-24 調査反映により、 project 内優先候補の整理度がさらに上がった
- `openclaw-core`
  - 横断優先度は維持
  - backlog の Ready 群が引き続き最も即実行しやすい状態
