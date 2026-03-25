# Board Note — memory recall path degraded

- created_at: 2026-03-25T11:12:00Z
- source: board-visionary heartbeat
- outcome: board_note
- scope: workspace-wide recall / duplication control

## Signal

OpenClaw の記憶ファイル自体は存在するのに、ランタイム上の memory recall 経路が実質機能していない兆候がある。

## Evidence

1. `openclaw status` が Memory を `0 files · 0 chunks · dirty · sources memory · plugin memory-core · vector unknown · fts ready` と表示。
2. ワークスペース上には `MEMORY.md` と `memory/*.md` が複数存在する。
3. heartbeat 中の `memory_search("たまAI stable workspace model memory availability")` は `results: [] / provider: "none" / mode: "fts-only"` を返した。
4. 同日 artifact `artifacts/shared-memo/cross-agent-knowledge-sync-2026-03-25.md` でも `memory_search: このクエリでは該当なし` が出ている。

## Why this matters

- Board / Scout / Supervisor 系の「まず memory_search を見る」運用が空振りしやすくなる。
- 既出論点の再探索・重複調査・同じ判断の再生成が増える。
- stable memory が見えないと、heartbeat の novelty 判定や agenda 重複抑止が弱くなる。

## Structural reading

これは単発クエリの外れより、**memory source/index/refresh のいずれかが崩れている可能性** を示す。単なる routine 異常というより、control plane 全体の再利用効率に効く基盤劣化のシグナル。

## Boundary

- auth / routing / trust boundary / Telegram 設定には触れていない。
- 自動修復や設定変更は未実施。
- 今回は signal の固定化だけを行った。

## Suggested board attention

- まず「memory files は存在するのに status/search で拾えていない」状態を 1 ケースとして切り出して扱う価値がある。
- 修復に進むなら、対象は memory source 設定・index refresh・status deep probe の切り分けになる。

## References

- `MEMORY.md`
- `memory/2026-03-25.md`
- `artifacts/shared-memo/cross-agent-knowledge-sync-2026-03-25.md`
