# 薬剤師無料ツール群 保守運用手順書

> 対象リポジトリ: `yusuketakuma/pharma-free-tools`
> 対象パス: `/Users/yusuke/Projects/pharma-free-tools`
> 最終更新: 2026-03-28

## 1. 現状サマリー

| 項目 | 値 |
|------|-----|
| HTMLツール数 | 74ファイル |
| デプロイ先 | GitHub Pages (`yusuketakuma.github.io/pharma-free-tools`) + Vercel |
| CI | GitHub Actions (`check-tool-count.yml`) |
| SEO監査スクリプト | `scripts/seo_audit.py` (82.6%スコア) |
| クロスリンク管理 | `add_crosslinks.py` (9ファイルのみ対応済) |
| 外部リンクチェッカー | `link-checker.sh` (週次cron想定) |
| sitemap.xml | 手動更新 (2026-03-18 最終) |
| .tmpファイル | 24ファイル残存 (ゴミ) |
| npm/package.json | なし (pure HTML/JS) |

## 2. 既存CIの現状と限界

### check-tool-count.yml
- ✅ ツール数とindex.html表示数の一致確認
- ✅ GA4プレースホルダー検出
- ✅ OGP URLの旧パターン検出
- ✅ 内部リンク死活確認 (href="*.html")
- ❌ 外部リンクの死活確認なし
- ❌ sitemap.xmlと実ファイルの同期確認なし
- ❌ クロスリンク整合性確認なし
- ❌ HTML構造検証なし

## 3. 定期保守タスク一覧

### 3.1 デイリー（低リスク自動化推奨）
- [ ] 外部リンク404チェック
- [ ] sitemap.xmlと実ファイルの差分確認

### 3.2 ウィークリー
- [ ] SEO監査スクリプト実行 (`scripts/seo_audit.py`)
- [ ] クロスリンク整合性チェック
- [ ] GA4プレースホルダー残存確認
- [ ] .tmpファイル掃除確認

### 3.3 マンスリー
- [ ] index.html表示数と実ファイル数の照合
- [ ] OGP画像の存在確認
- [ ] sitemap.xmlのlastmod更新
- [ ] 新規追加ツールのクロスリンク設定

### 3.4 クォータリー
- [ ] 全ツールのmeta description品質レビュー
- [ ] JSON-LD構造化データの追加状況確認
- [ ] クロスリンク網羅率の拡大（現在9/74ファイル → 目標30+/74）

## 4. 自動化スクリプト利用法

### 統合保守スクリプト (`scripts/pharma-maintenance.sh`)

```bash
# フルチェック (全項目)
./scripts/pharma-maintenance.sh

# クイックチェック (リンク+SEOのみ)
./scripts/pharma-maintenance.sh --quick

# .tmpファイル一括削除
./scripts/pharma-maintenance.sh --clean

# sitemap.xml再生成 (全HTMLファイルを自動反映)
./scripts/pharma-maintenance.sh --sitemap

# クロスリンク整合性チェックのみ
./scripts/pharma-maintenance.sh --crosslinks

# 内外リンク死活のみ
./scripts/pharma-maintenance.sh --links
```

### レポート出力
実行ごとに `reports/maintenance_YYYYMMDD_HHMMSS.md` にレポートを生成。

### GitHub Actions (`.github/workflows/maintenance-checks.yml`)
- push/PR時: ツール数、内部リンク、OGP URL、SEO監査
- 毎週月曜9:00JST: 定期メンテナンスチェック (schedule)
- 手動実行: `workflow_dispatch` 対応

## 5. 既知の課題

| ID | 課題 | 優先度 | 状態 |
|----|------|--------|------|
| M-001 | .tmpファイル24個残存 | 低 | `--clean` で一括削除可能 |
| M-002 | GA4プレースホルダーが全74ファイルで残存 | 低 | G-XXXXXXXXXX を本番IDに置換 |
| M-003 | 内部死リンク15件 (renal-drug-dosing等) | **高** | 削除 or 存在するファイル名に修正 |
| M-004 | クロスリンク先不在6件 | **高** | 削除 or 実在ファイルに修正 |
| M-005 | sitemap未登録14件 | 中 | `--sitemap` で自動再生成 |
| M-006 | title_tag WARN が58件 (短すぎる) | 低 | 仕様判断 |
| M-007 | JSON-LD未設定ファイル多数 | 低 | 段階追加 |
| M-008 | SEOスコア82.6% → 目標90%+ | 中 | FAIL 2件/88 WARN 解消で到達可能 |

## 5. 新規ツール追加時のチェックリスト

- [ ] HTMLファイルをリポジトリルートに配置
- [ ] `index.html` のツール一覧に追加し、表示数を更新
- [ ] sitemap.xml に `<url>` エントリ追加
- [ ] meta description (50-160文字) 設定
- [ ] OGP tags (title, description, url, image) 設定
- [ ] GA4 tag 追加
- [ ] 関連ツールセクション追加（既存ツールへのリンク）
- [ ] 既存ツールの関連ツールセクションに新ツールを追加
- [ ] `scripts/seo_audit.py` で検証実行
- [ ] `link-checker.sh` で404確認
- [ ] GitHub Actions CI通過確認
