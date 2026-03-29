// トークン管理コーディネーター v2
// session_status経由の正確なデータに基づく管理

const fs = require('fs');
const path = require('path');
const { runPrediction, readTokenSnapshot, writeTokenSnapshot } = require('./token-usage-monitor');

const CONFIG = {
  storagePath: '/Users/yusuke/.openclaw/workspace/systems/token-management',
  stateFile: path.join('/Users/yusuke/.openclaw/workspace/systems/token-management', 'system-state.json'),
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
};

function loadState() {
  try {
    if (fs.existsSync(CONFIG.stateFile)) {
      state = { ...state, ...JSON.parse(fs.readFileSync(CONFIG.stateFile, 'utf8')) };
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

// メイン管理ループ
async function managementLoop(snapshotOverride) {
  loadState();

  const prediction = await runPrediction(snapshotOverride);
  if (!prediction) {
    return { status: 'no_data', message: 'トークンスナップショットがありません' };
  }

  // モード評価
  const targetMode = prediction.recommendedMode;
  const prevMode = state.currentMode;
  let modeChanged = false;
  let alertMessages = [];

  // アラート評価
  const rh = prediction.remainingHours === Infinity ? 999 : prediction.remainingHours;
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
  };
}

// スナップショット注入（OpenClawエージェントから呼び出し用）
function injectSnapshot(sessionStatusData) {
  writeTokenSnapshot({
    timestamp: new Date().toISOString(),
    tokensIn: sessionStatusData.tokensIn || 0,
    tokensOut: sessionStatusData.tokensOut || 0,
    contextSize: sessionStatusData.contextSize || 0,
    contextLimit: sessionStatusData.contextLimit || 203000,
    cacheHitRate: sessionStatusData.cacheHitRate || 0,
    monthlyUsagePercent: sessionStatusData.monthlyUsagePercent || 0,
    fiveHourRemainingPercent: sessionStatusData.fiveHourRemainingPercent || 100,
  });
}

module.exports = {
  managementLoop,
  getCurrentMode,
  setMode,
  injectSnapshot,
  loadState,
  saveState,
  MODE_TABLE,
};
