#!/bin/bash
# ポータルリンク整合性チェックスクリプト
# 作成: 2026-03-11
# 用途: index.html内のローカルHTMLリンクで、ファイルが存在しないものを検出

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PORTAL_DIR="$SCRIPT_DIR/free-tool-portal"
INDEX_FILE="$PORTAL_DIR/index.html"

echo "=== ポータルリンク整合性チェック ==="
echo "実行日時: $(date)"
echo "対象: $INDEX_FILE"
echo ""

MISSING_COUNT=0
MISSING_FILES=""

# index.html内のHTMLリンクを抽出し、存在確認
while IFS= read -r link; do
  # 外部URLはスキップ
  if [[ "$link" == http* ]]; then
    continue
  fi
  
  # ファイル存在確認
  if [[ ! -f "$PORTAL_DIR/$link" ]]; then
    echo "❌ MISSING: $link"
    MISSING_COUNT=$((MISSING_COUNT + 1))
    MISSING_FILES="$MISSING_FILES $link"
  fi
done < <(grep -oE 'href="[^"]+\.html"' "$INDEX_FILE" 2>/dev/null | sed 's/href="//;s/"$//' | sort -u)

echo ""
echo "=== 結果サマリ ==="
if [ $MISSING_COUNT -eq 0 ]; then
  echo "✅ すべてのローカルリンクが有効です"
else
  echo "❌ $MISSING_COUNT 件のリンクが無効です:$MISSING_FILES"
fi

# ポータル件数の整合性チェック
echo ""
echo "=== ポータル件数チェック ==="
TITLE_COUNT=$(grep -o '<title>.*</title>' "$INDEX_FILE" | grep -oE '[0-9]+選' | grep -oE '[0-9]+')
SUBTITLE_COUNT=$(grep 'class="subtitle"' "$INDEX_FILE" | grep -oE '[0-9]+選' | grep -oE '[0-9]+')
STAT_NUMBER=$(grep '<div class="stat-number">' "$INDEX_FILE" | grep -oE '>[0-9]+<' | head -1 | grep -oE '[0-9]+')

echo "タイトル: ${TITLE_COUNT}選"
echo "サブタイトル: ${SUBTITLE_COUNT}選"
echo "統計数値: $STAT_NUMBER"

if [ "$TITLE_COUNT" = "$SUBTITLE_COUNT" ] && [ "$SUBTITLE_COUNT" = "$STAT_NUMBER" ]; then
  echo "✅ 件数が一致しています"
else
  echo "⚠️ 件数に不整合があります"
fi
