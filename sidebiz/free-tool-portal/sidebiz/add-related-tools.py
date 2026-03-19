#!/usr/bin/env python3
"""
関連ツール推薦セクションを全無料ツールに追加するスクリプト
"""

import os
import re

# カテゴリ定義
CATEGORIES = {
    "drug-safety": {
        "name": "薬剤確認・安全",
        "tools": [
            ("free-tool-drug-interaction", "併用禁忌チェック", "併用禁忌・相互作用を即座に確認"),
            ("free-tool-side-effect-checker", "副作用チェッカー", "副作用の早期発見・評価"),
            ("free-tool-similar-drug-check", "類似薬チェッカー", "後発品・類似薬の比較"),
            ("free-tool-renal-dose", "腎機能別用量調整", "eGFRベースの用量計算"),
        ]
    },
    "dispensing": {
        "name": "調剤・計算",
        "tools": [
            ("free-tool-drug-price", "薬価シミュレーター", "処方変更の薬価比較"),
            ("free-tool-fee-calculator", "調剤報酬計算", "調剤報酬の自動計算"),
            ("free-tool-prescription-screening", "処方鑑別支援", "疑義照会の効率化"),
        ]
    },
    "patient-care": {
        "name": "服薬指導・患者対応",
        "tools": [
            ("free-tool-patient-explanation", "患者説明文生成", "分かりやすい説明文を自動生成"),
            ("free-tool-medication-guidance", "服薬指導プラン", "個別化した指導プラン作成"),
            ("free-tool-medication-guidance-scenario", "指導シナリオ", "患者タイプ別の指導シナリオ"),
            ("free-tool-adherence-check", "アドヒアランス評価", "服薬遵守状況の評価"),
            ("free-tool-inquiry-email", "問い合わせメール", "医療機関へのメール作成"),
        ]
    },
    "homecare": {
        "name": "在宅医療",
        "tools": [
            ("free-tool-homecare-report", "在宅報告書作成", "訪問薬剤管理報告書"),
            ("free-tool-homecare-record", "在宅記録支援", "訪問時の簡易記録"),
            ("free-tool-homecare-scheduler", "訪問スケジュール", "在宅訪問の計画作成"),
            ("free-tool-bringing-medicine", "持参薬確認", "持参薬の確認・整理"),
        ]
    },
    "documentation": {
        "name": "薬歴・記録",
        "tools": [
            ("free-tool-medication-history", "薬歴入力支援", "薬歴の効率的な入力"),
            ("free-tool-medication-summary", "服薬サマリー", "お薬まとめシート作成"),
            ("free-tool-medication-reminder", "服薬リマインダー", "服薬時間の通知設定"),
            ("free-tool-medication-calendar", "服薬カレンダー", "服薬スケジュールの可視化"),
            ("free-tool-di-query", "DIクエリ生成", "DI問い合わせの効率化"),
        ]
    },
    "efficiency": {
        "name": "業務効率・管理",
        "tools": [
            ("free-tool-pharmacist-efficiency-diagnosis-v2", "業務効率化診断", "業務改善の優先順位を提示"),
            ("free-tool-prescription-checklist", "処方チェックリスト", "確認漏れ防止のチェックリスト"),
            ("free-tool-polypharmacy", "ポリファーマシー評価", "多剤併用のリスク評価"),
            ("free-tool-inventory-alert", "在庫アラート設定", "欠品防止のアラート設定"),
        ]
    },
}

# ツール→カテゴリのマッピングを作成
TOOL_TO_CATEGORY = {}
for cat_key, cat_data in CATEGORIES.items():
    for tool_dir, _, _ in cat_data["tools"]:
        TOOL_TO_CATEGORY[tool_dir] = cat_key

def get_related_tools(tool_dir, max_count=4):
    """関連ツールのリストを取得（自分を除外）"""
    if tool_dir not in TOOL_TO_CATEGORY:
        return []
    
    cat_key = TOOL_TO_CATEGORY[tool_dir]
    cat_data = CATEGORIES[cat_key]
    
    related = []
    for t_dir, t_name, t_desc in cat_data["tools"]:
        if t_dir != tool_dir:
            related.append((t_dir, t_name, t_desc))
        if len(related) >= max_count:
            break
    
    return related

def generate_related_section(tool_dir):
    """関連ツールセクションのHTMLを生成"""
    related = get_related_tools(tool_dir)
    
    if not related:
        return ""
    
    html = '''
    <section class="related-tools" style="margin: 2rem 0; padding: 1.5rem; background: #f8f9fa; border-radius: 8px;">
        <h3 style="margin-top: 0; color: #333;">📌 関連ツール</h3>
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
'''
    
    for t_dir, t_name, t_desc in related:
        html += f'''
            <a href="https://yusuketakuma.github.io/{t_dir}/" 
               style="display: block; padding: 1rem; background: white; border-radius: 6px; text-decoration: none; border: 1px solid #e0e0e0; transition: all 0.2s;"
               onmouseover="this.style.borderColor='#4a90d9'; this.style.transform='translateY(-2px)';"
               onmouseout="this.style.borderColor='#e0e0e0'; this.style.transform='translateY(0)';">
                <div style="font-weight: bold; color: #4a90d9; margin-bottom: 0.25rem;">{t_name}</div>
                <div style="font-size: 0.85rem; color: #666;">{t_desc}</div>
            </a>
'''
    
    html += '''        </div>
    </section>
'''
    
    return html

def process_file(file_path, tool_dir):
    """HTMLファイルに関連ツールセクションを追加"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 既存の関連ツールセクションを確認
    if 'class="related-tools"' in content:
        print(f"  [SKIP] 既存セクションあり: {tool_dir}")
        return False
    
    # ポータルサイトはスキップ
    if tool_dir == "free-tool-portal":
        print(f"  [SKIP] ポータルサイト: {tool_dir}")
        return False
    
    related_html = generate_related_section(tool_dir)
    
    if not related_html:
        print(f"  [SKIP] 関連ツールなし: {tool_dir}")
        return False
    
    # CTAセクションの前に挿入
    cta_pattern = r'(<section[^>]*class="cta"[^>]*>)'
    portal_pattern = r'(<section[^>]*class="portal-link"[^>]*>)'
    
    if re.search(cta_pattern, content):
        content = re.sub(cta_pattern, related_html + r'\n\1', content, count=1)
        insert_pos = "CTA前"
    elif re.search(portal_pattern, content):
        content = re.sub(portal_pattern, related_html + r'\n\1', content, count=1)
        insert_pos = "ポータルリンク前"
    else:
        # </main>の前に挿入
        content = re.sub(r'(</main>)', related_html + r'\n\1', content)
        insert_pos = "</main>前"
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"  [ADD] {tool_dir} ({insert_pos})")
    return True

def main():
    base_dir = "/Users/yusuke/.openclaw/workspace/sidebiz"
    
    # 全ツールディレクトリを処理
    added_count = 0
    for tool_dir in os.listdir(base_dir):
        if not tool_dir.startswith("free-tool-"):
            continue
        
        index_path = os.path.join(base_dir, tool_dir, "index.html")
        if os.path.exists(index_path):
            if process_file(index_path, tool_dir):
                added_count += 1
    
    print(f"\n完了: {added_count}ツールに関連ツールセクションを追加")

if __name__ == "__main__":
    main()
