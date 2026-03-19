# Neon Preview DB 同期設定ガイド

## 概要

`neon-sync-preview.yml` ワークフローは、Neon の preview ブランチを親ブランチ（main）の最新状態にリセットします。
これにより、preview 環境のDBを本番DBと同期できます。

## 前提条件

- Neon アカウント（https://neon.tech）
- Neon プロジェクト作成済み
- プロジェクト内に `main` ブランチと `preview` ブランチが存在すること

## 設定手順

### 1. Neon API Key の取得

1. Neon Console にログイン: https://console.neon.tech
2. Account Settings → API Keys
3. 「Create API Key」をクリック
4. キー名を入力（例: `github-actions`）
5. 生成されたキーをコピー（一度しか表示されません）

### 2. Neon Project ID の取得

1. Neon Console でプロジェクトを選択
2. Settings → General
3. 「Project ID」をコピー

### 3. GitHub Secrets/Variables の設定

リポジトリの Settings → Secrets and variables → Actions で設定:

| 種別 | 名前 | 値 | 必須 |
|------|------|-----|------|
| Secret | `NEON_API_KEY` | 手順1で取得したAPI Key | ✅ |
| Variable | `NEON_PROJECT_ID` | 手順2で取得したProject ID | ✅ |
| Variable | `NEON_PREVIEW_BRANCH` | preview ブランチ名（未設定時は `preview`） | ❌ |

### 4. 設定確認

設定完了後、以下のいずれかでワークフローを実行:

1. `preview` ブランチに push
2. GitHub Actions → Neon Sync Preview DB → Run workflow

## トラブルシューティング

### ワークフローが「Missing Neon config」で終了する

**原因**: `NEON_API_KEY` または `NEON_PROJECT_ID` が未設定

**解決**: 上記の手順3を完了してください。

### ワークフローが失敗する（API Key エラー）

**原因**: API Key が無効または権限不足

**解決**:
1. API Key が正しくコピーされているか確認
2. API Key の権限を確認（プロジェクトへのアクセス権）

### ワークフローが失敗する（ブランチ名エラー）

**原因**: 指定したブランチが Neon プロジェクトに存在しない

**解決**:
1. Neon Console でブランチ一覧を確認
2. `NEON_PREVIEW_BRANCH` 変数を正しいブランチ名に設定

### 同期後にデータが消えた

**原因**: 仕様通りの動作（preview ブランチは上書きされます）

**解決**: 
- preview 環境のデータは一時的なものとして扱ってください
- 重要なデータは本番（main ブランチ）で管理してください

## 注意事項

- **データ消失リスク**: 同期は preview ブランチを完全に上書きします
- **本番影響なし**: main ブランチ（本番DB）には影響しません
- **実行タイミング**: `preview` ブランチへの push 時に自動実行されます

## 関連ファイル

- ワークフロー定義: `.github/workflows/neon-sync-preview.yml`
- README セクション: 「Vercel / Neon Preview運用」
