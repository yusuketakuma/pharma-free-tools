#!/usr/bin/env bash
# stale-report-detection.sh — Read-only stale-report detection for CEO / department jobs
#
# Spec: projects/openclaw-core/docs/stale-report-detection-spec.md
# Snapshot: projects/openclaw-core/docs/stale-report-snapshot-spec.md
#
# Usage:
#   ./scripts/stale-report-detection.sh                    # stdout table
#   ./scripts/stale-report-detection.sh --json             # JSON output
#   ./scripts/stale-report-detection.sh --snapshot         # write snapshot to reports/cron/
#   ./scripts/stale-report-detection.sh --check-fallback   # emit fallback candidates only
#
# Exit codes:
#   0 = all ok
#   1 = warning or worse detected
#   2 = critical or hard-stale detected

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
WORKSPACE_DIR="${WORKSPACE_DIR:-$HOME/.openclaw/workspace}"
REPORTS_CRON_DIR="$WORKSPACE_DIR/reports/cron"
REPORTS_COMPANY_DIR="$WORKSPACE_DIR/reports/company"
CONFIG_FILE="${CONFIG_FILE:-$PROJECT_DIR/config/stale-report-jobs.json}"
DEDUPE_WINDOW_HOURS="${DEDUPE_WINDOW_HOURS:-6}"
NOW_EPOCH="$(date +%s)"

# --- Config ---
# If config file doesn't exist, create a default
if [ ! -f "$CONFIG_FILE" ]; then
  mkdir -p "$(dirname "$CONFIG_FILE")"
  cat > "$CONFIG_FILE" << 'JSONEOF'
{
  "jobs": [
    {
      "name": "cross-agent-knowledge-sync",
      "pattern": "cross-agent-knowledge-sync-*.md",
      "directory": "reports/cron",
      "cadence_hours": 2,
      "deadline_critical": false
    },
    {
      "name": "proactive-idle-work-discovery",
      "pattern": "proactive-idle-work-discovery-*.md",
      "directory": "reports/cron",
      "cadence_hours": 4,
      "deadline_critical": false
    },
    {
      "name": "workspace-project-priority-review",
      "pattern": "workspace-project-priority-review-*.md",
      "directory": "reports/cron",
      "cadence_hours": 24,
      "deadline_critical": false
    },
    {
      "name": "workspace-report-learning-review",
      "pattern": "workspace-report-learning-review-*.md",
      "directory": "reports/cron",
      "cadence_hours": 24,
      "deadline_critical": false
    },
    {
      "name": "domain-specialization-growth-review",
      "pattern": "domain-specialization-growth-review-*.md",
      "directory": "reports/cron",
      "cadence_hours": 24,
      "deadline_critical": false
    },
    {
      "name": "autonomy-kpi-outcome-review",
      "pattern": "autonomy-kpi-outcome-review-*.md",
      "directory": "reports/cron",
      "cadence_hours": 24,
      "deadline_critical": true
    },
    {
      "name": "sidebiz-project-scout",
      "pattern": "sidebiz-project-scout-*.md",
      "directory": "reports/cron",
      "cadence_hours": 24,
      "deadline_critical": false
    },
    {
      "name": "project-kpi-registry-maintenance",
      "pattern": "project-kpi-registry-maintenance-*.md",
      "directory": "reports/cron",
      "cadence_hours": 24,
      "deadline_critical": false
    },
    {
      "name": "ceo-tama-report",
      "pattern": "ceo-tama-latest.md",
      "directory": "reports/company",
      "cadence_hours": 24,
      "deadline_critical": true
    },
    {
      "name": "board-agenda-assembly",
      "pattern": "board-agenda-assembly-*.md",
      "directory": "reports/cron",
      "cadence_hours": 6,
      "deadline_critical": true
    }
  ],
  "dedupe_window_hours": 6
}
JSONEOF
fi

