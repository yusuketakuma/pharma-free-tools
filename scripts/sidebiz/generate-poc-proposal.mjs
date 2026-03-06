#!/usr/bin/env node
/**
 * 在庫ロス診断 PoC提案文生成スクリプト
 * 漏斗CSVから未送付リードを抽出し、PoC提案文を生成
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const workspaceRoot = path.resolve(__dirname, '../..');

// 引数解析
const args = process.argv.slice(2);
const options = {
  funnelFile: null,
  outputDir: null,
  limit: 5,
  format: 'markdown',
};

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--funnel' && args[i + 1]) {
    options.funnelFile = args[++i];
  } else if (args[i] === '--output' && args[i + 1]) {
    options.outputDir = args[++i];
  } else if (args[i] === '--limit' && args[i + 1]) {
    options.limit = parseInt(args[++i], 10);
  } else if (args[i] === '--format' && args[i + 1]) {
    options.format = args[++i];
  }
}

// デフォルトパス
const currentMonth = new Date().toISOString().slice(0, 7);
options.funnelFile = options.funnelFile || path.join(workspaceRoot, 'reports/sidebiz/funnel-tracker-' + currentMonth + '.csv');
options.outputDir = options.outputDir || path.join(workspaceRoot, 'reports/sidebiz/poc-proposals');

// CSVパース
function parseCSV(content) {
  const lines = content.trim().split('\n');
  const headers = lines[0].split(',');
  const records = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',');
    const record = {};
    headers.forEach((h, idx) => {
      record[h.trim()] = values[idx] ? values[idx].trim() : '';
    });
    records.push(record);
  }
  
  return records;
}

// 未送付リード抽出
function extractUnsentLeads(records) {
  return records
    .filter(r => !r.poc_sent_at || r.poc_sent_at === '')
    .sort((a, b) => parseInt(b.priority_score, 10) - parseInt(a.priority_score, 10))
    .slice(0, options.limit);
}

// PoC提案文生成（Markdown）
function generateMarkdown(lead) {
  const value = parseInt(lead.four_week_value, 10) || 0;
  const score = parseInt(lead.priority_score, 10) || 50;
  
  // 提案金額の計算（4週間価値の10-20%をPoC料金に設定）
  const pocAmount = Math.round(value * 0.15 / 1000) * 1000; // 千円単位に丸める
  const monthlyAmount = Math.round(value / 4 / 1000) * 1000; // 月額換算
  
  return `# 在庫ロス診断 PoC提案書

## 貴社名
${lead.company_name}

## 診断日
${new Date().toLocaleDateString('ja-JP')}

---

## 概要

貴社の在庫ロス状況を診断し、4週間で**¥${value.toLocaleString()}**の損失削減可能性を特定しました。

---

## 診断結果サマリー

| 項目 | 数値 |
|------|------|
| 優先スコア | ${score}/100 |
| 4週間削減見込 | ¥${value.toLocaleString()} |
| 推奨アクション | PoC実施 |

---

## PoC提案内容

### 実施期間
2週間

### PoC費用
**¥${pocAmount.toLocaleString()}**（税込）

### 提供内容
1. 在庫データ分析（Excel提出のみでOK）
2. 削減可能な損失項目の特定
3. 改善提案レポートの提出

### 期待効果
- 月額換算: ¥${monthlyAmount.toLocaleString()}/月の損失削減
- ROI: PoC費用の${Math.round(monthlyAmount / pocAmount * 100)}%回収見込

---

## 次のステップ

1. 本提案のご確認
2. 質問・調整事項のご相談
3. PoC開始日程の調整

---

## お問い合わせ

本提案についてご質問がございましたら、お気軽にお問い合わせください。

---

*本提案書は在庫ロス診断システムにより自動生成されました。*
*生成日時: ${new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })}*
`;
}

// PoC提案文生成（Telegram用短縮版）
function generateTelegram(lead) {
  const value = parseInt(lead.four_week_value, 10) || 0;
  const score = parseInt(lead.priority_score, 10) || 50;
  const pocAmount = Math.round(value * 0.15 / 1000) * 1000;
  const monthlyAmount = Math.round(value / 4 / 1000) * 1000;
  
  return `📊 **在庫ロス診断 PoC提案**

**${lead.company_name}** 様

🔍 診断結果:
- 優先スコア: ${score}/100
- 4週間削減見込: ¥${value.toLocaleString()}

💡 PoC提案:
- 期間: 2週間
- 費用: ¥${pocAmount.toLocaleString()}
- 期待効果: ¥${monthlyAmount.toLocaleString()}/月の損失削減

📅 次のステップ:
1. 本提案のご確認
2. 質問・調整のご相談
3. PoC開始日程の調整

---
*${new Date().toLocaleDateString('ja-JP')} 自動生成*`;
}

// メイン処理
function main() {
  // CSV読み込み
  if (!fs.existsSync(options.funnelFile)) {
    console.error('❌ 漏斗CSVファイルが見つかりません:', options.funnelFile);
    process.exit(1);
  }
  
  const csvContent = fs.readFileSync(options.funnelFile, 'utf-8');
  const records = parseCSV(csvContent);
  const unsentLeads = extractUnsentLeads(records);
  
  if (unsentLeads.length === 0) {
    console.log('✅ 未送付リードはありません');
    return;
  }
  
  console.log(`📋 未送付リード: ${unsentLeads.length}件\n`);
  
  // 出力ディレクトリ作成
  if (!fs.existsSync(options.outputDir)) {
    fs.mkdirSync(options.outputDir, { recursive: true });
  }
  
  // 各リードの提案文生成
  const results = [];
  const timestamp = new Date().toISOString().slice(0, 10);
  
  unsentLeads.forEach((lead, idx) => {
    const content = options.format === 'telegram' 
      ? generateTelegram(lead)
      : generateMarkdown(lead);
    
    const filename = `poc-proposal-${lead.id}-${timestamp}.${options.format === 'telegram' ? 'txt' : 'md'}`;
    const outputPath = path.join(options.outputDir, filename);
    
    fs.writeFileSync(outputPath, content);
    
    results.push({
      id: lead.id,
      company: lead.company_name,
      score: lead.priority_score,
      value: lead.four_week_value,
      outputPath
    });
    
    console.log(`✅ [${idx + 1}/${unsentLeads.length}] ${lead.company_name}`);
    console.log(`   スコア: ${lead.priority_score} / 4週間価値: ¥${parseInt(lead.four_week_value, 10).toLocaleString()}`);
    console.log(`   出力: ${outputPath}\n`);
  });
  
  // サマリーJSON
  const summaryPath = path.join(options.outputDir, `poc-proposals-summary-${timestamp}.json`);
  const summary = {
    generatedAt: new Date().toISOString(),
    totalLeads: unsentLeads.length,
    proposals: results,
    totalValue: results.reduce((sum, r) => sum + parseInt(r.value, 10), 0),
    totalPocRevenue: results.reduce((sum, r) => sum + Math.round(parseInt(r.value, 10) * 0.15 / 1000) * 1000, 0)
  };
  
  fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
  console.log(`📊 サマリー: ${summaryPath}`);
  console.log(`💰 総4週間価値: ¥${summary.totalValue.toLocaleString()}`);
  console.log(`💰 総PoC収益見込: ¥${summary.totalPocRevenue.toLocaleString()}`);
}

main();
