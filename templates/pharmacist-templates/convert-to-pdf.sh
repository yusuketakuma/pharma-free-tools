#!/bin/bash
# Markdown to PDF conversion script for pharmacist templates
# Requires: pandoc (brew install pandoc) or wkhtmltopdf

set -e

TEMPLATES_DIR="$(dirname "$0")"
OUTPUT_DIR="$TEMPLATES_DIR/pdf"

mkdir -p "$OUTPUT_DIR"

# Check for pandoc
if command -v pandoc &> /dev/null; then
    echo "Using pandoc for PDF conversion..."
    for md in "$TEMPLATES_DIR"/*.md; do
        if [[ -f "$md" && "$(basename "$md")" != "sales-page-draft.md" ]]; then
            filename=$(basename "$md" .md)
            pandoc "$md" -o "$OUTPUT_DIR/${filename}.pdf" \
                --pdf-engine=xelatex \
                -V mainfont="Hiragino Sans" \
                -V geometry:margin=1in
            echo "Converted: $filename.pdf"
        fi
    done
else
    echo "Error: pandoc not found. Install with: brew install pandoc"
    echo "Alternative: brew install --cask wkhtmltopdf"
    exit 1
fi

echo "PDF files saved to: $OUTPUT_DIR"
