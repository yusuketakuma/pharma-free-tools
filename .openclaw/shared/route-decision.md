# Shared Doc: Route Decision

## Goal
OpenClaw が「自分で処理するか / Claude Code に委譲するか」を一貫した基準で決める。

## Required fields
- task summary
- affected paths
- risk level
- approval required
- selected executor
- rationale

## Default rule
- 小さく安全な変更は OpenClaw
- 実装・多ファイル・検証込みは Claude Code
