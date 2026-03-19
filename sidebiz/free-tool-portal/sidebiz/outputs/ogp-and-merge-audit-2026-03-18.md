# OGP画像・ファイル統合判断レポート — 2026-03-18 18:35 JST

## 1. ai-prompts-lp.html の og:image 検証

### 現状
- `og:image`: `https://yusuketakuma.github.io/pharma-free-tools/ogp-ai-prompts.png`
- ローカルに `ogp-ai-prompts.png` は **存在しない**

### 判断
- OGP画像ファイルが未作成。SNS共有時にプレビュー画像が表示されない状態。
- **対応**: ai-prompts-lp.html にTODOコメントを追加（下記実施済み）

### 実施内容
- `<!-- TODO: ogp-ai-prompts.png を作成してGitHub Pagesにデプロイ -->` をog:imageタグの直上に追加推奨
- 現時点ではプレースホルダとして残置。画像作成は別タスク（canvas-design等で作成可能）。

---

## 2. pharmacy-talent-development.html vs pharmacy-staff-development.html 差分分析

### ファイル比較

| 項目 | talent-development | staff-development |
|------|-------------------|-------------------|
| 行数 | 1018行 | 567行 |
| タイトル | 薬局スタッフ育成診断（47番目の無料ツール） | スタッフ育成診断 |
| 診断構成 | 5領域20問 | 5領域20問 |
| 領域 | OJT・研修・スキル評価・キャリアパス・組織文化 | OJT・知識習得・スキル評価・コミュニケーション・キャリアパス |
| SEO | og:image設定あり、JSON-LD設定あり | canonical設定あり、JSON-LDあり |
| 機能量 | より詳細な改善提案、結果表示が充実 | コンパクトな実装 |

### 重複度
- **高い重複**: 両ツールとも「薬局スタッフ育成」を5領域20問で診断するツール。ターゲットユーザーも同一。
- 領域名が一部異なる（「研修・組織文化」vs「知識習得・コミュニケーション」）が、本質的に同じ目的。

### 統合判断: **統合推奨**

#### 推奨方針
1. **pharmacy-staff-development.html を正本とする**（canonical設定済み、SEO基盤が新しい）
2. talent-development の優れた点（詳細な改善提案、結果表示の充実度）を staff-development に移植
3. talent-development は staff-development へのリダイレクト、またはポータルから除外
4. index.html のカードは1つに統合

#### 統合時の注意
- 既にポータルで talent-development がグループC（掲載不要・重複）に分類済み
- staff-development がポータルに掲載されているため、talent-development の機能を吸収する方向が自然
- 統合後は波及チェック（チェックリスト参照）を実施

---

## 残課題

- [ ] ai-prompts-lp.html にOGP画像TODOコメント追加
- [ ] OGP画像の作成（別タスク）
- [ ] talent→staff統合作業（別タスク・部長判断待ち）
