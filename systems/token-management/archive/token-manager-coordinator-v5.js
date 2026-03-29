// トークン管理コーディネーター v5 - モード変更時のみ通知
const fs = require('fs');
const path = require('path');
const { runPrediction, saveSnapshot } = require('./token-usage-monitor-v4');

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
  predictionHistory: [],
  lastNotification: null, // 最後の通知時刻
  notificationCooldown: 30 * 60 * 1000, // 30分の通知クールダウン
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

// 通知を送るべきか判定
function shouldSendNotification() {
  const now = new Date().getTime();
  if (!state.lastNotification) {
    return true; // 初回通知
  }
  return (now - state.lastNotification) > state.notificationCooldown;
}

// 通知を記録
function recordNotification() {
  state.lastNotification = new Date().getTime();
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

// メイン管理ループ - モード変更時のみ通知
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
  let shouldNotify = false;
  let notificationContent = null;
  let alertMessages = [];

  // アラート評価
  const rh = prediction.remainingHours;
  if (rh < CONFIG.alertThresholds.stopHours) {
    alertMessages.push(`🚨 トークン残量停止ライン: 残${rh}時間`);
  } else if (rh < CONFIG.alertThresholds.warningHours) {
    alertMessages.push(`⚠️ トークン残量警告: 残${rh}時間`);
  }
  if (prediction.monthlyUsagePercent >= CONFIG.alertThresholds.monthlyWarning) {
    alertMessages.push(`⚠️ 月間予算警告: ${prediction.monthlyPercent}%`);
  }

  // モード切り替え
  if (targetMode !== prevMode) {
    setMode(targetMode, `自動判定: 推奨モード=${targetMode}`);
    modeChanged = true;
    
    // 通知の必要性を判定
    if (shouldSendNotification()) {
      shouldNotify = true;
      notificationContent = createModeChangeNotification(prevMode, targetMode, prediction);
      recordNotification();
    }
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
    shouldNotify,
    notificationContent,
    modeConfig,
    prediction,
    alerts: alertMessages,
    predictionHistory: state.predictionHistory,
  };
}

// モード変更通知を作成
function createModeChangeNotification(prevMode, currentMode, prediction) {
  const prevConfig = MODE_TABLE[prevMode];
  const currentConfig = MODE_TABLE[currentMode];
  
  return {
    title: `🔄 トークン管理モード変更`,
    message: `モードが「${prevConfig.name}」から「${currentConfig.name}」に切り替わりました`,
    details: {
      from: prevMode,
      to: currentMode,
      reason: `自動判定: 推奨モード=${currentMode}`,
      timestamp: new Date().toISOString(),
      usagePercent: prediction.usagePercent,
      remainingHours: prediction.remainingHours,
      monthlyUsagePercent: prediction.monthlyUsagePercent,
      agentCount: currentConfig.agentCount,
      intervalMinutes: currentConfig.intervalMinutes,
      targetConsumptionRate: currentConfig.targetConsumptionRate,
    }
  };
}

// 通知を送信（ops-automatorから呼び出し用）
async function sendNotification(notification) {
  // ここで実際の通知処理を実装
  console.log('送信通知:', notification.title);
  console.log('詳細:', notification.message);
  console.log('データ:', notification.details);
}

// スナップショットを保存（ops-automatorから呼び出し用）
function saveSnapshotWithData(data) {
  saveSnapshot(data);
}

// 現在の状態を取得
function getCurrentState() {
  loadState();
  return state;
}

// モードを手動設定（デバッグ用）
function setModeManually(mode, reason = '手動設定') {
  setMode(mode, reason);
}

// 通知クールダウンを設定（デバッグ用）
function setNotificationCooldown(minutes) {
  state.notificationCooldown = minutes * 60 * 1000;
  saveState();
}

module.exports = {
  managementLoop,
  getCurrentMode,
  setMode,
  saveSnapshotWithData,
  loadState,
  saveState,
  MODE_TABLE,
  getCurrentState,
  setModeManually,
  sendNotification,
  setNotificationCooldown,
};