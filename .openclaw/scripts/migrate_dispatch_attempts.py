#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))

from task_runtime import atomic_write_text, load_jsonl, migrate_dispatch_attempt_rows  # noqa: E402


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Migrate legacy dispatch-attempts.jsonl artifacts to schema v1")
    parser.add_argument("--path", action="append", default=[])
    parser.add_argument("--tasks-root", default=str(ROOT / "tasks"))
    parser.add_argument("--write", action="store_true", help="Rewrite files in place after creating *.legacy.bak backups")
    return parser.parse_args()


def iter_candidate_paths(explicit: list[str], tasks_root: Path) -> list[Path]:
    if explicit:
        return [Path(item) for item in explicit]
    return sorted(tasks_root.glob("*/dispatch-attempts.jsonl"))


def migrate_one(path: Path, *, write: bool) -> dict:
    if not path.exists():
        return {"path": str(path), "status": "missing", "migrated": 0, "skipped": 0}
    raw_rows = load_jsonl(path)
    if not raw_rows:
        return {"path": str(path), "status": "empty", "migrated": 0, "skipped": 0}
    try:
        normalized = migrate_dispatch_attempt_rows(raw_rows)
    except Exception as exc:  # noqa: BLE001
        return {"path": str(path), "status": "error", "error": str(exc), "migrated": 0, "skipped": len(raw_rows)}
    if write and normalized:
        backup = path.with_suffix(path.suffix + ".legacy.bak")
        if not backup.exists():
            atomic_write_text(backup, path.read_text(encoding="utf-8"))
        atomic_write_text(path, "".join(json.dumps(row, ensure_ascii=False) + "\n" for row in normalized))
    return {
        "path": str(path),
        "status": "migrated" if write else "preview",
        "migrated": len(normalized),
        "skipped": max(len(raw_rows) - len(normalized), 0),
    }


def main() -> int:
    args = parse_args()
    results = [migrate_one(path, write=args.write) for path in iter_candidate_paths(args.path, Path(args.tasks_root))]
    summary = {
        "write": args.write,
        "results": results,
        "migrated_files": sum(1 for item in results if item.get("status") in {"migrated", "preview"} and item.get("migrated", 0) > 0),
        "error_files": sum(1 for item in results if item.get("status") == "error"),
    }
    print(json.dumps(summary, ensure_ascii=False, indent=2))
    return 0 if summary["error_files"] == 0 else 1


if __name__ == "__main__":
    raise SystemExit(main())
