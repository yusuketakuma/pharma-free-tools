#!/usr/bin/env python3
from __future__ import annotations

from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo
import re

JST = ZoneInfo("Asia/Tokyo")
BOARD_DIR = Path("/Users/yusuke/.openclaw/workspace/reports/board")
LATEST_CANON = BOARD_DIR / "board-premeeting-brief-latest.md"


def compute_slot_id(now_jst: datetime) -> str:
    slot = now_jst.replace(minute=35, second=0, microsecond=0)
    return slot.strftime("%Y%m%d-%H%M")


def extract_slot_id(content: str) -> str | None:
    m = re.search(r"board_cycle_slot_id:\s*`?(\d{8}-\d{4})`?", content)
    return m.group(1) if m else None


def find_source() -> Path | None:
    candidates = []
    candidates.extend(BOARD_DIR.glob("board-input-brief-*.md"))
    candidates.extend(BOARD_DIR.glob("board-premeeting-brief-*.md"))
    candidates = [p for p in candidates if p.is_file()]
    if not candidates:
        return None
    return max(candidates, key=lambda p: p.stat().st_mtime)


def canonicalize(content: str, source_name: str, slot_id: str, checked_at: str) -> str:
    body = content
    body = re.sub(r"^#\s*Board input brief\s*$", "# Board premeeting brief latest", body, flags=re.MULTILINE)
    body = re.sub(r"^#\s*Board Pre-Meeting Brief.*$", "# Board premeeting brief latest", body, flags=re.MULTILINE)

    lines = body.splitlines()
    out: list[str] = []
    inserted_meta = False
    for i, line in enumerate(lines):
        if i == 0 and line.startswith("# "):
            out.append(line)
            out.append("")
            out.append(f"- board_cycle_slot_id: {slot_id}")
            out.append(f"- checked_at: {checked_at}")
            out.append(f"- source_artifact: {source_name}")
            out.append("")
            inserted_meta = True
            continue
        if i < 12 and (line.startswith("- board_cycle_slot_id:") or line.startswith("- checked_at:") or line.startswith("- source_artifact:")):
            continue
        if re.fullmatch(r"`\d{8}-\d{4}`", line.strip()):
            out.append(f"`{slot_id}`")
            continue
        out.append(line)
    if not inserted_meta:
        out = ["# Board premeeting brief latest", "", f"- board_cycle_slot_id: {slot_id}", f"- checked_at: {checked_at}", f"- source_artifact: {source_name}", ""] + out
    text = "\n".join(out)
    text = re.sub(r"board_cycle_slot_id\s*:?\s*`?\d{8}-\d{4}`?", f"board_cycle_slot_id: `{slot_id}`", text)
    return text.rstrip() + "\n"


def main() -> None:
    BOARD_DIR.mkdir(parents=True, exist_ok=True)
    source = find_source()
    if source is None:
        raise SystemExit("no premeeting source artifact found")
    now_jst = datetime.now(JST)
    source_text = source.read_text(encoding="utf-8")
    slot_id = extract_slot_id(source_text) or compute_slot_id(now_jst)
    checked_at = now_jst.strftime("%Y-%m-%d %H:%M JST")
    canon = canonicalize(source_text, source.name, slot_id, checked_at)
    latest = LATEST_CANON
    slot = BOARD_DIR / f"board-premeeting-brief-{slot_id}.md"
    latest.write_text(canon, encoding="utf-8")
    slot.write_text(canon, encoding="utf-8")
    print(f"source={source}")
    print(f"latest={latest}")
    print(f"slot={slot}")


if __name__ == "__main__":
    main()
