// トークン管理システムセットアップ v3
// 実際のsession_statusデータを使用するバージョン

const fs = require('fs');
const path = require('path');
const { managementLoop, getCurrentState } = require('./token-manager-coordinator-v3');
const { saveSnapshot } = require('./fetch-token-snapshot');

const CONFIG = {
  storagePath: '/Users/yusuke/.openclaw/workspace/systems/token-management',
  snapshotFile: path.join('/Users/yusuke/.openclaw/workspace/systems/token-management', 'token-snapshot.json'),
  stateFile: path.join('/Users/yusuke/.openclaw/workspace/systems/token-management', 'system-state.json'),
  cronJobFile: path.join('/Users/yusuke/.openclaw/workspace/systems/token-management', 'cron-jobs.json'),
};

// スナップショット取得ジョブ
const SNAPSHOT_JOB = {
  id: 'token-management-snapshot-v3',
  name: 'token-management-snapshot-v3',
  schedule: {
    kind: 'cron',
    expr: '*/15 * * * *',
    tz: 'Asia/Tokyo'
  },
  payload: {
    kind: 'agentTurn',
    message: '【トークン管理スナップショット v3】\n以下のコマンドを実行して、実際のsession_statusデータを取得し保存してください:\n\nnode /Users/yusuke/.openclaw/workspace/systems/token-management/fetch-token-snapshot.js\n\nこのコマンドは:\n1. openclaw session_status を実行\n2. 実際のトークン使用量データを取得\n3. token-snapshot.json に保存\n\n実行後、システムはそのデータを自動的に読み取ります。',
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
  id: 'token-management-evaluation-v3',
  name: 'token-management-evaluation-v3',
  schedule: {
    kind: 'cron',
    expr: '*/15 * * * *',
    tz: 'Asia/Tokyo'
  },
  payload: {
    kind: 'agentTurn',
    message: '【トークン管理評価 v3】\n実際のsession_statusデータに基づいたトークン管理を実行してください。\n\n実行手順:\n1. /Users/yusuke/.openclaw/workspace/systems/token-management/token-snapshot.json を読み込む\n2. 以下のデータを取得:\n   - tokensIn / contextLimit = 使用率(%)\n   - fiveHourRemainingPercent = 5時間枠残量\n   - monthlyUsagePercent = 月間使用率\n3. モード判定:\n   - monthlyUsage >= 80% or 残時間 < 3時間 → energy_saving\n   - monthlyUsage < 20% and 残時間 > 12時間 → high_efficiency\n   - それ以外 → normal\n4. /Users/yusuke/.openclaw/workspace/systems/token-management/system-state.json を更新\n   currentModeが変更された場合のみ更新\n5. モード変更があった場合のみCEOセッションに報告（メッセージ送信不要）\n\n静かに実行してください。報告不要の場合は何も出力しない。',
    timeoutSeconds: 60
  },
  sessionTarget: 'isolated',
  agentId: 'ops-automator',
  delivery: {
    mode: 'none'
  }
};

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
    predictionHistory: []
  };

  fs.writeFileSync(CONFIG.stateFile, JSON.stringify(initialState, null, 2));
  console.log('初期状態ファイルを作成しました');
}

// システムテスト
async function testSystem() {
  console.log('トークン管理システムテストを開始...');

  try {
    // スナップショット取得のテスト
    console.log('1. スナップショット取得テスト...');
    const snapshot = await saveSnapshot();
    console.log('   ✅ スナップショット取得成功');

    // 評価ループのテスト
    console.log('2. 評価ループテスト...');
    const result = await managementLoop();
    console.log(`   ✅ 評価ループ成功: ${result.status}`);
    console.log(`   現在モード: ${result.currentMode}`);
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
  console.log('トークン管理システム v3 セットアップを開始...');

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
  console.log('次のステップ:');
  console.log('1. 以下のコマンドでCronジョブを登録してください:');
  console.log('   openclaw cron add --id ' + SNAPSHOT_JOB.id + ' --payload "' + JSON.stringify(SNAPSHOT_JOB.payload) + '"');
  console.log('   openclaw cron add --id ' + EVALUATION_JOB.id + ' --payload "' + JSON.stringify(EVALUATION_JOB.payload) + '"');
  console.log('2. または、Cronジョブ設定ファイルから手動で登録してください');
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