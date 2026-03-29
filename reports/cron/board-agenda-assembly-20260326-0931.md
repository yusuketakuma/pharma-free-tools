# Board Agenda Assembly — 2026-03-26 09:31 JST

## 結論
**input_gate=degraded**。`agenda-seed-latest` は fresh だが、`claude-code-precheck-latest` は旧 slot (`20260326-0925`) で、現行 seed (`20260326-0935`) と slot 不一致。今回は **evidence-only** で OpenClaw 再レビューを回し、主要論点は **3件まで** に圧縮した。

## board_cycle_slot_id / input_gate
- `board_cycle_slot_id`: **20260326-0935**
- `input_gate`: **degraded**
- 縮退理由:
  - Claude Code precheck が旧 slot (`20260326-0925`) / `stale_input`
  - current seed は fresh だが、precheck と同 slot ではない
  - そのため、強い採否ではなく **evidence-only** 判定に倒した

## 一致点 / 不一致点
### 一致点
- stale backlog / triage / runbook 化が主軸
- routine output は signal-only へ寄せるべき
- 1ページ runbook・owner / due / evidence の短文化が必要
- 新規施策より、滞留の解消と運用品質の回復を優先

### 不一致点
- Claude Code: **stale_input のため進行停止**
- OpenClaw: **degraded でも evidence-only で続行**
- つまり、方向性は一致するが、**実行可否の閾値** がずれている

## 主要論点（最大3件）
1. **stale queue backlog の triage policy 化**  
   - 判定: **採用**  
   - 理由: safe-close / reopen / escalate の判断軸を固定しないと、同じ滞留が再発するため

2. **dominant-prefix triage の専任化 / runbook 化**  
   - 判定: **調査継続**  
   - 理由: 方向性は妥当だが、実装境界と owner 実装が未確定で、今回の gate では採り切らないため

3. **外部公開面・境界防御の監査**  
   - 判定: **保留**  
   - 理由: 重要だが、今回は input_gate が degraded。監査の着手条件とスコープを先に固める方が安全

## lane 別件数
- fast: **4**
- review: **6**
- deep: **0**

## 採用 / 調査継続 / 却下 / 保留
- **採用**: 1
- **調査継続**: 1
- **却下**: 0
- **保留**: 1

## runtime 記録件数
- `board_runtime.py assemble --hours 24` 実行済み
- 記録件数: **26件**
  - case: **10**
  - decision: **10**
  - deferred: **6**

## 差分指示要点
### 変更あり
- **board-operator**: 前回の producer-map 1本化案から、今回は「今日中に着手する最小実行案」を1件だけ抽出し、1〜2行のルール候補へ圧縮
- **board-auditor**: 外部公開面監査は保留。先に監査範囲と着手条件を明文化

### 変更なし / 待機条件だけ
- **supervisor-core**: `safe-close / reopen / escalate` の1ページ runbook 初稿を待機。auth / trust boundary / approval root を跨がない
- **doc-editor**: runbook を 1ページに圧縮し、owner / due / evidence を短文化
- **research-analyst**: dominant prefix / 滞留期間 / reopen pattern を evidence-only で要約
- **ops-automator**: reopen 率・滞留中央値・7日超滞留件数の監視のみ。自動 drain はしない
- **github-operator**: runbook 確定後まで待機。焼き直し論点は上げない
- **dss-manager**: DDS への転用は待機。今回論点への混入を避ける
- **opportunity-scout**: 新規論点のみ。既存 backlog の焼き直しは上げない

## 入力欠落 / 縮退理由
- `reports/board/agenda-seed-latest.md`: **あり** / fresh
- `reports/board/claude-code-precheck-latest.md`: **あり** だが旧 slot 参照で stale
- `5分前業務報告`: **board-premeeting-brief-20260326-0925.md** を参照
- したがって、欠落ではなく **slot mismatch による縮退**

## 次アクション
1. `board-operator` の最小実行案を 1 件に絞る
2. `supervisor-core` と `doc-editor` に runbook 初稿を維持指示
3. `board-auditor` の監査スコープを 1 ページ化
4. 次回会議では backlog そのものではなく **triage 結果** を持ち込む
5. 通常通知は出さず、定期報告へ集約する
