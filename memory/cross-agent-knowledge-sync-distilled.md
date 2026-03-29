# Cross-Agent Knowledge Sync — 蒸馏済み index

## このファイルの目的
2026-03-24 / 03-25 の cross-agent knowledge sync から、再利用価値の高い判断を各 RUNBOOK / MEMORY.md に蒸留済みであることを記録する。
生の sync ノートを読み直す必要はない。

## 蒸馏先

| 知見領域 | 蒸馏先 |
|---|---|
| DDS connection lifecycle (register/heartbeat/claim/callback) | `projects/deadstocksolution/ops/RUNBOOK.md` |
| DDS post-register safety (token 削除, active fields クリア) | `projects/deadstocksolution/ops/RUNBOOK.md` |
| OpenClaw CLI 不安定 = PATH/launchd 問題、version 問題ではない | `MEMORY.md` には未記載 — 要注意 |
| Queue dominant prefix triage | `projects/openclaw-core/ops/RUNBOOK.md` |
| Artifact retention / stale-report / baseline-smoke / report verification | `projects/openclaw-core/ops/RUNBOOK.md` |

## 未蒸馏
- （なし — CLI 安定化手順は 2026-03-28 に RUNBOOK に反映済み）

## 生ノート（参照のみ）
- `memory/2026-03-24-cross-agent-knowledge-sync.md`
- `memory/2026-03-25-cross-agent-knowledge-sync.md`
