// トークン使用量監視システム v2
// OpenClawのsession_statusデータをファイル経由で取得し、正確に予測する

const fs = require('fs');
const path = require('path');

const CONFIG = {
  storagePath: '/Users/yusuke/.openclaw/workspace/systems/token-management',
  currentSessionFile: path.join('/Users/yusuke/.openclaw/workspace/systems/token-management', 'current-session.json'),
  historyFile: path.join('/Users/yusuke/.openclaw/workspace/systems/token-management', 'history.json'),
  snapshotFile: path.join('/Users/yusuke/.openclaw/workspace/systems/token-management', 'token-snapshot.json'),
};

// OpenClawから取得されたトークンスナップショットを読み込む
function readTokenSnapshot() {
  try {
    if (fs.existsSync(CONFIG.snapshotFile)) {
      return JSON.parse(fs.readFileSync(CONFIG.snapshotFile, 'utf8'));
    }
  } catch (e) {
    // ignore
  }
  return null;
}

// トークンスナップショットを書き込む（外部から呼び出し用）
function writeTokenSnapshot(data) {
  data._writtenAt = new Date().toISOString();
  fs.writeFileSync(CONFIG.snapshotFile, JSON.stringify(data, null, 2));
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
  // 直近200件まで保持
  if (history.length > 200) {
    history = history.slice(-200);
  }
  fs.writeFileSync(CONFIG.historyFile, JSON.stringify(history, null, 2));
}

// 消費速度計算 (tokens/時間)
function calculateRate(history) {
  if (history.length < 2) return null;

  // 直近のスナップショットから消費速度を計算
  const now = history[history.length - 1];
  const prev = history[history.length - 2];

  if (!now.timestamp || !prev.timestamp) return null;

  const timeDiffHours = (new Date(now.timestamp) - new Date(prev.timestamp)) / (1000 * 60 * 60);
  if (timeDiffHours <= 0) return null;

  const tokensDiff = now.tokensIn - prev.tokensIn;
  return Math.round(tokensDiff / timeDiffHours);
}

// 予測残時間計算
function calculateRemainingHours(currentTokens, contextLimit, rate) {
  if (!rate || rate <= 0) return Infinity;
  const remaining = contextLimit - currentTokens;
  // 10%バッファを差し引く
  const usable = remaining * 0.9;
  return Math.round(usable / rate * 10) / 10;
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

// メイン予測関数
async function runPrediction(snapshotOverride) {
  const snapshot = snapshotOverride || readTokenSnapshot();
  if (!snapshot) {
    console.error('トークンスナップショットがありません');
    return null;
  }

  const history = readHistory();

  // 現在エントリを作成
  const current = {
    timestamp: snapshot.timestamp || new Date().toISOString(),
    tokensIn: snapshot.tokensIn || 0,
    tokensOut: snapshot.tokensOut || 0,
    contextSize: snapshot.contextSize || 0,
    contextLimit: snapshot.contextLimit || 203000,
    cacheHitRate: snapshot.cacheHitRate || 0,
    monthlyUsagePercent: snapshot.monthlyUsagePercent || 0,
    fiveHourRemainingPercent: snapshot.fiveHourRemainingPercent || 100,
  };

  // 消費速度計算
  const rate = calculateRate([...history, current]);

  // 残時間計算
  const remainingHours = calculateRemainingHours(
    current.tokensIn,
    current.contextLimit,
    rate || 12000 // フォールバック: 12k/時間
  );

  // モード判定
  const recommendedMode = determineMode(
    remainingHours === Infinity ? 999 : remainingHours,
    current.monthlyUsagePercent
  );

  const prediction = {
    timestamp: current.timestamp,
    tokensIn: current.tokensIn,
    tokensOut: current.tokensOut,
    contextSize: current.contextSize,
    contextLimit: current.contextLimit,
    usagePercent: Math.round(current.tokensIn / current.contextLimit * 1000) / 10,
    consumptionRate: rate,
    consumptionRatePerHour: rate ? Math.round(rate / 1000 * 10) / 10 : null, // k/時間
    remainingHours: remainingHours,
    recommendedMode,
    monthlyUsagePercent: current.monthlyUsagePercent,
    fiveHourRemainingPercent: current.fiveHourRemainingPercent,
    historyCount: history.length,
  };

  // 履歴に保存
  saveToHistory(current);

  // 現在状態を保存
  fs.writeFileSync(CONFIG.currentSessionFile, JSON.stringify(prediction, null, 2));

  console.log(`トークン予測: ${prediction.recommendedMode} | 消費 ${prediction.consumptionRatePerHour || '?'}k/時 | 残 ${remainingHours === Infinity ? '∞' : remainingHours + '時間'} | 使用率 ${prediction.usagePercent}%`);

  return prediction;
}

// モジュールエクスポート
module.exports = { runPrediction, readTokenSnapshot, writeTokenSnapshot, calculateRate, determineMode, readHistory };
