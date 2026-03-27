# Board Pre-Meeting Brief — 2026-03-26 09:25 JST

## 結論
**input_gate=degraded**。Claude Code precheck は slot 一致だが、agenda seed は正本ファイル欠落＋生成時刻 stale で、Board 採否の根拠としては弱い。今回は **evidence-only** で上げる。

## board_cycle_slot_id
`20260326-0925`

## input_gate
`degraded`

## agenda seed 要点
- 取得正本: `reports/board/agenda-seed-latest.md` は **未存在**
- 実在入力: `reports/board/manual-agenda-seed-latest.md`
- generated_at: `2026-03-26 08:36 JST` → 今回スロットに対して **stale**
- board_cycle_slot_id: **明示なし**
- 要点: stale queue / triage / signal-only / runbook 化 / 監視固定 が主軸

## Claude Code 要点
- 取得正本: `reports/board/claude-code-precheck-latest.md`
- board_cycle_slot_id: `20260326-0925` → **一致**
- generated_at: `2026-03-26 09:28 JST` → **fresh**
- 判定: stale_input のため進行停止
- 要点: seed freshness 不一致のまま lane / contract 審議は止めるべき

## 全体サマリ
- seed は stale かつ正本欠落、precheck は slot 一致
- Board で強い採否判断は避け、縮退運転前提で evidence を共有
- 後段本会議では **最大3件** まで圧縮する前提で、まず論点を広めに載せる

## 要判断候補（最大6件）
1. `agenda-seed-latest` の正本化と `board_cycle_slot_id` 必須化
2. stale queue backlog の `safe-close / reopen / escalate` 固定
3. dominant-prefix triage の専任化
4. routine output の signal-only 化
5. board runtime producer map の統一
6. bundle + manifest + dry-run の sync 必須化
   - live runtime reflection は bundle manifest を先に作り、dry-run diff / smoke check を通ったものだけ publish 候補にする

## dispatch 阻害要因
- agenda seed 正本欠落
- seed の `board_cycle_slot_id` 未記載
- seed generated_at が今回スロットに対して stale
- precheck 側は stale_input 判定のため、強い採否には使えない

## 入力欠落/鮮度異常
- `reports/board/agenda-seed-latest.md`: **missing**
- `reports/board/manual-agenda-seed-latest.md`: **stale** / slot 明示なし
- `reports/board/claude-code-precheck-latest.md`: **fresh** / slot 一致
- したがって最終判定は **degraded**
