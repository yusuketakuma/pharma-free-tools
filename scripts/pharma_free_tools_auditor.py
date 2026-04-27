#!/usr/bin/env python3
"""pharma-free-tools-auditor

Runability:
- default: audit root HTML files only (existing behavior parity)
- scope=all: includes sidebiz + homecare HTML files (recursive)

Usage:
  python3 scripts/pharma_free_tools_auditor.py [--scope all|root|sidebiz|homecare] [--json-output PATH]

Return code:
- 0: 失敗 (FAIL) が 0 件
- 1: FAIL が 1 件以上
"""

from __future__ import annotations

import argparse
import json
import re
from collections import defaultdict
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable, List, Optional
from urllib.parse import urldefrag


@dataclass
class AuditResult:
    file: str
    check: str
    status: str  # PASS / WARN / FAIL
    message: str
    value: Optional[str] = None


ROOT_EXCLUDE_DIRS = {
    "node_modules",
    ".git",
    ".next",
    "coverage",
    "dist",
    "build",
}


def is_excluded(path: Path) -> bool:
    """Skip deep inspection under heavy/汎用生成物 directories."""
    parts = set(path.parts)
    return bool(parts & ROOT_EXCLUDE_DIRS) or str(path).endswith(".map")


def iter_html_files(base_path: Path, scope: str) -> List[Path]:
    """Collect HTML target files for a given scope."""
    scope = scope.lower()
    if scope not in {"root", "all", "sidebiz", "homecare"}:
        raise ValueError(f"Unsupported scope: {scope}")

    root_files: List[Path] = []
    sidebiz_files: List[Path] = []
    homecare_files: List[Path] = []

    root_files.extend(sorted(base_path.glob("*.html")))

    sidebiz_dir = base_path / "sidebiz"
    if scope in {"all", "sidebiz"} and sidebiz_dir.exists():
        sidebiz_files.extend(sorted(p for p in sidebiz_dir.rglob("*.html") if not is_excluded(p)))

    homecare_dir = base_path / "homecare"
    if scope in {"all", "homecare"} and homecare_dir.exists():
        homecare_files.extend(sorted(p for p in homecare_dir.rglob("*.html") if not is_excluded(p)))

    return root_files + sidebiz_files + homecare_files


def read_file(filepath: Path) -> str:
    with open(filepath, "r", encoding="utf-8") as fp:
        return fp.read()


def check_meta_description(content: str, filepath: Path) -> AuditResult:
    match = re.search(r'<meta[^>]*name=["\']description["\'][^>]*content=["\']([^"\']*)["\'][^>]*>', content, re.IGNORECASE)
    if not match:
        return AuditResult(str(filepath.name), "meta_description", "FAIL", "Meta description missing")

    description = match.group(1).strip()
    length = len(description)

    if length < 50:
        return AuditResult(str(filepath.name), "meta_description", "FAIL", f"Too short ({length} chars, min 50)", description)
    if length > 160:
        return AuditResult(str(filepath.name), "meta_description", "WARN", f"Too long ({length} chars, max 160)", description)
    return AuditResult(str(filepath.name), "meta_description", "PASS", f"OK ({length} chars)", description)


def check_ga4_tag(content: str, filepath: Path) -> AuditResult:
    # placeholder is intentionally warned, not treated as pass
    if re.search(r"G-XXXXXXXXXX", content):
        return AuditResult(str(filepath.name), "ga4_tag", "WARN", "GA4 placeholder detected")

    if re.search(r"G-[A-Z0-9]{10}", content):
        return AuditResult(str(filepath.name), "ga4_tag", "PASS", "GA4 tag detected")

    if "gtag" in content and "G-" in content:
        return AuditResult(str(filepath.name), "ga4_tag", "WARN", "GA4-like pattern detected, but format not strict")

    return AuditResult(str(filepath.name), "ga4_tag", "FAIL", "GA4 tag missing")


def check_title(content: str, filepath: Path) -> AuditResult:
    match = re.search(r"<title>([^<]+)</title>", content, re.IGNORECASE)
    if not match:
        return AuditResult(str(filepath.name), "title_tag", "FAIL", "Missing title")

    title = match.group(1).strip()
    length = len(title)

    if length < 30:
        return AuditResult(str(filepath.name), "title_tag", "WARN", f"Short title ({length} chars)", title)
    if length > 60:
        return AuditResult(str(filepath.name), "title_tag", "WARN", f"Long title ({length} chars)", title)
    return AuditResult(str(filepath.name), "title_tag", "PASS", f"OK ({length} chars)", title)


