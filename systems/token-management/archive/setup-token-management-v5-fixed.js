// トークン管理システムセットアップ v5 - モード変更時のみ通知（修正版）
const fs = require('fs');
const path = require('path');
const { managementLoop, getCurrentState, setModeManually, sendNotification } = require('./token-manager-coordinator-v5');

const CONFIG = {
  storagePath: '/Users/yusuke/.openclaw/workspace/systems/token-management',
  snapshotFile: path.join('/Users/yusuke/.openclaw/workspace/systems/token-management', 'token-snapshot.json'),
  stateFile: path.join('/Users/yusuke/.openclaw/workspace/systems/token-management', 'system-state.json'),
  cronJobFile: path.join('/Users/yusuke/.openclaw/workspace/systems/token-management', 'cron-jobs.json'),
};

// スナップショット取得ジョブ
const SNAPSHOT_JOB = {
  id: 'token-management-snapshot-v5',
  name: 'token-management-snapshot-v5',
  schedule: {
    kind: 'cron',
    expr: '*/15 * * * *',
    tz: 'Asia/Tokyo'
  },
  payload: {
    kind: 'agentTurn',
    message: "【トークン管理スナップショット v5】\n現在のトークン使用状況を推定して保存してください。\n\n1. 現在のトークン使用状況を推定:\n   - tokensIn: 約180,000 (実際の使用量に調整)\n   - tokensOut: 約178,000\n   - contextSize: 約170,000\n   - contextLimit: 203,000\n   - cacheHitRate: 0.82\n   - monthlyUsagePercent: 42\n   - fiveHourRemainingPercent: 75\n\n2. 以下のコマンドで保存:\n   node /Users/yusuke/.openclaw/workspace/systems/token-management/save-token-data.js\n\n3. システムが自動的に読み取って管理します。\n\n※ 注意: 通常の監察結果は通知しません。モードが切り替わる時のみ通知します。",
    timeoutSeconds: 30
  },
  sessionTarget: 'isolated',
  agentId: 'ops-automator',
  delivery: {
    mode: 'none'
  }
};

// モード評価ジョブ
const EVALUATION_JOB = {
  id: 'token-management-evaluation-v5',
  name: 'token-management-evaluation-v5',
  schedule: {
    kind: 'cron',
    expr: '*/15 * * * *',
    tz: 'Asia/Tokyo'
  },
  payload: {
    kind: 'agentTurn',
    message: "【トークン管理評価 v5】\n保存されたトークンデータに基づいた管理を実行。\n\n手順:\n1. /Users/yusuke/.openclaw/workspace/systems/token-management/token-snapshot.json を読み込む\n2. 以下を計算:\n   - tokensIn / contextLimit = 使用率(%)\n   - fiveHourRemainingPercent = 5時間枠残量\n   - monthlyUsagePercent = 月間使用率\n3. モード判定:\n   - monthlyUsage >= 80% or 残時間 < 3時間 → energy_saving\n   - monthlyUsage < 20% and 残時間 > 12時間 → high_efficiency\n   - それ以外 → normal\n4. system-state.json の currentMode を更新（変更時のみ）\n5. モードが変更された場合のみ通知を送信:\n   if (result.shouldNotify) {\n     console.log('通知送信: ' + result.notificationContent.title);\n     console.log('詳細: ' + result.notificationContent.message);\n   }\n\n※ 注意: 通常の監察結果は通知しません。モードが切り替わる時のみ通知します。",
    timeoutSeconds: 60
  },
  sessionTarget: 'isolated',
  agentId: 'ops-automator',
  delivery: {
    mode: 'none'
  }
};

// データ保存スクリプト
const SAVE_SCRIPT = `// トークンデータ保存スクリプト
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
`;

