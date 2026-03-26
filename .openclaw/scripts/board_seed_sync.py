#!/usr/bin/env python3
from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path
from zoneinfo import ZoneInfo
import re

JST = ZoneInfo("Asia/Tokyo")
BOARD_DIR = Path("/Users/yusuke/.openclaw/workspace/reports/board")
LATEST_MANUAL = BOARD_DIR / "manual-agenda-seed-latest.md"
LATEST_CANON = BOARD_DIR / "agenda-seed-latest.md"


def compute_slot_id(now_jst: datetime) -> str:
    slot = now_jst.replace(minute=35, second=0, microsecond=0)
    return slot.strftime("%Y%m%d-%H%M")


def latest_manual_timestamped() -> Path | None:
    files = sorted(BOARD_DIR.glob("manual-agenda-seed-*.md"))
    return files[-1] if files else None


def canonicalize(content: str, source_name: str, slot_id: str, generated_at: str) -> str:
    body = content
    body = re.sub(r"^#\s*manual board agenda seed latest\s*$", "# board agenda seed latest", body, flags=re.MULTILINE)
    body = re.sub(r"^#\s*manual board agenda seed.*$", "# board agenda seed", body, flags=re.MULTILINE)
    lines = body.splitlines()

    meta_lines = [
        f"- board_cycle_slot_id: {slot_id}",
        f"- generated_at: {generated_at}",
        f"- source_artifact: {source_name}",
    ]

    # remove legacy generated_at line near top to avoid duplication
    cleaned: list[str] = []
    for i, line in enumerate(lines):
        if i < 8 and line.startswith("- generated_at:"):
            continue
        cleaned.append(line)

    if cleaned and cleaned[0].startswith("# "):
        out = [cleaned[0], ""] + meta_lines + [""] + cleaned[1:]
    else:
        out = ["# board agenda seed", ""] + meta_lines + [""] + cleaned
    return "\n".join(out).rstrip() + "\n"


def main() -> None:
    BOARD_DIR.mkdir(parents=True, exist_ok=True)
    source = LATEST_MANUAL if LATEST_MANUAL.exists() else latest_manual_timestamped()
    if source is None or not source.exists():
        raise SystemExit("no manual agenda seed source found")

    now_jst = datetime.now(JST)
    slot_id = compute_slot_id(now_jst)
    generated_at = now_jst.strftime("%Y-%m-%d %H:%M JST")
    content = source.read_text(encoding="utf-8")
    canon = canonicalize(content, source.name, slot_id, generated_at)

    latest_path = LATEST_CANON
    slot_path = BOARD_DIR / f"agenda-seed-{slot_id}.md"
    latest_path.write_text(canon, encoding="utf-8")
    slot_path.write_text(canon, encoding="utf-8")

    print(f"source={source}")
    print(f"latest={latest_path}")
    print(f"slot={slot_path}")


if __name__ == "__main__":
    main()
