# GA4イベント計測コードテンプレート

## 概要
無料Webツール（G1-G21）の収益導線CTAクリックを追跡するためのGA4イベント計測コード。

## 測定ID設定
```html
<!-- Google tag (gtag.js) - 測定IDを差し替えてください -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');
</script>
```

## イベント定義

### 1. CTAクリックイベント
```javascript
// AIプロンプト集CTAクリック
function trackPromptCTA() {
  gtag('event', 'cta_click', {
    'event_category': 'monetization',
    'event_label': 'ai_prompts',
    'product_name': 'AIプロンプト集',
    'price': 300
  });
}

// NotionテンプレートCTAクリック
function trackNotionCTA() {
  gtag('event', 'cta_click', {
    'event_category': 'monetization',
    'event_label': 'notion_template',
    'product_name': 'Notionテンプレート',
    'price': 500
  });
}
```

### 2. ツール利用イベント
```javascript
// 計算実行・生成実行
function trackToolUsage(toolName, actionType) {
  gtag('event', 'tool_usage', {
    'event_category': 'engagement',
    'event_label': toolName,
    'action_type': actionType  // 'calculate', 'generate', 'copy', etc.
  });
}
```

### 3. コピー機能利用イベント
```javascript
function trackCopyAction(contentType) {
  gtag('event', 'copy_action', {
    'event_category': 'engagement',
    'event_label': contentType  // 'patient_explanation', 'checklist', etc.
  });
}
```

## HTML適用例

### CTAボタンへの適用
```html
<!-- Before -->
<a href="#" class="cta-button">AIプロンプト集を入手</a>

<!-- After -->
<a href="#" class="cta-button" onclick="trackPromptCTA()">AIプロンプト集を入手</a>
```

### 計算ボタンへの適用
```html
<!-- Before -->
<button onclick="calculate()">計算する</button>

<!-- After -->
<button onclick="calculate(); trackToolUsage('薬価シミュレーター', 'calculate');">計算する</button>
```

### コピーボタンへの適用
```html
<!-- Before -->
<button onclick="copyResult()">コピー</button>

<!-- After -->
<button onclick="copyResult(); trackCopyAction('patient_explanation');">コピー</button>
```

## KPI目標

| 指標 | 現状 | 1ヶ月後目標 |
|------|------|-------------|
| CTAクリック計測 | 未実装 | 21ツール |
| CTAクリック率 | - | 5% |
| ツール利用率 | - | 50% |

## 測定ID取得手順（ユーザー作業）

1. Google Analytics 4 (GA4)にログイン
2. 管理画面 → データストリーム → ウェブ
3. 新規ストリーム追加または既存ストリーム選択
4. 測定ID（G-XXXXXXXXXX）をコピー
5. 各ツールの`G-XXXXXXXXXX`を実際のIDに差し替え

## 収益性 / 再現性

- **収益性**: CTA効果の可視化 → データドリブンな改善 → 転換率向上
- **再現性**: テンプレートベースで全21ツールに適用可能

## 次のステップ

- [ ] ユーザーがGA4測定IDを取得
- [ ] テンプレートを全21ツールに適用
- [ ] GA4ダッシュボードでKPI確認
