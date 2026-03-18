# GA4 Batch4 実装テンプレート — 2026-03-19

**作成**: sidebiz-worker (00:01 JST 静音モード)
**目的**: Batch4 25ファイルへのGA4追加を高速化するテンプレート集

---

## 1. GA4スクリプト挿入テンプレート（共通）

`</head>` 直前に挿入する共通ブロック。`{SLUG}` をファイル名（.html除去）に置換。

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
        'event_label': '{SLUG}-' + action
      });
    }

    function trackCopyAction() {
      gtag('event', 'copy_action', {
        'event_category': 'engagement',
        'event_label': '{SLUG}-copy'
      });
    }

    function trackPromptCTA() {
      gtag('event', 'cta_click', {
        'event_category': 'monetization',
        'event_label': '{SLUG}-prompt-cta'
      });
    }
  </script>
```

---

## 2. Pythonバッチスクリプト — Step1: チェックリスト12ファイル

```python
#!/usr/bin/env python3
"""GA4 Batch4 Step1: チェックリスト12ファイルへGA4スクリプト挿入"""
import os, re

PORTAL_DIR = "."  # free-tool-portalディレクトリで実行

GA4_TEMPLATE = """  <!-- GA4 -->
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){{dataLayer.push(arguments);}}
    gtag('js', new Date());
    gtag('config', 'G-XXXXXXXXXX');

    function trackToolUsage(action) {{
      gtag('event', 'tool_usage', {{
        'event_category': 'engagement',
        'event_label': '{slug}-' + action
      }});
    }}

    function trackCopyAction() {{
      gtag('event', 'copy_action', {{
        'event_category': 'engagement',
        'event_label': '{slug}-copy'
      }});
    }}

    function trackPromptCTA() {{
      gtag('event', 'cta_click', {{
        'event_category': 'monetization',
        'event_label': '{slug}-prompt-cta'
      }});
    }}
  </script>
"""

CHECKLIST_FILES = [
    "claim-denial-prevention-checklist.html",
    "dementia-elderly-medication-support-checklist.html",
    "designated-abuse-prevention-drugs-checklist.html",
    "dispensing-error-prevention-checklist.html",
    "medication-adherence-improvement-checklist.html",
    "pharmacy-5s-checklist.html",
    "pharmacy-accessibility-checklist.html",
    "pharmacy-billing-checklist.html",
    "pharmacy-emergency-response-checklist.html",
    "pharmacy-quality-management-checklist.html",
    "pharmacy-risk-management-checklist.html",
    "pharmacy-safety-health-management-checklist.html",
]

def insert_ga4(filepath):
    slug = os.path.basename(filepath).replace('.html', '')
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    if 'gtag' in content:
        print(f"  SKIP (already has GA4): {filepath}")
        return False

    ga4_block = GA4_TEMPLATE.format(slug=slug)
    content = content.replace('</head>', ga4_block + '\n  </head>')

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"  OK: {filepath} (slug={slug})")
    return True

count = 0
for fname in CHECKLIST_FILES:
    fpath = os.path.join(PORTAL_DIR, fname)
    if os.path.exists(fpath):
        if insert_ga4(fpath):
            count += 1
    else:
        print(f"  NOT FOUND: {fpath}")

print(f"\nGA4追加完了: {count}/{len(CHECKLIST_FILES)} ファイル")
```

---

## 3. onclickバインディング追記テンプレート — チェックリスト用

チェックリストの共通パターン別マッピング:

| 既存onclick | 追記する tracking | 例 |
|---|---|---|
| `resetChecklist()` / `resetAll()` / `resetForm()` / `resetData()` / `location.reload()` | `trackToolUsage('reset')` | `onclick="resetChecklist(); trackToolUsage('reset')"` |
| `showResult()` / `showResults()` / `calculateScore()` | `trackToolUsage('show-results')` | `onclick="showResult(); trackToolUsage('show-results')"` |
| `exportChecklist()` / `copyResult()` | `trackCopyAction()` | `onclick="exportChecklist(); trackCopyAction()"` |
| `saveChecklist()` / `saveData()` / `saveProgress()` | `trackToolUsage('save')` | `onclick="saveChecklist(); trackToolUsage('save')"` |
| `loadProgress()` | `trackToolUsage('load')` | `onclick="loadProgress(); trackToolUsage('load')"` |
| `window.print()` / `printChecklist()` | `trackToolUsage('print')` | `onclick="window.print(); trackToolUsage('print')"` |
| CTA リンク (href=ai-prompts-lp等) | `trackPromptCTA()` | `onclick="trackPromptCTA()"` |

### Pythonバッチスクリプト — onclickバインディング追加

```python
#!/usr/bin/env python3
"""GA4 Batch4: チェックリスト12ファイル onclick バインディング追加"""
import re, os

ONCLICK_MAP = {
    'resetChecklist()': "trackToolUsage('reset')",
    'resetAll()': "trackToolUsage('reset')",
    'resetForm()': "trackToolUsage('reset')",
    'resetData()': "trackToolUsage('reset')",
    'location.reload()': "trackToolUsage('reset')",
    'showResult()': "trackToolUsage('show-results')",
    'showResults()': "trackToolUsage('show-results')",
    'calculateScore()': "trackToolUsage('show-results')",
    'exportChecklist()': "trackCopyAction()",
    'copyResult()': "trackCopyAction()",
    'saveChecklist()': "trackToolUsage('save')",
    'saveData()': "trackToolUsage('save')",
    'saveProgress()': "trackToolUsage('save')",
    'loadProgress()': "trackToolUsage('load')",
    'window.print()': "trackToolUsage('print')",
    'printChecklist()': "trackToolUsage('print')",
}

