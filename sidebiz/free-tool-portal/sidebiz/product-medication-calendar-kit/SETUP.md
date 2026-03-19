# セットアップガイド（GitHub Pagesで公開するまで）

前提: GitHubアカウントを持っていること

## 手順（所要5分）

1. リポジトリを作成
   - GitHub右上の［New repository］
   - Repository name: `medication-calendar`（任意）
   - Publicを選択 →［Create repository］

2. ファイルをアップロード
   - ［Add file → Upload files］
   - 本キットの `index.html` をドラッグ＆ドロップ
   - ［Commit changes］

3. GitHub Pagesを有効化
   - リポジトリの［Settings］→左メニューの［Pages］
   - Source: `Deploy from a branch`
   - Branch: `main` / `(root)` →［Save］

4. 公開URLを確認
   - 数分後に `https://<あなたのユーザー名>.github.io/medication-calendar/` でアクセス可能

5. （任意）独自ドメインの設定
   - Pages設定の［Custom domain］に所有ドメインを入力
   - DNSのCNAMEを `あなたのユーザー名.github.io` に設定

## 注意点
- 測定ID（GA4）は `G-XXXXXXXXXX` を自分のIDに差し替え
- CTAのリンク先は自分の販売ページへ変更可能

## トラブルシューティング
- 404になる: ブランチと公開フォルダが合っているか確認（main / root）
- スタイルが崩れる: `index.html`の相対パスがリポジトリ名と合っているか確認
