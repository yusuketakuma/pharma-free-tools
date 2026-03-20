#!/usr/bin/env python3
"""旧形式CTA重複の除去。
class="cta-section" 付きが存在するファイルでは、旧形式（classなし）の CTA Section ブロックを削除する。
"""
from pathlib import Path
import re

ROOT = Path('/Users/yusuke/.openclaw/workspace')

old_cta_pattern = re.compile(
    r'\n?\s*<!-- CTA Section -->\s*\n'
    r'\s*<div style="background: linear-gradient\(135deg, #667eea 0%, #764ba2 100%\); color: white; padding: 24px; border-radius: 12px; margin: 32px 0; text-align: center;">\s*\n'
    r'\s*<h3 style="margin: 0 0 12px 0; font-size: 1\.2em;">🎯 業務効率化をもっと進める</h3>\s*\n'
    r'\s*<p style="margin: 0 0 16px 0; opacity: 0\.9;">.*?</p>\s*\n'
    r'\s*<a href="ai-prompts-lp\.html" onclick="gtag\(\'event\', \'cta_click\', \{\'event_category\': \'conversion\', \'event_label\': \'[^\']+-cta\'\}\)" style="display: inline-block; background: white; color: #667eea; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">詳細を見る →</a>\s*\n'
    r'\s*</div>\s*\n?',
    re.DOTALL,
)

updated = []
unchanged = []

for path in sorted(ROOT.glob('*.html')):
    text = path.read_text(encoding='utf-8')
    if 'class="cta-section"' not in text:
        unchanged.append(path.name)
        continue
    original = text
    # class付きブロックを保つため、classなし旧形式のみ削除
    text = old_cta_pattern.sub('\n', text)
    # 余分な改行を軽く整形
    text = re.sub(r'\n{4,}', '\n\n\n', text)
    if text != original:
        path.write_text(text, encoding='utf-8')
        updated.append(path.name)
    else:
        unchanged.append(path.name)

print(f'UPDATED={len(updated)}')
for name in updated:
    print(name)
print(f'UNCHANGED={len(unchanged)}')
