#!/usr/bin/env node
/**
 * 在庫ロス改善提案書生成スクリプト v2
 * 
 * 使い方: node generate-improvement-proposal-v2.mjs <診断JSON> [--output <ファイル名>] [--template v1|v2]
 * 
 * 機能:
 * - 診断データから改善提案書を自動生成
 * - ROI試算、投資回収期間を自動計算
 * - 業界平均との比較を含む
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname, basename, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const workspaceRoot = join(__dirname, '..', '..');
const reportsDir = join(workspaceRoot, 'reports', 'sidebiz');
const templatesDir = join(workspaceRoot, 'templates', 'sidebiz');

// 業界平均値（薬局業界）
const INDUSTRY_BENCHMARKS = {
  avgDemandMatchRate: 85, // %
  avgWasteRate: 2.5, // %
  avgTurnoverRate: 8, // 回/年
};

// 計算ロジック
function calculateDerivedMetrics(diag) {
  const totalValue = diag.total_stock_value || 0;
  const matchRate = diag.demand_match_rate || 0;
  const priorityScore = diag.priority_score || 0;
  const fourWeekRecovery = diag.four_week_recovery_estimate || 0;
  
  // 年間推定廃棄ロス（需要不一致分の一部が廃棄されると仮定）
  const wasteRate = Math.max(0, 100 - matchRate) * 0.3; // 不一致分の30%が廃棄
  const annualWasteEstimate = Math.round(totalValue * 12 * (wasteRate / 100));
  
  // 業界平均との比較
  const demandMatchComparison = matchRate >= INDUSTRY_BENCHMARKS.avgDemandMatchRate
    ? '✅ 業界平均以上'
    : `⚠️ 業界平均以下（平均: ${INDUSTRY_BENCHMARKS.avgDemandMatchRate}%）`;
  
  const priorityComparison = priorityScore >= 75
    ? '🔥 高優先度（48時間以内のアプローチ推奨）'
    : priorityScore >= 50
    ? '📋 中優先度（2週間以内のアプローチ推奨）'
    : '📊 低優先度（定期フォローで十分）';
  
  // 優先度バッジ
  const priorityBadge = priorityScore >= 75
    ? '> 🔥 **高優先度**: 廃棄ロスが大きく、早急な対応が効果的です'
    : priorityScore >= 50
    ? '> 📋 **中優先度**: 改善余地あり、計画的な対応を推奨'
    : '> 📊 **低優先度**: 現状維持でも問題ありませんが、定期チェックを推奨';
  
  // Phase別期待効果（簡易計算）
  const phase1Savings = Math.round(annualWasteEstimate * 0.3); // 即時対応で30%削減
  const phase2Savings = Math.round(totalValue * 0.15); // 短期改善で在庫の15%削減
  const phase3AnnualSavings = Math.round(annualWasteEstimate * 0.5); // 継続で50%削減
  
  // 回転率・廃棄ロス率の推定
  const currentTurnover = Math.max(4, Math.min(12, 8 - (100 - matchRate) * 0.05));
  const targetTurnover = currentTurnover + 2;
  const turnoverImprovement = Math.round((targetTurnover - currentTurnover) / currentTurnover * 100);
  
  const currentWasteRate = wasteRate;
  const targetWasteRate = Math.max(0.5, wasteRate * 0.5);
  const wasteReduction = Math.round((currentWasteRate - targetWasteRate) / currentWasteRate * 100);
  
  // 改善後の回収価値
  const improvedRecoveryValue = Math.round(fourWeekRecovery * 1.3);
  const recoveryImprovement = 30;
  
  // 削減後の年間廃棄ロス
  const reducedAnnualWaste = Math.round(annualWasteEstimate * 0.5);
  const annualSavings = annualWasteEstimate - reducedAnnualWaste;
  
  // 投資回収期間（月）
  const standardPayback = Math.max(1, Math.ceil(30000 / (annualSavings / 12)));
  const premiumPayback = Math.max(2, Math.ceil(50000 / (annualSavings / 12)));
  
  return {
    annual_waste_estimate: annualWasteEstimate,
    demand_match_comparison: demandMatchComparison,
    priority_comparison: priorityComparison,
    priority_badge: priorityBadge,
    phase1_savings: phase1Savings,
    phase2_savings: phase2Savings,
    phase3_annual_savings: phase3AnnualSavings,
    current_turnover: currentTurnover.toFixed(1),
    target_turnover: targetTurnover.toFixed(1),
    turnover_improvement: turnoverImprovement,
    current_waste_rate: currentWasteRate.toFixed(1),
    target_waste_rate: targetWasteRate.toFixed(1),
    waste_reduction: wasteReduction,
    improved_recovery_value: improvedRecoveryValue,
    recovery_improvement: recoveryImprovement,
    reduced_annual_waste: reducedAnnualWaste,
    annual_savings: annualSavings,
    standard_payback_months: standardPayback,
    premium_payback_months: premiumPayback,
  };
}

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = { template: 'v2' };
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (!a.startsWith('-')) opts.input = a;
    else if (a === '--output' && args[i + 1]) opts.output = args[++i];
    else if (a === '--template' && args[i + 1]) opts.template = args[++i];
  }
  return opts;
}

function loadDiagnostic(path) {
  if (!existsSync(path)) {
    console.error(`[generate-improvement-proposal-v2] 診断JSONなし: ${path}`);
    process.exit(1);
  }
  return JSON.parse(readFileSync(path, 'utf8'));
}

function loadTemplate(version) {
  const templateName = version === 'v1'
    ? 'deadstock-improvement-proposal-template.md'
    : 'deadstock-improvement-proposal-template-v2.md';
  const templatePath = join(templatesDir, templateName);
  if (!existsSync(templatePath)) {
    console.error(`[generate-improvement-proposal-v2] テンプレートなし: ${templatePath}`);
    process.exit(1);
  }
  return readFileSync(templatePath, 'utf8');
}

function fillTemplate(template, diag, derived) {
  const allVars = { ...diag, ...derived };
  
  return Object.entries(allVars).reduce((str, [key, value]) => {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    return str.replace(regex, String(value));
  }, template);
}

function main() {
  const opts = parseArgs();
  if (!opts.input) {
    console.error('使い方: node generate-improvement-proposal-v2.mjs <診断JSON> [--output <ファイル名>] [--template v1|v2]');
    process.exit(1);
  }

  const diag = loadDiagnostic(opts.input);
  const derived = calculateDerivedMetrics(diag);
  const template = loadTemplate(opts.template);
  const proposal = fillTemplate(template, diag, derived);

  mkdirSync(reportsDir, { recursive: true });
  const baseName = basename(opts.input, extname(opts.input));
  const outPath = opts.output || join(reportsDir, `proposal-${baseName}-v2.md`);

  writeFileSync(outPath, proposal, 'utf8');
  console.log(`[generate-improvement-proposal-v2] 出力: ${outPath}`);
  console.log(`  - 年間推定廃棄ロス: ¥${derived.annual_waste_estimate.toLocaleString()}`);
  console.log(`  - 年間削減効果見込: ¥${derived.annual_savings.toLocaleString()}`);
  console.log(`  - 標準プラン投資回収期間: ${derived.standard_payback_months}ヶ月`);
}

main();
