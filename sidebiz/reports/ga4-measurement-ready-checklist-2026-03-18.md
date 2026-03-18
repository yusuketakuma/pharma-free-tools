# GA4計測 次回レビュー準備チェックリスト — 2026-03-18 20:30 JST

## 概要

GA4 Measurement IDが実IDに差し替わった際に即座に計測開始できるよう、現状の計測設計をまとめる。

---

## 1. GA4 onclickバインディング カバレッジ確認

### GA4スクリプト設置済みファイル（13/72ファイル = 18%）

| # | ファイル名 | onclick設定 | 種別 |
|---|-----------|------------|------|
| 1 | `ai-prompts-lp.html` | ✅ あり | 販売LP |
| 2 | `doac-dosing.html` | ✅ あり | 診断ツール |
| 3 | `homecare-joint-visit-checklist.html` | － | チェックリスト |
| 4 | `homecare-revenue-simulator.html` | ✅ あり | 計算ツール |
| 5 | `medication-reminder.html` | ✅ あり | リマインダー |
| 6 | `pharmacy-branding-diagnosis.html` | ✅ あり | 診断ツール |
| 7 | `pharmacy-claim-denial-diagnosis.html` | － | 診断ツール |
| 8 | `pharmacy-dispensing-fee-revision-diagnosis.html` | ✅ あり | 診断ツール |
| 9 | `pharmacy-dx-roi-calculator.html` | ✅ あり | 計算ツール |
| 10 | `pharmacy-reorder-point-calculator.html` | ✅ あり | 計算ツール |
| 11 | `pharmacy-revenue-improvement.html` | ✅ あり | 改善ツール |
| 12 | `pharmacy-staff-development.html` | ✅ あり | 診断ツール |
| 13 | `pharmacy-time-visualization.html` | ✅ あり | 可視化ツール |

**サマリー**: 13ファイルにGA4スクリプト設置済み。うち11ファイルにonclickバインディングあり。

---

## 2. 計測設計サマリー

### イベント名・パラメータ規則

| イベント名 | トリガー条件 | パラメータ例 |
|-----------|------------|------------|
| `cta_click` | 外部LP・購入ページへのCTAボタンクリック | `event_category`, `event_label`, `value` |
| `tool_usage` | ツール内主要操作（計算・診断開始・リセット等） | `action` (calculate/save/reset/show-results) |
| `copy_action` | テキストコピーボタンクリック | `event_label` |
| `purchase_click` | 購入ページへの遷移ボタン | `event_category`, `event_label`, `value` |

### イベント命名例（ai-prompts-lp.html）

```javascript
// ヒーローCTA
gtag('event', 'cta_click', {
  'event_category': '100_prompts_lp',
  'event_label': 'hero_cta',
  'value': 500
});

// 購入ボタン
gtag('event', 'purchase_click', {
  'event_category': '100_prompts_lp',
  'event_label': 'payhip_cta',
  'value': 500
});
```

---

## 3. G-XXXXXXXXXX プレースホルダ残存ファイルリスト（要差し替えTODO）

| # | ファイル名 |
|---|-----------|
| 1 | `ai-prompts-lp.html` |
| 2 | `doac-dosing.html` |
| 3 | `homecare-revenue-simulator.html` |
| 4 | `medication-reminder.html` |
| 5 | `pharmacy-branding-diagnosis.html` |
| 6 | `pharmacy-dispensing-fee-revision-diagnosis.html` |
| 7 | `pharmacy-dx-roi-calculator.html` |
| 8 | `pharmacy-reorder-point-calculator.html` |
| 9 | `pharmacy-revenue-improvement.html` |
| 10 | `pharmacy-staff-development.html` |
| 11 | `pharmacy-time-visualization.html` |

**合計: 11ファイル**（全て `/* TODO: Replace G-XXXXXXXXXX with actual Measurement ID */` コメント付き）

---

## 4. Measurement ID差し替え作業チェックリスト

### 前提条件
- [ ] Google Analytics 4でプロパティ作成済み
- [ ] Measurement ID（`G-XXXXXXXXXX` 形式の実ID）を取得済み

### 差し替え手順

**ステップ1: 一括置換コマンド**

```bash
# ワークスペースルートで実行
cd /workspace

# 全HTMLファイルのG-XXXXXXXXXXを実IDに一括置換
REAL_ID="G-XXXXXXXXXX"  # ← 実IDに変更
find . -name "*.html" -exec sed -i "s/G-XXXXXXXXXX/${REAL_ID}/g" {} \;

# 確認（置換後にプレースホルダが残っていないか）
grep -r "G-XXXXXXXXXX" *.html
```

**ステップ2: TODOコメント削除（任意）**

```bash
# TODOコメントを削除
find . -name "*.html" -exec sed -i '/TODO: Replace G-XXXXXXXXXX/d' {} \;
```

**ステップ3: 動作確認**

- [ ] ブラウザDevToolsでネットワークタブを開き `collect` リクエストが飛ぶことを確認
- [ ] GA4リアルタイムレポートでページビューが記録されることを確認
- [ ] CTAボタンクリックで `cta_click` イベントが記録されることを確認

**ステップ4: GitHub Pagesへデプロイ**

```bash
git add *.html
git commit -m "Set GA4 Measurement ID: ${REAL_ID}"
git push origin main
```

### 確認ポイント

- [ ] 11ファイル全てに実IDが設定されているか
- [ ] `G-XXXXXXXXXX` の文字列が残っていないか
- [ ] GA4プロパティの「データストリーム」でドメインが一致しているか（`yusukedev.github.io`）
- [ ] GA4リアルタイムレポートでイベントが計測されているか

---

## 5. 次回Measurement ID取得後の優先対応ファイル

計測効果が最も高いファイルの差し替え優先順位:

| 優先度 | ファイル | 理由 |
|--------|---------|------|
| 🔴 最優先 | `ai-prompts-lp.html` | 販売LP・収益直結 |
| 🔴 最優先 | `homecare-revenue-simulator.html` | 高価値CTAあり |
| 🟡 高 | `pharmacy-staff-development.html` | 利用率高い診断ツール |
| 🟡 高 | `pharmacy-time-visualization.html` | onclick多数 |
| 🟢 通常 | 残り7ファイル | 一括置換で対応 |

---

## 保留理由

GA4 Measurement IDのプレースホルダが残っている理由: ゆうすけのGoogleアカウントでGA4プロパティを作成し、実IDを発行する必要がある。現在のコードは全て準備完了状態。
