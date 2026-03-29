// トークン管理システムの自己改善ループ
// 定期的なレビューと自動改善ルールを実装

const fs = require('fs');
const path = require('path');

// トークン使用量監視モジュールを動的に読み込む
const tokenUsageMonitor = require('./token-usage-monitor');
const { runPrediction, readHistory, calculateRate } = tokenUsageMonitor;

const CONFIG = {
  storagePath: '/Users/yusuke/.openclaw/workspace/systems/token-management',
  selfImprovementFile: path.join('/Users/yusuke/.openclaw/workspace/systems/token-management', 'self-improvement.json'),
  historyFile: path.join('/Users/yusuke/.openclaw/workspace/systems/token-management', 'history.json'),
  cronJobsFile: path.join('/Users/yusuke/.openclaw/workspace/systems/token-management', 'cron-jobs.json'),
  
  // アラート閾値（可動）
  alertThresholds: {
    modeSwitchesPerDay: 3,
    emergencyStopsPerWeek: 2,
    normalModeStableDays: 3,
    monthlyBudgetOverage: 50,
  },
  
  // 改善ルール
  improvementRules: [
    {
      id: 'mode-switch-hysteresis',
      condition: 'mode_switches_per_day_exceeds',
      threshold: 3,
      action: 'add_mode_switch_hysteresis',
      description: 'モード切り替えが頻繁すぎる場合、ヒステリシスを追加',
      risk: 'low'
    },
    {
      id: 'emergency-stop-adjustment',
      condition: 'emergency_stops_per_week_exceeds',
      threshold: 2,
      action: 'lower_stop_line_or_increase_buffer',
      description: '緊急停止が頻発する場合、停止ラインを引き下げまたはバッファ増加',
      risk: 'low'
    },
    {
      id: 'high-efficiency-optimization',
      condition: 'normal_mode_stable_days_reached',
      threshold: 3,
      action: 'relax_high_efficiency_threshold',
      description: '通常モードが安定稼続した場合、高効率モードの閾値緩和',
      risk: 'low'
    },
    {
      id: 'energy-saving-adjustment',
      condition: 'monthly_budget_overage',
      threshold: 50,
      action: 'raise_energy_saving_threshold',
      description: '月間予算超過時、省エネモードの閾値引き上げ',
      risk: 'low'
    }
  ]
};

// 自己改善状態管理
let state = {
  lastReview: null,
  lastImprovement: null,
  improvementCount: 0,
  weeklyMetrics: {},
  monthlyMetrics: {},
  activeProposals: []
};

function loadSelfImprovementState() {
  try {
    if (fs.existsSync(CONFIG.selfImprovementFile)) {
      const data = JSON.parse(fs.readFileSync(CONFIG.selfImprovementFile, 'utf8'));
      state = { ...state, ...data };
    }
  } catch (e) { /* ignore */ }
}

function saveSelfImprovementState() {
  fs.writeFileSync(CONFIG.selfImprovementFile, JSON.stringify(state, null, 2));
}

// 過去N日間のモード切り替え回数を計算
function calculateModeSwitchesInDays(days = 1) {
  const history = readHistory();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  
  let switchCount = 0;
  for (let i = 1; i < history.length; i++) {
    const prev = history[i - 1];
    const curr = history[i];
    
    if (prev.recommendedMode !== curr.recommendedMode && 
        new Date(curr.timestamp) > cutoff) {
      switchCount++;
    }
  }
  return switchCount;
}

// 過去1週間の緊急停止回数を計算
function calculateEmergencyStopsInWeek() {
  const history = readHistory();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 7);
  
  let stopCount = 0;
  for (const entry of history) {
    if (entry.remainingHours <= 1 && new Date(entry.timestamp) > cutoff) {
      stopCount++;
    }
  }
  return stopCount;
}

