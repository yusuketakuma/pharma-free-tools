# Growth Directory Index

このファイルは `.openclaw/growth/` ディレクトリ内の主要ファイルのパスを集約し、提案/レビュー/報告文書の効率的な探索をサポートします。

## ディレクトリ構造

### 主要ディレクトリ
- `proposals/` - 成長提案ファイル
- `reviews/` - 提案レビュー結果  
- `reports/` - 成長報告書
- `runbooks/` - 運用手順書
- `ledgers/` - 取引記録
- `inbox/` - 受付中の提案
- `under-review/` - 審査中の提案
- `approved/` - 承認済み提案
- `rejected/` - 却下された提案
- `applied/` - 適用済み提案
- `verified/` - 検証済み提案

## 主要ファイルパス

### 提案ファイル (Proposals)
- `proposals/2026-03-28-growth-input-index-and-readpath.json` - ディレクトリ探索効率化提案
- `proposals/phase4-growth-smoke-proposal.json` - 初期サイクル提案（却下）

### レビュー結果 (Reviews)  
- `reviews/phase4-growth-smoke-proposal.review.json` - 初期サイクルレビュー結果
- `reviews/growth-proposal-review-summary-2026-03-28.md` - レビュー要約

### 報告書 (Reports)
- `reports/phase4-growth-smoke.md` - 成長報告書

### 運用手順書 (Runbooks)
- なし

### スクリプト (Scripts)
- `scripts/run_growth_cycle.py` - 成長サイクル実行スクリプト
- `scripts/review_growth_proposal.py` - 提案レビュースクリプト
- `scripts/apply_growth_proposal.py` - 提案適用スクリプト

### 設定ファイル (Configuration)
- `config/growth-policy.yaml` - 成長ポリシー設定
- `schemas/growth-proposal.schema.json` - 提案スキーマ
- `schemas/growth-review.schema.json` - レビュースキーマ
- `schemas/growth-apply-result.schema.json` - 適用結果スキーマ

## 更新履歴

- **2026-03-29**: INDEX.md 作成 - 成長ディレクトリ探索効率化提案の適用により作成

## 探索方法

この INDEX.md ファイルを使用することで、以下の探索パターンが改善されます：

1. **提案探索**: `proposals/` ディレクトリ内のファイル一覧を参照
2. **レビュー結果**: `reviews/` ディレクトリ内のレビュー結果を確認  
3. **報告書**: `reports/` ディレクトリ内の進捗報告を閲覧
4. **運用手順**: `runbooks/` ディレクトリ内の手順書を参照

## 探索の改善

これにより、以下の問題が解消されます：
- 複雑な `find` コマンドによる探索が必要なケースを削減
- `approval-timeout` による提案探索失敗の防止
- 既存提案との重複チェックの信頼性向上
- サイクリックな提案生成の効率化