def check_ogp(content: str, filepath: Path) -> AuditResult:
    required_ogp = ["og:title", "og:description", "og:url", "og:type", "og:image"]
    missing = [tag for tag in required_ogp if f'property="{tag}"' not in content and f"property='{tag}'" not in content]
    if missing:
        return AuditResult(
            str(filepath.name),
            "ogp_tags",
            "WARN",
            "Missing OGP tags: " + ", ".join(missing),
        )
    return AuditResult(str(filepath.name), "ogp_tags", "PASS", "All required OGP tags present")


def check_cta(content: str, filepath: Path) -> AuditResult:
    if "cta-section" in content or "cta-banner" in content or "action-section" in content:
        return AuditResult(str(filepath.name), "cta_section", "PASS", "CTA section present")
    return AuditResult(str(filepath.name), "cta_section", "WARN", "CTA section not found")


def check_related_tools(content: str, filepath: Path) -> AuditResult:
    if filepath.name == "index.html":
        return AuditResult(str(filepath.name), "related_tools", "PASS", "index.html: skipped")
    if "related-section" in content or "関連ツール" in content:
        return AuditResult(str(filepath.name), "related_tools", "PASS", "Related tools section present")
    return AuditResult(str(filepath.name), "related_tools", "WARN", "Related tools section not found")


def check_jsonld(content: str, filepath: Path) -> AuditResult:
    if "application/ld+json" in content:
        return AuditResult(str(filepath.name), "jsonld", "PASS", "JSON-LD present")
    return AuditResult(str(filepath.name), "jsonld", "WARN", "Missing JSON-LD (recommended)")


def _iter_local_links(content: str) -> Iterable[str]:
    href_re = re.compile(r"href=(?P<q>['\"])(?P<href>[^'\"]+)\1", re.IGNORECASE)
    for m in href_re.finditer(content):
        href = m.group("href").strip()
        if not href:
            continue
        yield href


def check_internal_links(content: str, filepath: Path, base_path: Path) -> AuditResult:
    """Check links that are expected to be local .html files."""
    missing: List[str] = []
    for raw in _iter_local_links(content):
        href, _ = urldefrag(raw)
        href = href.strip()

        if href.startswith(("#", "javascript:", "mailto:", "tel:", "mailto:", "sms:", "mailto")):
            continue
        if href.startswith("http://") or href.startswith("https://"):
            continue
        if href.startswith("//"):
            continue
        if "{{" in href or "{%" in href or "{{#" in href:
            # templated path
            continue
        if not href.lower().endswith(".html") and not href.endswith("/"):
            continue

        candidate: Optional[Path]
        if href.startswith("/"):
            candidate = base_path / href.lstrip("/")
        elif href.startswith("../") or href.startswith("./"):
            candidate = (filepath.parent / href).resolve()
        else:
            candidate = (filepath.parent / href).resolve()

        # ignore local anchors in same page like "./" root-like links and "index.html/"
        if href == "/" or href.endswith("/"):
            candidate = base_path / "index.html"

        if not candidate.exists() or not candidate.is_file():
            missing.append(href)
            continue

        if candidate.suffix.lower() != ".html":
            continue

    if missing:
        # keep at most 5 samples to reduce noise in logs
        shown = ", ".join(missing[:5])
        if len(missing) > 5:
            shown += f", ... (+{len(missing) - 5} more)"
        return AuditResult(
            str(filepath.name),
            "internal_links",
            "WARN",
            f"Potentially broken local links: {len(missing)}",
            shown,
        )

    return AuditResult(str(filepath.name), "internal_links", "PASS", "No missing local HTML links")


def check_og_url_domain(content: str, filepath: Path) -> AuditResult:
    og_url_re = re.compile(r'property=["\']og:url["\'][^>]*content=["\']([^"\']+)["\']', re.IGNORECASE)
    match = og_url_re.search(content)
    if not match:
        return AuditResult(str(filepath.name), "og_url_domain", "WARN", "Missing og:url")

    url = match.group(1)
    if "vercel.app" in url or "yusuke-ai" in url:
        return AuditResult(
            str(filepath.name),
            "og_url_domain",
            "FAIL",
            "Invalid OGP URL domain (legacy/obsolete domain detected)",
            url,
        )
    return AuditResult(str(filepath.name), "og_url_domain", "PASS", "OGP URL is acceptable")


def run_audit(base_path: Path, scope: str) -> List[AuditResult]:
    results: List[AuditResult] = []
    html_files = iter_html_files(base_path, scope)

    checks = [
        check_meta_description,
        check_ga4_tag,
        check_title,
        check_ogp,
        check_cta,
        check_related_tools,
        check_jsonld,
        check_og_url_domain,
    ]

    for filepath in html_files:
        content = read_file(filepath)
        for check in checks:
            results.append(check(content, filepath))
        results.append(check_internal_links(content, filepath, base_path))

    # enforce deterministic order
    return sorted(results, key=lambda r: (r.file, r.check, r.status))


