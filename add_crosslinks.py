#!/usr/bin/env python3
"""
Add cross-link sections to pharmacy tool HTML files.
"""

import os
import re

WORKSPACE_DIR = "/sessions/vibrant-sleepy-faraday/mnt/.openclaw/workspace/"

# Configuration: file -> (title, related_tools)
TOOLS_CONFIG = {
    "antibiotic-stewardship.html": {
        "title": "抗菌薬適正使用チェック",
        "related": [
            ("doac-dosing.html", "DOAC用量適正化チェック"),
            ("drug-induced-ade-checklist.html", "薬剤性有害事象チェックリスト"),
            ("polypharmacy-assessment.html", "ポリファーマシー評価"),
        ]
    },
    "claim-denial-reduction-simulator.html": {
        "title": "請求返戣削減シミュレーター",
        "related": [
            ("pharmacy-claim-denial-diagnosis.html", "請求返戣診断"),
            ("pharmacy-billing-checklist.html", "薬局請求チェックリスト"),
            ("pharmacy-revenue-improvement.html", "薬局収益改善"),
        ]
    },
    "doac-dosing.html": {
        "title": "DOAC用量適正化チェック",
        "related": [
            ("renal-drug-dosing.html", "腎機能別用量調整計算ツール"),
            ("antibiotic-stewardship.html", "抗菌薬適正使用チェック"),
            ("polypharmacy-assessment.html", "ポリファーマシー評価"),
        ]
    },
    "pharmacy-automation-roi.html": {
        "title": "業務自動化ROI診断",
        "related": [
            ("pharmacy-dx-roi-calculator.html", "薬局DX ROI計算機"),
            ("pharmacy-dx-assessment.html", "薬局DX評価"),
            ("pharmacy-bottleneck-diagnosis.html", "薬局業務ボトルネック診断"),
        ]
    },
    "pharmacy-bottleneck-diagnosis.html": {
        "title": "薬局業務ボトルネック診断",
        "related": [
            ("pharmacy-dispensing-time-diagnosis.html", "調剤時間診断"),
            ("pharmacy-time-study-diagnosis.html", "薬局タイムスタディ診断"),
            ("pharmacy-automation-roi.html", "業務自動化ROI診断"),
        ]
    },
    "pharmacy-drug-price-revision-2026.html": {
        "title": "2026薬価改定チェックリスト",
        "related": [
            ("pharmacy-dispensing-fee-revision-diagnosis.html", "調剤報酬改定診断"),
            ("pharmacy-revision-2026.html", "2026年改定対策"),
            ("generic-drug-switch-revenue-checklist.html", "後発医薬品切替え収益チェック"),
        ]
    },
    "pharmacy-medication-history-efficiency.html": {
        "title": "薬歴作成効率化診断",
        "related": [
            ("medication-history-time-saving-checklist.html", "薬歴作成時間短縮チェック"),
            ("pharmacy-dispensing-time-diagnosis.html", "調剤時間診断"),
            ("pharmacy-followup-efficiency.html", "薬局フォローアップ効率化"),
        ]
    },
    "pharmacy-patient-communication.html": {
        "title": "薬局患者対応診断",
        "related": [
            ("patient-informed-consent-checklist.html", "患者インフォームドコンセント"),
            ("medication-adherence-improvement-checklist.html", "服薬アドヒアランス改善"),
            ("pharmacy-followup-efficiency.html", "薬局フォローアップ効率化"),
        ]
    },
    "renal-drug-dosing.html": {
        "title": "腎機能別用量調整計算ツール",
        "related": [
            ("doac-dosing.html", "DOAC用量適正化チェック"),
            ("polypharmacy-assessment.html", "ポリファーマシー評価"),
            ("drug-induced-ade-checklist.html", "薬剤性有害事象チェックリスト"),
        ]
    },
}

CROSSLINK_TEMPLATE = '''<div class="related-tools" style="margin-top: 24px; padding: 20px; background: #f0f9ff; border-radius: 12px;">
  <h3 style="color: #1e40af; margin-bottom: 12px; font-size: 16px;">📦 関連ツール</h3>
  <ul style="list-style: none; display: grid; gap: 8px;">
{links}
    <li><a href="index.html" style="color: #2563eb; text-decoration: none;">→ 全ツール一覧を見る</a></li>
  </ul>
</div>'''

def generate_links(related_tools):
    """Generate link HTML lines."""
    links = []
    for html_file, title in related_tools:
        links.append(f'    <li><a href="{html_file}" style="color: #2563eb; text-decoration: none;">→ {title}</a></li>')
    return '\n'.join(links)

def find_insertion_point(content):
    """
    Find the best insertion point.
    Look for the closing </div> of the container, before </div>\n  </div>\n  <footer
    or before the last <script> tag.
    """
    # Pattern 1: Look for </div> that closes the main container (before footer)
    # Typically: </div>\n    </div>\n    <footer
    pattern1 = r'(</div>)\s*\n\s*<footer'
    match = re.search(pattern1, content)
    if match:
        return match.start(1)  # Position of the closing </div>

    # Pattern 2: Look for last </div> before </body>
    pattern2 = r'(</div>)\s*\n\s*</body>'
    match = re.search(pattern2, content)
    if match:
        return match.start(1)

    # Pattern 3: Look for the last occurrence of </div> before any closing script tag
    pattern3 = r'(</div>)\s*\n\s*<script'
    match = re.search(pattern3, content)
    if match:
        return match.start(1)

    # Fallback: Find the last </div> before </body>
    last_div = content.rfind('</div>')
    if last_div != -1:
        return last_div

    return -1

def add_crosslinks_to_file(filepath, config):
    """Add cross-link section to a single file."""
    print(f"Processing: {filepath}")

    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception as e:
        print(f"  ERROR reading file: {e}")
        return False

    # Generate the crosslink HTML
    links_html = generate_links(config['related'])
    crosslink_section = CROSSLINK_TEMPLATE.format(links=links_html)

    # Find insertion point
    insert_pos = find_insertion_point(content)
    if insert_pos == -1:
        print(f"  ERROR: Could not find insertion point")
        return False

    # Insert the crosslink section
    new_content = content[:insert_pos] + crosslink_section + '\n    ' + content[insert_pos:]

    # Write back
    try:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"  ✓ Successfully added cross-links")
        return True
    except Exception as e:
        print(f"  ERROR writing file: {e}")
        return False

def main():
    """Process all configured files."""
    success_count = 0
    fail_count = 0

    for filename, config in TOOLS_CONFIG.items():
        filepath = os.path.join(WORKSPACE_DIR, filename)
        if not os.path.exists(filepath):
            print(f"SKIP: {filename} (file not found)")
            fail_count += 1
            continue

        if add_crosslinks_to_file(filepath, config):
            success_count += 1
        else:
            fail_count += 1

    print(f"\n{'='*50}")
    print(f"Summary: {success_count} successful, {fail_count} failed")
    print(f"{'='*50}")

if __name__ == '__main__':
    main()
