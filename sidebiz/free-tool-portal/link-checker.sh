#!/bin/bash
# link-checker.sh - pharma-free-tools ポータル404検知
# 週次cron実行想定

set -e

PORTAL_BASE="https://yusuketakuma.github.io/pharma-free-tools"
RAW_BASE="https://raw.githubusercontent.com/yusuketakuma/pharma-free-tools/main"
WORKSPACE="/Users/yusuke/.openclaw/workspace"
MEMORY_FILE="$WORKSPACE/memory/$(date +%Y-%m-%d).md"
ALERTS=()

log() {
  echo "[$(date '+%H:%M')] $1"
}

check_url() {
  local url="$1"
  local status
  status=$(curl -s -o /dev/null -w "%{http_code}" "$url" --connect-timeout 10 --max-time 30)
  echo "$status"
}

# ポータルトップ確認
log "ポータルトップ確認..."
TOP_STATUS=$(check_url "$PORTAL_BASE/")
if [ "$TOP_STATUS" != "200" ]; then
  ALERTS+=("ポータルトッップ: $TOP_STATUS")
fi

# 主要ツールURL確認（高優先度ツール）
CRITICAL_TOOLS=(
  "graceful-period-drug-switch-checklist.html"
  "designated-abuse-prevention-drugs-checklist.html"
  "dispensing-error-prevention-checklist.html"
  "homecare-revenue-simulator.html"
  "doac-dosing.html"
)

for tool in "${CRITICAL_TOOLS[@]}"; do
  PAGES_STATUS=$(check_url "$PORTAL_BASE/$tool")
  RAW_STATUS=$(check_url "$RAW_BASE/$tool")
  
  if [ "$PAGES_STATUS" != "200" ]; then
    ALERTS+=("$tool: Pages=$PAGES_STATUS, Raw=$RAW_STATUS")
    log "[WARN] $tool: Pages=$PAGES_STATUS, Raw=$RAW_STATUS"
  else
    log "[OK] $tool: 200"
  fi
done

# アラートがあれば記録
if [ ${#ALERTS[@]} -gt 0 ]; then
  echo "" >> "$MEMORY_FILE"
  echo "## $(date '+%H:%M') [link-checker] 404検知アラート" >> "$MEMORY_FILE"
  echo "" >> "$MEMORY_FILE"
  for alert in "${ALERTS[@]}"; do
    echo "- $alert" >> "$MEMORY_FILE"
  done
  log "[ALERT] ${#ALERTS[@]}件の問題を検出・記録"
  exit 1
else
  log "全URL正常"
  exit 0
fi
