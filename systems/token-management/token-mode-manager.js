// トークンモード管理システム
// トークン使用状況に応じて稼働モードを動的に調整

const fs = require('fs');
const path = require('path');

// モード設定
const MODE_CONFIGS = {
  energy_saving: {
    name: '省エネモード',
    agentCount: 6,
    intervalMinutes: 7,
    consumptionRate: 8000,
    description: 'トークン消費を33%削減、継続稼働を最優先'
  },
  normal: {
    name: '通常モード',
    agentCount: 8,
    intervalMinutes: 5,
    consumptionRate: 12000,
    description: '標準的な消費パターン、バランス重視'
  },
  high_efficiency: {
    name: '高効率モード',
    agentCount: 10,
    intervalMinutes: 3,
    consumptionRate: 16000,
    description: '高速処理を最優先、消費は33%増'
  }
};

// 現在モードの取得
function getCurrentMode() {
  const configFile = '/Users/yusuke/.openclaw/workspace/systems/token-management/current-mode.json';
  
  if (fs.existsSync(configFile)) {
    const config = JSON.parse(fs.readFileSync(configFile, 'utf8'));
    return config.currentMode || 'normal';
  }
  
  return 'normal';
}

// 現在モードの保存
function saveCurrentMode(mode) {
  const configFile = '/Users/yusuke/.openclaw/workspace/systems/token-management/current-mode.json';
  const config = { currentMode: mode, updatedAt: new Date().toISOString() };
  
  fs.writeFileSync(configFile, JSON.stringify(config, null, 2));
}

// サブエージェントの動的調整
async function adjustSubagents(targetMode) {
  const config = MODE_CONFIGS[targetMode];
  if (!config) {
    throw new Error(`不明なモード: ${targetMode}`);
  }
  
  console.log(`${config.name}に切り替え中...`);
  console.log(`エージェント数: ${config.agentCount}, 間隔: ${config.intervalMinutes}分`);
  
  // 1. 全サブエージェントの一時停止
  await pauseAllSubagents();
  
  // 2. エージェント数の調整（実際の実装ではエージェント設定を更新）
  await updateAgentCount(config.agentCount);
  
  // 3. 実行間隔の調整（cronジョブの更新）
  await updateExecutionInterval(config.intervalMinutes);
  
  // 4. モード設定の保存
  saveCurrentMode(targetMode);
  
  console.log('モード切り替え完了');
  return config;
}

// サブエージェントの一時停止
async function pauseAllSubagents() {
  // 実際の実装では、各サブエージェントのセッションを一時停止
  // ここではダミー実装
  console.log('全サブエージェントを一時停止...');
  
  // 実際の実装例:
  // const subagents = await listSubagents();
  // for (const agent of subagents) {
  //   await stopSubagent(agent.id);
  // }
  
  await new Promise(resolve => setTimeout(resolve, 5000)); // 5秒待機
  console.log('サブエージェント停止完了');
}

// エージェント数の更新
async function updateAgentCount(targetCount) {
  console.log(`エージェント数を ${targetCount} に調整...`);
  
  // 実際の実装では、エージェントの起動/停止を制御
  // ここではダミー実装
  await new Promise(resolve => setTimeout(resolve, 3000)); // 3秒待機
  
  console.log(`エージェント数調整完了: ${targetCount}体`);
}

// 実行間隔の更新
async function updateExecutionInterval(minutes) {
  console.log(`実行間隔を ${minutes} 分に調整...`);
  
  // 実際の実装では、cronジョブのスケジュールを更新
  // ここではダミー実装
  await new Promise(resolve => setTimeout(resolve, 2000)); // 2秒待機
  
  console.log(`実行間隔調整完了: ${minutes}分間隔`);
}

// モード切り替えの実行
async function changeMode(targetMode, reason = '') {
  try {
    const currentMode = getCurrentMode();
    
    if (currentMode === targetMode) {
      console.log(`既に${MODE_CONFIGS[targetMode].name}です`);
      return;
    }
    
    console.log(`モード切り替え開始: ${MODE_CONFIGS[currentMode].name} → ${MODE_CONFIGS[targetMode].name}`);
    if (reason) {
      console.log(`理由: ${reason}`);
    }
    
    const config = await adjustSubagents(targetMode);
    
    return {
      success: true,
      fromMode: currentMode,
      toMode: targetMode,
      config: config,
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('モード切り替え失敗:', error);
    return {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

// 緊急時対応
async function emergencyAction(action) {
  switch (action) {
    case 'stop_all':
      console.log('緊急停止: 全サブエージェント停止');
      await pauseAllSubagents();
      break;
      
    case 'force_energy_saving':
      console.log('緊急対応: 強制的に省エネモードへ');
      await changeMode('energy_saving', '緊急省エネモード');
      break;
      
    default:
      throw new Error(`不明な緊急アクション: ${action}`);
  }
}

// 状態監視
function monitorSystemState() {
  return {
    currentMode: getCurrentMode(),
    timestamp: new Date().toISOString(),
    config: MODE_CONFIGS[getCurrentMode()]
  };
}

// モード設定の取得
function getModeConfig(mode) {
  return MODE_CONFIGS[mode] || MODE_CONFIGS.normal;
}

// 全モード情報の取得
function getAllModes() {
  return Object.keys(MODE_CONFIGS).map(key => ({
    key,
    name: MODE_CONFIGS[key].name,
    description: MODE_CONFIGS[key].description,
    agentCount: MODE_CONFIGS[key].agentCount,
    intervalMinutes: MODE_CONFIGS[key].intervalMinutes,
    consumptionRate: MODE_CONFIGS[key].consumptionRate
  }));
}

// メイン実行（テスト用）
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('使用法:');
    console.log('  node token-mode-manager.js <mode> [reason]');
    console.log('  node token-mode-manager.js emergency <action>');
    console.log('');
    console.log('モード:', getAllModes().map(m => `${m.key}: ${m.name}`).join(', '));
    console.log('緊急アクション: stop_all, force_energy_saving');
    return;
  }
  
  const command = args[0];
  
  if (command === 'emergency') {
    const action = args[1];
    await emergencyAction(action);
  } else {
    const mode = command;
    const reason = args.slice(1).join(' ');
    await changeMode(mode, reason);
  }
}

// 直接実行
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  getCurrentMode,
  saveCurrentMode,
  changeMode,
  emergencyAction,
  monitorSystemState,
  getModeConfig,
  getAllModes
};