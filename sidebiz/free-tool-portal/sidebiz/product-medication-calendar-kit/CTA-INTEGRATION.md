# 服薬カレンダーキット - CTA導線統合ガイド

> 既存21無料ツールへのCTA追加用テキスト

---

## 統一CTAセクション（HTML）

既存の収益化CTAセクションに追加する、服薬カレンダーキット用の導線。

### パターン1: セクション追加（推奨）

```html
<!-- 服薬カレンダーキット CTA -->
<section style="margin-top: 24px; padding: 20px; background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border-radius: 12px; border: 1px solid #86efac;">
  <h4 style="font-size: 1rem; font-weight: 700; margin-bottom: 8px; color: #166534;">🗓️ 服薬カレンダーをWeb公開しませんか？</h4>
  <p style="font-size: 0.9rem; color: #15803d; margin-bottom: 12px;">
    この服薬カレンダーを<strong>あなたのサイト</strong>として公開できるキットです。<br>
    GitHub Pagesで無料ホスティング。サーバー費用¥0。
  </p>
  <a href="[Payhip/Gumroad URL]"
     style="display: inline-block; padding: 10px 20px; background: #16a34a; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 0.9rem;">
    キットを入手する（¥500）→
  </a>
</section>
```

### パターン2: 既存CTA内に追加（省スペース）

```html
<div style="margin-top: 12px; padding: 12px; background: #f0fdf4; border-radius: 8px; border-left: 4px solid #16a34a;">
  <strong style="color: #166534;">🗓️ 服薬カレンダーWeb版キット</strong>
  <span style="font-size: 0.85rem; color: #15803d;">自分のサイトとして公開。¥500</span>
  <a href="[URL]" style="margin-left: 8px; color: #16a34a; font-weight: 600;">詳細→</a>
</div>
```

---

## ツール別おすすめ配置

| ツール | 推奨パターン | 理由 |
|-------|-------------|------|
| G9: 服薬カレンダー生成 | パターン1 | 直接関連・高転換率 |
| G6: 在宅医療報告書生成 | パターン1 | 在宅医療との親和性 |
| G7: 服薬アドヒアランス評価 | パターン2 | 補助的導線 |
| G10: 服薬指導チェックリスト | パターン2 | 補助的導線 |
| G11: 服薬指導シナリオ生成 | パターン2 | 補助的導線 |
| その他17ツール | パターン2 または なし | 関連度低 |

---

## 既存CTAとの統合例

### G9（服薬カレンダー生成）の場合

```html
<!-- 収益化CTA -->
<section style="margin-top: 32px; padding: 24px; background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); border-radius: 16px; border: 1px solid #bfdbfe;">
  <h3 style="font-size: 1.1rem; font-weight: 700; margin-bottom: 12px; color: #1e40af;">🎁 さらに業務を効率化しませんか？</h3>
  
  <div style="display: flex; flex-wrap: wrap; gap: 12px; margin-bottom: 16px;">
    <a href="[AIプロンプト集URL]" style="padding: 12px 20px; background: #3b82f6; color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">
      AIプロンプト集（¥300）
    </a>
    <a href="[NotionテンプレートURL]" style="padding: 12px 20px; background: #8b5cf6; color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">
      Notionテンプレート（¥500）
    </a>
  </div>
  
  <!-- 服薬カレンダーキット（追加） -->
  <div style="margin-top: 16px; padding: 16px; background: #f0fdf4; border-radius: 10px; border: 1px solid #86efac;">
    <h4 style="font-size: 0.95rem; font-weight: 700; margin-bottom: 8px; color: #166534;">🗓️ このカレンダーをWeb公開しませんか？</h4>
    <p style="font-size: 0.85rem; color: #15803d; margin-bottom: 10px;">
      <strong>服薬カレンダー即デプロイキット</strong>で、あなたのサイトとして公開できます。<br>
      GitHub Pagesで無料ホスティング。サーバー費用¥0。
    </p>
    <a href="[キットURL]" style="display: inline-block; padding: 8px 16px; background: #16a34a; color: white; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 0.85rem;">
      キットを入手（¥500）→
    </a>
  </div>
</section>
```

---

## URL プレースホルダー

| 商品 | プレースホルダー | 本番URL（取得後差し替え） |
|------|-----------------|-------------------------|
| AIプロンプト集 | `[AIプロンプト集URL]` | TBD |
| Notionテンプレート | `[NotionテンプレートURL]` | TBD |
| 服薬カレンダーキット | `[キットURL]` | TBD |

---

## 効果測定（GA4）

### イベント定義

```javascript
// キットCTAクリック
gtag('event', 'cta_click', {
  event_category: 'monetization',
  event_label: 'medication-calendar-kit'
});
```

### KPI目標

| 指標 | 初月目標 |
|------|----------|
| CTA表示数 | 21ツール |
| CTAクリック率 | 3% |
| 転換率 | 5% |
| 売上 | ¥5,000 |

---

## 実装手順

1. Payhip/Gumroadで商品ページ作成 → URL取得
2. G9（服薬カレンダー生成）にパターン1を追加
3. G6/G7/G10/G11にパターン2を追加
4. GA4イベント計測コードを追加
5. 効果測定開始

---

## 更新履歴

- 2026-03-08: CTA統合ガイド作成
