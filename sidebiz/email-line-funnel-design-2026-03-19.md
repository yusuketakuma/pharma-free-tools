# メール/LINE登録導線 最小設計メモ

作成日: 2026-03-19 12:00
作成者: 副業担当

## 目的
無料ツール訪問者→継続接点化（メール/LINE登録）で、再訪・収益化導線を構築する

## 現状
- 無料ツール86件: GitHub Pages正常稼働
- GA4トラッキング: 100%完了
- OGP/Twitter Card: 100%完了
- **ボトルネック**: メール/LINE登録導線未整備

## 最小実装案

### Phase 1: LINE公式アカウント登録導線（所要: 1-2時間）

#### 実装内容
1. **共通フッターCTA追加**: 全ツール下部にLINE登録バナー追加
   - テキスト: 「薬剤師業務効率化の最新情報をLINEで受け取る」
   - リンク: LINE公式アカウント登録URL

2. **高CTR見込みページ優先展開**（10件）
   - pharmacy-bottleneck-diagnosis.html
   - pharmacy-revenue-improvement.html
   - homecare-revenue-simulator.html
   - pharmacy-automation-roi.html
   - pharmacy-dx-roi-calculator.html
   - pharmacy-claim-denial-diagnosis.html
   - pharmacy-inventory-diagnosis.html
   - pharmacy-safety-diagnosis.html
   - polypharmacy-assessment.html
   - ai-prompts-lp.html

3. **HTMLテンプレート**
```html
<!-- LINE CTA Banner -->
<div class="line-cta-banner" style="background: linear-gradient(135deg, #06C755 0%, #00B900 100%); padding: 20px; border-radius: 10px; text-align: center; margin: 30px 0;">
  <p style="color: white; font-size: 18px; margin-bottom: 15px;">💊 薬剤師業務効率化の最新情報をLINEで受け取る</p>
  <a href="[LINE登録URL]" target="_blank" style="display: inline-block; background: white; color: #06C755; padding: 12px 30px; border-radius: 25px; text-decoration: none; font-weight: bold;">LINE友だち追加</a>
</div>
```

#### 必要リソース
- LINE公式アカウント作成（ゆうすけ実施）
- LINE登録URL発行
- HTMLテンプレート実装（副業担当）

### Phase 2: メール登録導線（所要: 2-3時間）

#### 実装内容
1. **共通サイドバーCTA追加**: 全ツールサイドバーにメール登録フォーム追加
   - テキスト: 「薬剤師向け無料メルマガ登録」
   - 特典: 「薬価改定2026対応チェックリストPDF」

2. **メールサービス選定**
   - 候補: Mailchimp / SendGrid / ConvertKit
   - 基準: 無料枠あり・日本語対応・CSVインポート可

3. **HTMLテンプレート**
```html
<!-- Email CTA Sidebar -->
<div class="email-cta-sidebar" style="background: #f8f9fa; padding: 20px; border-radius: 10px; border: 2px solid #4A90E2;">
  <h3 style="color: #333; font-size: 18px; margin-bottom: 10px;">📧 薬剤師向け無料メルマガ</h3>
  <p style="color: #666; font-size: 14px; margin-bottom: 15px;">薬価改定2026対応チェックリストPDFを無料プレゼント</p>
  <form action="[メールサービスURL]" method="post">
    <input type="email" name="email" placeholder="メールアドレス" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 5px; margin-bottom: 10px;">
    <button type="submit" style="width: 100%; background: #4A90E2; color: white; padding: 12px; border: none; border-radius: 5px; font-weight: bold;">無料登録</button>
  </form>
</div>
```

#### 必要リソース
- メールサービスアカウント作成（ゆうすけ実施）
- 登録フォームURL発行
- 特典PDF作成（副業担当）

### Phase 3: 収益化導線強化（所要: 3-4時間）

#### 実装内容
1. **登録者向け限定コンテンツ**
   - 薬価改定2026対応シート（Excel）
   - 在宅加算最大化チェックリスト（PDF）
   - 業務効率化ロードマップ（PDF）

2. **販売導線への誘導**
   - AIプロンプト集100（販売ページへリンク）
   - Notionテンプレート（販売ページへリンク）

## 実装優先順位

| 優先度 | タスク | 所要 | 担当 | 依存 |
|--------|--------|------|------|------|
| 【高】 | LINE公式アカウント作成 | 30分 | ゆうすけ | なし |
| 【高】 | LINE登録URL発行 | 10分 | ゆうすけ | LINE作成後 |
| 【高】 | 高CTR見込みページ10件にCTA追加 | 1時間 | 副業担当 | LINE URL発行後 |
| 【中】 | メールサービス選定・作成 | 1時間 | ゆうすけ | なし |
| 【中】 | 特典PDF作成 | 1時間 | 副業担当 | なし |
| 【中】 | メール登録フォーム実装 | 1時間 | 副業担当 | メールサービス作成後 |
| 【低】 | 残り76ページへCTA展開 | 2時間 | 副業担当 | Phase1完了後 |

## 期待効果

### アクセス→登録転換率
- LINE登録: 2-5%（訪問者100人→2-5人登録）
- メール登録: 1-3%（訪問者100人→1-3人登録）

### 月間登録者数見込（訪問者1,000人/月想定）
- LINE: 20-50人/月
- メール: 10-30人/月

### 収益化への導線
- 登録者→販売ページ遷移率: 5-10%
- 購買転換率: 1-3%
- 月間売上見込: 5,000-15,000円（AIプロンプト集500円×10-30人）

## 次アクション

1. **ゆうすけへ依頼**:
   - LINE公式アカウント作成
   - LINE登録URL発行
   - メールサービス選定・作成

2. **副業担当実施**:
   - HTMLテンプレート準備完了
   - 高CTR見込みページ10件特定完了
   - 特典PDF構成案作成

## 注意事項

- 通知抑止中のため、本メモは内部整理用
- 対外報告は trainer-2h-regular-report に集約
- ゆうすけ判断待ちタスクは明示的に記載
