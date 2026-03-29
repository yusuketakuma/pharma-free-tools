# Board Agenda Layer Assembly — 2026-03-26 08:41 JST

## 結論
今回の Board は **5件上限で整理し、うち 3件を採用、2件を調査継続** とした。  
全体としては、**stale queue backlog の safe-close / reopen / escalate 化** と **dominant-prefix triage の専任化**、および **routine output の signal-only 化** が最優先で一致した。  
一方で、**board runtime producer map の統一** と **bundle sync / dry-run / smoke の実装固定** は、方針は揃ったが実装後工程の詰めが残るため継続審議に回した。

## manual agenda seed 要点
- `ceo-tama`: stale task / manual review backlog の解消を最優先
- `supervisor-core`: 限定前進での継続承認、ただし最大不確実性を 1 点だけ再検証
- `board-visionary`: 資源配分よりも今回は監視寄り
- `board-user-advocate`: 推奨案を 1 つに絞る運用へ寄せる
- `board-operator`: 今日中の最小実行案を 1 件だけ抽出
- `board-auditor`: external surface / boundary 防御の監査
- `research-analyst` / `github-operator`: backlog triage の runbook / checklist 化
- `ops-automator`: 自動 drain せず監視のみ
- `doc-editor`: 1ページ runbook 化
- `dss-manager` / `opportunity-scout`: 監視待機

## Claude Code 側審議要点
- **進行可**。ただし **部分同期・裸 CLI 常用フォールバック・publish 先行** は止める
- lane health は **ACP primary healthy / CLI healthy / cli_backend_safety_net unhealthy**
- `execution-request.json` / `execution-result.json` は **bundle 単位** で扱う
- `prompt` ではなく **process boundary** で trust boundary を守る
- publish 前に **dry-run / smoke** を必須化すべき
- protected path、approval 範囲、artifact 保持、lane snapshot の鮮度を再確認

## OpenClaw 側再レビュー要点
- stale backlog は単発棚卸しでなく **triage policy** に落とすべき
- dominant-prefix triage は **supervisor-core の重複ループを切り、owner / runbook ベースへ**
- routine heartbeat / board / scorecard は **signal-only** に縮退
- board runtime の append / producer 経路は、複線化を減らして **1本化** したい
- live runtime reflection は **bundle + manifest + dry-run** を前提にする

## 一致点 / 不一致点
### 一致点
- stale backlog の safe-close / reopen / escalate 化は妥当
- routine output を signal-only に寄せる方向は妥当
- bundle 単位 sync と dry-run 必須化は妥当
- direct dispatch 可能な相手に大きな阻害はない

### 不一致点
- `board runtime producer map` の **統一方法** は未確定
- `Queue Triage Analyst` への **完全専任化** は、方針としては支持されるが、実装分割は次工程で詰める必要あり
- `bundle manifest + dry-run sync` は原則賛成だが、具体的な smoke 範囲はまだ要整理

## 取り扱い論点数
- 主要論点: **5件**
- そのうち board case 化: **5件**
- 実質採否対象: **3件採用 / 2件調査継続**

## lane 別件数
- fast: **4件**
- review: **5件**
- deep: **0件**

## runtime に書いた case / decision / deferred 件数
- case: **9件**
- decision: **9件**
- deferred: **5件**

## 今回の採用
1. **stale queue backlog の triage policy 化を採用**
   - 判定: 採用
   - owner: `supervisor-core`
   - 期限: 次回 board までに 1ページ runbook 初稿
   - 止める条件: auth / trust boundary / approval root を変更する必要が出たら停止
   - direct 配信: 可

2. **dominant-prefix triage の専任化方針を採用**
   - 判定: 採用
   - owner: `supervisor-core`
   - 期限: 12:00 JST までに runbook へ反映
   - 止める条件: 既存 telemetry の焼き直しになり、追加価値が出ない場合
   - direct 配信: 可

3. **routine output の signal-only 化を採用**
   - 判定: 採用
   - owner: `board-visionary` / `research-analyst`
   - 期限: 次回 heartbeat まで
   - 止める条件: anomaly / delta / precedent gap 以外を Board に上げる必要が出たら停止
   - direct 配信: 可

