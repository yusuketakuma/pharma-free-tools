# メールアクセス設定手順（たまAI mail-clerk用）

## 推奨: Gmail転送 + OpenClaw webhook

### Step 1: Gmail転送設定
1. Gmail → 設定 → 転送とPOP/IMAP
2. 転送先アドレスを追加（OpenClawのメール受信用アドレス）
3. 転送を有効化

### Step 2: OpenClaw側でメール受信チャネルを有効化
- `openclaw channel add --type email` または設定ファイルに追記
- 受信アドレス・SMTP認証を設定

### 代替: IMAP直接接続
1. Googleアカウント → セキュリティ → アプリパスワード生成
2. 以下をOpenClaw環境変数に設定:
   - `MAIL_IMAP_HOST=imap.gmail.com`
   - `MAIL_IMAP_PORT=993`
   - `MAIL_IMAP_USER=<email>`
   - `MAIL_IMAP_PASS=<app-password>`
3. `openclaw channel add --type imap` でチャネル追加

### 最小構成で始めるには
Gmail転送設定だけでもOK。転送先の受信方法は後で相談。
