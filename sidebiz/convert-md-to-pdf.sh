#!/bin/bash
# Markdown → HTML → PDF 変換（textutil 使用）
# Usage: ./convert-md-to-pdf.sh input.md output.pdf

set -e
IN_MD="$1"
OUT_PDF="$2"
TEMP_HTML="${IN_MD%.md}.html"

if [ -z "$IN_MD" ] || [ -z "$OUT_PDF" ]; then
  echo "Usage: $0 input.md output.pdf"
  exit 1
fi

# 簡易 Markdown → HTML（Node.js 使用）
node -e "
const fs = require('fs');
const md = fs.readFileSync(process.argv[1], 'utf8');
const html = '<!DOCTYPE html><html><head><meta charset=\"utf-8\"><title>Pharmacist AI Prompts</title></head><body>' +
  md
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\`([^\`]+)\`/g, '<code>$1</code>')
    .replace(/^[-] (.*)$/gim, '<li>$1</li>')
    .replace(/<li>.*<\/li>/s, '<ul>$&</ul>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/---/g, '<hr/>') +
  '</body></html>';
fs.writeFileSync(process.argv[2], html);
" "$IN_MD" "$TEMP_HTML"

# HTML → PDF
textutil -convert pdf "$TEMP_HTML" -output "$OUT_PDF"
rm -f "$TEMP_HTML"
echo "PDF created: $OUT_PDF"
