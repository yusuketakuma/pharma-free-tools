# GA4イベント計測設定ガイド - 2026-03-08

**作成日時**: 2026-03-08 22:35 JST
**対象**: 無料ツール群・プロモLPのGA4トラッキング

---

## 現状

- 全無料ツール・ポータルサイトにGA4タグ導入済み
- 測定ID: `G-XXXXXXXXXX`（プレースホルダー）
- イベント計測関数: `trackPromptCTA()`, `trackNotionCTA()`, `trackToolUsage()`, `trackCopyAction()`

---

## 設定手順

### 1. GA4プロパティ作成

1. [Google Analytics](https://analytics.google.com/)にアクセス
2. 「管理」→「作成」→「プロパティ」
3. プロパティ名: `副業無料ツール群`
4. タイムゾーン: `日本`
5. 通貨: `日本円（JPY）`

### 2. データストリーム作成

1. 「データストリーム」→「ウェブ」
2. URL: `https://yusuketakuma.github.io`
3. ストリーム名: `GitHub Pages`
4. 測定IDをコピー（例: `G-ABC123XYZ`）

### 3. 測定ID差し替え

以下のリポジトリの`index.html`から`G-XXXXXXXXXX`を实际のIDに置換：

```bash
# 全リポジトリで一括置換
for repo in pharma-drug-price-tool pharma-efficiency-diagnosis pharma-medication-summary pharma-side-effect-checker pharma-prescription-checklist pharma-inquiry-email promo-ai-prompts-lp pharma-free-tools; do
  cd /tmp/$repo
  sed -i '' 's|G-XXXXXXXXXX|G-ABC123XYZ|g' index.html
  git add index.html && git commit -m "Update GA4 measurement ID" && git push origin main
done
```

### 4. イベント計測の確認

GA4管理画面で「リアルタイム」→「イベント」を開き、以下のイベントが計測されているか確認：

| イベント名 | カテゴリ | ラベル | トリガー |
|-----------|---------|--------|---------|
| `cta_click` | monetization | ai_prompts | AIプロンプト集CTAクリック |
| `cta_click` | monetization | notion_template | NotionテンプレートCTAクリック |
| `tool_usage` | engagement | 薬価シミュレーター | 計算ボタンクリック |
| `copy_action` | engagement | patient_explanation | コピー実行 |

### 5. コンバージョン設定

1. GA4管理画面で「イベント」→「イベントを作成」
2. イベント名: `purchase`
3. 条件: `event_name = cta_click AND event_label = ai_prompts`
4. コンバージョンとしてマーク

---

## KPIダッシュボード設定

### 推奨指標

| 指標 | 説明 | 目標（1ヶ月） |
|------|------|-------------|
| ポータルPV | 無料ツールポータルのページビュー | 500 |
| LP流入 | プロモLPへの流入数 | 200 |
| CTAクリック率 | LP内のCTAクリック / LP流入 | 15% |
| 購入転換率 | 購入完了 / LP流入 | 5% |

### カスタムレポート作成

1. 「探索」→「空白」
2. ディメンション: `ページパス`, `イベント名`
3. 指標: `表示回数`, `イベント数`, `ユーザー`
4. フィルタ: `ページパス contains promo-ai-prompts-lp`

---

## 注意点

- GA4は24時間程度でデータが反映される
- リアルタイム表示は最大30分の遅延あり
- コンバージョン設定後は最大24時間で有効化

---

## 次のアクション

1. [ ] GA4プロパティ作成
2. [ ] 測定IDをコピー
3. [ ] 上記bashコマンドで一括置換
4. [ ] 各サイトでイベントが発火することを確認
5. [ ] コンバージョン設定
6. [ ] カスタムレポート作成
