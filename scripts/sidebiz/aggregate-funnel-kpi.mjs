#!/usr/bin/env node
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const workspaceRoot = join(__dirname, '..', '..');
const reportsDir = join(workspaceRoot, 'reports', 'sidebiz');

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = { month: new Date().toISOString().slice(0, 7) };
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (!a.startsWith('-')) opts.month = a;
  }
  return opts;
}

function loadFunnel(month) {
  const path = join(reportsDir, `funnel-tracker-${month}.csv`);
  if (!existsSync(path)) return null;
  const raw = readFileSync(path, 'utf8').trim();
  const lines = raw.split('\n');
  if (lines.length < 2) return { rows: [] };
  const header = lines[0].split(',');
  const rows = lines.slice(1).map(l => {
    const cols = l.split(',');
    const obj = {};
    header.forEach((h, idx) => { obj[h] = cols[idx] || ''; });
    return obj;
  });
  return { rows };
}

function main() {
  const opts = parseArgs();
  const funnel = loadFunnel(opts.month);
  if (!funnel) {
    console.error(`[aggregate-funnel-kpi] 漏斗CSVなし: ${opts.month}`);
    process.exit(1);
  }

  const total = funnel.rows.length;
  const pocSent = funnel.rows.filter(r => r.poc_sent_at && r.poc_sent_at.length > 0).length;
  const pocConverted = funnel.rows.filter(r => r.poc_status === 'monthly').length;
  const pocRate = total > 0 ? Math.round((pocSent / total) * 1000) / 10 : 0;
  const monthlyRate = total > 0 ? Math.round((pocConverted / total) * 1000) / 10 : 0;
  const mrr = funnel.rows.reduce((sum, r) => sum + (Number(r.monthly_amount) || 0), 0);
  const avgScore = total > 0 ? Math.round(funnel.rows.reduce((s, r) => s + (Number(r.priority_score) || 0), 0) / total * 10) / 10 : 0;
  const avgFourWeek = total > 0 ? Math.round(funnel.rows.reduce((s, r) => s + (Number(r.four_week_value) || 0), 0) / total) : 0;

  const kpi = {
    month: opts.month,
    generated_at: new Date().toISOString(),
    total_leads: total,
    poc_sent_count: pocSent,
    poc_converted_count: pocConverted,
    poc_rate: pocRate,
    monthly_rate: monthlyRate,
    mrr,
    avg_priority_score: avgScore,
    avg_four_week_recovery: avgFourWeek
  };

  const md = `# Funnel KPI - ${opts.month}

- 生成日時: ${kpi.generated_at}
- 総リード数: ${kpi.total_leads}
- PoC送付数: ${kpi.poc_sent_count}
- PoC化率: ${kpi.poc_rate}%
- 月額化率: ${kpi.monthly_rate}%
- 見込MRR: ¥${kpi.mrr.toLocaleString()}/月
- 平均優先スコア: ${kpi.avg_priority_score}/100
- 平均4週間回収見込: ¥${kpi.avg_four_week_recovery.toLocaleString()}

## 推奨アクション
${kpi.total_leads === 0 ? '- リード0件。診断→登録の運用を開始してください。' : ''}
${kpi.poc_rate < 30 ? '- PoC化率が低い。営業アプローチを加速してください。' : ''}
${kpi.mrr < 100000 ? '- 見込MRRが10万円未満。商談加速または単価見直し検討。' : ''}
`;

  mkdirSync(reportsDir, { recursive: true });
  const outPath = join(reportsDir, `funnel-kpi-${opts.month}.md`);
  const jsonPath = join(reportsDir, `funnel-kpi-${opts.month}.json`);
  writeFileSync(outPath, md, 'utf8');
  writeFileSync(jsonPath, JSON.stringify(kpi, null, 2), 'utf8');
  console.log(`[aggregate-funnel-kpi] 出力: ${outPath}`);
  console.log(`[aggregate-funnel-kpi] JSON: ${jsonPath}`);
  console.log(JSON.stringify(kpi, null, 2));
}

main();
