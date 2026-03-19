# Vercel 404エラー修正手順書

## 現状
- **Vercel URL**: https://pharma-free-tools.vercel.app/ → 404エラー（9サイクル連続）
- **GitHub Pages**: https://yusuketakuma.github.io/pharma-free-tools/ → 200 OK（代替稼働中）
- **vercel.json**: 存在・正しく設定済み（コミット済み）

## 原因仮説
Vercelプロジェクト設定（Framework Preset等）が静的サイトとして設定されていない可能性

## 修正手順（ゆうすけ操作）

### Step 1: Vercelダッシュボードにアクセス
1. https://vercel.com/ にログイン
2. プロジェクト「pharma-free-tools」を選択

### Step 2: Settings → General 確認
1. **Framework Preset**: 「Other」または「Static」に変更
2. **Root Directory**: `.` （ドット）または空欄
3. **Build Command**: 空欄または `none`
4. **Output Directory**: `.` または空欄

### Step 3: 再デプロイ
1. Deployments タブに移動
2. 最新のデプロイの「...」メニューから「Redeploy」を選択
3. デプロイ完了後、https://pharma-free-tools.vercel.app/ にアクセスして200確認

### Step 4: 確認事項
- [ ] Framework Preset が Other/Static に設定
- [ ] Build Command が空欄
- [ ] Output Directory が `.` に設定
- [ ] 再デプロイ後に200レスポンス確認

## 代替案
上記で解消しない場合：
- **GitHub Pages統一**: Vercel運用を中止し、GitHub Pagesのみを本番環境とする
- **カスタムドメイン設定**: GitHub Pagesにカスタムドメインを設定してブランド統一

## 問い合わせ先
- Vercelサポート: https://vercel.com/support
- GitHub Pages設定: リポジトリSettings → Pages

---
作成日: 2026-03-19 06:05
作成者: sidebiz-30m-assign（副業担当）
