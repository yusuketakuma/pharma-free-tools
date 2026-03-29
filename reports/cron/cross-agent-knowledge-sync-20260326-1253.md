# Cross-Agent Knowledge Sync — 2026-03-26 12:53 JST

## 結論
- 平常同期は signal_event として処理し、conflict / contradiction / new pattern / precedent gap のみ agenda_candidate に上げた。
- Board 向けの裁定文・採否判断はこのジョブでは作っていない。
- runtime には **signal_event 4件**、**agenda_candidate 3件** を書き込んだ。

## runtime に書いた signal_event 件数
- 4件

### signal_event 要約
1. 20260326-1235 の board cycle は seed / precheck / premeeting brief で fresh に揃っていた。
2. board / heartbeat / scorecard は steady-state では signal-only に留めるのが妥当。
3. supervisor-core の RUNBOOK は board intent と整合しているが、due / evidence / stop conditions の明示がまだ薄い。
4. board-user-advocate は 1 行ルールに収束しており、追加手順は不要。

## runtime に書いた agenda_candidate 件数
- 3件

### agenda_candidate 要約
1. board-cycle freshness を単一の slot/state contract に正規化する。
2. exec-agent dispatch の receipt semantics を safe-temporary-file fallback / live receipt で明示化する。
3. safe-close 記録に mandatory fields を固定する。

## conflict / contradiction
- 20260326-1235 の board artifacts は fresh だが、dispatch verification は同じ cycle を別の freshness lens で見ており、stale-vs-missing ambiguity が残る。
- exec dispatch は board 側では accepted / completed / artifact confirmed でも、exec 側は safe temporary file fallback のままで live receipt が未観測。
- safe-close / reopen は policy と docs では定義済みだが、運用 record の必須項目がまだ揃っていない。

## new pattern
- 定常監視は signal-only、変化点だけ candidate という監視契約が安定してきた。
- board-user-advocate の監視は 1 行ルールで十分という方向に収束した。
- queue triage / scout handoff では `target / owner / due / success criteria / next check` の 1 行 preflight が最小有効パターンになっている。

## precedent gap
- board-cycle artifact に canonical な published / pending / stale / missing / observed-late contract がない。
- exec-agent dispatch に pending_artifact / completed / blocked を含む receipt contract がない。
- safe-close record に owner / next_action / success_criteria / review_after / linked_evidence を必須化する前例が薄い。

## Board へ上げる候補
1. **Canonicalize board-cycle freshness into a single slot/state contract**
2. **Define exec-agent dispatch delivery states for safe-temporary-file fallback and live receipt**
3. **Standardize safe-close records with mandatory owner / next_action / success_criteria / review_after / linked_evidence**

## 次アクション
1. 上記 3 候補を Board 用の agenda へ流す。
2. `board-agenda-assembly` では routine signal と candidate を混ぜず、候補の root_issue / desired_change をそのまま使う。
3. exec delivery の candidate は `pending_artifact` と `live receipt` を別軸で扱う。
4. safe-close 候補は runbook / policy / queue note のどこを正本にするかを切り分けてから付議する。
