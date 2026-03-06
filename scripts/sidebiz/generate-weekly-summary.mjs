#!/usr/bin/env node
/**
 * 週次KPIサマリー生成スクリプト
 * Usage: node generate-weekly-summary.mjs [--channel telegram]
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPORTS_DIR = path.join(__dirname, '../../reports/sidebiz');

function getWeekLabel() {
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay()); // 日曜始まり
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  
  const fmt = (d) => `${d.getMonth() + 1}/${d.getDate()}`;
  return `${fmt(weekStart)}-${fmt(weekEnd)}`;
}

function loadFunnelKpi() {
  // 最新のfunnel-kpiファイルを探す
  const files = fs.readdirSync(REPORTS_DIR)
    .filter(f => f.startsWith('funnel-kpi-') && f.endsWith('.json'))
    .sort()
    .reverse();
  
  if (files.length === 0) return null;
  
  const latest = files[0];
  const content = fs.readFileSync(path.join(REPORTS_DIR, latest), 'utf-8');
  return JSON.parse(content);
}

function formatTelegramSummary(kpi) {
  if (!kpi) {
    return `📊 副業週次サマリー (${getWeekLabel()})

⚠️ KPIデータがありません
初回診断を実行してください:
\`node scripts/sidebiz/generate-deadstock-diagnostic.mjs\``;
  }

  const pocRate = kpi.poc_rate ?? kpi.pocRate ?? 0;
  const mrr = kpi.mrr ?? 0;
  
  let status = '🟡 立ち上げ中';
  if (mrr >= 100000) status = '🟢 安定運用';
  else if (kpi.total_leads >= 5) status = '🟡 拡大期';
  
  const lines = [
    `📊 副業週次サマリー (${getWeekLabel()})`,
    ``,
    `${status}`,
    ``,
    `📈 今週のKPI:`,
    `• 総リード数: ${kpi.total_leads}件`,
    `• PoC送付済み: ${kpi.poc_sent_count}件`,
    `• PoC化率: ${pocRate.toFixed(1)}%`,
    `• 月額化率: ${(kpi.mrr_rate ?? 0).toFixed(1)}%`,
    `• 見込MRR: ¥${mrr.toLocaleString()}/月`,
    ``,
    `💡 次のアクション:`
  ];
  
  if (kpi.total_leads === 0) {
    lines.push(`• 診断対象データを投入してください`);
  } else if (pocRate < 50) {
    lines.push(`• 未送付リードへPoC提案を送付`);
  } else if (mrr < 50000) {
    lines.push(`• 商談加速または単価見直し検討`);
  } else {
    lines.push(`• 継続運用 + 新規リード獲得`);
  }
  
  lines.push(``, `詳細: reports/sidebiz/funnel-kpi-*.md`);
  
  return lines.join('\n');
}

function formatMarkdownSummary(kpi) {
  if (!kpi) {
    return `# 週次KPIサマリー (${getWeekLabel()})\n\nKPIデータがありません。\n`;
  }
  
  const pocRate = kpi.poc_rate ?? kpi.pocRate ?? 0;
  
  return `# 週次KPIサマリー (${getWeekLabel()})

## 概要

| 指標 | 値 |
|------|-----|
| 総リード数 | ${kpi.total_leads}件 |
| PoC送付済み | ${kpi.poc_sent_count}件 |
| PoC化率 | ${pocRate.toFixed(1)}% |
| 月額化率 | ${(kpi.mrr_rate ?? 0).toFixed(1)}% |
| 見込MRR | ¥${(kpi.mrr ?? 0).toLocaleString()}/月 |
| 平均優先スコア | ${(kpi.avg_priority_score ?? 0).toFixed(1)}/100 |
| 平均4週間回収見込 | ¥${(kpi.avg_four_week_recovery ?? 0).toLocaleString()} |

## 推奨アクション

${kpi.total_leads === 0 
  ? '- 診断対象データを投入してください'
  : pocRate < 50 
    ? '- 未送付リードへPoC提案を送付'
    : (kpi.mrr ?? 0) < 50000
      ? '- 商談加速または単価見直し検討'
      : '- 継続運用 + 新規リード獲得'}

---
Generated: ${new Date().toISOString()}
`;
}

// Main
const kpi = loadFunnelKpi();

// Markdown出力
const weekLabel = getWeekLabel().replace(/\//g, '-');
const mdPath = path.join(REPORTS_DIR, `weekly-summary-${weekLabel}.md`);
fs.mkdirSync(REPORTS_DIR, { recursive: true });
fs.writeFileSync(mdPath, formatMarkdownSummary(kpi));
console.log(`✅ Markdown saved: ${mdPath}`);

// Telegram用テキスト出力
const telegramPath = path.join(REPORTS_DIR, `weekly-summary-${weekLabel}.telegram.txt`);
fs.writeFileSync(telegramPath, formatTelegramSummary(kpi));
console.log(`✅ Telegram text saved: ${telegramPath}`);

// 標準出力にも表示
console.log('\n--- Telegram Preview ---\n');
console.log(formatTelegramSummary(kpi));
