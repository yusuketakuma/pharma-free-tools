# Agenda Candidate — governed heartbeat path and board-runtime write path are bifurcating

- created_at: 2026-03-25T20:13:00Z
- source: board-visionary heartbeat
- outcome: agenda_candidate
- scope: heartbeat governance / board runtime / duplicate suppression integrity

## Summary

`1 run = 1 outcome` の governed heartbeat contract は導入済みだが、別経路の cron が **複数 signal / 複数 agenda_candidate を board runtime に直接書き込める状態** が見えている。これにより、duplicate suppression / cooldown / lease / board-touch 抑制の設計と、実際の投入経路が分岐している可能性が高い。

## Why this is worth board time

- これは単なる report format の揺れではなく、**governance を守る入口と、governance を迂回できる入口が並立している** という構造問題。
- この分岐が残ると、Board は「1 run = 1 outcome」で静かに運用しているつもりでも、別経路から candidate が束で流入しうる。
- anomaly-delta monitor や board-noise 抑制を続けても、投入経路が複線化していれば再発しやすい。

## Evidence

1. `reports/heartbeat-governance-implementation-2026-03-25.md`
   - role ごとの allowed outcome を定義
   - duplicate suppression / exploration lease / cooldown を heartbeat governance として導入
2. `reports/cross-agent-knowledge-sync-2026-03-26.md`
   - 「signal_event 4件、agenda_candidate 3件 を runtime に書き込んだ」と明記
3. `.openclaw/runtime/board/agenda-candidates.jsonl`
   - 2026-03-26 04:51 JST に `cross-agent-knowledge-sync` 由来の candidate が **3件連続**で append されている
4. `.openclaw/runtime/board/signals.jsonl`
   - 同時刻に `cross-agent-knowledge-sync` 由来の signal が複数 append されている
5. `.openclaw/runtime/heartbeat/heartbeat-results.jsonl`
   - heartbeat_result 側の記録件数は依然として少なく、board runtime への投入実態と一本化されていない
6. `reports/cron/board-agenda-assembly-20260326-0435.md`
   - intake は 1 candidate / 1 case に見えるが、その直後に別経路から複数 candidate が runtime に追加されている

## Root issue

heartbeat governance は **「heartbeat_result の契約」** として整備されている一方、board runtime への投入は **cron / sync / review artifact からの直接 append** が残っており、入口の統一 contract が未固定。

## Desired change

Board で最低限次を固定する価値がある。
- board runtime へ書ける producer の種類
- `1 run = 1 outcome` を適用する範囲（heartbeat だけか、board runtime producer 全体か）
- multi-signal / multi-candidate を許す経路と、その集約前段
- board runtime append 前に通す dedupe / cooldown / lease の共通ゲート

## Requested action

- この論点を **governance integrity** の agenda として扱い、board runtime への write contract を統一するか判断する。

## Change scope

- process / runtime contract / observability
- auth / routing / trust boundary / Telegram 設定の変更は含まない

## Boundary impact

- 中
- Board の noise 抑制、precedent 形成、runtime metrics の信頼性に横断影響

## Reversibility

- 高い
- append 前ゲートや producer contract の整理から始められる

## Blast radius

- 中
- board / heartbeat / cron review の接続面に影響
- 直接の対外副作用はない

## Novelty

- stale queue・memory recall・ledger bridge 個別論点ではなく、**それらの candidate 生成がどの入口から runtime に入るか** という統治層の分岐を扱う点が新しい。

## Recommendation

- proposed_lane: review
- board_mode: short review
- first step: board runtime producer map と pre-append gate を 1 枚の spec として切る
