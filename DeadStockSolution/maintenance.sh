#!/bin/bash

# DeadStockSolution 定期保守スクリプト
# npm audit + テスト + カバレッジ確認を自動化

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$SCRIPT_DIR"
LOG_DIR="$PROJECT_DIR/logs"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# ログディレクトリ作成
mkdir -p "$LOG_DIR"

# ログファイル
LOG_FILE="$LOG_DIR/maintenance_${TIMESTAMP}.log"

# テスト成功フラグ
TEST_SUCCESS=false

# 関数定義
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

error_exit() {
    log "ERROR: $1"
    exit 1
}

# メイン処理
log "===== DeadStockSolution 定期保守開始 ====="

# ディレクトリ移動
cd "$PROJECT_DIR"

# 1. npm audit 実行
log "1. npm audit 実行中..."
if npm audit --audit-level=moderate; then
    log "✓ npm audit: 脆弱性は Moderate 未満で問題なし"
else
    log "⚠ npm audit: Moderate 以上の脆弱性を検出"
    npm audit --audit-level=moderate || true
fi

# 2. テスト実行
log "2. テスト実行中..."
cd server
# 依存関係のインストールチェック
if [ ! -d "node_modules" ] || [ ! "$(ls -A node_modules 2>/dev/null)" ]; then
    log "⚠ node_modulesが空または不存在: npm installを実行"
    # huskyを無視してインストール
    npm install --ignore-scripts || {
        log "✗ npm install: 失敗（husky関連で失敗する可能性あり）"
        log "⚠ 再試行: --ignore-scripts でインストール"
        npm install --ignore-scripts || {
            log "✗ npm install: 再度失敗"
            cd ..
            error_exit "依存関係のインストールに失敗しました"
        }
    }
    log "✓ npm install: 成功（huskyを無視して完了）"
fi

if npm test; then
    log "✓ テスト: 全て成功"
    TEST_SUCCESS=true
else
    log "✗ テスト: 失敗あり（テストスイートの問題か依存関係不足）"
    log "⚠ テストが失敗しても継続します（パフォーマンスチェックのため）"
fi
cd ..

# 3. カバレッジ確認（テストが成功した場合のみ）
log "3. カバレッジ確認中..."
if [ "$TEST_SUCCESS" = "true" ]; then
    cd server
    if npm run test:coverage; then
        log "✓ カバレッジ: 測定成功"
        
        # カバレッジレポートの要約
        if [ -f "coverage/coverage-summary.json" ]; then
            COVERAGE=$(grep -o '"lines":[0-9.]*' coverage/coverage-summary.json | grep -o '[0-9.]*' | head -1)
            log "✓ 行カバレッジ: ${COVERAGE}%"
            
            # 最低カバレッジ閾値（80%）
            if (( $(echo "$COVERAGE < 80" | bc -l) )); then
                log "⚠ カバレッジが閾値未満: ${COVERAGE}% < 80%"
            fi
        fi
    else
        log "⚠ カバレッジ: 測定失敗（テストが失敗している可能性）"
    fi
    cd ..
else
    log "⚠ カバレッジ: テストが失敗しているためスキップ"
fi

# 4. 依存関係チェック
log "4. 依存関係チェック中..."
if npm outdated; then
    log "✓ 依存関係: 全て最新"
else
    log "⚠ 依存関係: 更新可能なパッケージあり"
    npm outdated || true
fi

# 5. ビルドチェック（frontendがある場合）
if [ -d "client" ]; then
    log "5. Frontend ビルドチェック中..."
    cd client
    if [ ! -d "node_modules" ] || [ ! "$(ls -A node_modules 2>/dev/null)" ]; then
        log "⚠ Frontend node_modulesが空または不存在: npm installを実行"
        npm install --ignore-scripts || {
            log "✗ Frontend npm install: 失敗"
            cd ..
            error_exit "Frontend依存関係のインストールに失敗しました"
        }
        log "✓ Frontend npm install: 成功（huskyを無視して完了）"
    fi
    if npm run build; then
        log "✓ Frontend ビルド: 成功"
    else
        log "✗ Frontend ビルド: 失敗"
        cd ..
        error_exit "Frontend ビルドが失敗しました"
    fi
    cd ..
fi

log "===== 定期保守完了 ====="
log "ログファイル: $LOG_FILE"

# 成功時の終了コード
exit 0