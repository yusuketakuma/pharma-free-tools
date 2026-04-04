#!/bin/bash
# PharmCheck AI CTA 一括追加スクリプト
# 5ファイルの既存CTAセクション直後にPharmCheck導線を追加

TARGETS=(
  "drug-interaction-checker.html"
  "ai-medication-history-workflow.html"
  "dispensing-error-prevention-checklist.html"
  "medication-history-time-saving-checklist.html"
  "polypharmacy-assessment.html"
)

COUNT=0
SKIP=0

for f in "${TARGETS[@]}"; do
  if [ ! -f "$f" ]; then
    echo "⚠️  $f not found, skipping"
    ((SKIP++))
    continue
  fi

  # 既にPharmCheck CTAがあるか確認
  if grep -q "PharmCheck" "$f" 2>/dev/null; then
    echo "⏭️  $f already has PharmCheck CTA, skipping"
    ((SKIP++))
    continue
  fi

  # .cta-section の閉じタグ </div> の直後に挿入
  # macOS sed対応
  CTA_SNIPPET='<!-- PharmCheck AI -->\
      <div class="cta-section" style="background: linear-gradient(135deg, #052e16 0%, #14532d 100%); border: 1px solid #166534;">\
        <h3 style="color: #dcfce7;">🤖 AIが処方を自動解析 — PharmCheck AI</h3>\
        <p style="color: #86efac; font-size: 0.85rem;">相互作用・重複・用量・禁忌を一括チェック。薬歴指導の下書きも自動生成。</p>\
        <a href="#" class="cta-button" style="background: #22c55e; color: white;" onclick="gtag('\''event'\'','\''cta_click'\'',{'\''event_category'\'':'\''conversion'\'','\''event_label'\'':'\''"$(basename "$f" .html)"-pharmcheck'\''})">近日公開 — お知らせを受け取る →</a>\
      </div>'

  # 最初の .cta-section ブロックの </div> の後に挿入
  # Pythonで安全に処理（macOS sedの制限回避）
  python3 -c "
import sys
with open('$f', 'r') as fh:
    content = fh.read()

snippet = '''$CTA_SNIPPET'''

# 最初の cta-section の閉じ div の直後に挿入
marker = '</div>'
cta_start = content.find('class=\"cta-section\"')
if cta_start == -1:
    cta_start = content.find(\"class='cta-section'\")
if cta_start == -1:
    sys.exit(1)

# その後の最初の </div> を見つける
insert_pos = content.find(marker, cta_start)
if insert_pos == -1:
    sys.exit(1)
insert_pos += len(marker)

# 重複挿入防止
if 'PharmCheck' in content[:insert_pos + 500]:
    sys.exit(1)

content = content[:insert_pos] + '\n      ' + snippet + '\n' + content[insert_pos:]
with open('$f', 'w') as fh:
    fh.write(content)
print('OK')
" 2>/dev/null

  if [ $? -eq 0 ]; then
    echo "✅ $f — PharmCheck CTA added"
    ((COUNT++))
  else
    echo "❌ $f — failed to add CTA"
    ((SKIP++))
  fi
done

echo ""
echo "=== Result ==="
echo "Added: $COUNT"
echo "Skipped: $SKIP"