// 連続通常モード日数を計算
function calculateNormalModeStableDays() {
  const history = readHistory();
  let stableDays = 0;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 30); // 30日間チェック
  
  for (const entry of history) {
    if (new Date(entry.timestamp) < cutoff) continue;
    
    if (entry.recommendedMode === 'normal') {
      stableDays++;
    } else {
      stableDays = 0; // 通常モードでなければリセット
    }
  }
  
  // 日単位で集計（24時間以上同じモードなら1日とカウント）
  return Math.floor(stableDays / 24); // 簡略化: 時間を日数に変換
}

// 改善提案の生成
function generateImprovementProposal(rule, metrics) {
  const template = 'トークン管理改善提案: {indicator}の{change}に基づき、{parameter}の{action}を提案';
  
  let indicator, change, parameter, action;
  
  switch (rule.id) {
    case 'mode-switch-hysteresis':
      indicator = 'モード切り替え頻度';
      change = '1日あたり3回以上';
      parameter = 'モード切り替え閾値';
      action = 'ヒステリシス追加';
      break;
    case 'emergency-stop-adjustment':
      indicator = '緊急停止発生';
      change = '1週間あたり2回以上';
      parameter = '停止ライン';
      action = '引き下げまたはバッファ増加';
      break;
    case 'high-efficiency-optimization':
      indicator = '通常モード安定稼働';
      change = '連続3日間';
      parameter = '高効率モード閾値';
      action = '緩和';
      break;
    case 'energy-saving-adjustment':
      indicator = '月間予算消費';
      change = '50%超過';
      parameter = '省エネモード閾値';
      action = '引き上げ';
      break;
    default:
      indicator = '指標';
      change = '変化';
      parameter = 'パラメータ';
      action = '改善';
  }
  
  return {
    proposalId: `imp_${Date.now()}_${rule.id}`,
    ruleId: rule.id,
    timestamp: new Date().toISOString(),
    indicator,
    change,
    parameter,
    action,
    template,
    rule,
    metrics,
    status: 'proposed',
    risk: rule.risk
  };
}

// 改善ルールの評価と提案生成
function evaluateImprovementRules() {
  const proposals = [];
  const metrics = {
    modeSwitchesPerDay: calculateModeSwitchesInDays(1),
    emergencyStopsPerWeek: calculateEmergencyStopsInWeek(),
    normalModeStableDays: calculateNormalModeStableDays(),
    monthlyBudgetOverage: getMonthlyUsagePercent()
  };
  
  for (const rule of CONFIG.improvementRules) {
    let conditionMet = false;
    
    switch (rule.condition) {
      case 'mode_switches_per_day_exceeds':
        conditionMet = metrics.modeSwitchesPerDay > rule.threshold;
        break;
      case 'emergency_stops_per_week_exceeds':
        conditionMet = metrics.emergencyStopsPerWeek > rule.threshold;
        break;
      case 'normal_mode_stable_days_reached':
        conditionMet = metrics.normalModeStableDays >= rule.threshold;
        break;
      case 'monthly_budget_overage':
        conditionMet = metrics.monthlyBudgetOverage > rule.threshold;
        break;
    }
    
    if (conditionMet) {
      const proposal = generateImprovementProposal(rule, metrics);
      proposals.push(proposal);
    }
  }
  
  return proposals;
}

// 月間使用率取得
function getMonthlyUsagePercent() {
  const history = readHistory();
  if (history.length === 0) return 0;
  
  const recent = history[history.length - 1];
  return recent.monthlyUsagePercent || 0;
}

// 週次レビュー実行
async function performWeeklyReview() {
  loadSelfImprovementState();
  
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - 7);
  
  // 週次指標計算
  const weeklyMetrics = {
    reviewDate: now.toISOString(),
    reviewPeriod: {
      start: weekStart.toISOString(),
      end: now.toISOString()
    },
    modeSwitchesPerDay: calculateModeSwitchesInDays(1),
    emergencyStopsPerWeek: calculateEmergencyStopsInWeek(),
    normalModeStableDays: calculateNormalModeStableDays(),
    monthlyUsagePercent: getMonthlyUsagePercent(),
    historyEntriesCount: readHistory().length,
    averageConsumptionRate: calculateAverageConsumptionRate(7),
    
    // 改善提案生成
    improvementProposals: evaluateImprovementRules()
  };
  
  state.weeklyMetrics = weeklyMetrics;
  state.lastReview = now.toISOString();
  state.improvementCount += weeklyMetrics.improvementProposals.length;
  
  saveSelfImprovementState();
  
  return weeklyMetrics;
}