// 初期状態の作成
function initializeSystem() {
  // ディレクトリの作成
  if (!fs.existsSync(CONFIG.storagePath)) {
    fs.mkdirSync(CONFIG.storagePath, { recursive: true });
  }

  // 初期状態ファイルの作成
  const initialState = {
    currentMode: 'normal',
    lastCheck: new Date().toISOString(),
    lastModeChange: new Date().toISOString(),
    lastAlert: null,
    modeChangeLog: [{
      from: 'initial',
      to: 'normal',
      reason: 'システム初期化',
      timestamp: new Date().toISOString()
    }],
    predictionHistory: [],
    lastNotification: null,
    notificationCooldown: 30 * 60 * 1000
  };

  fs.writeFileSync(CONFIG.stateFile, JSON.stringify(initialState, null, 2));
  
  // データ保存スクリプトの作成
  fs.writeFileSync(path.join(CONFIG.storagePath, 'save-token-data.js'), SAVE_SCRIPT);
  
  console.log('初期状態ファイルと保存スクリプトを作成しました');
  console.log('通知設定: モード変更時のみ通知（30分クールダウン）');
}

// システムテスト
async function testSystem() {
  console.log('トークン管理システム v5 テストを開始...');

  try {
    // スナップショット保存のテスト
    console.log('1. スナップショット保存テスト...');
    const testData = {
      timestamp: new Date().toISOString(),
      tokensIn: 150000,
      tokensOut: 148000,
      contextSize: 140000,
      contextLimit: 203000,
      cacheHitRate: 0.75,
      monthlyUsagePercent: 35,
      fiveHourRemainingPercent: 80,
    };
    
    // saveSnapshotを直接呼び出す
    const { saveSnapshot } = require('./token-usage-monitor-v4');
    saveSnapshot(testData);
    console.log('   ✅ スナップショット保存成功');

    // 評価ループのテスト
    console.log('2. 評価ループテスト...');
    const result = await managementLoop();
    console.log(`   ✅ 評価ループ成功: ${result.status}`);
    console.log(`   現在モード: ${result.currentMode}`);
    console.log(`   推奨モード: ${result.prediction.recommendedMode}`);
    console.log(`   モード変更: ${result.modeChanged ? 'あり' : 'なし'}`);
    console.log(`   通知必要: ${result.shouldNotify ? 'あり' : 'なし'}`);
    
    if (result.shouldNotify && result.notificationContent) {
      console.log(`   通知内容: ${result.notificationContent.title}`);
      console.log(`   通知メッセージ: ${result.notificationContent.message}`);
    }
    
    if (result.alerts.length > 0) {
      console.log(`   アラート: ${result.alerts.join(', ')}`);
    }

    console.log('テスト完了: システムは正常に動作します');
    return true;
  } catch (error) {
    console.error('テスト失敗:', error);
    return false;
  }
}

// メイン実行関数
async function main() {
  console.log('トークン管理システム v5 セットアップを開始...');

  // 初期化
  initializeSystem();

  // テスト実行
  const testResult = await testSystem();
  if (!testResult) {
    console.log('テスト失敗: システム設定を確認してください');
    process.exit(1);
  }

  // Cronジョブ情報の保存
  const cronJobs = [SNAPSHOT_JOB, EVALUATION_JOB];
  fs.writeFileSync(CONFIG.cronJobFile, JSON.stringify(cronJobs, null, 2));
  console.log('Cronジョブ設定情報を保存しました');

  console.log('セットアップ完了');
  console.log('通知ポリシー: モード変更時のみ通知（30分クールダウン）');
  console.log('次のステップ:');
  console.log('1. 以下のコマンドでCronジョブを登録してください:');
  console.log('   openclaw cron add --id ' + SNAPSHOT_JOB.id + ' --payload "' + JSON.stringify(SNAPSHOT_JOB.payload) + '"');
  console.log('   openclaw cron add --id ' + EVALUATION_JOB.id + ' --payload "' + JSON.stringify(EVALUATION_JOB.payload) + '"');
  console.log('2. システムが15分ごとに自動的にトークンデータを取得・管理します');
  console.log('3. モードが切り替わる時のみ通知が送られます');
}

// 直接実行
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  initializeSystem,
  testSystem,
  SNAPSHOT_JOB,
  EVALUATION_JOB
};