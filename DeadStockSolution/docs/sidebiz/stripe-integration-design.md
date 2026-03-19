# Stripe統合設計書

## 概要
DeadStockSolutionのSaaS化に向けたStripe決済システム統合設計

## 対象プラン
| プラン | 月額 | 対象 | 機能 |
|--------|------|------|------|
| Light | ¥9,800 | 小規模薬局（1-2店舗） | 基本在庫管理・アラート |
| Standard | ¥19,800 | 中規模薬局（3-5店舗） | 全機能・レポート・API |
| Enterprise | ¥49,800〜 | 大規模薬局（6店舗〜） | 全機能・カスタマイズ・サポート |

## アーキテクチャ

### フロー
```
[LP] → [トライアル登録] → [Stripe Checkout] → [Webhook] → [アカウント有効化]
```

### 必要なStripe API
1. **Customers** - 顧客管理
2. **Products/Prices** - 商品・価格管理
3. **Subscriptions** - サブスクリプション管理
4. **Checkout Sessions** - 決済ページ
5. **Webhooks** - イベント通知

## 実装計画

### Phase 1: 基盤構築（Week 1）
- [ ] Stripe SDK導入 (`stripe` npmパッケージ)
- [ ] APIキー設定（テスト/本番環境分離）
- [ ] Products/Prices作成（3プラン）
- [ ] Webhookエンドポイント実装

### Phase 2: 購入フロー（Week 2）
- [ ] Checkout Session作成API
- [ ] 成功/キャンセルページ
- [ ] Webhookイベントハンドリング
- [ ] サブスクリプション状態管理

### Phase 3: 管理機能（Week 3）
- [ ] プラン変更機能
- [ ] 解約機能
- [ ] 請求履歴表示
- [ ] 管理画面統合

## 技術スタック
- Backend: Hono (既存)
- Database: Neon PostgreSQL (既存)
- ORM: Drizzle (既存)
- Stripe: stripe@^17.0.0

## セキュリティ要件
- [ ] Webhook署名検証
- [ ] APIキーの環境変数管理
- [ ] 顧客データ暗号化
- [ ] PCI DSS準拠（Stripeが処理）

## KPI定義
| 指標 | 目標値 | 測定方法 |
|------|--------|----------|
| トライアル開始数 | 50/月 | Stripe Customer作成数 |
| 有料転換率 | 20% | トライアル→有料移行率 |
| 解約率 | <5%/月 | 月次アクティブサブスクリプション減少率 |
| MRR | ¥100,000〜 | Stripe Revenue Reports |

## 環境変数
```env
# テスト環境
STRIPE_SECRET_KEY_TEST=sk_test_xxx
STRIPE_PUBLISHABLE_KEY_TEST=pk_test_xxx
STRIPE_WEBHOOK_SECRET_TEST=whsec_xxx

# 本番環境
STRIPE_SECRET_KEY_LIVE=sk_live_xxx
STRIPE_PUBLISHABLE_KEY_LIVE=pk_live_xxx
STRIPE_WEBHOOK_SECRET_LIVE=whsec_xxx
```

## 次のステップ
1. Stripeアカウント作成（要: ユーザー操作）
2. テスト環境APIキー取得
3. Products/Prices作成
4. Webhookエンドポイント実装開始

## 依存関係
- **ユーザー依存**: Stripeアカウント作成・APIキー提供
- **自律実行可**: コード実装・テスト・設計

---
作成日: 2026-03-06
