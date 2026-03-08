#!/usr/bin/env python3
import os
import glob
import re

portal_link = '''            <!-- ポータルサイト -->
            <div style="text-align: center; margin: 24px 0;">
                <a href="https://yusuketakuma.github.io/pharma-free-tools/" target="_blank" style="display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 0.95rem; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);">🏠 全ツール一覧（ポータルサイト）</a>
            </div>

'''

# 追加パターン
patterns = [
    ('<p class="tools-title">🔗 その他の無料ツール</p>', '<!-- patient-explanation -->'),
    ('<div class="section-title">🔗 他の無料ツール</div>', '<!-- medication-guidance-scenario -->'),
    ('<h3>🔗 関連無料ツール</h3>', '<!-- medication-guidance -->'),
    ('<!-- 他の無料ツールへのリンク -->', '<!-- pharmacist-efficiency-diagnosis-v2 -->'),
]

for dir_path in glob.glob('free-tool-*/'):
    file_path = os.path.join(dir_path, 'index.html')
    if not os.path.exists(file_path):
        continue
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 既にポータルリンクがある場合はスキップ
    if 'pharma-free-tools' in content:
        print(f"Skip (exists): {dir_path}")
        continue
    
    updated = False
    for pattern, comment in patterns:
        if pattern in content:
            content = content.replace(pattern, portal_link + pattern)
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"Updated {comment}: {dir_path}")
            updated = True
            break
    
    if not updated:
        # その他のパターンを探す
        if '無料ツール' in content:
            # 「無料ツール」を含む行を探して、その前に挿入
            lines = content.split('\n')
            for i, line in enumerate(lines):
                if '🔗' in line and '無料ツール' in line:
                    # この行の前にポータルリンクを挿入
                    lines.insert(i, portal_link.strip())
                    with open(file_path, 'w', encoding='utf-8') as f:
                        f.write('\n'.join(lines))
                    print(f"Updated (fallback): {dir_path}")
                    updated = True
                    break
        
        if not updated:
            print(f"No pattern: {dir_path}")

print("\nDone!")
