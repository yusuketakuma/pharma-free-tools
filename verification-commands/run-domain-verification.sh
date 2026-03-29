#!/bin/bash

# Domain Specialization Verification Runner
# 各ドメイン特化エージェントのverification commandsを実行

set -e

echo "=== Domain Specialization Verification Suite ==="
echo "実行時刻: $(date)"
echo

# ディレクトリ設定
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_DIR="${SCRIPT_DIR}/logs"
mkdir -p "${LOG_DIR}"

# ログファイル設定
LOG_FILE="${LOG_DIR}/verification-$(date +%Y%m%d_%H%M%S).log"
exec > >(tee -a "${LOG_FILE}") 2>&1

# 関数定義
log_message() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

check_command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# ドメイン別実行関数
run_pharma_verification() {
    log_message "Pharma Operations Domain 開始"
    if [[ -f "${SCRIPT_DIR}/pharma/pharma-operations-verify.sh" ]]; then
        bash "${SCRIPT_DIR}/pharma/pharma-operations-verify.sh"
    else
        log_message "⚠️ Pharma verification script not found"
    fi
    log_message "Pharma Operations Domain 完了"
    echo
}

run_inventory_verification() {
    log_message "Inventory & Supply Chain Domain 開始"
    if [[ -f "${SCRIPT_DIR}/inventory/dss-verify.sh" ]]; then
        bash "${SCRIPT_DIR}/inventory/dss-verify.sh"
    else
        log_message "⚠️ Inventory verification script not found"
    fi
    log_message "Inventory & Supply Chain Domain 完了"
    echo
}

run_revenue_verification() {
    log_message "Revenue Cycle Domain 開始"
    if [[ -f "${SCRIPT_DIR}/revenue/revenue-verify.sh" ]]; then
        bash "${SCRIPT_DIR}/revenue/revenue-verify.sh"
    else
        log_message "⚠️ Revenue verification script not found"
    fi
    log_message "Revenue Cycle Domain 完了"
    echo
}

# システムチェック
pre_flight_check() {
    log_message "=== Pre-Flight Check ==="
    
    # 必要なコマンドの確認
    local required_commands=("bash" "date" "grep" "awk")
    for cmd in "${required_commands[@]}"; do
        if check_command_exists "$cmd"; then
            log_message "✅ $cmd: OK"
        else
            log_message "❌ $cmd: Missing"
            return 1
        fi
    done
    
    # ディレクトリ構造の確認
    local domains=("pharma" "inventory" "revenue")
    for domain in "${domains[@]}"; do
        if [[ -d "${SCRIPT_DIR}/${domain}" ]]; then
            log_message "✅ ${domain} directory: OK"
        else
            log_message "⚠️ ${domain} directory: Missing (optional)"
        fi
    done
    
    log_message "Pre-Flight Check 完了"
    echo
}

# 結果集計
generate_summary() {
    log_message "=== Verification Summary ==="
    
    if [[ -f "${LOG_FILE}" ]]; then
        local total_checks=$(grep -c "検証を実行中" "${LOG_FILE}" || echo "0")
        local completed_domains=$(grep -c "Domain 完了" "${LOG_FILE}" || echo "0")
        local error_count=$(grep -c "❌\|⚠️\|Error" "${LOG_FILE}" || echo "0")
        
        log_message "総チェック数: ${total_checks}"
        log_message "完了ドメイン数: ${completed_domains}"
        log_message "エラー/警告数: ${error_count}"
        log_message "ログファイル: ${LOG_FILE}"
        
        # エラーがある場合にのみ警告
        if [[ ${error_count} -gt 0 ]]; then
            log_message "⚠️  ${error_count}個の問題を検出。詳細はログを確認してください。"
        else
            log_message "✅ 全ての検証を正常に完了しました。"
        fi
    fi
}

# メイン実行
main() {
    log_message "Domain Specialization Verification Suite 開始"
    
    # 前処理チェック
    if ! pre_flight_check; then
        log_message "❌ Pre-Flight Checkに失敗。処理を中止します。"
        exit 1
    fi
    
    # ドメイン別実行
    run_pharma_verification
    run_inventory_verification
    run_revenue_verification
    
    # 結果集計
    generate_summary
    
    log_message "Domain Specialization Verification Suite 完了"
    
    # 終了コード
    if grep -q "❌" "${LOG_FILE}"; then
        exit 1
    else
        exit 0
    fi
}

# スクリプトが直接実行された場合のみmainを実行
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi