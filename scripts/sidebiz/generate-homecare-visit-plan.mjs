#!/usr/bin/env node
/**
 * 訪問薬剤管理 週次計画テンプレート生成スクリプト
 * 
 * 入力: 患者リスト（CSV/JSON）
 * 出力: 週次訪問計画（Markdown）
 * 
 * 収益化: 初回 ¥5,000 / 月額 ¥2,000（アップデート付き）
 * KPI: テンプレート生成数 / 訪問効率化率
 * 
 * 使用方法:
 *   node generate-homecare-visit-plan.mjs [CSVファイル] [--output ディレクトリ]
 *   node generate-homecare-visit-plan.mjs --sample  # サンプルデータで実行
 */

import fs from 'fs';
import path from 'path';

// CSVパーサー（外部依存なし）
function parseCSV(content) {
  const lines = content.trim().split('\n');
  if (lines.length < 2) return [];
  
  const headers = lines[0].split(',').map(h => h.trim());
  const records = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim());
    const record = {};
    headers.forEach((h, idx) => {
      record[h] = values[idx] || '';
    });
    records.push(record);
  }
  
  return records;
}

// CSVレコードを患者データ形式に変換
function normalizePatient(record) {
  return {
    id: record.id || record.ID || `P${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    name: record.name || record.患者名 || record.氏名 || '名前未設定',
    address: record.address || record.住所 || record.所在地 || '',
    lastVisit: record.lastVisit || record.前回訪問 || record.前回来局 || new Date().toISOString().split('T')[0],
    prescriptionDays: parseInt(record.prescriptionDays || record.処方日数 || 28, 10),
    urgency: (record.urgency || record.緊急度 || record.優先度 || 'medium').toLowerCase(),
    notes: record.notes || record.特記 || record.備考 || ''
  };
}

// サンプル患者データ（--sample オプション用）
const SAMPLE_PATIENTS = [
  { id: 'P001', name: 'A様', address: '杉並区A町1-1', lastVisit: '2026-02-24', prescriptionDays: 28, urgency: 'high', notes: '多剤併用' },
  { id: 'P002', name: 'B様', address: '杉並区B町2-2', lastVisit: '2026-02-20', prescriptionDays: 14, urgency: 'medium', notes: '認知症支援' },
  { id: 'P003', name: 'C様', address: '練馬区C町3-3', lastVisit: '2026-02-28', prescriptionDays: 28, urgency: 'low', notes: '' },
  { id: 'P004', name: 'D様', address: '杉並区A町1-5', lastVisit: '2026-02-15', prescriptionDays: 7, urgency: 'critical', notes: '在宅酸素' },
  { id: 'P005', name: 'E様', address: '練馬区D町4-4', lastVisit: '2026-02-26', prescriptionDays: 28, urgency: 'medium', notes: '糖尿病' },
  { id: 'P006', name: 'F様', address: '中野区E町5-5', lastVisit: '2026-02-22', prescriptionDays: 14, urgency: 'high', notes: '褥瘡ケア' },
];

// 訪問優先度スコア計算
function calculatePriorityScore(patient, today = new Date()) {
  let score = 0;
  
  // 前回訪問からの経過日数
  const lastVisitDate = new Date(patient.lastVisit);
  const daysSinceVisit = Math.floor((today - lastVisitDate) / (1000 * 60 * 60 * 24));
  const prescriptionRemaining = patient.prescriptionDays - daysSinceVisit;
  
  // 処方残日数による加点（残り少ないほど高優先）
  if (prescriptionRemaining <= 3) score += 40;
  else if (prescriptionRemaining <= 7) score += 25;
  else if (prescriptionRemaining <= 14) score += 10;
  
  // 緊急度による加点
  const urgencyScores = { critical: 30, high: 20, medium: 10, low: 0 };
  score += urgencyScores[patient.urgency] || 0;
  
  // 特別対応が必要な場合の加点
  if (patient.notes.includes('在宅酸素') || patient.notes.includes('褥瘡')) score += 15;
  if (patient.notes.includes('認知症')) score += 10;
  
  return { score, prescriptionRemaining, daysSinceVisit };
}

// エリア別グループ化
function groupByArea(patients) {
  const groups = {};
  for (const p of patients) {
    // 区名を抽出（簡易版）
    const areaMatch = p.address.match(/(.+区)/);
    const area = areaMatch ? areaMatch[1] : 'その他';
    if (!groups[area]) groups[area] = [];
    groups[area].push(p);
  }
  return groups;
}

// 週次計画の生成
function generateWeeklyPlan(patients, startDate = new Date()) {
  const plan = {
    weekStart: formatDate(startDate),
    weekEnd: formatDate(addDays(startDate, 6)),
    days: {},
    unassigned: []
  };
  
  // 優先度計算と並び替え
  const withPriority = patients.map(p => {
    const { score, prescriptionRemaining, daysSinceVisit } = calculatePriorityScore(p, startDate);
    return { ...p, priorityScore: score, prescriptionRemaining, daysSinceVisit };
  }).sort((a, b) => b.priorityScore - a.priorityScore);
  
  // エリア別グループ化
  const areaGroups = groupByArea(withPriority);
  
  // 曜日割り当て（月〜金）
  const weekdays = ['月', '火', '水', '木', '金'];
  const areaList = Object.keys(areaGroups);
  
  weekdays.forEach((day, i) => {
    plan.days[day] = [];
  });
  
  // 優先度高を前半に配置、エリア考慮
  let dayIndex = 0;
  for (const patient of withPriority) {
    // 処方残3日以下は最優先で月〜火に配置
    if (patient.prescriptionRemaining <= 3) {
      plan.days[weekdays[Math.min(dayIndex, 1)]].push(patient);
    } else {
      plan.days[weekdays[dayIndex % 5]].push(patient);
    }
    dayIndex++;
  }
  
  return plan;
}

// Markdown出力
function generateMarkdown(plan) {
  const lines = [];
  
  lines.push(`# 訪問薬剤管理 週次計画表`);
  lines.push(``);
  lines.push(`> 期間: ${plan.weekStart} 〜 ${plan.weekEnd}`);
  lines.push(`> 生成日時: ${new Date().toISOString()}`);
  lines.push(``);
  
  lines.push(`## 📊 今週のサマリー`);
  lines.push(``);
  const totalPatients = Object.values(plan.days).flat().length;
  const criticalCount = Object.values(plan.days).flat().filter(p => p.urgency === 'critical').length;
  lines.push(`| 項目 | 数値 |`);
  lines.push(`|------|------|`);
  lines.push(`| 訪問予定患者数 | ${totalPatients}名 |`);
  lines.push(`| 要緊急対応 | ${criticalCount}名 |`);
  lines.push(``);
  
  lines.push(`## 📅 曜日別計画`);
  lines.push(``);
  
  for (const [day, patients] of Object.entries(plan.days)) {
    lines.push(`### ${day}曜日`);
    lines.push(``);
    
    if (patients.length === 0) {
      lines.push(`_訪問予定なし_`);
      lines.push(``);
      continue;
    }
    
    lines.push(`| 優先 | 患者名 | 住所 | 処方残 | 前回訪問 | 特記事項 |`);
    lines.push(`|------|--------|------|--------|----------|----------|`);
    
    for (const p of patients) {
      const priorityIcon = p.priorityScore >= 50 ? '🔴' : p.priorityScore >= 30 ? '🟡' : '🟢';
      const remainingText = p.prescriptionRemaining <= 0 ? '⚠️切れ' : `${p.prescriptionRemaining}日`;
      lines.push(`| ${priorityIcon} ${p.priorityScore} | ${p.name} | ${p.address} | ${remainingText} | ${p.lastVisit} | ${p.notes || '-'} |`);
    }
    lines.push(``);
  }
  
  lines.push(`## 🗺️ エリア別ルート案`);
  lines.push(``);
  
  const areaGroups = groupByArea(Object.values(plan.days).flat());
  for (const [area, patients] of Object.entries(areaGroups)) {
    lines.push(`### ${area}（${patients.length}名）`);
    for (const p of patients) {
      lines.push(`- ${p.name}: ${p.address}`);
    }
    lines.push(``);
  }
  
  lines.push(`## 📝 注意事項`);
  lines.push(``);
  lines.push(`- 🔴: 要緊急対応（48h以内推奨）`);
  lines.push(`- 🟡: 要注意（1週間以内）`);
  lines.push(`- 🟢: 通常対応`);
  lines.push(`- ⚠️: 処方切れリスク`);
  lines.push(``);
  
  lines.push(`---`);
  lines.push(`_本計画表は訪問薬剤管理支援システムにより自動生成されています。_`);
  
  return lines.join('\n');
}

// ユーティリティ関数
function formatDate(date) {
  return date.toISOString().split('T')[0];
}

function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

// メイン処理
function main() {
  const args = process.argv.slice(2);
  
  // 引数解析
  let csvPath = null;
  let outputDir = './reports/sidebiz/homecare-visit-plans';
  let useSample = false;
  
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--sample') {
      useSample = true;
    } else if (args[i] === '--output' || args[i] === '-o') {
      outputDir = args[++i];
    } else if (!args[i].startsWith('--')) {
      csvPath = args[i];
    }
  }
  
  const today = new Date('2026-03-03'); // テスト用固定日付
  
  console.log('🏥 訪問薬剤管理 週次計画テンプレート生成');
  console.log('');
  
  // 患者データの読み込み
  let patients;
  if (csvPath && fs.existsSync(csvPath)) {
    console.log(`📥 CSV読み込み: ${csvPath}`);
    const content = fs.readFileSync(csvPath, 'utf-8');
    const records = parseCSV(content);
    patients = records.map(normalizePatient);
    console.log(`   ${patients.length}件の患者データを読み込みました`);
    console.log('');
  } else if (useSample || !csvPath) {
    console.log('📋 サンプルデータを使用します（--sample または CSV未指定時）');
    patients = SAMPLE_PATIENTS;
    console.log(`   ${patients.length}件のサンプルデータ`);
    console.log('');
  } else {
    console.error(`❌ エラー: CSVファイルが見つかりません: ${csvPath}`);
    process.exit(1);
  }
  
  if (patients.length === 0) {
    console.error('❌ エラー: 患者データが空です');
    process.exit(1);
  }
  
  // 週次計画の生成
  const plan = generateWeeklyPlan(patients, today);
  
  // Markdown生成
  const markdown = generateMarkdown(plan);
  
  // 出力
  const timestamp = Date.now();
  const dateStr = today.toISOString().split('T')[0];
  const outputPath = path.join(outputDir, `weekly-plan-${dateStr}-${timestamp}.md`);
  
  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(outputPath, markdown);
  
  console.log(`✅ 週次計画表を生成しました`);
  console.log(`   出力: ${outputPath}`);
  console.log('');
  console.log(`📊 KPIサマリー:`);
  console.log(`   - 訪問予定患者数: ${Object.values(plan.days).flat().length}名`);
  console.log(`   - 要緊急対応: ${Object.values(plan.days).flat().filter(p => p.urgency === 'critical').length}名`);
  console.log(`   - エリア数: ${Object.keys(groupByArea(Object.values(plan.days).flat())).length}`);
  
  // JSON出力（機械連携用）
  const jsonOutput = {
    generatedAt: new Date().toISOString(),
    source: csvPath || 'sample',
    weekStart: plan.weekStart,
    weekEnd: plan.weekEnd,
    summary: {
      totalPatients: Object.values(plan.days).flat().length,
      criticalCount: Object.values(plan.days).flat().filter(p => p.urgency === 'critical').length,
      areaCount: Object.keys(groupByArea(Object.values(plan.days).flat())).length
    },
    days: plan.days
  };
  
  const jsonPath = path.join(outputDir, `weekly-plan-${dateStr}-${timestamp}.json`);
  fs.writeFileSync(jsonPath, JSON.stringify(jsonOutput, null, 2));
  console.log(`   JSON: ${jsonPath}`);
  
  // サンプルCSVテンプレート生成（初回のみ）
  const sampleCsvPath = path.join(outputDir, 'sample-patients-template.csv');
  if (!fs.existsSync(sampleCsvPath)) {
    const csvHeaders = 'id,name,address,lastVisit,prescriptionDays,urgency,notes';
    const csvRows = SAMPLE_PATIENTS.map(p => 
      `${p.id},${p.name},${p.address},${p.lastVisit},${p.prescriptionDays},${p.urgency},${p.notes}`
    );
    fs.writeFileSync(sampleCsvPath, [csvHeaders, ...csvRows].join('\n'));
    console.log(`   テンプレートCSV: ${sampleCsvPath}`);
  }
}

main();
