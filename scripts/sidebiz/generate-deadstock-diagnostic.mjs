#!/usr/bin/env node
import { writeFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { join, dirname, basename, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const workspaceRoot = join(__dirname, '..', '..');
const reportsDir = join(workspaceRoot, 'reports', 'sidebiz');

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = { jsonOutput: false, outTag: '' };
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--json-output') opts.jsonOutput = true;
    else if (!a.startsWith('-')) opts.input = a;
    else if (a === '--tag' && args[i + 1]) { opts.outTag = args[++i]; }
  }
  return opts;
}

function mockDiagnostic(inputPath) {
  // 本来はExcel/CSVを読み込んで計算。ここではデモ用にモック値を返す。
  const base = basename(inputPath, extname(inputPath));
  const totalValue = 50000 + Math.floor(Math.random() * 100000);
  const matchRate = 70 + Math.random() * 25;
  const fourWeekRecover = totalValue * (matchRate / 100) * 0.85;
  const priorityScore = Math.min(100, Math.max(0, Math.round(50 + Math.random() * 50)));
  const companyName = base.replace(/[-_]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  return {
    id: `${Date.now()}`,
    generated_at: new Date().toISOString(),
    company_name: companyName,
    total_stock_value: totalValue,
    demand_match_rate: Math.round(matchRate * 10) / 10,
    four_week_recovery_estimate: Math.round(fourWeekRecover),
    priority_score: priorityScore,
    recommendation: priorityScore >= 75 ? '48h以内にアプローチ推奨' : '2週間以内にアプローチ推奨'
  };
}

function main() {
  const opts = parseArgs();
  if (!opts.input) {
    console.error('使い方: node generate-deadstock-diagnostic.mjs <入力ファイル> [--json-output] [--tag <tag>]');
    process.exit(1);
  }

  const diag = mockDiagnostic(opts.input);
  mkdirSync(reportsDir, { recursive: true });

  const tag = opts.outTag || Date.now().toString();
  const mdPath = join(reportsDir, `diagnostic-${tag}.md`);
  const jsonPath = join(reportsDir, `diagnostic-${tag}.json`);

  // Markdown
  const md = `# Dead Stock Diagnostic - ${diag.company_name}

- 生成日時: ${diag.generated_at}
- 総在庫価値: ¥${diag.total_stock_value.toLocaleString()}
- 需要一致率: ${diag.demand_match_rate}%
- 4週間推定回収価値: ¥${diag.four_week_recovery_estimate.toLocaleString()}
- 商談優先スコア: ${diag.priority_score}/100
- 推奨アクション: ${diag.recommendation}
`;
  writeFileSync(mdPath, md, 'utf8');
  console.log(`[generate-deadstock-diagnostic] Markdown: ${mdPath}`);

  if (opts.jsonOutput) {
    writeFileSync(jsonPath, JSON.stringify(diag, null, 2), 'utf8');
    console.log(`[generate-deadstock-diagnostic] JSON: ${jsonPath}`);
  }
}

main();
