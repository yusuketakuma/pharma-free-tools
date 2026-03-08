#!/usr/bin/env python3
import os
import glob

portal_link = '''            <!-- ポータルサイト -->
            <div style="text-align: center; margin: 24px 0;">
                <a href="https://yusuketakuma.github.io/pharma-free-tools/" target="_blank" style="display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: white; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 0.95rem; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);">🏠 全ツール一覧（ポータルサイト）</a>
            </div>

'''

# free-tool-*ディレクトリのindex.htmlを処理
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
    
    # パターン1: links-title
    if '<div class="links-title">🔗 その他の無料ツール</div>' in content:
        content = content.replace(
            '<div class="links-title">🔗 その他の無料ツール</div>',
            portal_link + '<div class="links-title">🔗 その他の無料ツール</div>'
        )
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated (pattern1): {dir_path}")
        continue
    
    # パターン2: 🔧 その他の無料ツール（全22種）
    if '🔧 その他の無料ツール（全22種）' in content:
        content = content.replace(
            '<h3 style="font-size: 0.9rem; font-weight: 600; margin-bottom: 12px; color: #4b5563;">🔧 その他の無料ツール（全22種）</h3>',
            portal_link.replace('links-title', 'section-title') + '<h3 style="font-size: 0.9rem; font-weight: 600; margin-bottom: 12px; color: #4b5563;">🔧 その他の無料ツール（全22種）</h3>'
        )
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated (pattern2): {dir_path}")
        continue
    
    # パターン3: 🔧 その他の無料ツール（全24種）
    if '🔧 その他の無料ツール（全24種）' in content:
        content = content.replace(
            '<h3 style="font-size: 0.9rem; font-weight: 600; margin-bottom: 12px; color: #4b5563;">🔧 その他の無料ツール（全24種）</h3>',
            portal_link.replace('links-title', 'section-title') + '<h3 style="font-size: 0.9rem; font-weight: 600; margin-bottom: 12px; color: #4b5563;">🔧 その他の無料ツール（全24種）</h3>'
        )
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated (pattern3): {dir_path}")
        continue
    
    print(f"No pattern match: {dir_path}")

print("\nDone!")
