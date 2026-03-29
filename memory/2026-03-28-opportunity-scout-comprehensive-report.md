# 2026-03-28-opportunity-scout-comprehensive-report.md

## Opportunity Scout横断調査完了報告

### 調査概要
- **タイミング**: 2026-03-28 15:15 JST
- **調査範囲**: 3プロジェクトスペース + pharma-free-tools
- **優先軸**: 収益化に近い改善・低リスクな構造的勝ち筋・反復作業の仕組み化

### Tier 1: 即時着手推奨（収益化に近い・低リスク）

#### 1. 薬歴下書き・要点整理支援の実装（pharma-free-tools）- **最優先**
- **現状**: wireframe proposal完了、Board採用済み
- **既存改善**: `pharmacy-medication-history-efficiency.html`, `medication-history-time-saving-checklist.html`
- **実装内容**: 診断/チェックリスト→SOAP下書き・患者説明メモ・次回確認事項へ拡張
- **収益化距離**: 近い（74本無料ツール集への追加で流入強化）
- **リスク**: 低（既存HTML改善、auth/routing非接触）
- **自律探索適性**: 高（Claude Code委譲可能）

#### 2. 供給障害患者対応ワークベンチ改善（pharma-free-tools）
- **現状**: backlog優先2位
- **既存資産**: `supply-disruption-patient-impact.html`
- **実装内容**: 患者説明文・医師連絡文・薬歴記録文の出力追加
- **収益化距離**: 近い（毎日起きる実務課題）
- **リスク**: 低
- **自律探索適性**: 高

#### 3. 返戻再請求ナビ統合（pharma-free-tools）
- **現状**: backlog優先3位、3ファイル分散
- **対象ファイル**: 
  - `pharmacy-rejection-template.html`
  - `pharmacy-claim-denial-risk-diagnosis.html`
  - `claim-denial-prevention-checklist.html`
- **実装内容**: 理由別ナビに統合
- **収益化距離**: 近い（薬局の最大コスト痛点）
- **リスク**: 低
- **自律探索適性**: 高

### Tier 2: 構造的勝ち筋

#### 4. DeadStockSolution preview branch棚卸し（deadstocksolution）
- **現状**: DS-MAINT-001がbacklogに滞留中
- **問題**: preview branchに大規模削除差分が残ったまま
- **実装内容**: keep/drop/relocate分類による整理
- **収益化距離**: 中（棚卸し完了後の次ステップ判断）
- **リスク**: 低（read-only triage + 段階的整理）
- **自律探索適性**: 中（30分程度で完了見込み）

#### 5. openclaw-core backlog消化（openclaw-core）
- **現状**: 12件のReady backlog滞留
- **優先順位**: 
  #1-4: stale-report detection、fallback notification、metric verification、artifact retention
  #5-12: その他の仕様済み機能
- **実装内容**: 仕様済みものから順に実装
- **収益化距離**: 間接（運用品質向上→時間確保→収益活動）
- **リスク**: 低〜中（protected path非接触）
- **自律探索適性**: 中〜高

### Tier 3: 反復作業の仕組み化

#### 6. pharma-free-tools定期リサーチの自動化
- **現状**: 手動で「薬局・薬剤師の繰り返し困りごと」抽出中
- **実装内容**: 検索クエリ固定→自動収集→スコアリング→差分レポート生成
- **リスク**: 低（read-only調査の自動化）
- **自律探索適性**: 高

#### 7. OpenClaw queue telemetryの定期スナップショット
- **現状**: 手動でqueue状態取得
- **実装内容**: 改善ledgerに基づく定期read-onlyスナップショット
- **リスク**: 低
- **自律探索適性**: 高

### Board決定

#### 最優先実行案
**Tier 1の#1（薬歴下書き実装）を最優先でClaude Codeに委譲**

**決定理由**:
1. wireframeが固定済みで仕様リスクが低い
2. 収益化距離が最も近い（無料ツール集追加で流入強化）
3. 薬剤師の日常最高頻度タスクを直撃
4. 自律探索の成果物化として明確
5. 成功パターン確立後、#2,#3を連続実行可能

#### 並行実行案
**Tier 2の#4（DeadStockSolution棚卸し）を独立して並行実行**
- 理由: #1と独立、30分程度のread-only triageで完了
- 影響: プロジェクトのクリーン化と次ステップ判断の明確化

#### 実行順序
1. **今すぐ**: #1（薬歴下書き実装）をClaude Codeに委譲
2. **並行して**: #4（DeadStockSolution棚卸し）を実行
3. **次フェーズ**: #1成功後、#2,#3を連続実行
4. **安定化後**: Tier 2の#5とTier 3の仕組み化

### 成果
- **具体的な改善候補の発見**: Tier 1-3で7つの具体的な改善機会を特定
- **収益化距離の明確化**: 各候補のビジネス価値を定量評価
- **実行可能性の評価**: リスクと自律探索適性の両面から評価
- **Board決定プロセス**: 明確な優先順位と実行計画の策定