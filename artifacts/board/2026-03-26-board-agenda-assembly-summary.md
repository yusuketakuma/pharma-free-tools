# Board Agenda Layer — 2026-03-26 08:35 JST

## 結論
- 9件のケースを ledger に反映。今回の会議では全件 `investigate` 扱い。
- 主要論点は 5 件に圧縮し、routine は fast lane へ、境界変更は review lane へ回した。
- deep まで行くべき例外は今回は追加採用せず、quorum review の保留に留めた。

## 取り扱い論点数
- 9件（normalize / dedupe / cluster 済み）

## lane 別件数
- fast: 4
- review: 5
- deep: 0

## dispatch lane 目安
- fast follow-up: 2
- review follow-up: 3
- deep escalation: 0

## runtime 反映件数
- case: 9
- decision: 9
- deferred: 5

## 今回の採用
- なし（adopted なし）

## 今回の調査継続
1. stale queue backlog の triage policy
2. routine board / heartbeat / scorecard の signal-only 化
3. Queue Triage Analyst への dominant-prefix triage 分離
4. live runtime reflection の bundle manifest + dry-run sync 化
5. light-edit / scout handoff の exact-target + owner/due/success criteria gate

## 今回の却下
- なし

## 今回の保留
- 上記 5 件は `investigate` / quorum review 保留

## 会議後に各エージェントへ渡す指示要点
- 指示本文: ルーティンは signal-only、例外だけ agenda 化。handoff は exact-target と owner/due/success criteria 必須。
- 優先度: 高
- owner: supervisor-core / board-agenda-assembly
- 期限: 次回定例まで
- 止める条件: 新しい evidence、risk escalation、board review 要請
- direct 配信可能か: routine は可、境界変更案件は代替経路（review）必須

## dispatch 計画
- fast lane: 2 件を監視・継続確認
- review lane: 3 件を quorum review で継続
- deep lane: 0 件

## 次アクション
- 次回定例で deferred 5 件の進捗と新規 evidence を確認
- signal-only / agenda_candidate の境界を監視
- runtime ledger の reopen 条件に該当する変化があれば再アセンブル
