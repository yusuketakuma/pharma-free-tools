#!/usr/bin/env node
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname, basename, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const workspaceRoot = join(__dirname, '..', '..');
const reportsDir = join(workspaceRoot, 'reports', 'sidebiz');
const templatesDir = join(workspaceRoot, 'templates', 'sidebiz');

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = {};
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (!a.startsWith('-')) opts.input = a;
    else if (a === '--output' && args[i + 1]) opts.output = args[++i];
  }
  return opts;
}

function loadDiagnostic(path) {
  if (!existsSync(path)) {
    console.error(`[generate-improvement-proposal] 診断JSONなし: ${path}`);
    process.exit(1);
  }
  return JSON.parse(readFileSync(path, 'utf8'));
}

function loadTemplate() {
  const templatePath = join(templatesDir, 'deadstock-improvement-proposal-template.md');
  if (!existsSync(templatePath)) {
    console.error('[generate-improvement-proposal] テンプレートなし');
    process.exit(1);
  }
  return readFileSync(templatePath, 'utf8');
}

function fillTemplate(template, diag) {
  return template
    .replace(/\{\{company_name\}\}/g, diag.company_name || 'Unknown')
    .replace(/\{\{generated_at\}\}/g, diag.generated_at || new Date().toISOString())
    .replace(/\{\{id\}\}/g, diag.id || 'N/A')
    .replace(/\{\{total_stock_value\}\}/g, (diag.total_stock_value || 0).toLocaleString())
    .replace(/\{\{demand_match_rate\}\}/g, diag.demand_match_rate || 0)
    .replace(/\{\{four_week_recovery_estimate\}\}/g, (diag.four_week_recovery_estimate || 0).toLocaleString())
    .replace(/\{\{priority_score\}\}/g, diag.priority_score || 0)
    .replace(/\{\{recommendation\}\}/g, diag.recommendation || 'アプローチを検討してください');
}

function main() {
  const opts = parseArgs();
  if (!opts.input) {
    console.error('使い方: node generate-improvement-proposal.mjs <診断JSON> [--output <ファイル名>]');
    process.exit(1);
  }

  const diag = loadDiagnostic(opts.input);
  const template = loadTemplate();
  const proposal = fillTemplate(template, diag);

  mkdirSync(reportsDir, { recursive: true });
  const baseName = basename(opts.input, extname(opts.input));
  const outPath = opts.output || join(reportsDir, `proposal-${baseName}.md`);

  writeFileSync(outPath, proposal, 'utf8');
  console.log(`[generate-improvement-proposal] 出力: ${outPath}`);
}

main();
