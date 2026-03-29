// トークン管理システムセットアップ v6 - 完全通知停止
const fs = require('fs');
const path = require('path');
const { managementLoop } = require('./token-manager-coordinator-v6');

const CONFIG = {
  storagePath: '/Users/yusuke/.openclaw/workspace/systems/token-management',
  stateFile: path.join('/Users/yusuke/.openclaw/workspace/systems/token-management', 'system-state.json'),
  cronJobFile: path.join('/Users/yusuke/.openclaw/workspace/systems/token-management', 'cron-jobs.json'),
};

// スナップショット取得ジョブ - 通知一切なし
const SNAPSHOT_JOB = {
  id: 'token-management-snapshot-v6',
  name: 'token-management-snapshot-v6',
  schedule: {
    kind: 'cron',
    expr: '*/15 * * * *',
    tz: 'Asia/Tokyo'
  },
  payload: {
    kind: 'agentTurn',
    message: "トークン管理スナップショット更新。node /Users/yusuke/.openclaw/workspace/systems/token-management/save-token-data.js を実行してトークンデータを保存。通知は一切不要。静かに終了すること。",
    timeoutSeconds: 30
  },
  sessionTarget: 'isolated',
  agentId: 'ops-automator',
  delivery: {
    mode: 'none'
  }
};

// モード評価ジョブ - 通知一切なし
const EVALUATION_JOB = {
  id: 'token-management-evaluation-v6',
  name: 'token-management-evaluation-v6',
  schedule: {
    kind: 'cron',
    expr: '*/15 * * * *',
    tz: 'Asia/Tokyo'
  },
  payload: {
    kind: 'agentTurn',
    message: "トークン管理評価。/Users/yusuke/.openclaw/workspace/systems/token-management/token-snapshot.json を読み込み、モード判定を実行し、結果を system-state.json に記録。通知は一切不要。静かに終了すること。",
    timeoutSeconds: 60
  },
  sessionTarget: 'isolated',
  agentId: 'ops-automator',
  delivery: {
    mode: 'none'
  }
};

function initializeSystem() {
  if (!fs.existsSync(CONFIG.storagePath)) {
    fs.mkdirSync(CONFIG.storagePath, { recursive: true });
  }

  const initialState = {
    currentMode: 'normal',
    lastCheck: new Date().toISOString(),
    lastModeChange: new Date().toISOString(),
    modeChangeLog: [{
      from: 'initial',
      to: 'normal',
      reason: 'システム初期化',
      timestamp: new Date().toISOString()
    }],
    predictionHistory: [],
  };

  fs.writeFileSync(CONFIG.stateFile, JSON.stringify(initialState, null, 2));
  console.log('初期化完了 - 通知: 完全停止');
}

async function testSystem() {
  console.log('テスト開始...');
  const { saveSnapshot } = require('./token-usage-monitor-v4');
  
  saveSnapshot({
    timestamp: new Date().toISOString(),
    tokensIn: 150000,
    tokensOut: 148000,
    contextSize: 140000,
    contextLimit: 203000,
    cacheHitRate: 0.75,
    monthlyUsagePercent: 35,
    fiveHourRemainingPercent: 80,
  });

  const result = await managementLoop();
  console.log(`モード: ${result.currentMode} | 変更: ${result.modeChanged} | 通知: なし`);
  console.log('テスト完了');
  return true;
}

async function main() {
  initializeSystem();
  await testSystem();
  
  fs.writeFileSync(CONFIG.cronJobFile, JSON.stringify([SNAPSHOT_JOB, EVALUATION_JOB], null, 2));
  console.log('セットアップ完了 - 通知ポリシー: 完全停止');
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { SNAPSHOT_JOB, EVALUATION_JOB, initializeSystem, testSystem };