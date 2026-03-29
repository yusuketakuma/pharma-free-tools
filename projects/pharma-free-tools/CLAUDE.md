# pharma-free-tools — Claude Code 実行規約

## Architecture
- OpenClaw = control plane
- Claude Code = execution plane
- ACP = primary transport / CLI = secondary

## Project Overview
薬局向け無料HTMLツールのポータルサイト。GitHub Pages で公開。
現在74本のツールを提供中。毎日1本ずつ新規作成＋既存アップデートを継続。

## Source Repository
`/Users/yusuke/pharma-free-tools`
GitHub: `https://github.com/yusuketakuma/pharma-free-tools.git`

## Tech Stack
- **Frontend**: 静的HTML + CSS + JavaScript（フレームワークなし）
- **Deploy**: GitHub Pages
- **SEO**: sitemap.xml, OGP meta tags, GA4
- **CI**: GitHub Actions (OGP検証, ツール数検証, meta description長チェック)

## 日次タスク
1. **新規ツール作成** (1本/日)
   - インターネットで薬局業務のベストプラクティスを調査
   - 需要のあるテーマを選定
   - HTMLツールを設計・実装
   - OGP meta tags, sitemap.xml 更新
   - index.html にリンク追加
2. **既存ツール改善** (1本/日)
   - UI/UX改善、機能追加、バグ修正
   - SEO最適化、meta description改善
3. **GitHub Push** (承認後)

## ツール作成ガイドライン
- 単一HTMLファイル（CSS/JS インライン）
- 日本語UI
- レスポンシブデザイン
- 印刷対応（必要に応じて @media print）
- OGP meta tags 必須
- GA4 トラッキングコード含む
- 他ツールへのクロスリンク含む
- ファイル名: kebab-case (例: `pharmacy-inventory-diagnosis.html`)

## Key Commands
```bash
cd /Users/yusuke/pharma-free-tools
git status
git add <file>
git commit -m "feat: <ツール名>"
git push origin main  # 承認必須
```

## Verification
- HTML構文チェック
- OGP meta tags 存在確認
- sitemap.xml 更新確認
- index.html リンク追加確認
- meta description 160文字以内

## Constraints
- noPush: true（承認なしにpushしない）
- noDestructive: true
- 既存ツールの削除禁止
