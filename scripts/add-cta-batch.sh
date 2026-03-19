#!/bin/bash
# CTA一括追加スクリプト
# 使用方法: ./add-cta-batch.sh

CTA_SNIPPET='
  <!-- CTA Section -->
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 24px; border-radius: 12px; margin: 32px 0; text-align: center;">
    <h3 style="margin: 0 0 12px 0; font-size: 1.2em;">🎯 業務効率化をもっと進める</h3>
    <p style="margin: 0 0 16px 0; opacity: 0.9;">薬剤師向けAIプロンプト集で、調剤・鑑別・在宅業務を自動化</p>
    <a href="ai-prompts-lp.html" onclick="gtag('\''event'\'', '\''cta_click'\'', {'\''event_category'\'': '\''conversion'\'', '\''event_label'\'': '\'FILENAME-cta'\''})" style="display: inline-block; background: white; color: #667eea; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">詳細を見る →</a>
  </div>
</body>
</html>'

count=0
for f in *.html; do
  # CTA未設置ファイルのみ処理（複数パターンで検出）
  if ! grep -q "cta-button\|有料製品\|<!-- CTA Section -->\|ai-prompts-lp.html" "$f"; then
    # ファイル名をCTAに埋め込み
    filename=$(basename "$f" .html)
    cta_custom=$(echo "$CTA_SNIPPET" | sed "s/FILENAME/$filename/g")
    
    # </body>の前にCTAを挿入
    if grep -q "</body>" "$f"; then
      # 一時ファイルで処理
      awk -v cta="$cta_custom" '
      BEGIN { found = 0 }
      /<\/body>/ && !found {
        print cta
        found = 1
      }
      { print }
      ' "$f" > "${f}.tmp" && mv "${f}.tmp" "$f"
      
      ((count++))
      echo "✅ $f にCTA追加"
    fi
  fi
done

echo ""
echo "完了: $count ファイルにCTA追加"
