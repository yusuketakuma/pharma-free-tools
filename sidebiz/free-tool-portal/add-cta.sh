#!/bin/bash
count=0
skipped=0

for f in *.html; do
  if grep -q "<!-- CTA Section -->\|ai-prompts-lp.html\|cta-button\|有料製品" "$f" 2>/dev/null; then
    ((skipped++))
    continue
  fi
  
  filename=$(basename "$f" .html)
  
  if sed -i '' 's|</body>|\
  <!-- CTA Section -->\
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 24px; border-radius: 12px; margin: 32px 0; text-align: center;">\
    <h3 style="margin: 0 0 12px 0; font-size: 1.2em;">🎯 業務効率化をもっと進める</h3>\
    <p style="margin: 0 0 16px 0; opacity: 0.9;">薬剤師向けAIプロンプト集で、調剤・鑑別・在宅業務を自動化</p>\
    <a href="ai-prompts-lp.html" onclick="gtag('\''event'\'', '\''cta_click'\'', {'\''event_category'\'': '\''conversion'\'', '\''event_label'\'': '\'''"$filename"'-cta'\''})" style="display: inline-block; background: white; color: #667eea; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;">詳細を見る →</a>\
  </div>\
</body>|' "$f" 2>/dev/null; then
    ((count++))
    echo "✅ $f にCTA追加"
  fi
done

echo ""
echo "完了: $count ファイルにCTA追加"
echo "スキップ: $skipped ファイル（既にCTAあり）"
