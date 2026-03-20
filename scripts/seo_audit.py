#!/usr/bin/env python3
"""
SEO Quality Audit Script for pharma-free-tools
Usage: python3 scripts/seo_audit.py [--fix]
"""

import os
import re
import sys
from pathlib import Path
from dataclasses import dataclass
from typing import List, Optional

@dataclass
class AuditResult:
    file: str
    check: str
    status: str  # PASS, FAIL, WARN
    message: str
    value: Optional[str] = None

def get_all_html_files(base_path: Path) -> List[Path]:
    """Get all HTML files in the directory."""
    return sorted(base_path.glob("*.html"))

def read_file(filepath: Path) -> str:
    """Read file content."""
    with open(filepath, 'r', encoding='utf-8') as f:
        return f.read()

def check_meta_description(content: str, filepath: Path) -> AuditResult:
    """Check meta description (50-160 chars)."""
    match = re.search(r'<meta name="description" content="([^"]*)"', content)
    if not match:
        return AuditResult(str(filepath.name), "meta_description", "FAIL", "Missing meta description")
    
    description = match.group(1)
    length = len(description)
    
    if length < 50:
        return AuditResult(str(filepath.name), "meta_description", "FAIL", 
                          f"Too short ({length} chars, min 50)", description)
    elif length > 160:
        return AuditResult(str(filepath.name), "meta_description", "WARN", 
                          f"Too long ({length} chars, max 160)", description)
    else:
        return AuditResult(str(filepath.name), "meta_description", "PASS", 
                          f"OK ({length} chars)")

def check_ga4(content: str, filepath: Path) -> AuditResult:
    """Check GA4 tag presence."""
    if 'G-XXXXXXXXXX' in content or re.search(r'G-[A-Z0-9]{10}', content):
        return AuditResult(str(filepath.name), "ga4_tag", "PASS", "GA4 tag present")
    return AuditResult(str(filepath.name), "ga4_tag", "FAIL", "Missing GA4 tag")

def check_title(content: str, filepath: Path) -> AuditResult:
    """Check title tag."""
    match = re.search(r'<title>([^<]+)</title>', content)
    if not match:
        return AuditResult(str(filepath.name), "title_tag", "FAIL", "Missing title tag")
    
    title = match.group(1)
    length = len(title)
    
    if length < 30:
        return AuditResult(str(filepath.name), "title_tag", "WARN", 
                          f"Short title ({length} chars)", title)
    elif length > 60:
        return AuditResult(str(filepath.name), "title_tag", "WARN", 
                          f"Long title ({length} chars)", title)
    else:
        return AuditResult(str(filepath.name), "title_tag", "PASS", 
                          f"OK ({length} chars)")

def check_ogp(content: str, filepath: Path) -> AuditResult:
    """Check OGP tags."""
    required_ogp = ['og:title', 'og:description', 'og:url']
    missing = []
    
    for tag in required_ogp:
        if f'property="{tag}"' not in content:
            missing.append(tag)
    
    if missing:
        return AuditResult(str(filepath.name), "ogp_tags", "WARN", 
                          f"Missing: {', '.join(missing)}")
    return AuditResult(str(filepath.name), "ogp_tags", "PASS", "All required OGP tags present")

def check_cta(content: str, filepath: Path) -> AuditResult:
    """Check CTA section."""
    if 'cta-section' in content or 'cta-banner' in content:
        return AuditResult(str(filepath.name), "cta_section", "PASS", "CTA section present")
    return AuditResult(str(filepath.name), "cta_section", "FAIL", "Missing CTA section")

def check_related_tools(content: str, filepath: Path) -> AuditResult:
    """Check related tools section (skip index.html)."""
    if filepath.name == 'index.html':
        return AuditResult(str(filepath.name), "related_tools", "PASS", "Skipped (index.html)")
    
    if 'related-section' in content or '関連ツール' in content:
        return AuditResult(str(filepath.name), "related_tools", "PASS", "Related tools present")
    return AuditResult(str(filepath.name), "related_tools", "FAIL", "Missing related tools section")

def check_jsonld(content: str, filepath: Path) -> AuditResult:
    """Check JSON-LD structured data."""
    if 'application/ld+json' in content:
        return AuditResult(str(filepath.name), "jsonld", "PASS", "JSON-LD present")
    return AuditResult(str(filepath.name), "jsonld", "WARN", "Missing JSON-LD (recommended)")

def run_audit(base_path: Path) -> List[AuditResult]:
    """Run all audits on all HTML files."""
    results = []
    html_files = get_all_html_files(base_path)
    
    checks = [
        check_meta_description,
        check_ga4,
        check_title,
        check_ogp,
        check_cta,
        check_related_tools,
        check_jsonld,
    ]
    
    for filepath in html_files:
        content = read_file(filepath)
        for check in checks:
            results.append(check(content, filepath))
    
    return results

def print_report(results: List[AuditResult]):
    """Print audit report."""
    # Group by check type
    by_check = {}
    for r in results:
        if r.check not in by_check:
            by_check[r.check] = {'PASS': 0, 'FAIL': 0, 'WARN': 0}
        by_check[r.check][r.status] += 1
    
    total_files = len(set(r.file for r in results))
    total_checks = len(results)
    
    print("=" * 60)
    print("SEO Quality Audit Report")
    print("=" * 60)
    print(f"\nTotal files: {total_files}")
    print(f"Total checks: {total_checks}")
    print()
    
    # Summary by check type
    print("Summary by Check Type:")
    print("-" * 60)
    for check, counts in sorted(by_check.items()):
        total = sum(counts.values())
        pass_rate = (counts['PASS'] / total * 100) if total > 0 else 0
        status_icon = "✅" if pass_rate == 100 else "⚠️" if pass_rate >= 90 else "❌"
        print(f"{status_icon} {check:20} PASS: {counts['PASS']:3} FAIL: {counts['FAIL']:3} WARN: {counts['WARN']:3} ({pass_rate:.0f}%)")
    
    # Failed items
    failed = [r for r in results if r.status == 'FAIL']
    if failed:
        print("\n" + "=" * 60)
        print("FAILED Items (must fix):")
        print("-" * 60)
        for r in failed:
            print(f"❌ {r.file}: {r.message}")
    
    # Warnings
    warnings = [r for r in results if r.status == 'WARN']
    if warnings:
        print("\n" + "=" * 60)
        print("WARNINGS (recommended to fix):")
        print("-" * 60)
        for r in warnings[:10]:  # Show first 10
            print(f"⚠️  {r.file}: {r.message}")
        if len(warnings) > 10:
            print(f"... and {len(warnings) - 10} more warnings")
    
    # Overall score
    total_pass = sum(1 for r in results if r.status == 'PASS')
    total_fail = sum(1 for r in results if r.status == 'FAIL')
    total_warn = sum(1 for r in results if r.status == 'WARN')
    
    print("\n" + "=" * 60)
    score = (total_pass / total_checks * 100) if total_checks > 0 else 0
    print(f"Overall Score: {score:.1f}% ({total_pass}/{total_checks} checks passed)")
    print(f"  PASS: {total_pass}  FAIL: {total_fail}  WARN: {total_warn}")
    print("=" * 60)
    
    return total_fail == 0

def main():
    """Main entry point."""
    # Determine base path (script is in scripts/ directory)
    script_path = Path(__file__).parent
    base_path = script_path.parent
    
    print(f"Auditing: {base_path}")
    print()
    
    results = run_audit(base_path)
    all_passed = print_report(results)
    
    # Exit with error code if there are failures
    sys.exit(0 if all_passed else 1)

if __name__ == "__main__":
    main()
