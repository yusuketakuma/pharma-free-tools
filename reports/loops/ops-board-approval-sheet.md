# Board裁定シート（ops-automator作成・2026-03-29 12:07 更新）

## ⚡ 最優先: 裁定依頼5 — cron job 41件の無効化

### 根本問題
全有効cron job 43件のうち**41件（95%）がdelivered=False**。
**1日8.3時間のリソース消費のうち8.2時間（99%）が未配送** — 行き場のないデータ生成に浪費中。

### Tier 1: 即時無効化推奨（日次3.2時間節減）
| # | job | agent | 回/日 | 日次消費 | 理由 |
|---|-----|-------|-------|----------|------|
| 1 | board-agenda-seed-generator | supervisor-core | 24 | **2.2時間** | 最重・未配送 |
| 2 | self-improvement-verification | board-auditor | 24 | 43分 | 未配送 |
| 3 | self-improvement-proposal-synthesis | supervisor-core | 24 | 38分 | 未配送 |
| 4 | board-postmeeting-agent-dispatch | supervisor-core | 24 | 26分 | 未配送 |
| 5 | proactive-idle-work-discovery | board-visionary | 24 | 25分 | 未配送 |
| 6 | self-improvement-proposal-review | board-auditor | 24 | 24分 | 未配送 |
| 7 | cross-agent-knowledge-sync | supervisor-core | 24 | 16分 | 未配送 |
| 8 | board-premeeting-all-agent-business-report | supervisor-core | 24 | 12分 | 未配送 |

### Tier 2: 要検討（日次2.3時間）
| # | job | agent | 回/日 | 日次消費 | 備考 |
|---|-----|-------|-------|----------|------|
| 9 | claude-code-completion-checker | ceo-tama | 480 | 33分 | 高頻度だが軽量 |
| 10 | token-management-evaluation | ops-automator | 96 | 25分 | delivery=none |
| 11 | token-management-snapshot | ops-automator | 96 | 16分 | delivery=none |
| 12-41 | その他30件 | 各agent | 様々 | 約1.6時間 | 詳細はops-latest.md参照 |

### Tier 3: 維持（機能中）
| job | agent | 回/日 | 日次消費 | 理由 |
|-----|-------|-------|----------|------|
| tama-regular-progress-report | ceo-tama | 4 | 5.5分 | ✅ delivered=True |
| supervisor-noise-and-overhead-review | supervisor-core | 週1 | 3分 | ✅ delivered=True |

### 裁定項目
- [ ] Tier 1（8件）を即時無効化 → 日次3.2時間節減
- [ ] Tier 1 + Tier 2（41件）を全件無効化 → 日次8.2時間節減
- [ ] 一部のみ無効化（対象を指定）
- [ ] 変更しない

---

## 裁定依頼1: 空転loop 6件のheartbeat間隔変更

### 対象
| agent | 空転時間 | 原因 | 変更内容 |
|-------|----------|------|----------|
| mail-clerk | 33h+ | メールアクセス経路未設定 | every: 10m → 168h |
| schedule-clerk | 37h+ | 期日入力未着 | every: 10m → 168h |
| direct-support | 38h+ | ゆうすけ連絡未着 | every: 10m → 168h |
| homecare-support | 31h+ | 訪問予定データ未提示 | every: 10m → 168h |
| receipt-clerk | 34h+ | 受理対象未提示 | every: 10m → 168h |
| backlog-clerk | 23h+ | idle | every: 168h（現状維持） |

### 裁定項目
- [ ] 6件のheartbeat everyを168hに変更する
- [ ] 一部のみ変更（対象を指定）
- [ ] 変更しない

---

## 裁定依頼2: loop寿命管理runbookの承認

### 主要ルール
- 6サイクル連続executed=0 → 警告
- 12サイクル連続実務ゼロ → 停止提案
- 6h超で入力経路未設定 → every → 168h

### 裁定項目
- [ ] runbook案を承認（reports/loops/loop-lifecycle-runbook-draft.md）
- [ ] 修正を指示
- [ ] 却下

---

## 裁定依頼3: セッションarchive/rotate指針

### 提案
- 7日超の完了セッションを圧縮保存
- 30日超のセッションを削除

### 裁定項目
- [ ] 承認 / [ ] 期間変更 / [ ] 却下

---

## 裁定依頼4: Reportフォーマット統一

### 提案
- 全loop reportをYAMLフラット形式に統一
- テンプレート: reports/loops/report-template.md

### 裁定項目
- [ ] 承認 / [ ] 却下

---

## 実績サマリー（19サイクル / 約3時間20分）

| カテゴリ | 成果 |
|----------|------|
| 整理 | reports/ 43件 + board/ 139件 = **182件archive** |
| 観測 | loop健全性/stuck原因/セッション肥大化/フロー欠陥/フォーマット混在/**cron浪費（99%未配送）** |
| 提案 | 空転loop停止/寿命runbook/セッションarchive/フォーマット統一/**cron job整理** |
| 資料 | 裁定シート + 総合レポート + reportテンプレート + 寿命runbook案 |

### 推定リソース改善効果（全提案承認時）
| アクション | 節減効果 |
|-----------|----------|
| cron Tier 1無効化 | 日次3.2時間 |
| cron Tier 1+2無効化 | 日次8.2時間 |
| 空転loop 6件停止 | 1日約30回の無駄heartbeat |
| 合計 | **日次8.2時間+のコンピュート節減** |