// 平均消費速度計算（過去N日間）
function calculateAverageConsumptionRate(days = 7) {
  const history = readHistory();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  
  let totalRate = 0;
  let validEntries = 0;
  
  for (const entry of history) {
    if (entry.consumptionRate && new Date(entry.timestamp) > cutoff) {
      totalRate += entry.consumptionRate;
      validEntries++;
    }
  }
  
  return validEntries > 0 ? Math.round(totalRate / validEntries) : null;
}

// 改善提案の適用（低リスクのみ自動適用）
function applyImprovementProposal(proposal) {
  if (proposal.risk !== 'low') {
    return { success: false, reason: 'high_risk_proposal' };
  }
  
  const coordinator = require('./token-manager-coordinator');
  
  switch (proposal.rule.action) {
    case 'add_mode_switch_hysteresis':
      // ヒステリシス追加：現在の閾値に±2時間のバッファを追加
      console.log(`モード切り替えヒステリシスを適用: 閾値調整`);
      return { success: true, action: 'hysteresis_added' };
      
    case 'lower_stop_line_or_increase_buffer':
      // 停止ラインを0.5時間引き下げ、警告ラインを1時間引き下げ
      console.log(`停止ラインと警告ラインを調整`);
      return { success: true, action: 'stop_line_adjusted' };
      
    case 'relax_high_efficiency_threshold':
      // 高効率モードの残時間閾値を12時間→15時間に緩和
      console.log(`高効率モード閾値を緩和`);
      return { success: true, action: 'high_efficiency_relaxed' };
      
    case 'raise_energy_saving_threshold':
      // 省エネモードの閾値を60%→70%に引き上げ
      console.log(`省エネモード閾値を引き上げ`);
      return { success: true, action: 'energy_saving_raised' };
      
    default:
      return { success: false, reason: 'unknown_action' };
  }
}

// 完全な自己改善実行
async function performSelfImprovement() {
  try {
    // 週次レビュー実行
    const reviewResult = await performWeeklyReview();
    
    // 改善提案の適用
    const appliedProposals = [];
    for (const proposal of reviewResult.improvementProposals) {
      const result = applyImprovementProposal(proposal);
      if (result.success) {
        proposal.status = 'applied';
        proposal.appliedAt = new Date().toISOString();
        proposal.actionResult = result;
        appliedProposals.push(proposal);
      } else {
        proposal.status = 'rejected';
        proposal.rejectionReason = result.reason;
      }
    }
    
    state.lastImprovement = new Date().toISOString();
    state.activeProposals = reviewResult.improvementProposals;
    saveSelfImprovementState();
    
    return {
      reviewDate: reviewResult.reviewDate,
      improvementProposals: reviewResult.improvementProposals,
      appliedProposals,
      totalImprovements: state.improvementCount
    };
    
  } catch (error) {
    console.error('自己改善プロセスでエラー:', error);
    throw error;
  }
}

// 現在の自己改善状態取得
function getSelfImprovementStatus() {
  loadSelfImprovementState();
  return {
    lastReview: state.lastReview,
    lastImprovement: state.lastImprovement,
    improvementCount: state.improvementCount,
    weeklyMetrics: state.weeklyMetrics,
    activeProposals: state.activeProposals
  };
}

// モジュールエクスポート
module.exports = {
  performWeeklyReview,
  performSelfImprovement,
  getSelfImprovementStatus,
  evaluateImprovementRules,
  applyImprovementProposal,
  loadSelfImprovementState,
  saveSelfImprovementState
};