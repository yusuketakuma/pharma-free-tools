# pharmacy-talent-development.html 削除準備レポート — 2026-03-18 20:30 JST

## 概要

`pharmacy-talent-development.html` の削除前チェックリスト。ゆうすけ確認・承認後に実行可能な状態であることを確認済み。

---

## 削除前チェックリスト（全項目確認済み）

### ✅ 1. index.html 本体からのカード削除確認

```bash
grep "talent-development" /workspace/index.html
# → ヒットなし（削除済み）
```

**結果**: `pharmacy-talent-development.html` へのリンクカードは本体 `index.html` から削除済み。

---

### ✅ 2. ポータルコピー（free-tool-portal/index.html）からのカード削除確認

```bash
grep "talent-development" /workspace/sidebiz/free-tool-portal/index.html
# → ヒットなし（削除済み）
```

**結果**: ポータルコピーからも削除済み。

---

### ✅ 3. sitemap.xml からの除外確認

```bash
grep "talent-development" /workspace/sitemap.xml
# → ヒットなし（除外済み）
```

**結果**: `/workspace/sitemap.xml`（2026-03-18 作成・86 URL収録）に `talent-development` URLは含まれていない。

---

### ✅ 4. pharmacy-staff-development.html のcanonical・OGP設定確認

統合先ファイル（`pharmacy-staff-development.html`）の設定:

```html
<link rel="canonical" href="https://yusuketakuma.github.io/pharma-free-tools/pharmacy-staff-development.html">
<meta property="og:url" content="https://yusuketakuma.github.io/pharma-free-tools/pharmacy-staff-development.html">
```

**結果**: canonical URLおよびog:urlは正しく `staff-development` に設定済み。重複ページの問題なし。

---

### ⚠️ 5. 外部リンク影響の注記（ゆうすけ判断材料）

- **GitHub Pages URL**: `https://yusuketakuma.github.io/pharma-free-tools/pharmacy-talent-development.html`
- **内部参照**: index.html・portal・sitemap から全て除外済み
- **外部リンク**: SNS投稿・note記事等に過去このURLを記載していた場合、削除後は404になる
  - 旧URLへのアクセスは自動的には staff-development にリダイレクトされない（GitHub Pagesにリダイレクト機能なし）
  - リダイレクト対応が必要な場合は `pharmacy-talent-development.html` を削除せず、以下の内容に差し替える方法もある:

```html
<meta http-equiv="refresh" content="0; url=pharmacy-staff-development.html">
<link rel="canonical" href="https://yusuketakuma.github.io/pharma-free-tools/pharmacy-staff-development.html">
```

---

## ゆうすけ承認後の実行コマンド

### A. ファイル削除のみ（GitHub操作は手動）

```bash
rm /workspace/pharmacy-talent-development.html
```

### B. 削除 + git操作（リポジトリがgit管理されている場合）

```bash
# ワークスペースルートに移動（Gitリポジトリのルートに応じて調整）
cd ~/Desktop/openclaw-cowork

# ファイル削除 & ステージング
git rm workspace/pharmacy-talent-development.html

# コミット
git commit -m "Remove pharmacy-talent-development.html (merged into staff-development)"

# プッシュ（GitHub Pages更新）
git push origin main
```

---

## ファイル情報

| 項目 | 内容 |
|------|------|
| ファイルパス | `/workspace/pharmacy-talent-development.html` |
| ファイルサイズ | 38,113 bytes（38 KB） |
| 最終更新日 | 2026-03-10 |
| 削除可否 | ✅ 削除可能（内部参照なし・統合完了） |

---

## 結論

**削除準備完了。ゆうすけの最終承認のみ待ち状態。**

外部リンク（SNS・note等）にこのURLを使用した投稿がある場合のみ、削除前にリダイレクトページへの差し替えを検討すること。
