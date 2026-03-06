# GitHub Pages デプロイ計画 - 薬剤師業務効率化診断

## 作成日時
2026-03-07 04:10 JST

## リポジトリ情報
- ツールID: G5
- ツール名: 薬剤師業務効率化診断
- ソース: `sidebiz/free-tool-pharmacist-efficiency-diagnosis/index.html`

## 収益性
- 形態: 無料ツール（リード獲得用）
- 収益導線:
  1. 無料診断 → リード収集フォーム
  2. メールでAIプロンプト集・Notionテンプレート紹介
  3. 有料製品（¥300〜¥980）へ転換

## 再現性
- 技術: Vanilla HTML/CSS/JS（依存なし）
- デプロイ: GitHub Pages（無料）
- 更新: ファイル置換のみ

## KPI目標

| 指標 | 1週間 | 1ヶ月 | 3ヶ月 |
|------|-------|-------|-------|
| PV | 50 | 200 | 800 |
| 診断完了数 | 20 | 80 | 320 |
| リード獲得 | 5 | 20 | 60 |
| 有料転換 | 1 | 3 | 10 |

## デプロイ手順

### 1. GitHubリポジトリ作成
```bash
# 新規リポジトリ作成（ブラウザ）
# リポジトリ名: pharma-efficiency-diagnosis-tool
# Public設定
```

### 2. ローカル初期化
```bash
cd /Users/yusuke/.openclaw/workspace/sidebiz/free-tool-pharmacist-efficiency-diagnosis
git init
git add .
git commit -m "Initial commit: 薬剤師業務効率化診断ツール"
git branch -M main
git remote add origin https://github.com/yusuketakuma/pharma-efficiency-diagnosis-tool.git
git push -u origin main
```

### 3. GitHub Pages有効化
- Settings → Pages → Source: main branch → / (root) → Save

### 4. 公開URL確認
- URL: https://yusuketakuma.github.io/pharma-efficiency-diagnosis-tool/

### 5. 相互リンク設定
既存ツール（G/G2/G3/G4）の「その他のツール」セクションにG5へのリンクを追加

## リスク・注意点
- なし（静的HTMLのみ、外部API不使用）

## 次のステップ
- [ ] ユーザー確認後にpush実行
- [ ] 相互リンク設定
- [ ] X/LINE告知用テキスト作成

---

*作成者: sidebiz-30m-assign*
