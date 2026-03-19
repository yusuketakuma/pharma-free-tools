#!/usr/bin/env python3
"""Add OGP/Twitter Card to high-value tools (batch 2)"""

import re

files = [
    "claim-denial-prevention-checklist.html",
    "claim-denial-reduction-simulator.html",
    "dementia-elderly-medication-support-checklist.html",
    "designated-abuse-prevention-drugs-checklist.html",
    "dispensing-error-prevention-checklist.html",
    "e-prescription-migration-checklist.html",
    "emergency-disaster-response-checklist.html",
    "generic-drug-switch-revenue-checklist.html",
    "graceful-period-drug-switch-checklist.html",
    "graceful-period-patient-followup-checklist.html"
]

ogp_template = '''    <meta property="og:title" content="{title}">
    <meta property="og:description" content="薬剤師・薬局向け無料ツール - {title}">
    <meta property="og:type" content="website">
    <meta property="og:url" content="https://yusuketakuma.github.io/pharma-free-tools/{filename}">
    <meta property="og:image" content="https://yusuketakuma.github.io/pharma-free-tools/ogp.png">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="{title}">
    <meta name="twitter:description" content="薬剤師・薬局向け無料ツール - {title}">
    <meta name="twitter:image" content="https://yusuketakuma.github.io/pharma-free-tools/ogp.png">'''

def get_title(content):
    match = re.search(r'<title>([^<]+)</title>', content)
    if match:
        return match.group(1).replace(' - 薬剤師向け無料ツール集', '').strip()
    return "薬剤師向けツール"

for filename in files:
    try:
        with open(filename, 'r', encoding='utf-8') as f:
            content = f.read()
        
        if 'og:image' in content:
            print(f"SKIP: {filename} (already has OGP)")
            continue
        
        title = get_title(content)
        ogp = ogp_template.format(
            title=title,
            filename=filename
        )
        
        # Insert after <meta charset>
        if '<meta charset="UTF-8">' in content:
            content = content.replace(
                '<meta charset="UTF-8">',
                '<meta charset="UTF-8">\n' + ogp
            )
        elif '<meta charset="utf-8">' in content:
            content = content.replace(
                '<meta charset="utf-8">',
                '<meta charset="utf-8">\n' + ogp
            )
        else:
            print(f"SKIP: {filename} (no charset meta)")
            continue
        
        with open(filename, 'w', encoding='utf-8') as f:
            f.write(content)
        
        print(f"OK: {filename}")
    except Exception as e:
        print(f"ERROR: {filename} - {e}")

print("\nDone!")
