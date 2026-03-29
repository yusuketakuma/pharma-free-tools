#!/bin/bash

# Board Meeting Agenda Seed Generator
# 取締役会議題 seed 生成ジョブ

set -e

# Configuration
BOARD_AGENTS=(
    "ceo-tama"
    "supervisor-core" 
    "board-visionary"
    "board-user-advocate"
    "board-operator"
    "board-auditor"
    "research-analyst"
    "github-operator"
    "ops-automator"
    "doc-editor"
    "dss-manager"
    "opportunity-scout"
)

# Generate board_cycle_slot_id based on JST time (HH:20 slot)
# Current: 2026-03-28 19:20 UTC = 2026-03-29 04:20 JST
# Most recent HH:20 slot: 2026-03-28 09:20 JST = 2026-03-27 00:20 UTC
BOARD_CYCLE_SLOT_ID="20260328-0920"
GENERATED_AT=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# Reports directory
REPORTS_DIR="reports/board"
mkdir -p "$REPORTS_DIR"

# Initialize counters
GENERATED_COUNT=0
DEDUPED_COUNT=0

# Function to collect agenda from an agent
collect_agenda() {
    local agent="$1"
    local agenda_file="$REPORTS_DIR/${agent}_agenda.md"
    
    echo "Collecting agenda from $agent..."
    
    # Send message to agent requesting agenda item
    sessions_send \
        --sessionKey="$agent" \
        --message="【取締役会議題提出要請】

あなたの担当分野から、この取緡役会で議論すべき重要な議題を1件だけ提案してください。

必須形式:
- 議題
- 結論
- 理由  
- リスク
- 次アクション

担当エージェント: $agent" \
        --timeoutSeconds=60
    
    # Wait a moment for response (in real implementation, would need proper polling)
    sleep 2
    
    echo "Agenda collected from $agent"
}

# Function to process collected agendas and create seed artifact
process_agendas() {
    local collected_agendas=()
    local unique_agendas=()
    local agenda_hashes=()
    
    # Collect agendas from all agents (simulated - in reality would process actual responses)
    for agent in "${BOARD_AGENTS[@]}"; do
        local agenda_file="$REPORTS_DIR/${agent}_agenda.md"
        
        if [[ -f "$agenda_file" ]]; then
            # Read agenda content
            local agenda_content=$(cat "$agenda_file")
            local agenda_hash=$(echo "$agenda_content" | md5sum | cut -d' ' -f1)
            
            collected_agendas+=("$agent: $agenda_content")
            agenda_hashes+=("$agenda_hash")
            
            # Check for duplicates
            local is_duplicate=0
            for hash in "${agenda_hashes[@]::${#agenda_hashes[@]}-1}"; do
                if [[ "$hash" == "$agenda_hash" ]]; then
                    is_duplicate=1
                    break
                fi
            done
            
            if [[ $is_duplicate -eq 0 ]]; then
                unique_agendas+=("$agent: $agenda_content")
                DEDUPED_COUNT=$((DEDUPED_COUNT + 1))
            fi
            
            GENERATED_COUNT=$((GENERATED_COUNT + 1))
        else
            echo "Warning: No agenda file found for $agent"
        fi
    done
    
    # Generate seed artifact
    local seed_content=$(generate_seed_artifact "$BOARD_CYCLE_SLOT_ID" "$GENERATED_AT" "${BOARD_AGENTS[@]}" "$GENERATED_COUNT" "$DEDUPED_COUNT" "${unique_agendas[@]}")
    
    # Save seed artifacts
    echo "$seed_content" > "$REPORTS_DIR/agenda-seed-$BOARD_CYCLE_SLOT_ID.md"
    
    # Update latest (with error handling)
    if ln -sf "agenda-seed-$BOARD_CYCLE_SLOT_ID.md" "$REPORTS_DIR/agenda-seed-latest.md" 2>/dev/null; then
        echo "Latest artifact updated successfully"
    else
        echo "WARNING: Failed to update latest artifact - manual intervention required"
        # Create a note about the failure
        echo "FAILURE: Could not update agenda-seed-latest.md at $(date -u)" >> "$REPORTS_DIR/update-failures.log"
    fi
    
    echo "Seed generation completed"
}

# Function to generate seed artifact content
generate_seed_artifact() {
    local slot_id="$1"
    local gen_at="$2"
    shift 2
    local source_agents=("$@")
    local gen_count="${source_agents[-2]}"
    local dedup_count="${source_agents[-1]}"
    local agendas=("${source_agents[@]::-2}")
    
    local artifact="# 取締役会議題 Seed Artifact

## 基本情報
- **board_cycle_slot_id**: $slot_id
- **generated_at**: $gen_at
- **source_agents**: ${#agendas[@]}
- **generated_count**: $gen_count
- **deduped_count**: $dedup_count

## 提出エージェントと議題
"
    
    for agenda_item in "${agendas[@]}"; do
        artifact+="$agenda_item

"
    done
    
    artifact+="## 重複統合の要点
- 重複議題: $((gen_count - dedup_count))件
- 重複率: $(( (gen_count - dedup_count) * 100 / gen_count ))% (重複あり)

## 次アクション
1. Claude Code による事前審議
2. OpenClaw による再レビュー
3. 最終議題確定
4. 取締役会開催

---
*自動生成: Board Agenda Seed Generator*"
    
    echo "$artifact"
}

# Main execution
echo "Starting board meeting agenda seed generation..."
echo "Board cycle slot ID: $BOARD_CYCLE_SLOT_ID"
echo "Generated at: $GENERATED_AT"

# Collect agendas from all agents
for agent in "${BOARD_AGENTS[@]}"; do
    collect_agenda "$agent"
done

# Process and create seed artifact
process_agendas

echo "Board meeting agenda seed generation completed successfully"