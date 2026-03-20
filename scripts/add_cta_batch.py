#!/usr/bin/env python3
from pathlib import Path

ROOT = Path('/Users/yusuke/.openclaw/workspace')
patterns = ['cta-button', 'お問い合わせ', 'お申し込み', '購入する', '詳細を見る']

def has_cta(text: str) -> bool:
    return any(p in text for p in patterns)

inserted = []
skipped = []
errors = []

for path in sorted(ROOT.glob('*.html')):
    text = path.read_text(encoding='utf-8')
    if has_cta(text):
        skipped.append(path.name)
        continue
    if '</body>' not in text:
        errors.append((path.name, 'missing </body>'))
        continue

    slug = path.stem
    cta = f'''
  <!-- CTA Section -->
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 24px; border-radius: 12px; margin: 32px 0; text-align: center;">
    <h3 style="margin: 0 0 12px 0; font-size: 1.2em;">🎯 業務効率化をもっと進める</h3>
    <p style="margin: 0 0 16px 0; opacity: 0.9;">薬剤師向けAIプロンプト集で、調剤・鑑別・在宅業務の時短パターンをすぐ使えます</p>
    <a href="ai-prompts-lp.html" onclick="gtag('event', 'cta_click', {{'event_category': 'conversion', 'event_label': '{slug}-cta'}})" style="display: inline-block; background: white; color: #667eea; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">詳細を見る →</a>
  </div>
'''
    new_text = text.replace('</body>', cta + '\n</body>', 1)
    path.write_text(new_text, encoding='utf-8')
    inserted.append(path.name)

print(f'INSERTED={len(inserted)}')
for name in inserted:
    print(name)
print(f'SKIPPED={len(skipped)}')
print(f'ERRORS={len(errors)}')
for name, reason in errors:
    print(f'ERROR {name}: {reason}')
