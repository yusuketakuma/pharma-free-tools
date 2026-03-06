# 薬剤師向けAIプロンプト集 - 着地ページ

## 概要
Gumroad商品への流入用着地ページ。GitHub Pagesで無料ホスティング可能。

## デプロイ手順（GitHub Pages）

### 方法1: 新規リポジトリ作成
```bash
# 1. GitHubで新規リポジトリ作成（例: pharmacist-ai-prompts）

# 2. ローカルで初期化
cd /Users/yusuke/.openclaw/workspace/sidebiz/landing-page
git init
git add .
git commit -m "Initial landing page"

# 3. リモート追加&プッシュ
git remote add origin https://github.com/YOUR_USERNAME/pharmacist-ai-prompts.git
git branch -M main
git push -u origin main

# 4. GitHub Pages有効化
# Settings → Pages → Source: main ブランチ → Save
# https://YOUR_USERNAME.github.io/pharmacist-ai-prompts/ で公開
```

### 方法2: 既存リポジトリのdocsフォルダ
```bash
# 既存リポジトリのdocsフォルダに配置
cp -r /Users/yusuke/.openclaw/workspace/sidebiz/landing-page/* /path/to/repo/docs/
git add docs/
git commit -m "Add landing page"
git push
```

## 設定が必要な項目

1. **Gumroadリンク**: `[GUMROAD_LINK]` を実際の商品URLに置換
   - ファイル: `index.html`
   - 検索: `href="[GUMROAD_LINK]"`
   - 置換: `href="https://gum.co/YOUR_PRODUCT_ID"`

2. **OGP画像**（オプション）:
   - 1200x630px の画像を追加
   - `<meta property="og:image" content="ogp.png">` をheadに追加

## カスタムドメイン（オプション）

1. CNAME ファイル作成: `echo "prompts.yourdomain.com" > CNAME`
2. DNS設定: CNAME レコードを `YOUR_USERNAME.github.io` に設定

## 更新履歴

- 2026-03-06: 初版作成
