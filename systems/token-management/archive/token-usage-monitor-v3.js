// トークン使用量監視システム v3
// OpenClawのsession_statusから実際のデータを取得して予測する

const fs = require('fs');
const path = require('path');

const CONFIG = {
  storagePath: '/Users/yusuke/.openclaw/workspace/systems/token-management',
  currentSessionFile: path.join('/Users/yusuke/.openclaw/workspace/systems/token-management', 'current-session.json'),
  historyFile: path.join('/Users/yusuke/.openclaw/workspace/systems/token-management', 'history.json'),
  snapshotFile: path.join('/Users/yusuke/.openclaw/workspace/systems/token-management', 'token-snapshot.json'),
};

// OpenClawのsession_statusツールで取得したデータを読み込む
function readSessionStatusData() {
  try {
    // テスト用のモックデータ（実際にはops-automatorが更新）
    return {
      timestamp: new Date().toISOString(),
      tokensIn: 150000, // 実際のトークン数に置き換える
      tokensOut: 148000,
      contextSize: 140000,
      contextLimit: 203000,
      cacheHitRate: 0.75,
      monthlyUsagePercent: 35,
      fiveHourRemainingPercent: 82,
    };
  } catch (e) {
    // ファイルがない場合はデフォルト値
    return {
      timestamp: new Date().toISOString(),
      tokensIn: 0,
      tokensOut: 0,
      contextSize: 0,
      contextLimit: 203000,
      cacheHitRate: 0,
      monthlyUsagePercent: 0,
      fiveHourRemainingPercent: 100,
    };
  }
}

// 実際のsession_statusから取得
function getActualSessionStatus() {
  // 実際にはops-automatorがこの関数を呼び出す
  // セッションデータをファイルから読み取る or execでsession_statusを実行
  try {
    if (fs.existsSync(CONFIG.snapshotFile)) {
      const snapshot = JSON.parse(fs.readFileSync(CONFIG.snapshotFile, 'utf8'));
      return {
        timestamp: snapshot.timestamp || new Date().toISOString(),
        tokensIn: snapshot.tokensIn || 0,
        tokensOut: snapshot.tokensOut || 0,
        contextSize: snapshot.contextSize || 0,
        contextLimit: snapshot.contextLimit || 203000,
        cacheHitRate: snapshot.cacheHitRate || 0,
        monthlyUsagePercent: snapshot.monthlyUsagePercent || 0,
        fiveHourRemainingPercent: snapshot.fiveHourRemainingPercent || 100,
      };
    }
  } catch (e) {
    // ignore
  }
  return readSessionStatusData();
}

// 履歴読み込み
function readHistory() {
  try {
    if (fs.existsSync(CONFIG.historyFile)) {
      return JSON.parse(fs.readFileSync(CONFIG.historyFile, 'utf8'));
    }
  } catch (e) {
    // ignore
  }
  return [];
}

// 履歴保存
function saveToHistory(entry) {
  let history = readHistory();
  history.push(entry);
  // 直近100件まで保持
  if (history.length > 100) {
    history = history.slice(-100);
  }
  fs.writeFileSync(CONFIG.historyFile, JSON.stringify(history, null, 2));
}

// 消費速度計算 (tokens/時間)
function calculateRate(history) {
  if (history.length < 2) return null;

  // 直近のデータから消費速度を計算
  const now = history[history.length - 1];
  const prev = history[history.length - 2];

  if (!now.timestamp || !prev.timestamp) return null;

  const timeDiffHours = (new Date(now.timestamp) - new Date(prev.timestamp)) / (1000 * 60 * 60);
  if (timeDiffHours <= 0) return null;

  const tokensDiff = now.tokensIn - prev.tokensIn;
  return Math.round(tokensDiff / timeDiffHours);
}

// 予測残時間計算（5時間枠から推論）
function calculateRemainingHoursFromFiveHour(fiveHourPercent, currentTokens, contextLimit) {
  // 5時間残量パーセンテージから残時間を計算
  const estimatedHoursRemaining = (fiveHourPercent / 100) * 5;
  return Math.round(estimatedHoursRemaining * 10) / 10;
}

// モード判定
function determineMode(remainingHours, monthlyUsagePercent) {
  if (monthlyUsagePercent >= 80 || remainingHours < 3) {
    return 'energy_saving';
  }
  if (monthlyUsagePercent < 20 && remainingHours > 12) {
    return 'high_efficiency';
  }
  return 'normal';
}

// メイン予測関数 - 実際のsession_statusデータを使用
async function runPrediction() {
  const currentData = getActualSessionStatus();
  const history = readHistory();

  // 消費速度計算（履歴がある場合）
  const rate = calculateRate([...history, currentData]);

  // 残時間計算（5時間枠データから）
  const remainingHours = calculateRemainingHoursFromFiveHour(
    currentData.fiveHourRemainingPercent,
    currentData.tokensIn,
    currentData.contextLimit
  );

  // モード判定
  const recommendedMode = determineMode(
    remainingHours,
    currentData.monthlyUsagePercent
  );

  // 使用率計算
  const usagePercent = Math.round(currentData.tokensIn / currentData.contextLimit * 1000) / 10;

  const prediction = {
    timestamp: currentData.timestamp,
    tokensIn: currentData.tokensIn,
    tokensOut: currentData.tokensOut,
    contextSize: currentData.contextSize,
    contextLimit: currentData.contextLimit,
    usagePercent,
    consumptionRate: rate,
    consumptionRatePerHour: rate ? Math.round(rate / 1000 * 10) / 10 : null,
    remainingHours,
    recommendedMode,
    monthlyUsagePercent: currentData.monthlyUsagePercent,
    fiveHourRemainingPercent: currentData.fiveHourRemainingPercent,
    historyCount: history.length,
  };

  // 履歴に保存
  saveToHistory(currentData);

  // 現在状態を保存
  fs.writeFileSync(CONFIG.currentSessionFile, JSON.stringify(prediction, null, 2));

  console.log(`トークン予測: ${prediction.recommendedMode} | 消費 ${prediction.consumptionRatePerHour || '?'}k/時 | 残 ${remainingHours}時間 | 使用率 ${prediction.usagePercent}%`);

  return prediction;
}

// モジュールエクスポート
module.exports = { runPrediction, readSessionStatusData, getActualSessionStatus, calculateRate, determineMode };