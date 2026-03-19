#!/usr/bin/env node
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname, basename, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const workspaceRoot = join(__dirname, '..', '..');
const reportsDir = join(workspaceRoot, 'reports', 'sidebiz');

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = { markPocSent: false, markMonthly: false, pocAmount: 0, monthlyAmount: 0, notes: '', nextAction: '' };
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--mark-poc-sent') opts.markPocSent = true;
    else if (a === '--mark-monthly') opts.markMonthly = true;
    else if (a === '--poc-amount' && args[i + 1]) { opts.pocAmount = Number(args[++i]) || 0; }
    else if (a === '--monthly-amount' && args[i + 1]) { opts.monthlyAmount = Number(args[++i]) || 0; }
    else if (a === '--notes' && args[i + 1]) { opts.notes = args[++i]; }
    else if (a === '--next-action' && args[i + 1]) { opts.nextAction = args[++i]; }
    else if (!a.startsWith('-')) opts.input = a;
  }
  return opts;
}

function loadFunnel(month) {
  const path = join(reportsDir, `funnel-tracker-${month}.csv`);
  if (!existsSync(path)) return null;
  const raw = readFileSync(path, 'utf8').trim();
  const lines = raw.split('\n');
  const header = lines[0].split(',');
  const rows = lines.slice(1).map(l => {
    const cols = l.split(',');
    const obj = {};
    header.forEach((h, idx) => { obj[h] = cols[idx] || ''; });
    return obj;
  });
  return { header, rows, path };
}

function saveFunnel(path, header, rows) {
  const content = [header.join(','), ...rows.map(r => header.map(h => r[h] || '').join(','))].join('\n');
  writeFileSync(path, content + '\n', 'utf8');
}

function loadDiagnostic(jsonPath) {
  if (!existsSync(jsonPath)) return null;
  return JSON.parse(readFileSync(jsonPath, 'utf8'));
}

function main() {
  const opts = parseArgs();
  if (!opts.input) {
    console.error('使い方: node register-diagnostic-lead.mjs <診断JSON> [--mark-poc-sent] [--poc-amount N] [--mark-monthly] [--monthly-amount N] [--notes "xxx"] [--next-action "xxx"]');
    process.exit(1);
  }

  const diag = loadDiagnostic(opts.input);
  if (!diag) {
    console.error(`[register-diagnostic-lead] 診断JSONが見つかりません: ${opts.input}`);
    process.exit(1);
  }

  const month = new Date().toISOString().slice(0, 7);
  let funnel = loadFunnel(month);
  if (!funnel) {
    // 自動初期化
    const initPath = join(reportsDir, `funnel-tracker-${month}.csv`);
    mkdirSync(reportsDir, { recursive: true });
    const header = ['id', 'created_at', 'company_name', 'priority_score', 'four_week_value', 'poc_sent_at', 'poc_status', 'poc_amount', 'monthly_amount', 'next_action', 'notes'];
    funnel = { header, rows: [], path: initPath };
    console.log(`[register-diagnostic-lead] 漏斗CSVを新規作成: ${initPath}`);
  }

  // 既存IDを検索（company_nameベース）
  let row = funnel.rows.find(r => r.company_name === diag.company_name);
  const now = new Date().toISOString();
  if (!row) {
    row = {
      id: diag.id,
      created_at: now,
      company_name: diag.company_name,
      priority_score: String(diag.priority_score),
      four_week_value: String(diag.four_week_recovery_estimate),
      poc_sent_at: '',
      poc_status: '',
      poc_amount: '',
      monthly_amount: '',
      next_action: '',
      notes: ''
    };
    funnel.rows.push(row);
    console.log(`[register-diagnostic-lead] 新規リード登録: ${diag.company_name}`);
  } else {
    console.log(`[register-diagnostic-lead] 既存リード更新: ${diag.company_name}`);
  }

  if (opts.markPocSent) {
    row.poc_sent_at = now;
    row.poc_status = 'sent';
    if (opts.pocAmount) row.poc_amount = String(opts.pocAmount);
    console.log(`[register-diagnostic-lead] PoC送付済みマーク: ${now}`);
  }
  if (opts.markMonthly) {
    row.poc_status = 'monthly';
    if (opts.monthlyAmount) row.monthly_amount = String(opts.monthlyAmount);
    console.log(`[register-diagnostic-lead] 月額化マーク`);
  }
  if (opts.notes) row.notes = opts.notes;
  if (opts.nextAction) row.next_action = opts.nextAction;

  saveFunnel(funnel.path, funnel.header, funnel.rows);
  console.log(`[register-diagnostic-lead] 保存完了: ${funnel.path}`);
}

main();
