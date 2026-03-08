# SEO戦略 - 施策J（2026-03）

## 概要
無料Webツール群（施策G～G20）の検索流入を増やし、リード獲得→収益化へ誘導する。

## 収益性 / 再現性 / KPI

| 項目 | 内容 |
|------|------|
| 収益性 | 中（間接的: 無料流入→有料製品販売） |
| 再現性 | 高（技術的SEOは自律実行可能） |
| KPI | 検索流入数 / インデックス数 / リード数 |

### KPI目標

| 指標 | 1週間 | 1ヶ月 | 3ヶ月 |
|------|-------|-------|-------|
| 検索流入 | 50 PV | 300 PV | 1,500 PV |
| インデックス数 | 10ページ | 20ページ | 20ページ |
| リード | 3件 | 15件 | 50件 |

## 実施内容

### 2026-03-07 20:08 JST
- [x] **構造化データ（JSON-LD）全21ツール適用完了**
  - 追加ツール: 16件（G2-G4, G6-G16, G19-G20）
  - 既存ツール: 5件（G1, G5, G17, G18, G21）
  - Schema type: SoftwareApplication
  - 内容: name, description, url, offers（無料）, author, inLanguage

### 2026-03-07 17:15 JST
- [x] sitemap.xml生成（全20ツール）
  - ファイル: `sidebiz/sitemap.xml`
  - URL: 各GitHub PagesのURLを登録
  - 優先度設定: 高需要ツール（薬価・効率化診断・ポリファーマシー等）を0.9

- [x] 構造化データ（JSON-LD）追加（初期3ツール）
  - 対象: G（薬価シミュレーター）、G5（業務効率化診断）、G17（ポリファーマシー検出）
  - Schema type: SoftwareApplication
  - 内容: name, description, url, offers（無料）, author

## 次のアクション

1. **各リポジトリにsitemap.xmlを追加**（ユーザー依存: push権限必要）
2. **Google Search Console登録**（ユーザー依存）
3. **残り17ツールへの構造化データ追加**
4. **内部リンク最適化**（関連ツール間のリンク強化）

## 技術詳細

### sitemap.xml配置方法
各リポジトリのルートにsitemap.xmlを配置し、GitHub Actionsで自動デプロイ。

### Google Search Console
1. https://search.google.com/search-console でプロパティ登録
2. 所有権確認（HTMLファイル or DNS）
3. sitemap.xml送信

### 構造化データテスト
- Google Rich Results Test: https://search.google.com/test/rich-results
- Schema Markup Validator: https://validator.schema.org/

---

## 異常記録
- なし
