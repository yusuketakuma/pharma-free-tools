#!/bin/bash
# CTA一括追加スクリプト（改良版）
# 対象: cta-button等のCTAキーワードを含まないHTMLファイル

set -e

WORKSPACE_DIR="$(dirname "$0")/.."
cd "$WORKSPACE_DIR"

count=0
failed=0

# CTA未設置ファイルを特定
files=$(grep -L "cta-button\|お問い合わせ\|お申し込み\|購入する\|詳細を見る" *.html 2>/dev/null || true)

if [ -z "$files" ]; then
    echo "✓ すべてのファイルにCTAが設置済みです"
    exit 0
fi

echo "=== CTA一括追加 ==="
echo "対象ファイル数: $(echo "$files" | wc -l | tr -d ' ')"
echo ""

for f in $files; do
    filename=$(basename "$f" .html)
    
    # CTAスニペット（ファイル名を埋め込み）
    cta_snippet="
  <!-- CTA Section -->
  <div style=\"background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 24px; border-radius: 12px; margin: 32px 0; text-align: center;\">
    <h3 style=\"margin: 0 0 12px 0; font-size: 1.2em;\">🎯 業務効率化をもっと進める</h3>
    <p style=\"margin: 0 0 16px 0; opacity: 0.9;\">薬剤師向けAIプロンプト集で、調剤・鑑別・在宅業務を自動化</p>
    <a href=\"ai-prompts-lp.html\" onclick=\"gtag('event', 'cta_click', {'event_category': 'conversion', 'event_label': '${filename}-cta'})\" style=\"display: inline-block; background: white; color: #667eea; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;\">詳細を見る →</a>
  </div>
"
    
    # </body>の前にCTAを挿入
    if grep -q "</body>" "$f"; then
        # macOS互換: awkで挿入
        awk -v cta="$cta_snippet" '
        /<\/body>/ {
            print cta
        }
        { print }
        ' "$f" > "${f}.tmp" && mv "${f}.tmp" "$f"
        
        ((count++))
        echo "✅ $f"
    else
        ((failed++))
        echo "⚠️ $f - </body>タグなし"
    fi
done

echo ""
echo "=== 完了 ==="
echo "追加済み: $count ファイル"
if [ "$failed" -gt 0 ]; then
    echo "失敗: $failed ファイル"
fi

# 検証
remaining=$(grep -L "cta-button\|お問い合わせ\|お申し込み\|購入する\|詳細を見る" *.html 2>/dev/null | wc -l | tr -d ' ')
echo "CTA未設置残: $remaining ファイル"
