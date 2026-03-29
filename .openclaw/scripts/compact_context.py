#!/usr/bin/env python3
import argparse
import pathlib


def compact(text: str, max_chars: int) -> str:
    if len(text) <= max_chars:
        return text
    keep_head = max_chars // 2
    keep_tail = max_chars - keep_head - len("\n\n[context compacted by OpenClaw]\n\n")
    return text[:keep_head] + "\n\n[context compacted by OpenClaw]\n\n" + text[-keep_tail:]


def main() -> int:
    parser = argparse.ArgumentParser(description="Compact large context files for execution handoff")
    parser.add_argument("path")
    parser.add_argument("--max-chars", type=int, default=1200)
    args = parser.parse_args()

    text = pathlib.Path(args.path).read_text(encoding="utf-8")
    print(compact(text, args.max_chars))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
