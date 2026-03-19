#!/usr/bin/env node
/**
 * update-funnel-lead.mjs
 * 漏斗CSVのリード情報を更新・追記するスクリプト
 * 
 * 使用方法:
 *   node update-funnel-lead.mjs --id <lead_id> --status <status> [--poc-sent] [--poc-converted] [--note "メモ"]
 *   node update-funnel-lead.mjs --list
 * 
 * ステータス:
 *   new → poc_sent → poc_converted → active → churned
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WORKSPACE_ROOT = path.resolve(__dirname, '../..');
const REPORTS_DIR = path.join(WORKSPACE_ROOT, 'reports/sidebiz');
const TODAY = new Date();
const FUNNEL_CSV = path.join(REPORTS_DIR, `funnel-tracker-${TODAY.getFullYear()}-${String(TODAY.getMonth() + 1).padStart(2, '0')}.csv`);

// CSVヘッダー（既存形式に統一）
const CSV_HEADERS = [
  'id',
  'created_at',
  'company_name',
  'priority_score',
  'four_week_value',
  'poc_sent_at',
  'poc_status',
  'poc_amount',
  'monthly_amount',
  'next_action',
  'notes'
].join(',');

/**
 * 既存CSVを読み込む
 */
function loadLeads() {
  if (!fs.existsSync(FUNNEL_CSV)) {
    return [];
  }
  
  const content = fs.readFileSync(FUNNEL_CSV, 'utf-8');
  const lines = content.trim().split('\n');
  
  if (lines.length <= 1) return [];
  
  const headers = lines[0].split(',');
  return lines.slice(1).map(line => {
    const values = parseCSVLine(line);
    const lead = {};
    headers.forEach((h, i) => {
      lead[h] = values[i] || '';
    });
    return lead;
  });
}

/**
 * CSV行をパース（カンマと引用符を考慮）
 */
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  
  return result;
}

/**
 * リードをCSVに保存
 */
function saveLeads(leads) {
  // ディレクトリ作成
  const dir = path.dirname(FUNNEL_CSV);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  const lines = [CSV_HEADERS];
  
  leads.forEach(lead => {
    const row = [
      lead.id || '',
      lead.created_at || '',
      lead.company_name || '',
      lead.priority_score || '0',
      lead.four_week_value || '0',
      lead.poc_sent_at || '',
      lead.poc_status || '',
      lead.poc_amount || '',
      lead.monthly_amount || '',
      lead.next_action || '',
      `"${(lead.notes || '').replace(/"/g, '""')}"`
    ];
    lines.push(row.join(','));
  });
  
  fs.writeFileSync(FUNNEL_CSV, lines.join('\n') + '\n', 'utf-8');
}

/**
 * IDでリードを検索
 */
function findLead(leads, id) {
  return leads.find(l => l.id === id || l.id.startsWith(id));
}

/**
 * リード情報を更新
 */
function updateLead(leads, id, updates) {
  const index = leads.findIndex(l => l.id === id || l.id.startsWith(id));
  if (index === -1) {
    console.error(`❌ リードID "${id}" が見つかりません`);
    process.exit(1);
  }
  
  const lead = leads[index];
  const today = new Date().toISOString();
  const todayDate = today.split('T')[0];
  
  // 更新適用
  Object.assign(lead, updates);
  
  // 自動フィールド設定
  if (updates.poc_status === 'sent' && !lead.poc_sent_at) {
    lead.poc_sent_at = today;
  }
  if (updates.poc_status === 'converted') {
    if (!lead.poc_sent_at) lead.poc_sent_at = today;
  }
  
  leads[index] = lead;
  return lead;
}

/**
 * リード一覧を表示
 */
