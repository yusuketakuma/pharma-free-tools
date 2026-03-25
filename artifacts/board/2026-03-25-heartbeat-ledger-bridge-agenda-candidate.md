# Agenda Candidate — heartbeat outcome ledger bridge gap

- created_at: 2026-03-25T14:12:00Z
- source: board-visionary heartbeat
- outcome: agenda_candidate
- scope: heartbeat governance / board observability / precedent formation

## Summary

heartbeat governance の設計は入っているが、**実際の board 成果物が formal ledger / precedent 経路にほぼ接続されていない**。このため、duplicate suppression・precedent reuse・reopen 判断の基盤が育たず、Board が毎回「初見扱い」で裁きやすい。

## Why this is worth board time

- これは単発の artifact 欠落ではなく、heartbeat governance の価値回収を止める構造ギャップ。
- ledger に接続されないまま board_note / candidate が増えると、Board の判断は蓄積されず、再審コストだけが増える。
- 既に runtime 側には `heartbeat_result` の置き場があるため、完全新設より **bridge ルールの固定** で改善余地が大きい。

## Evidence

1. `reports/heartbeat-governance-implementation-2026-03-25.md`
   - `heartbeat_result schema` / duplicate suppression / governance snapshot を実装済み。
2. `.openclaw/runtime/heartbeat/heartbeat-results.jsonl`
   - 現在 entries は 2 件のみで、board 系成果物の反映がほぼ見えない。
3. `.openclaw/reports/board/2026-03-25-board-agenda-2235-jst.md`
   - `precedent registry entries: 0`
   - `standing approval registry entries: 0`
4. `artifacts/board/`
   - 実際には `2026-03-25-stale-queue-reconciliation-candidate.md`
   - `2026-03-25-heartbeat-runbook-consolidation-candidate.md`
   - `2026-03-25-memory-recall-degraded-board-note.md`
   などの board 成果物が存在する。
5. `memory_search` では、この論点に対する既存 memory hit は取れなかった。

## Root issue

board artifact の生成、heartbeat runtime ledger、precedent registry が**別々に存在していて接続規約が弱い**。

## Desired change

Board で、最低限次を固定する価値がある。
- どの outcome が ledger append 対象か
- artifact path と heartbeat_result をどう紐づけるか
- precedent 化される前段の「pending board outcome」最小項目は何か
- report / agenda assembly / ledger の参照順をどう統一するか

## Requested action

- この論点を **governance / observability 系の board agenda** として扱い、bridge の最小 contract を決めるか判断する。

## Change scope

- low-code / process / artifact contract
- auth / routing / trust boundary / Telegram 設定には触れない

## Boundary impact

- 中
- 実行面の副作用は小さいが、Board の再審抑止・precedent reuse に広く効く

## Reversibility

- 高い
- append-only ledger / reference contract の追加で始められる

## Blast radius

- 中
- heartbeat / board / report レイヤーに横断影響
- 実リソースや対外送信には触れない

## Novelty

- queue backlog や memory recall そのものではなく、**それらが formal precedent に育たない共通原因**を扱う点で新規性がある。

## Recommendation

- proposed_lane: fast
- board_mode: chair_ack or short review
- first step: bridge contract を 1 枚の spec / runbook に落とし、次の 2〜3 heartbeat で観測する
