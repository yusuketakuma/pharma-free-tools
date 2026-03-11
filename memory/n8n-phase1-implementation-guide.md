# n8n Phase 1 実装手順書

## 目的
RSS→Telegram自動投稿ワークフローのPhase 1（基盤構築）を即座に実装可能な状態にする。

## Phase 1 スコープ
- n8n.cloud アカウント作成
- Telegram Bot 作成・連携
- RSS フィード選定・テスト

---

## 手順1: n8n.cloud アカウント作成

### 1-1. アカウント登録
1. https://n8n.io にアクセス
2. 「Get started free」をクリック
3. メールアドレス・パスワード入力
4. メール確認でアカウント有効化

### 1-2. プラン選択
- **推奨**: Starter ($20/月)
  - 5,000ワークフロー実行/月
  - 5アクティブワークフロー
  - 十分な制限

- **無料枠**: Self-hosted
  - 技術的設定必要
  - サーバー費用別途

### 1-3. 初期設定
1. ワークスペース作成
2. タイムゾーン設定: Asia/Tokyo
3. 通知設定: Email有効

---

## 手順2: Telegram Bot 作成

### 2-1. BotFather でボット作成
1. Telegram で @BotFather を検索
2. `/newbot` を送信
3. ボット名入力: `PharmaToolsBot`（例）
4. ユーザー名入力: `pharma_tools_alert_bot`（例）
5. **API Token を保存**（例: `1234567890:ABCdefGHIjklMNOpqrsTUVwxyz`）

### 2-2. チャットID取得
1. 作成したボットに `/start` を送信
2. https://api.telegram.org/bot{API_TOKEN}/getUpdates にアクセス
3. JSONから `chat.id` を取得（例: `123456789`）

### 2-3. n8n で Telegram ノード設定
1. n8n ワークフロー作成画面を開く
2. 「Telegram」ノードを追加
3. Credential作成:
   - Name: `PharmaToolsBot`
   - Access Token: 手順2-1で取得したトークン
4. テストメッセージ送信で動作確認

---

## 手順3: RSS フィード設定

### 3-1. 優先フィード（薬局関連）

| ソース | URL | 確認頻度 |
|--------|-----|----------|
| 薬局新聞 | https://www.yakkyoku-newspaper.com/feed | 15分 |
| 厚労省RSS | https://www.mhlw.go.jp/stf/rss.rdf | 30分 |
| 日経メディカル | https://medical.nikkeibp.co.jp/rss.rdf | 30分 |

### 3-2. n8n で RSS ノード設定
1. 「RSS Feed Read」ノードを追加
2. URL設定: 薬局新聞フィード
3. Polling interval: 15 minutes
4. テスト実行で記事取得確認

---

## 手順4: ワークフロー構築（Phase 1）

### 4-1. 基本構成
```
[Schedule Trigger] → [RSS Read] → [Filter] → [Telegram Send]
```

### 4-2. ノード設定詳細

**Node 1: Schedule Trigger**
- Mode: Interval
- Interval: 15 minutes

**Node 2: RSS Feed Read**
- URL: https://www.yakkyoku-newspaper.com/feed
- Options: 
  - Max items: 5

**Node 3: Filter（オプション）**
- Condition: タイトルに「薬局」「調剤」「在宅」を含む

**Node 4: Telegram Send**
- Credential: PharmaToolsBot
- Chat ID: 手順2-2で取得
- Text: 
```
📰 新着記事

タイトル: {{ $json.title }}
リンク: {{ $json.link }}
公開日: {{ $json.pubDate }}

#薬局 #調剤
```

### 4-3. テスト実行
1. 「Execute Workflow」をクリック
2. Telegramでメッセージ受信確認
3. エラーがある場合はノード設定を修正

---

## 手順5: 本番稼働

### 5-1. ワークフロー有効化
1. ワークフロー保存
2. 「Active」トグルをON
3. ステータス確認: 緑色の「Active」表示

### 5-2. 動作確認
- 15分後にTelegramで新着記事が届くか確認
- ログで実行履歴を確認

---

## コスト（Phase 1）

| 項目 | 月額 |
|------|------|
| n8n.cloud Starter | $20 |
| Telegram Bot | 無料 |
| RSS取得 | 無料 |
| **合計** | **$20/月** |

---

## 次フェーズ（Phase 2以降）

### Phase 2: AI要約追加
- OpenAI ノード追加（GPT-4o-mini）
- コスト: ~$5/月追加

### Phase 3: X投稿追加
- X API Basic契約（$100/月）
- 承認フロー実装

### Phase 4: Instagram投稿追加
- Instagram Graph API設定
- 画像生成ノード追加

---

## トラブルシューティング

### RSS取得エラー
- URLが正しいか確認
- フィードが有効かブラウザで確認
- User-Agent設定が必要な場合あり

### Telegram送信エラー
- API Tokenが正しいか確認
- Chat IDが正しいか確認
- ボットがチャットに参加しているか確認

### ワークフローが実行されない
- Activeになっているか確認
- Schedule設定を確認
- n8nログでエラー確認

---

作成日: 2026-03-11
作成者: 副業担当AI
次回更新: Phase 1完了後