function listLeads(leads) {
  if (leads.length === 0) {
    console.log('📭 リードがありません');
    return;
  }
  
  console.log('\n📋 漏斗リード一覧\n');
  console.log('ID\t\t\t| PoC状況\t| 薬局名\t\t\t| 優先度\t| 4週間価値');
  console.log('-'.repeat(90));
  
  leads.forEach(lead => {
    const id = lead.id.substring(0, 8);
    const pocStatus = lead.poc_status || '未送付';
    const company = (lead.company_name || '').substring(0, 20).padEnd(20);
    console.log(`${id}...\t| ${pocStatus}\t| ${company}\t| ${lead.priority_score}\t| ¥${Number(lead.four_week_value || 0).toLocaleString()}`);
  });
  
  console.log(`\n合計: ${leads.length}件`);
  
  // PoC状況別集計
  const byStatus = { '未送付': 0, 'sent': 0, 'converted': 0, 'declined': 0 };
  leads.forEach(l => {
    const status = l.poc_status || '未送付';
    byStatus[status] = (byStatus[status] || 0) + 1;
  });
  
  console.log('\nPoC状況別:');
  console.log(`  未送付: ${byStatus['未送付']}件`);
  console.log(`  送付済: ${byStatus['sent']}件`);
  console.log(`  成約: ${byStatus['converted']}件`);
  console.log(`  辞退: ${byStatus['declined']}件`);
  
  // 総潜在価値
  const totalValue = leads.reduce((sum, l) => sum + Number(l.four_week_value || 0), 0);
  console.log(`\n総潜在価値（4週間）: ¥${totalValue.toLocaleString()}`);
}

/**
 * ヘルプ表示
 */
function showHelp() {
  console.log(`
使用方法:
  node update-funnel-lead.mjs --id <lead_id> [options]
  node update-funnel-lead.mjs --list

オプション:
  --id <id>             更新するリードID（先頭8文字でも可）
  --poc-sent            PoC送付済みとしてマーク
  --poc-converted       PoC成約としてマーク
  --poc-declined        PoC辞退としてマーク
  --poc-amount <amt>    PoC料金を設定
  --monthly-amount <amt> 月額料金を設定
  --next-action <text>  次のアクション
  --note "text"         メモを追加
  --list                リード一覧を表示

PoCステータス:
  未送付 → sent → converted / declined
`);
}

// メイン処理
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  showHelp();
  process.exit(0);
}

// 既存リード読み込み
const leads = loadLeads();

// 一覧表示
if (args.includes('--list')) {
  listLeads(leads);
  process.exit(0);
}

// 更新処理
const idIndex = args.indexOf('--id');
if (idIndex === -1) {
  console.error('❌ --id が必要です');
  showHelp();
  process.exit(1);
}

const leadId = args[idIndex + 1];
const updates = {};

// PoC送付
if (args.includes('--poc-sent')) {
  updates.poc_status = 'sent';
}

// PoC成約
if (args.includes('--poc-converted')) {
  updates.poc_status = 'converted';
}

// PoC辞退
if (args.includes('--poc-declined')) {
  updates.poc_status = 'declined';
}

// PoC料金
const pocAmountIndex = args.indexOf('--poc-amount');
if (pocAmountIndex !== -1) {
  updates.poc_amount = args[pocAmountIndex + 1];
}

// 月額料金
const monthlyAmountIndex = args.indexOf('--monthly-amount');
if (monthlyAmountIndex !== -1) {
  updates.monthly_amount = args[monthlyAmountIndex + 1];
}

// 次のアクション
const nextActionIndex = args.indexOf('--next-action');
if (nextActionIndex !== -1) {
  updates.next_action = args[nextActionIndex + 1];
}

// メモ
const noteIndex = args.indexOf('--note');
if (noteIndex !== -1) {
  updates.notes = args[noteIndex + 1];
}

// 更新実行
const updatedLead = updateLead(leads, leadId, updates);
saveLeads(leads);

console.log(`\n✅ リード更新完了: ${leadId}`);
console.log(`   薬局: ${updatedLead.company_name}`);
console.log(`   PoC状況: ${updatedLead.poc_status || '未送付'}`);
if (updatedLead.poc_sent_at) {
  console.log(`   PoC送付日: ${updatedLead.poc_sent_at.split('T')[0]}`);
}
if (updatedLead.poc_amount) {
  console.log(`   PoC料金: ¥${Number(updatedLead.poc_amount).toLocaleString()}`);
}
if (updatedLead.monthly_amount) {
  console.log(`   月額: ¥${Number(updatedLead.monthly_amount).toLocaleString()}`);
}
