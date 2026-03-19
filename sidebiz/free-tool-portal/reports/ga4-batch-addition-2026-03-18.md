# GA4スクリプト一括追加レポート

**実施日時**: 2026-03-18 20:47 JST
**担当**: sidebiz-worker

---

## 概要

dispatch.md 優先度1の指示に基づき、GA4スクリプトを13ファイルに追加（うち2ファイルは既設置済みのためスキップ）。

---

## 追加対象ファイル一覧

| ファイル名 | 処理結果 | 備考 |
|---|---|---|
| pharmacy-patient-communication.html | ✅ 追加完了 | |
| pharmacy-safety-diagnosis.html | ✅ 追加完了 | |
| pharmacy-ict-diagnosis.html | ✅ 追加完了 | |
| pharmacy-time-study-diagnosis.html | ✅ 追加完了 | |
| pharmacy-revenue-improvement.html | ⏭ スキップ | GA4既設置済み（6ヒット） |
| pharmacy-automation-roi.html | ✅ 追加完了 | |
| pharmacy-dx-roi-calculator.html | ⏭ スキップ | GA4既設置済み（12ヒット） |
| pharmacy-dx-roadmap.html | ✅ 追加完了 | |
| antihypertensive-selector.html | ✅ 追加完了 | |
| renal-drug-dosing.html | ✅ 追加完了 | |
| pharmacy-cashflow-diagnosis.html | ✅ 追加完了 | |
| pharmacy-bottleneck-diagnosis.html | ✅ 追加完了 | |
| pharmacy-priority-scoring.html | ✅ 追加完了 | |

**追加完了**: 11ファイル / スキップ: 2ファイル

---

## 追加したGA4スクリプト内容

各ファイルの `</head>` 直前に以下のスクリプトブロックを挿入：

```html
<!-- GA4 -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXXXX');

  function trackToolUsage(action) {
    gtag('event', 'tool_usage', {
      'event_category': 'engagement',
      'event_label': '{ファイル名スラッグ}-' + action
    });
  }

  function trackCopyAction() {
    gtag('event', 'copy_action', {
      'event_category': 'engagement',
      'event_label': '{ファイル名スラッグ}-copy'
    });
  }

  function trackPromptCTA() {
    gtag('event', 'cta_click', {
      'event_category': 'monetization',
      'event_label': '{ファイル名スラッグ}-prompt-cta'
    });
  }
</script>
```

イベント命名規則は `ga4-measurement-ready-checklist-2026-03-18.md` に準拠。

---

## GA4カバレッジ更新（推定）

| 指標 | 前回 | 今回 |
|---|---|---|
| GA4設置ファイル数 | 13 | 24（+11） |
| 全ファイル数 | 72 | 72 |
| カバレッジ | 18% | 33% |

---

## 次のステップ

- **G-XXXXXXXXXX の実ID差し替え**: ゆうすけの GA4 Measurement ID を確認後、一括sed置換で対応
  ```bash
  sed -i 's/G-XXXXXXXXXX/G-実際のID/g' /workspace/*.html
  ```
- 追加11ファイルへの `trackToolUsage()` / `trackCopyAction()` 呼び出し箇所の実装（各ファイルのボタン・CTA要素に `onclick` を追加）
