// トークン管理システムのCronジョブセットアップ
// OpenClawのcronシステムにトークン管理ジョブを登録

const fs = require('fs');

// 設定
const TOKEN_MANAGEMENT_JOBS = [
  {
    id: 'token-management-prediction',
    name: 'token-management-prediction',
    schedule: '0,15,30,45 * * * *', // 15分ごと
    timezone: 'Asia/Tokyo',
    agentId: 'ops-automator',
    sessionKey: 'agent:ops-automator:telegram:direct:5385492291',
    payload: {
      kind: 'agentTurn',
      message: 'トークン使用量を予測し、モード切り替えを評価してください。システムファイル /Users/yusuke/.openclaw/workspace/systems/token-management/token-manager-coordinator.js を実行してください。',
      model: 'zai/glm-5-turbo'
    }
  },
  {
    id: 'token-management-mode-adjustment',
    name: 'token-management-mode-adjustment',
    schedule: '5,20,35,50 * * * *', // 予測実行5分後
    timezone: 'Asia/Tokyo',
    agentId: 'ops-automator',
    sessionKey: 'agent:ops-automator:telegram:direct:5385492291',
    payload: {
      kind: 'agentTurn',
      message: '必要に応じてトークンモードを調整してください。状態に応じて省エネモード、通常モード、高効率モードのいずれかに切り替えてください。ファイル /Users/yusuke/.openclaw/workspace/systems/token-management/token-mode-manager.js を使用してください。',
      model: 'zai/glm-5-turbo'
    }
  },
  {
    id: 'token-management-notification',
    name: 'token-management-notification',
    schedule: '10,25,40,55 * * * *', // 調整実行5分後
    timezone: 'Asia/Tokyo',
    agentId: 'secretariat-hq',
    sessionKey: 'agent:secretariat-hq:telegram:direct:5385492291',
    payload: {
      kind: 'agentTurn',
      message: 'トークン管理システムの状態を確認し、必要に応じて通知を作成してください。状態変化がある場合はCEOセッションに通知してください。/Users/yusuke/.openclaw/workspace/systems/token-management/system-state.json を確認してください。',
      model: 'zai/glm-5-turbo'
    }
  }
];

// 既存のジョバを取得
async function getExistingJobs() {
  try {
    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execAsync = promisify(exec);
    
    const result = await execAsync('openclaw cron list');
    const jobs = result.stdout.split('\n').filter(line => line.trim());
    
    // ヘッダー行を除く
    return jobs.slice(1);
  } catch (error) {
    console.error('既存ジョブ取得エラー:', error);
    return [];
  }
}

// ジョブを作成または更新
async function setupJob(job) {
  try {
    const { exec } = require('child_process');
    const { promisify } = require('util');
    const execAsync = promisify(exec);
    
    // ジョバが存在するか確認
    try {
      await execAsync(`openclaw cron get ${job.id}`);
      // 存在する場合は更新
      const updateCommand = `openclaw cron update ${job.id} --name "${job.name}" --schedule "${job.schedule}" --timezone "${job.timezone}" --agentId "${job.agentId}" --sessionKey "${job.sessionKey}" --payload '${JSON.stringify(job.payload)}'`;
      await execAsync(updateCommand);
      console.log(`ジョブ更新: ${job.name}`);
    } catch (error) {
      // 存在しない場合は作成
      const createCommand = `openclaw cron add --id "${job.id}" --name "${job.name}" --schedule "${job.schedule}" --timezone "${job.timezone}" --agentId "${job.agentId}" --sessionKey "${job.sessionKey}" --payload '${JSON.stringify(job.payload)}'`;
      await execAsync(createCommand);
      console.log(`ジョ作成: ${job.name}`);
    }
  } catch (error) {
    console.error(`ジョブ設定エラー (${job.name}):`, error);
  }
}

// 全てのトークン管理ジョブをセットアップ
async function setupTokenManagementJobs() {
  console.log('トークン管理システムのジョブセットアップを開始...');
  
  for (const job of TOKEN_MANAGEMENT_JOBS) {
    await setupJob(job);
  }
  
  console.log('トークン管理ジョブのセットアップ完了');
}

// ジョブの削除
async function cleanupTokenManagementJobs() {
  console.log('トークン管理ジョブの削除を開始...');
  
  for (const job of TOKEN_MANAGEMENT_JOBS) {
    try {
      const { exec } = require('child_process');
      const { promisify } = require('util');
      const execAsync = promisify(exec);
      
      await execAsync(`openclaw cron remove ${job.id}`);
      console.log(`ジョブ削除: ${job.name}`);
    } catch (error) {
      console.log(`ジョブが存在しないか削除に失敗: ${job.name}`);
    }
  }
  
  console.log('トークン管理ジョブの削除完了');
}

// メイン実行
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    // セットアップモード
    await setupTokenManagementJobs();
  } else if (args[0] === 'cleanup') {
    // クリーンアップモード
    await cleanupTokenManagementJobs();
  } else {
    console.log('使用法:');
    console.log('  node setup-token-management-cron.js    # ジョブセットアップ');
    console.log('  node setup-token-management-cron.js cleanup  # ジョブ削除');
  }
}

// 直接実行
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  setupTokenManagementJobs,
  cleanupTokenManagementJobs,
  TOKEN_MANAGEMENT_JOBS
};