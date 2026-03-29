// トークン管理システムの自己改善ループセットアップ
// 既存システムとの統合と初期化を実施

const fs = require('fs');
const path = require('path');
const cron = require('./cron-jobs.json');

const CONFIG = {
  storagePath: '/Users/yusuke/.openclaw/workspace/systems/token-management',
  selfImprovementFile: path.join('/Users/yusuke/.openclaw/workspace/systems/token-management', 'self-improvement.json'),
  systemStateFile: path.join('/Users/yusuke/.openclaw/workspace/systems/token-management', 'system-state.json'),
  reportsPath: path.join('/Users/yusuke/.openclaw/workspace/reports/loops'),
};

// レポートディレクトリ作成
function ensureDirectories() {
  const dirs = [CONFIG.reportsPath];
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`Created directory: ${dir}`);
    }
  });
}

// 自己改善状態ファイルの初期化
function initializeSelfImprovementState() {
  const initialState = {
    lastReview: null,
    lastImprovement: null,
    improvementCount: 0,
    weeklyMetrics: {},
    monthlyMetrics: {},
    activeProposals: [],
    createdAt: new Date().toISOString(),
    version: '2.0'
  };
  
  fs.writeFileSync(CONFIG.selfImprovementFile, JSON.stringify(initialState, null, 2));
  console.log('Initialized self-improvement state file');
}

// システム統合設定
function integrateWithSystem() {
  // 既存のsystem-state.jsonに自己改善フラグを追加
  let systemState = {};
  try {
    if (fs.existsSync(CONFIG.systemStateFile)) {
      systemState = JSON.parse(fs.readFileSync(CONFIG.systemStateFile, 'utf8'));
    }
  } catch (e) {
    console.log('Using empty system state');
  }
  
  // 自己改善統合情報を追加
  systemState.selfImprovementEnabled = true;
  systemState.selfImprovementVersion = '2.0';
  systemState.lastSelfImprovementCheck = new Date().toISOString();
  
  fs.writeFileSync(CONFIG.systemStateFile, JSON.stringify(systemState, null, 2));
  console.log('Integrated self-improvement with system state');
}

// 定期レビュースケジュール設定
function setupWeeklyReviewSchedule() {
  // 既存のcron設定を読み込み（もし存在しない場合は新しい配列を作成）
  let cronJobs = [];
  try {
    if (fs.existsSync(path.join(CONFIG.storagePath, 'cron-jobs.json'))) {
      cronJobs = JSON.parse(fs.readFileSync(path.join(CONFIG.storagePath, 'cron-jobs.json'), 'utf8'));
    }
  } catch (e) {
    console.log('Creating new cron jobs configuration');
  }
  
  // 週次レビュージョブが存在しない場合のみ追加
  const weeklyReviewExists = cronJobs.some(job => job.id === 'token-management-weekly-review');
  
  if (!weeklyReviewExists) {
    cronJobs.push({
      "id": "token-management-weekly-review",
      "name": "token-management-weekly-review",
      "schedule": {
        "kind": "cron",
        "expr": "0 10 * * 0",
        "tz": "Asia/Tokyo"
      },
      "payload": {
        "kind": "agentTurn",
        "message": "トークン管理システムの週次自己レビューを実行。node /Users/yusuke/.openclaw/workspace/systems/token-management/token-self-improvement-v2.js の performSelfImprovement() を実行。改善提案が生成された場合は、提案内容を reports/loops/ に保存し、board-auditor に軽微な通知を行う。低リスク改善は自動適用。",
        "timeoutSeconds": 120
      },
      "sessionTarget": "isolated",
      "agentId": "ops-automator",
      "delivery": {
        "mode": "announce"
      }
    });
    
    fs.writeFileSync(path.join(CONFIG.storagePath, 'cron-jobs.json'), JSON.stringify(cronJobs, null, 2));
    console.log('Added weekly review schedule to cron jobs');
  }
}

// 初期状態レポート生成
function generateInitialReport() {
  const report = {
    timestamp: new Date().toISOString(),
    system: 'token-management',
    version: '2.0',
    selfImprovement: {
      status: 'initialized',
      enabled: true,
      weeklyReview: {
        schedule: '毎週日曜 10:00 JST',
        nextReview: getNextReviewDate(),
        enabled: true
      },
      improvementRules: [
        {
          id: 'mode-switch-hysteresis',
          condition: 'モード切り替えが1日に3回以上',
          action: 'ヒステリシス追加',
          risk: 'low'
        },
        {
          id: 'emergency-stop-adjustment',
          condition: '緊急停止が1週間に2回以上',
          action: '停止ライン引き下げ',
          risk: 'low'
        },
        {
          id: 'high-efficiency-optimization',
          condition: '連続3日間通常モードで安定',
          action: '高効率モード閾値緩和',
          risk: 'low'
        },
        {
          id: 'energy-saving-adjustment',
          condition: '月間予算が50%超過',
          action: '省エネモード閾値引き上げ',
          risk: 'low'
        }
      ],
      metrics: {
        averageConsumptionRate: null,
        modeSwitchesPerDay: 0,
        emergencyStopsPerWeek: 0,
        normalModeStableDays: 0,
        monthlyUsagePercent: 0
      }
    },
    integration: {
      systemState: 'integrated',
      cronSchedule: 'configured',
      reportPath: CONFIG.reportsPath
    }
  };
  
  const reportFile = path.join(CONFIG.reportsPath, 'token-self-improvement-initial-report.json');
  fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
  console.log(`Generated initial report: ${reportFile}`);
  
  return report;
}

// 次のレビュー日を計算
function getNextReviewDate() {
  const now = new Date();
  const nextSunday = new Date(now);
  nextSunday.setDate(now.getDate() + (7 - now.getDay()));
  nextSunday.setHours(10, 0, 0, 0);
  return nextSunday.toISOString();
}

// セットアップ実行
function setupSelfImprovementSystem() {
  console.log('Starting token management self-improvement system setup...');
  
  try {
    // 1. ディレクトリ作成
    ensureDirectories();
    
    // 2. 自己改善状態ファイルの初期化
    initializeSelfImprovementState();
    
    // 3. システム統合
    integrateWithSystem();
    
    // 4. 週次レビュースケジュール設定
    setupWeeklyReviewSchedule();
    
    // 5. 初期レポート生成
    const report = generateInitialReport();
    
    console.log('✅ Token management self-improvement system setup completed successfully');
    console.log(`📊 Next weekly review: ${new Date(report.selfImprovement.weeklyReview.nextReview).toLocaleString('ja-JP')}`);
    console.log(`📁 Report directory: ${CONFIG.reportsPath}`);
    
    return {
      success: true,
      report,
      message: 'Self-improvement system initialized and integrated'
    };
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
    return {
      success: false,
      error: error.message,
      message: 'Self-improvement system setup failed'
    };
  }
}

// 実行
if (require.main === module) {
  setupSelfImprovementSystem();
}

module.exports = {
  setupSelfImprovementSystem,
  initializeSelfImprovementState,
  integrateWithSystem,
  setupWeeklyReviewSchedule,
  generateInitialReport
};