def print_report(results: List[AuditResult], scope: str) -> bool:
    if not results:
        print("No target HTML files found.")
        return True

    by_check = defaultdict(lambda: {"PASS": 0, "FAIL": 0, "WARN": 0})
    for r in results:
        by_check[r.check][r.status] += 1

    total_files = len(set(r.file for r in results))
    total_checks = len(results)

    print("=" * 60)
    print("pharma-free-tools Auditor Report")
    print("=" * 60)
    print(f"\nTarget scope: {scope}")
    print(f"Total files: {total_files}")
    print(f"Total checks: {total_checks}")
    print()

    print("Summary by Check Type:")
    print("-" * 60)
    for check in sorted(by_check.keys()):
        counts = by_check[check]
        total = counts["PASS"] + counts["FAIL"] + counts["WARN"]
        pass_rate = (counts["PASS"] / total * 100) if total else 0
        if pass_rate == 100:
            icon = "✅"
        elif pass_rate >= 90:
            icon = "⚠️"
        else:
            icon = "❌"
        print(f"{icon} {check:20} PASS: {counts['PASS']:3} FAIL: {counts['FAIL']:3} WARN: {counts['WARN']:3} ({pass_rate:.0f}%)")

    failed = [r for r in results if r.status == "FAIL"]
    if failed:
        print("\n" + "=" * 60)
        print("FAILED Items (must fix):")
        print("-" * 60)
        for r in failed:
            print(f"❌ {r.file}: {r.message}")

    warnings = [r for r in results if r.status == "WARN"]
    if warnings:
        print("\n" + "=" * 60)
        print("WARNINGS (recommended to fix):")
        print("-" * 60)
        for r in warnings[:10]:
            if r.value:
                print(f"⚠️  {r.file}: {r.message} :: {r.value}")
            else:
                print(f"⚠️  {r.file}: {r.message}")
        if len(warnings) > 10:
            print(f"... and {len(warnings) - 10} more warnings")

    total_pass = sum(1 for r in results if r.status == "PASS")
    total_fail = sum(1 for r in results if r.status == "FAIL")
    total_warn = sum(1 for r in results if r.status == "WARN")
    score = (total_pass / total_checks) * 100 if total_checks else 0

    print("\n" + "=" * 60)
    print(f"Overall Score: {score:.1f}% ({total_pass}/{total_checks} checks passed)")
    print(f"  PASS: {total_pass}  FAIL: {total_fail}  WARN: {total_warn}")
    print("=" * 60)

    return total_fail == 0


def _serialize_results(results: List[AuditResult]) -> dict:
    return {
        "total": len(results),
        "checks": [
            {
                "file": r.file,
                "check": r.check,
                "status": r.status,
                "message": r.message,
                "value": r.value,
            }
            for r in results
        ],
        "summary": {
            "count_by_check": {
                check: {
                    status: count
                    for status, count in counts.items()
                }
                for check, counts in _group_summary(results).items()
            },
            "overall": {
                "pass": sum(1 for r in results if r.status == "PASS"),
                "fail": sum(1 for r in results if r.status == "FAIL"),
                "warn": sum(1 for r in results if r.status == "WARN"),
                "files": len(set(r.file for r in results)),
            },
        },
    }


def _group_summary(results: List[AuditResult]) -> dict:
    grouped = {}
    for r in results:
        check_counts = grouped.setdefault(r.check, {"PASS": 0, "FAIL": 0, "WARN": 0})
        check_counts[r.status] += 1
    return grouped


def main() -> None:
    parser = argparse.ArgumentParser(description="pharma-free-tools-auditor")
    parser.add_argument(
        "--scope",
        choices=["root", "sidebiz", "homecare", "all"],
        default="root",
        help="Audit scope: root|sidebiz|homecare|all (default: root)",
    )
    parser.add_argument(
        "--base",
        default=str(Path(__file__).resolve().parent.parent),
        help="Project root path (default: scripts/../)",
    )
    parser.add_argument(
        "--json-output",
        default="",
        help="Optional JSON output path",
    )
    # legacy no-op kept for backward compatibility with old docs/usage
    parser.add_argument("--fix", action="store_true", help="legacy no-op (kept for compatibility)")

    args = parser.parse_args()

    base_path = Path(args.base).resolve()
    results = run_audit(base_path, args.scope)
    all_passed = print_report(results, args.scope)

    if args.json_output:
        output = _serialize_results(results)
        out_path = Path(args.json_output)
        out_path.parent.mkdir(parents=True, exist_ok=True)
        out_path.write_text(json.dumps(output, ensure_ascii=False, indent=2), encoding="utf-8")
        print(f"JSON report: {out_path}")

    raise SystemExit(0 if all_passed else 1)


if __name__ == "__main__":
    main()
