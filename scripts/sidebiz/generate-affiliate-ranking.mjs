#!/usr/bin/env node
/**
 * AI SaaS アフィリエイトランキング自動生成
 * 
 * 用途: affiliate-tools-registry.json からランキングページを生成
 * 出力: Markdown + JSON
 * 
 * 実行: node scripts/sidebiz/generate-affiliate-ranking.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');

const REGISTRY_PATH = path.join(ROOT, 'data/sidebiz/affiliate-tools-registry.json');
const OUTPUT_DIR = path.join(ROOT, 'reports/sidebiz');

function loadRegistry() {
  if (!fs.existsSync(REGISTRY_PATH)) {
    console.error('Registry not found:', REGISTRY_PATH);
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(REGISTRY_PATH, 'utf-8'));
}

function parseCommissionRate(rate) {
  // "40-60%" -> 50, "30%" -> 30
  const match = rate.match(/(\d+)(?:-(\d+))?%/);
  if (!match) return 0;
  const min = parseInt(match[1], 10);
  const max = match[2] ? parseInt(match[2], 10) : min;
  return (min + max) / 2;
}

function scoreTool(tool) {
  let score = 0;
  
  // Commission rate (0-40 points)
  const rate = parseCommissionRate(tool.commissionRate);
  score += Math.min(rate * 0.8, 40);
  
  // Duration bonus (0-30 points)
  if (tool.commissionDuration === 'lifetime') score += 30;
  else if (tool.commissionDuration === '24 months') score += 25;
  else if (tool.commissionDuration === '12 months') score += 15;
  
  // Bonus offerings (0-15 points)
  if (tool.bonus) score += 10;
  if (tool.signupBonus) score += 5;
  
  // Manual priority adjustment (0-15 points)
  score += (5 - tool.priority) * 5;
  
  return Math.round(score);
}

function generateMarkdown(registry) {
  const tools = registry.tools
    .map(t => ({ ...t, score: scoreTool(t) }))
    .sort((a, b) => b.score - a.score);
  
  const date = new Date().toISOString().split('T')[0];
  
  let md = `# AI SaaS アフィリエイトランキング

> 自動生成: ${date}
> 登録ツール数: ${tools.length}

## 🏆 高報酬ランキング（スコア順）

| 順位 | ツール | カテゴリ | 報酬率 | 期間 | スコア |
|------|--------|----------|--------|------|--------|
`;
  
  tools.forEach((tool, i) => {
    const rank = i + 1;
    const emoji = rank <= 3 ? ['🥇', '🥈', '🥉'][i] : `${rank}.`;
    const link = `[${tool.name}](${tool.affiliateUrl})`;
    const category = registry.categories[tool.category] || tool.category;
    const bonus = tool.bonus || tool.signupBonus ? ' 💰' : '';
    md += `| ${emoji} | ${link}${bonus} | ${category} | ${tool.commissionRate} | ${tool.commissionDuration} | ${tool.score} |\n`;
  });

  md += `
---

## 📊 カテゴリ別おすすめ

`;

  const byCategory = {};
  tools.forEach(t => {
    if (!byCategory[t.category]) byCategory[t.category] = [];
    byCategory[t.category].push(t);
  });

  Object.entries(byCategory).forEach(([cat, catTools]) => {
    const catName = registry.categories[cat] || cat;
    md += `### ${catName}\n\n`;
    catTools.slice(0, 3).forEach(t => {
      md += `- **${t.name}** - ${t.commissionRate} ${t.commissionDuration} - ${t.description}\n`;
    });
    md += '\n';
  });

  md += `---

## 🔗 次のアクション

1. **優先度1（スコア80+）のツールからアフィリエイト登録**
2. **コンテンツ作成**: 各ツールのレビュー記事または比較記事
3. **トラッキング設定**: UTMパラメータで流入元を計測

---

*KPI: クリック数 / 登録数 / 初月収益*
`;

  return { md, tools, date };
}

function generateJson(tools, date) {
  return {
    generatedAt: date,
    totalTools: tools.length,
    topTools: tools.slice(0, 5).map(t => ({
      id: t.id,
      name: t.name,
      commissionRate: t.commissionRate,
      score: t.score
    })),
    categoryCounts: tools.reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + 1;
      return acc;
    }, {})
  };
}

function main() {
  const registry = loadRegistry();
  const { md, tools, date } = generateMarkdown(registry);
  const json = generateJson(tools, date);
  
  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
  
  const mdPath = path.join(OUTPUT_DIR, `affiliate-ranking-${date}.md`);
  const jsonPath = path.join(OUTPUT_DIR, `affiliate-ranking-${date}.json`);
  
  fs.writeFileSync(mdPath, md);
  fs.writeFileSync(jsonPath, JSON.stringify(json, null, 2));
  
  console.log('✅ Generated:', mdPath);
  console.log('✅ Generated:', jsonPath);
  console.log('\n📊 Top 5 tools:');
  tools.slice(0, 5).forEach((t, i) => {
    console.log(`  ${i + 1}. ${t.name} - ${t.commissionRate} (score: ${t.score})`);
  });
}

main();
