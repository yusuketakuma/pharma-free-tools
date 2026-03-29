// トークンデータ保存スクリプト
const fs = require('fs');
const path = require('path');
const { saveSnapshot } = require('./token-usage-monitor-v4');

// 現在のトークンデータを推定して保存
const currentData = {
  timestamp: new Date().toISOString(),
  tokensIn: 180000, // 実際の使用量に調整
  tokensOut: 178000,
  contextSize: 170000,
  contextLimit: 203000,
  cacheHitRate: 0.82,
  monthlyUsagePercent: 42,
  fiveHourRemainingPercent: 75,
};

saveSnapshot(currentData);
console.log('トークンデータを保存しました');