def add_onclick_tracking(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    count = 0
    for original, tracking in ONCLICK_MAP.items():
        # Avoid double-adding
        pattern = re.escape(original)
        if tracking in content:
            continue
        # Match onclick="originalFunc()" and append tracking
        old = f'onclick="{original}"'
        new = f'onclick="{original}; {tracking}"'
        if old in content:
            content = content.replace(old, new)
            count += 1
        # Also handle single-quote onclick
        old_sq = f"onclick='{original}'"
        new_sq = f"onclick='{original}; {tracking}'"
        if old_sq in content:
            content = content.replace(old_sq, new_sq)
            count += 1

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"  {os.path.basename(filepath)}: {count} バインディング追加")
    return count

# 対象ファイルリスト（Step1と同一）
CHECKLIST_FILES = [
    "claim-denial-prevention-checklist.html",
    "dementia-elderly-medication-support-checklist.html",
    "designated-abuse-prevention-drugs-checklist.html",
    "dispensing-error-prevention-checklist.html",
    "medication-adherence-improvement-checklist.html",
    "pharmacy-5s-checklist.html",
    "pharmacy-accessibility-checklist.html",
    "pharmacy-billing-checklist.html",
    "pharmacy-emergency-response-checklist.html",
    "pharmacy-quality-management-checklist.html",
    "pharmacy-risk-management-checklist.html",
    "pharmacy-safety-health-management-checklist.html",
]

total = 0
for fname in CHECKLIST_FILES:
    if os.path.exists(fname):
        total += add_onclick_tracking(fname)
print(f"\n合計バインディング追加: {total}")
```

---

## 4. Step2用テンプレート — onclick既存その他ツール（12ファイル）

GA4スクリプト挿入は共通テンプレートと同一。onclickバインディングはファイル個別マッピング:

| ファイル | 既存onclick → 追記tracking |
|---|---|
| antibiotic-stewardship.html | `checkAntibiotic()` → `trackToolUsage('check')`, `copyResult()` → `trackCopyAction()` |
| pharmacy-drug-price-revision-2026.html | `selectOption(this)` → バインディング不要（UI操作）, CTAリンクに `trackPromptCTA()` 追加 |
| pharmacy-dx-assessment.html | `calculateScore()` → `trackToolUsage('show-results')`, `location.reload()` → `trackToolUsage('reset')` |
| pharmacy-ai-readiness.html | `restart()` → `trackToolUsage('reset')`, `nextQuestion()` → `trackToolUsage('next')` |
| pharmacy-rejection-template.html | `showSection(...)` → `trackToolUsage('select-section')`, コピーボタンに `trackCopyAction()` |
| pharmacist-quiz-generator.html | `generateQuiz()` → `trackToolUsage('generate')`, `checkAnswers()` → `trackToolUsage('check')`, `resetQuiz()` → `trackToolUsage('reset')` |
| pharmacy-annual-calendar.html | `addCustomEvent()` → `trackToolUsage('add-event')`, `resetCalendar()` → `trackToolUsage('reset')` |
| pharmacy-revision-2026.html | `restart()` → `trackToolUsage('reset')` |
| ai-medication-history-workflow.html | `toggleCheck(this)` → バインディング不要（多数発火）, CTAリンクに `trackPromptCTA()` |
| severe-patient-ratio-checksheet.html | `addPatient()` → `trackToolUsage('add-patient')` |
| supply-disruption-patient-impact.html | `startDiagnosis()` → `trackToolUsage('start')`, `copyResult()` → `trackCopyAction()`, `location.reload()` → `trackToolUsage('reset')` |

---

## 5. Step3用テンプレート — onclick未存在ファイル（1ファイル）

### pharmacy-medication-history-efficiency.html

- ボタン1個: onclick属性なし → `onclick="trackToolUsage('start')"` を追加
- GA4スクリプトは共通テンプレートで挿入

---

## 6. 動作確認チェックリスト

各ファイル実装後にチェック:

- [ ] `</head>` 直前にGA4スクリプトブロックが正しく挿入されている
- [ ] `G-XXXXXXXXXX` がMeasurement IDプレースホルダーとして設定されている
- [ ] `trackToolUsage()` / `trackCopyAction()` / `trackPromptCTA()` の3関数が定義されている
- [ ] slug名がファイル名と一致している（例: `claim-denial-prevention-checklist`）
- [ ] 既存onclickに `;` 区切りでtracking関数が追記されている
- [ ] 既存onclick処理が壊れていない（セミコロン後のスペース確認）
- [ ] HTMLのクォート統一（onclick内はシングルクォート使用）
- [ ] ブラウザでファイルを開きコンソールエラーなし
- [ ] 関連ツールセクションのCTAリンクに `trackPromptCTA()` が付与されている

---

## 7. 実装完了後の確認スクリプト

```python
#!/usr/bin/env python3
"""GA4 Batch4 完了確認: 全72ファイルのGA4カバレッジチェック"""
import os, glob

portal_dir = "."
html_files = glob.glob(os.path.join(portal_dir, "*.html"))
ga4_count = 0
no_ga4 = []
for f in sorted(html_files):
    if os.path.basename(f) == 'index.html':
        continue
    with open(f, 'r') as fh:
        content = fh.read()
    if 'gtag' in content:
        ga4_count += 1
    else:
        no_ga4.append(os.path.basename(f))

total = len(html_files) - 1  # exclude index.html
print(f"GA4カバレッジ: {ga4_count}/{total} ({ga4_count/total*100:.1f}%)")
if no_ga4:
    print(f"\n未対応ファイル ({len(no_ga4)}件):")
    for f in no_ga4:
        print(f"  - {f}")
else:
    print("\n✅ 全ファイルGA4対応完了!")
```