# --- Helper: resolve directory ---
resolve_dir() {
  local dir="$1"
  case "$dir" in
    reports/cron)  echo "$REPORTS_CRON_DIR" ;;
    reports/company) echo "$REPORTS_COMPANY_DIR" ;;
    /*) echo "$dir" ;;
    *) echo "$WORKSPACE_DIR/$dir" ;;
  esac
}

# --- Helper: get last successful run timestamp (epoch) ---
get_last_success_epoch() {
  local dir="$1"
  local pattern="$2"
  local resolved_dir
  resolved_dir="$(resolve_dir "$dir")"

  if [ ! -d "$resolved_dir" ]; then
    echo "0"
    return
  fi

  # Find newest matching file by modification time
  local newest
  newest="$(find "$resolved_dir" -maxdepth 1 -name "$pattern" -type f -print0 2>/dev/null | xargs -0 stat -f '%m %N' 2>/dev/null | sort -rn | head -1)"

  if [ -z "$newest" ]; then
    echo "0"
    return
  fi

  echo "${newest%% *}"
}

# --- Helper: compute severity ---
compute_severity() {
  local elapsed_hours="$1"
  local cadence_hours="$2"
  local warning_threshold critical_threshold hard_stale_threshold

  warning_threshold=$(echo "$cadence_hours * 1.5" | bc -l)
  critical_threshold=$(echo "$cadence_hours * 2.0" | bc -l)
  # Hard stale: 24h for sub-daily jobs, 72h for daily+
  if [ "$(echo "$cadence_hours < 24" | bc -l)" -eq 1 ]; then
    hard_stale_threshold=24
  else
    hard_stale_threshold=72
  fi

  if [ "$(echo "$elapsed_hours >= $hard_stale_threshold" | bc -l)" -eq 1 ]; then
    echo "hard-stale"
  elif [ "$(echo "$elapsed_hours >= $critical_threshold" | bc -l)" -eq 1 ]; then
    echo "critical"
  elif [ "$(echo "$elapsed_hours >= $warning_threshold" | bc -l)" -eq 1 ]; then
    echo "warning"
  else
    echo "ok"
  fi
}

# --- Helper: format hours ---
format_elapsed() {
  local hours="$1"
  local h m
  h=$(echo "$hours / 1" | bc)
  m=$(echo "($hours - $h) * 60 / 1" | bc)
  if [ "$h" -eq 0 ]; then
    echo "${m}m"
  elif [ "$m" -eq 0 ]; then
    echo "${h}h"
  else
    echo "${h}h${m}m"
  fi
}

# --- Helper: next action ---
compute_next_action() {
  local severity="$1"
  local deadline_critical="$2"
  case "$severity" in
    ok)         echo "monitor" ;;
    warning)    echo "surface-in-next-report" ;;
    critical)   echo "create-fallback-candidates" ;;
    hard-stale)
      if [ "$deadline_critical" = "true" ]; then
        echo "prepare-fallback-candidates"
      else
        echo "monitor"
      fi
      ;;
  esac
}

# --- Helper: dedupe check ---
# Check if a fallback notification was already emitted within the dedupe window
check_dedupe() {
  local job_name="$1"
  local snapshot_file="$REPORTS_CRON_DIR/stale-report-snapshot-latest.md"
  if [ ! -f "$snapshot_file" ]; then
    return 1  # no previous snapshot, not deduped
  fi
  local prev_severity
  prev_severity="$(grep -E "^[|] *${job_name} " "$snapshot_file" 2>/dev/null | tail -1 | awk -F'|' '{print $5}' | tr -d ' ')"
  if [ "$prev_severity" = "$2" ]; then
    return 0  # deduped
  fi
  return 1
}

# --- Main logic ---
OUTPUT_MODE="${1:---table}"

# Validate jq is available
if ! command -v jq &>/dev/null; then
  echo "ERROR: jq is required. Install with: brew install jq" >&2
  exit 2
fi

if ! command -v bc &>/dev/null; then
  echo "ERROR: bc is required." >&2
  exit 2
fi

# Read config
JOBS="$(jq -r '.jobs[] | @base64' "$CONFIG_FILE")"
DEDUPE_HOURS="$(jq -r '.dedupe_window_hours // 6' "$CONFIG_FILE")"

results=()
max_severity=0

for job_encoded in $JOBS; do
  job="$(echo "$job_encoded" | base64 -d)"
  name="$(echo "$job" | jq -r '.name')"
  pattern="$(echo "$job" | jq -r '.pattern')"
  directory="$(echo "$job" | jq -r '.directory')"
  cadence_hours="$(echo "$job" | jq -r '.cadence_hours')"
  deadline_critical="$(echo "$job" | jq -r '.deadline_critical // false')"

  last_epoch="$(get_last_success_epoch "$directory" "$pattern")"

  if [ "$last_epoch" -eq 0 ]; then
    elapsed_hours=9999
    last_success_str="never"
  else
    elapsed_hours=$(echo "scale=1; ($NOW_EPOCH - $last_epoch) / 3600" | bc -l)
    last_success_str="$(date -r "$last_epoch" '+%Y-%m-%d %H:%M')"
  fi

  severity="$(compute_severity "$elapsed_hours" "$cadence_hours")"
  next_action="$(compute_next_action "$severity" "$deadline_critical")"

  # Track max severity
  case "$severity" in
    ok)         severity_num=0 ;;
    warning)    severity_num=1 ;;
    critical)   severity_num=2 ;;
    hard-stale) severity_num=3 ;;
  esac
  if [ "$severity_num" -gt "$max_severity" ]; then
    max_severity="$severity_num"
  fi

  # Affected fallback items
  affected="none"
  if [ "$deadline_critical" = "true" ] && { [ "$severity" = "critical" ] || [ "$severity" = "hard-stale" ]; }; then
    affected="$name-deadline-reminders"
    # Check dedupe for fallback emission
    if ! check_dedupe "$name" "$severity"; then
      next_action="emit-fallback-notification"
    fi
  fi

  results+=("$name|$last_success_str|${cadence_hours}h|$(format_elapsed "$elapsed_hours")|$severity|$affected|$next_action")
done

# --- Output ---
case "$OUTPUT_MODE" in
  --json)
    echo '['
    first=true
    for row in "${results[@]}"; do
      IFS='|' read -r name last_success cadence elapsed severity affected action <<< "$row"
      if [ "$first" = true ]; then first=false; else echo ','; fi
      cat << JSONROW
  {
    "job": "$name",
    "last_success": "$last_success",
    "cadence": "$cadence",
    "elapsed": "$elapsed",
    "severity": "$severity",
    "affected_fallback_items": "$affected",
    "next_action": "$action"
  }
JSONROW
    done
    echo ']'
    ;;

  --snapshot)
    timestamp="$(date '+%Y%m%d-%H%M')"
    snapshot_file="$REPORTS_CRON_DIR/stale-report-snapshot-${timestamp}.md"
    latest_link="$REPORTS_CRON_DIR/stale-report-snapshot-latest.md"

    {
      echo "# Stale-Report Snapshot"
      echo ""
      echo "Generated: $(date '+%Y-%m-%d %H:%M:%S %Z')"
      echo "Spec: projects/openclaw-core/docs/stale-report-detection-spec.md"
      echo ""
      echo "| job | last success | cadence | elapsed | severity | affected fallback items | next action |"
      echo "| --- | --- | --- | --- | --- | --- | --- |"
      for row in "${results[@]}"; do
        IFS='|' read -r name last_success cadence elapsed severity affected action <<< "$row"
        echo "| $name | $last_success | $cadence | $elapsed | $severity | $affected | $action |"
      done
      echo ""
      echo "Max severity: $([ "$max_severity" -ge 3 ] && echo "hard-stale" || ([ "$max_severity" -ge 2 ] && echo "critical" || ([ "$max_severity" -ge 1 ] && echo "warning" || echo "ok")))"
    } > "$snapshot_file"

    # Update latest symlink
    ln -sf "$(basename "$snapshot_file")" "$latest_link"

    echo "Snapshot written: $snapshot_file"
    echo "Latest link: $latest_link"
    ;;

  --check-fallback)
    # Only emit rows that need fallback notification
    fallback_found=false
    for row in "${results[@]}"; do
      IFS='|' read -r name last_success cadence elapsed severity affected action <<< "$row"
      if [ "$action" = "emit-fallback-notification" ]; then
        if [ "$fallback_found" = false ]; then
          fallback_found=true
          echo "# Fallback Notification Candidates"
          echo ""
          echo "Generated: $(date '+%Y-%m-%d %H:%M:%S %Z')"
          echo ""
        fi
        echo "## $name"
        echo "- **missed**: $name did not run (last success: $last_success)"
        echo "- **affected**: $affected"
        echo "- **severity**: $severity"
        echo "- **next action**: confirm the last successful run and decide whether to escalate"
        echo ""
      fi
    done
    if [ "$fallback_found" = false ]; then
      echo "No fallback notification candidates. All jobs within thresholds."
    fi
    ;;

  --table|*)
    echo "| job | last success | cadence | elapsed | severity | affected fallback items | next action |"
    echo "| --- | --- | --- | --- | --- | --- | --- |"
    for row in "${results[@]}"; do
      IFS='|' read -r name last_success cadence elapsed severity affected action <<< "$row"
      echo "| $name | $last_success | $cadence | $elapsed | $severity | $affected | $action |"
    done
    ;;
esac

# Exit code based on max severity
if [ "$max_severity" -ge 2 ]; then
  exit 2
elif [ "$max_severity" -ge 1 ]; then
  exit 1
fi
exit 0
