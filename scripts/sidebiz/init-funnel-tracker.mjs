#!/usr/bin/env node
import { writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const workspaceRoot = join(__dirname, '..', '..');
const reportsDir = join(workspaceRoot, 'reports', 'sidebiz');

function main() {
  const args = process.argv.slice(2);
  const month = args[0] || new Date().toISOString().slice(0, 7); // YYYY-MM
  const outPath = join(reportsDir, `funnel-tracker-${month}.csv`);

  if (existsSync(outPath)) {
    console.error(`[init-funnel-tracker] 既に存在: ${outPath}`);
    process.exit(0);
  }

  mkdirSync(reportsDir, { recursive: true });
  const header = [
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
  writeFileSync(outPath, header + '\n', 'utf8');
  console.log(`[init-funnel-tracker] 作成完了: ${outPath}`);
}

main();
