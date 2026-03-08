#!/bin/bash
# 相互リンクセクション一括追加スクリプト（安全版）

TOOLS=(
  "free-tool-inquiry-email"
  "free-tool-medication-calendar"
  "free-tool-medication-guidance"
  "free-tool-medication-guidance-scenario"
  "free-tool-medication-history"
  "free-tool-medication-summary"
  "free-tool-renal-dose"
  "free-tool-prescription-checklist"
  "free-tool-prescription-screening"
  "free-tool-di-query"
  "free-tool-bringing-medicine"
  "free-tool-inventory-alert"
  "free-tool-adherence-check"
  "free-tool-similar-drug-check"
)

CROSSLINK_SECTION='  <div class="section">
    <div class="section-title">🔗 他の無料ツール</div>
    <div class="links">
      <a href="https://yusuketakuma.github.io/pharma-drug-price-tool/">薬価計算</a>
      <a href="https://yusuketakuma.github.io/pharma-medication-history-tool/">薬歴テンプレート</a>
      <a href="https://yusuketakuma.github.io/pharma-medication-guidance/">服薬指導チェック</a>
      <a href="https://yusuketakuma.github.io/pharma-renal-dose-tool/">腎機能別用量</a>
      <a href="https://yusuketakuma.github.io/pharma-efficiency-diagnosis/">業務効率化診断</a>
      <a href="https://yusuketakuma.github.io/pharma-prescription-checklist/">処方チェック</a>
      <a href="https://yusuketakuma.github.io/pharma-inquiry-email/">疑義照会メール</a>
      <a href="https://yusuketakuma.github.io/pharma-medication-summary/">薬歴サマリー</a>
      <a href="https://yusuketakuma.github.io/pharma-side-effect-checker/">副作用リスク</a>
      <a href="https://yusuketakuma.github.io/pharma-medication-calendar/">服薬カレンダー</a>
      <a href="https://yusuketakuma.github.io/pharma-prescription-screening/">処方鑑別</a>
      <a href="https://yusuketakuma.github.io/pharma-di-query/">DI照会生成</a>
      <a href="https://yusuketakuma.github.io/pharma-bringing-medicine/">持参薬チェック</a>
      <a href="https://yusuketakuma.github.io/pharma-inventory-alert/">在庫アラート</a>
      <a href="https://yusuketakuma.github.io/pharma-adherence-check/">アドヒアランス</a>
      <a href="https://yusuketakuma.github.io/pharma-similar-drug-check/">類似薬名</a>
      <a href="https://yusuketakuma.github.io/pharma-polypharmacy/">ポリファーマシー</a>
      <a href="https://yusuketakuma.github.io/pharma-medication-guidance-scenario/">服薬指導シナリオ</a>
      <a href="https://yusuketakuma.github.io/pharma-fee-calculator/">調剤報酬計算</a>
      <a href="https://yusuketakuma.github.io/pharma-homecare-report/">在宅医療報告書</a>
    </div>
  </div>
</body>
</html>'

cd /Users/yusuke/.openclaw/workspace/sidebiz

for tool in "${TOOLS[@]}"; do
  file="$tool/index.html"
  if [ -f "$file" ]; then
    # バックアップ作成
    cp "$file" "$file.bak"
    
    # </body></html>を削除して相互リンクセクションを追加
    # macOSのsed対応
    sed -i '' '$d' "$file"  # </html>削除
    sed -i '' '$d' "$file"  # </body>削除
    
    # 相互リンクセクション追加
    echo "$CROSSLINK_SECTION" >> "$file"
    
    echo "✅ Updated: $tool"
  else
    echo "❌ Not found: $tool"
  fi
done

echo ""
echo "Done. Updated ${#TOOLS[@]} tools."
