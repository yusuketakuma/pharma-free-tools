# ai-prompts-lp.html サンプルプロンプトセクション追加レポート

**作成日**: 2026-03-18 21:15 JST

---

## 変更サマリー

### 追加セクション

`<section class="sample-prompts" id="sample-prompts">` — CTAセクション直前に配置

### UI構成

- **タブ切り替え**: 3タブ（💊 服薬指導 / 🏠 在宅業務 / 📋 調剤報酬算定）
- **プロンプトカード**: 各タブ5枚 × 3タブ = 15枚
  - タイトル（紫色）
  - 用途（グレー1行テキスト）
  - プロンプト本文（ダークテーマpre: #1e1e2e背景・#cdd6f4テキスト）
  - 期待出力例（左ボーダー付きボックス）
- **サマリーグリッド**: 3カラム（各領域の収録数＋ハイライト3点）
- **誘導CTA**: 「残り85本はご購入後すぐにお使いいただけます」

### CSS追加（約120行）

- `.sample-prompts` セクション全体
- `.tab-buttons` / `.tab-btn` / `.tab-btn.active`
- `.tab-panel` / `.tab-panel.active`
- `.prompt-card` / `.prompt-card h4` / `.prompt-card pre` / `.prompt-card .expected`
- `.sample-summary` / `.summary-grid` / `.summary-col`
- モバイル対応（@media max-width: 600px）

### JavaScript追加

- `switchTab(tabName)` 関数（タブパネル・ボタンのactive切り替え）

### GA4イベント

- タブボタンクリック時: `gtag('event', 'sample_tab_click', {'tab_name': '...'})` を発火

---

## 期待効果

- LP滞在時間の延長（タブ操作による回遊）
- 購買転換率向上（実際のプロンプト品質を確認→購入動機強化）
- GA4 `sample_tab_click` でタブ別の関心領域を可視化

---

*本レポートは sidebiz-worker の優先度1タスクとして作成*
