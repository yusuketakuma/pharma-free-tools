#!/bin/bash
# ポータルリンク整合性チェックスクリプト
# index.html内のリンクを抽出し、実在ファイルと照合

PORTAL_DIR="/Users/yusuke/.openclaw/workspace/sidebiz/free-tool-portal"
INDEX_FILE="$PORTAL_DIR/index.html"

echo "=== ポータルリンク整合性チェック ==="
echo "実行日時: $(date '+%Y-%m-%d %H:%M:%S')"
echo ""

# 内部リンク（.html）を抽出
echo "【内部リンク検証】"
internal_links=$(grep -oE 'href="[^"]*\.html"' "$INDEX_FILE" | sed 's/href="//;s/"$//' | sort -u)

missing_count=0
for link in $internal_links; do
  # クエリパラメータを除去
  clean_link=$(echo "$link" | cut -d'?' -f1)
  
  # 相対パスの場合はフルパスに変換
  if [[ ! "$clean_link" =~ ^/ ]]; then
    full_path="$PORTAL_DIR/$clean_link"
  else
    full_path="$clean_link"
  fi
  
  if [[ ! -f "$full_path" ]]; then
    echo "[404] $clean_link"
    ((missing_count++))
  fi
done

if [[ $missing_count -eq 0 ]]; then
  echo "✅ 全内部リンク有効"
fi

echo ""
echo "【外部リンク検証】"
# 外部リンク（yusuketakuma.github.io）を抽出
external_links=$(grep -oE 'href="https://yusuketakuma\.github\.io/[^"]+"' "$INDEX_FILE" | sed 's/href="//;s/"$//' | sort -u)

echo "外部リンク数: $(echo "$external_links" | wc -l | tr -d ' ')"
echo "（curl検証は時間がかかるため、リストのみ表示）"
echo "$external_links" | head -10

echo ""
echo "【結果サマリー】"
echo "- 内部リンク404数: $missing_count"
echo "- チェック完了"
