# Backlog Queue

## Ready
（現在なし）

## Waiting Approval
- No approval-gated items tracked yet.

## Blocked
- No blocked items tracked yet.

## Archived
- ~~triage policy minimal runbook を backlog 運用へ反映する~~ ✅ **Done 2026-03-29**. 反映先: 本queue.mdの運用ルール（下記参照）。基準ドキュメント: `reports/cron/triage-policy-minimal-runbook-20260326.md`.

---

# Triage 運用ルール（日次判断用）

> 基準: `reports/cron/triage-policy-minimal-runbook-20260326.md` (2026-03-26)

## 分類手順
1. 項目を `Ready` / `Waiting Approval` / `Blocked` / `Archived` のいずれかに分類
2. 原因を1行で書く（例: `auth drift`, `manual review backlog`, `runtime error`, `queue saturation`）
3. 次アクションを1つだけ決める: `reopen` / `escalate` / `wait` / `close` / `requeue`
4. queue.md の該当セクションに反映

## 判定基準
| 分類 | 条件 |
|------|------|
| **Ready** | そのまま実行可能 |
| **Waiting Approval** | 権限・承認待ち |
| **Blocked** | 外部依存、再現待ち、入力不足 |
| **Archived** | 完了・却下・不要化（日付付きで移動） |

## Hold 条件
- ルーティング / trust boundary / auth / approval の根幹に触るもの → 自動で進めず manual review に倒す