## 今回の調査継続
1. **board runtime producer map の統一**
   - 判定: 調査継続
   - owner: `board-operator`
   - 期限: 次回 board cycle
   - 止める条件: protected path または approval root の変更が必要になったら停止
   - direct 配信: 可

2. **bundle manifest + dry-run / smoke 固定**
   - 判定: 調査継続
   - owner: `doc-editor` / `ops-automator`
   - 期限: 12:00 JST までに最小版を提示
   - 止める条件: publish を dry-run 前に進める必要が出たら停止
   - direct 配信: 可

## 今回の却下
- **部分同期**（例: 単一ファイル差し替え）
- **bare CLI safety net の常用化**
- **dry-run 前の publish**
- **自動 drain**
- **routine telemetry の narrative review 化**

## 今回の保留
- `Queue Triage Analyst` への完全切替の人員実装
- smoke check の厳密な対象範囲
- board runtime append 経路の単一化手順
- live runtime reflection の最終 contract 文面

## 会議後に各エージェントへ渡す指示要点
### supervisor-core
- 指示本文: `waiting_auth / waiting_manual_review` を safe-close / reopen / escalate で運用する 1ページ runbook を作成
- 優先度: 高
- owner: supervisor-core
- 期限: 12:00 JST
- 止める条件: auth / trust boundary / approval root 変更が必要なら停止
- direct 配信: 可

### doc-editor
- 指示本文: runbook を 1ページで読める粒度に圧縮し、owner / due / evidence を短文化
- 優先度: 高
- owner: doc-editor
- 期限: 12:00 JST
- 止める条件: 文面短文化で例外判断が曖昧になるなら停止
- direct 配信: 可

### research-analyst
- 指示本文: dominant prefix / 滞留期間 / reopen パターンを evidence-only で要約
- 優先度: 中
- owner: research-analyst
- 期限: 次回 heartbeat まで
- 止める条件: telemetry の焼き直しになったら停止
- direct 配信: 可

### ops-automator
- 指示本文: reopen 率・滞留中央値・7日超滞留件数を監視し、自動 drain はしない
- 優先度: 中
- owner: ops-automator
- 期限: 12:00 JST
- 止める条件: mutation に広げる必要が出たら停止
- direct 配信: 可

### board-auditor
- 指示本文: safe-close 後の silent failure と reopen 条件の曖昧性を監査
- 優先度: 中
- owner: board-auditor
- 期限: 次回 board cycle
- 止める条件: 黙殺 / 自動 drain / boundary drift の兆候が出たら停止
- direct 配信: 可

### board-operator
- 指示本文: board runtime producer map を 1本化する案を提示
- 優先度: 中
- owner: board-operator
- 期限: 次回 board cycle
- 止める条件: protected path を跨ぐ変更なら停止
- direct 配信: 可

### github-operator / dss-manager / opportunity-scout
- 指示本文: 今回は待機。新規論点だけ拾い、既存 backlog の焼き直しは上げない
- 優先度: 低
- owner: 各自
- 期限: 次回 board cycle
- 止める条件: 変更が承認済みでない領域に触れそうなら停止
- direct 配信: 可

## dispatch 計画
- **即時 dispatch するもの**: supervisor-core / doc-editor / research-analyst / ops-automator / board-auditor / board-operator
- **待機に回すもの**: github-operator / dss-manager / opportunity-scout
- **配信経路**: direct 配信可能。allowlist 外はなし
- **注意**: ops-automator は mutation に広げない。publish 系は dry-run 後に限定

## 入力欠落
- `manual-agenda-seed-latest.md` と `claude-code-precheck-latest.md` は取得できた
- 5分前業務報告も取得できた
- 欠落した必須 artifact は **なし**
- ただし `board runtime producer map` の実装詳細は、まだ最終 artifact に落ちていない

## 次アクション
1. supervisor-core / doc-editor に runbook 初稿を渡す
2. research-analyst / ops-automator へ監視条件を渡す
3. board-operator に producer map 1本化案を依頼する
4. 次回会議では backlog そのものではなく **triage 実施結果** を見る
5. 通常通知は行わず、7:00 / 12:00 / 17:00 / 23:00 の定期報告へ集約する
