# GitHub運用状況レポート

**日時**: 2026-03-29 11:38 JST
**対象**: yusuketakuma 配下 全10リポジトリ

## 緊急: GitHub Actions分枯渇

DeadStockSolution + careroute-rx 両方でCIがfailure。runner割り当て失敗（steps:0, 3-7秒でFAIL）。
GitHub Free plan（2,000分/月）を超過している可能性が高い。

### 確認手順
```bash
gh auth refresh -h github.com -s user,admin:repo_hook
gh api user/settings/billing/actions
```

### 対策
- 分超過: GitHub Pro（$4/月）アップグレード or public repo化で無制限
- 超過でない: GitHub Supportに連絡

---

## 本日実施済み（13サイクル）

### DeadStockSolution
| 項目 | 状態 |
|------|------|
| formatters TZ修正 | ✅ PR #35 マージ済み |
| dependabot #31/#32/#33 | ✅ マージ済み |
| dependabot #30 (eslint 10) | ✅ close（専用移行branchで対応） |
| npm audit fix | ⏳ PR #38 open（CI不通） |
| CI最適化 | ⏳ PR #39 open（CI不通） |

### careroute-rx
| 項目 | 状態 |
|------|------|
| PR #1236/#1237/#1238 | ⏳ open（CI不通、内容は良好） |
| CI不全原因 | ✅ 特定済み（runner割り当て失敗） |

### 全リポジトリ共通
| 項目 | 状態 |
|------|------|
| topics設定（各7-8件） | ✅ 10リポジトリ完了 |
| homepage設定 | ✅ 10リポジトリ完了 |
| delete_branch_on_merge | ✅ 10リポジトリ完了 |
| DeadStockSolution古branch削除 | ✅ 3件削除 |
| GitHub Profile README | ✅ 作成済み |
| Dependabot alerts有効化 | ❌ scope不足 |

---

## CI復旧後に実施するタスク（順序）

1. PR #39（CI最適化）マージ → 分消費削減
2. PR #38（npm audit fix）マージ → production脆弱性解消
3. careroute-rx PR #1238（HIGH）→ #1236 → #1237 マージ
4. Dependabot alerts有効化
5. careroute-rx stale branch 40+件削除
6. eslint 10移行ブランチ作成（DeadStockSolution）

---

## Dependabot alerts有効化（auth refresh後）
```bash
for repo in DeadStockSolution careviax careroute-rx pharma-free-tools pharma-rejection-template pharma-renal-dose-tool pharma-medication-guidance-tool pharma-homecare-report pharma-di-query pharma-bringing-medicine; do
  gh api -X PUT repos/yusuketakuma/$repo/vulnerability-alerts
done
```
