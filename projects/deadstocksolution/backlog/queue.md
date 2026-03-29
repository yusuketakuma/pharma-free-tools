# Backlog Queue

> **Triage date: 2026-03-29** — queue-backlog-triage-clerk

## Ready
（現在なし）

## Waiting Approval
（現在なし）

## Blocked
（現在なし）

## Archived

### ~~DS-MAINT-001: preview branch 大規模削除差分の棚卸し~~ ✅ Done 2026-03-29

`main → preview` 方向で **805ファイル** が削除。分類結果:

#### DROP（削除して問題なし）— 約520件

| グループ | 件数 | 理由 |
|----------|------|------|
| `.claude/state/` (sessions, state) | ~73 | 一時的セッションデータ、再生成可能 |
| `.sisyphus/` | ~77 | CI パイプライン一時状態 |
| `reports/slowpaths/` | ~58 | 古いslowpath分析レポート（2026-03-05〜09） |
| `server/drizzle/0021-0041` | 11 | preview で統合済みのmigration SQL |
| `server/src/db/schema-*.ts` (分割schema) | 12 | preview で `schema.ts` に統合済み |
| `server/src/db/migrations/` | 5 | カスタムSQL migration（previewではdrizzleに移行済み） |
| `server/src/db/materialized-views.ts` | 1 | preview では未使用 |
| `remotion/` | 10 | 動画生成実験機能（未使用） |
| ルートID系ファイル (SOUL/IDENTITY/TOOLS/USER/HEARTBEAT.md) | 6 | workspace配下に正本あり、repoには不要 |
| `.deep-review-findings.md` | 1 | 一時調査成果物 |
| `server/.claude/`, `server/.gitignore` | 3 | Claude Code一時状態 |

#### RELOCATE（project-owned foldersへ移動）— 約30件

| グループ | 件数 | 移動先 | 理由 |
|----------|------|--------|------|
| `.openclaw/` 配下の運用doc | 11 | `projects/deadstocksolution/docs/` | DSS_RUNTIME_LOGGING, DSS_STATE_MACHINE, DSS_WEBHOOK_CONTRACT, PREFLIGHT 等 |
| `docs/adr/`, `docs/plans/`, `docs/superpowers/`, `docs/runbooks/` | 20 | `projects/deadstocksolution/docs/` | ADR, 設計plan, sprint gate, test matrix 等 |
| `.claude/memory/archive/Plans-completed-sprints-*.md` | 5 | `projects/deadstocksolution/docs/` | 完了sprintの履歴 |
| `.claude/scripts/auto-cleanup-hook.sh` | 1 | `projects/deadstocksolution/ops/` | Claude Code cleanup hook |

#### KEEP（preview branchに維持すべき）— 約70件

| グループ | 件数 | 理由 |
|----------|------|------|
| `.github/` (dependabot, workflows) | 3 | CI/CD設定、運用に必須 |
| `.husky/` (commit-msg, pre-commit) | 2 | 開発ツールchain |
| `scripts/` (smoke-check, verify-release等) | 7 | リリース・品質gateスクリプト |
| `client/public/` (PWA icons, manifest) | 12 | PWA機能維持 |
| 設定ファイル (.nvmrc, commitlint, lighthouse, playwright) | 4 | 開発環境設定 |

#### ⚠️ 要注視：大規模コード削除 — 約183件

`server/src/` から **182ファイル**（routes 60, services 70, config 8, middleware 3, utils 10, types 7, tests 80）が削除。
`client/src/` から **126ファイル**（components 70+, hooks 10, tests 20+, pages 10+）が削除。

これらはpreview branchでのスコープ縮小（機能削除）によるもの。preview branchはコア機能+Stripe決済に特化している。main merge前に**機能別に残すべきものがないか**の確認が必要。

**次アクション**: ゆうすけに以下を確認:
1. preview branchのスコープ縮小方針に合意しているか
2. 削除対象の機能のうち再利用したいものがあるか
3. RELOCATE対象の移設をいつ実行するか

---

### ~~DS-MAINT-002: プロジェクト外運用メモの移設計画~~ ✅ Done 2026-03-29

プロジェクト外に残るDeadStockSolution関連ファイル:

#### 移設対象（RELOCATE）

| 場所 | 内容 | 件数 | 移設先 |
|------|------|------|--------|
| `~/.openclaw/workspace/DeadStockSolution/` | repoの完全コピー（server code, tests, utils等） | ~250+ | **DROP** — 正本は `/Users/yusuke/Projects/DeadStockSolution` にあり |
| `~/.openclaw/workspace/repos/DeadStockSolution-preview-bot/` | preview-bot用完全コピー（client/server/dist/reports） | ~600+ | **DROP** — dist/はビルド成果物、sourceは正本にあり |
| `~/.openclaw/workspace/docs/sidebiz/deadstock-*.md` | 商業化LP構造、next action | 4 | `projects/deadstocksolution/docs/business/` |
| `~/.openclaw/workspace/docs/sidebiz/deadstock-lp.html` | LP HTML原型 | 1 | `projects/deadstocksolution/docs/business/` |

#### すでに正しい場所にあるもの

| 場所 | 内容 | 状態 |
|------|------|------|
| `~/.openclaw/workspace/projects/deadstocksolution/` | project-owned workspace (CLAUDE.md, agents, skills, rules, backlog, docs, ops, learn) | ✅ 正常 |

#### 移設手順（推奨）

1. **Phase 1**: `docs/sidebiz/deadstock-*.md` を `projects/deadstocksolution/docs/business/` に移動
2. **Phase 2**: `~/.openclaw/workspace/DeadStockSolution/` を削除（正本の確認後）
3. **Phase 3**: `~/.openclaw/workspace/repos/DeadStockSolution-preview-bot/` から必要なdocs/scriptsだけを抽出して `projects/deadstocksolution/` に移動、残りは削除
4. **Phase 4**: `.openclaw/` 配下の運用doc (DS-MAINT-001で特定) を `projects/deadstocksolution/docs/ops/` に移動

**次アクション**: Phase 1から着手可能（低リスク）。Phase 2-3は正本確認後に実施。
