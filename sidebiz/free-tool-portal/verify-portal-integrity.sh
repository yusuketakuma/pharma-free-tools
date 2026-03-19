#!/bin/bash
# verify-portal-integrity.sh - free-tool-portal の実測KPI確認
# 目的: HTML総数 / CTA設置 / GA4イベント埋め込み / Measurement ID未差し替え を固定コマンドで確認する

set -euo pipefail

TARGET_DIR="${1:-$(pwd)}"
cd "$TARGET_DIR"

HTML_COUNT=$(find . -maxdepth 1 -name '*.html' | wc -l | tr -d ' ')
CTA_COUNT=$(grep -l '<!-- CTA Section -->' ./*.html 2>/dev/null | wc -l | tr -d ' ')
GA4_EVENT_COUNT=$(grep -l "gtag('event'" ./*.html 2>/dev/null | wc -l | tr -d ' ')
GA4_PLACEHOLDER_COUNT=$(grep -l 'G-XXXXXXXXXX' ./*.html 2>/dev/null | wc -l | tr -d ' ')

sample_line() {
  local file="$1"
  grep -n '<!-- CTA Section -->' "$file" 2>/dev/null | head -1 || true
}

printf 'verified_at: %s\n' "$(date '+%Y-%m-%d %H:%M:%S %Z')"
printf 'target_dir: %s\n' "$PWD"
printf 'html_count: %s\n' "$HTML_COUNT"
printf 'cta_count: %s\n' "$CTA_COUNT"
printf 'ga4_event_count: %s\n' "$GA4_EVENT_COUNT"
printf 'ga4_placeholder_count: %s\n' "$GA4_PLACEHOLDER_COUNT"
printf 'sample_claim_denial_reduction: %s\n' "$(sample_line 'claim-denial-reduction-simulator.html')"
printf 'sample_pharmacy_bottleneck: %s\n' "$(sample_line 'pharmacy-bottleneck-diagnosis.html')"
printf 'sample_index: %s\n' "$(sample_line 'index.html')"

if [ "$CTA_COUNT" -ne "$HTML_COUNT" ]; then
  echo 'status: ALERT (CTA coverage mismatch)'
  echo 'missing_cta_files:'
  grep -L '<!-- CTA Section -->' ./*.html 2>/dev/null | sed 's#^./#- #' || true
  exit 1
fi

echo 'status: OK'
