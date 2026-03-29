// トークン管理コーディネーター v3 - 実際のsession_statusデータを使用
// ops-automatorがsession_statusから直接データを取得し、管理する

const fs = require('fs');
const path = require('path');
const { runPrediction, getActualSessionStatus } = require('./token-usage-monitor-v3');

const CONFIG = {
  storagePath: '/Users/yusuke/.openclaw/workspace/systems/token-management',
  stateFile: path.join('/Users/yusuke/.openclaw/workspace/systems/token-management', 'system-state.json'),
  snapshotFile: path.join('/Users/yusuke/.openclaw/workspace/systems/token-management', 'token-snapshot.json'),
  alertThresholds: {
    warningHours: 3,
    stopHours: 1,
    monthlyWarning: 80,
  },
};

// 状態管理
let state = {
  currentMode: 'normal',
  lastCheck: null,
  lastModeChange: null,
  lastAlert: null,
  modeChangeLog: [],
  predictionHistory: [], // 予測履歴
};

function loadState() {
  try {
    if (fs.existsSync(CONFIG.stateFile)) {
      const saved = JSON.parse(fs.readFileSync(CONFIG.stateFile, 'utf8'));
      state = { ...state, ...saved };
    }
  } catch (e) { /* ignore */ }
}

function saveState() {
  state.savedAt = new Date().toISOString();
  fs.writeFileSync(CONFIG.stateFile, JSON.stringify(state, null, 2));
}

// 現在モード取得/設定
function getCurrentMode() { return state.currentMode; }

function setMode(mode, reason) {
  const prev = state.currentMode;
  state.currentMode = mode;
  state.lastModeChange = new Date().toISOString();
  state.modeChangeLog.push({
    from: prev,
    to: mode,
    reason,
    timestamp: state.lastModeChange,
  });
  // 直近20件のみ保持
  if (state.modeChangeLog.length > 20) {
    state.modeChangeLog = state.modeChangeLog.slice(-20);
  }
  saveState();
}

// モード設定テーブル
const MODE_TABLE = {
  energy_saving: {
    name: '省エネモード',
    description: 'トークン消費を33%削減、継続稼働を最優先',
    agentCount: 6,
    intervalMinutes: 7,
    targetConsumptionRate: 8000,
  },
  normal: {
    name: '通常モード',
    description: '標準的な消費パターン、バランス重視',
    agentCount: 8,
    intervalMinutes: 5,
    targetConsumptionRate: 12000,
  },
  high_efficiency: {
    name: '高効率モード',
    description: '高速処理を最優先、消費は33%増',
    agentCount: 10,
    intervalMinutes: 3,
    targetConsumptionRate: 16000,
  },
};

// メイン管理ループ - 実際のsession_statusデータに基づく
async function managementLoop() {
  loadState();

  const prediction = await runPrediction();
  if (!prediction) {
    return { status: 'no_data', message: 'トークンスナップショットがありません' };
  }

  // 予測履歴に保存
  state.predictionHistory.push({
    timestamp: prediction.timestamp,
    mode: prediction.recommendedMode,
    usagePercent: prediction.usagePercent,
    remainingHours: prediction.remainingHours,
  });
  if (state.predictionHistory.length > 50) {
    state.predictionHistory = state.predictionHistory.slice(-50);
  }

  // モード評価
  const targetMode = prediction.recommendedMode;
  const prevMode = state.currentMode;
  let modeChanged = false;
  let alertMessages = [];

  // アラート評価
  const rh = prediction.remainingHours;
  if (rh < CONFIG.alertThresholds.stopHours) {
    alertMessages.push(`🚨 トークン残量停止ライン: 残${rh}時間`);
  } else if (rh < CONFIG.alertThresholds.warningHours) {
    alertMessages.push(`⚠️ トークン残量警告: 残${rh}時間`);
  }
  if (prediction.monthlyUsagePercent >= CONFIG.alertThresholds.monthlyWarning) {
    alertMessages.push(`⚠️ 月間予算警告: ${prediction.monthlyUsagePercent}%`);
  }

  // モード切り替え
  if (targetMode !== prevMode) {
    setMode(targetMode, `自動判定: 推奨モード=${targetMode}`);
    modeChanged = true;
  }

  state.lastCheck = new Date().toISOString();
  saveState();

  const modeConfig = MODE_TABLE[targetMode];

  return {
    status: 'ok',
    timestamp: state.lastCheck,
    previousMode: prevMode,
    currentMode: targetMode,
    modeChanged,
    modeConfig,
    prediction,
    alerts: alertMessages,
    predictionHistory: state.predictionHistory,
  };
}

// session_statusデータをスナップショットとして保存（ops-automatorから呼び出し用）
function saveSnapshot(data) {
  fs.writeFileSync(CONFIG.snapshotFile, JSON.stringify(data, null, 2));
}

// 現在の状態ファイルを取得（デバッグ用）
function getCurrentState() {
  loadState();
  return state;
}

module.exports = {
  managementLoop,
  getCurrentMode,
  setMode,
  saveSnapshot,
  loadState,
  saveState,
  MODE_TABLE,
  getCurrentState,
};