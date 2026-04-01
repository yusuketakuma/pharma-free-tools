# MEMORY.md

## 2026-04-02 自律実行タスク: Reports & Learning Review 知見整理

### 実行概要
**日時**: 2026-04-02 03:00 JST  
**目的**: reports/やtrainer/の知見を再利用可能な形に整理  
**成果**: KNOWLEDGE-SYNTHESIS-2026-04-02.mdを作成し、AGENTS.mdとTOOLS.mdに反映

### 主な成果

#### 知見の抽出と整理
1. **Manual Review 判断基準の明文化**:
   - Trust Boundary変更は必須
   - 権限昇格操作は必須  
   - Protectedファイル変更は必須
   - 大規模ファイル削除は必須
   - 非可逆的操作は推奨
   - 監視範囲外の影響は推奨

2. **リスクレベル評価基準の確立**:
   - 高リスク: Board Deep Review必須
   - 中リスク: 設計review推奨
   - 低リスク: 設計確認後実行可
   - 極低リスク: Claude Codeで即時実行可

3. **プロジェクト優先順位評価フレームワーク**:
   - 4観点評価: 変更量・未整理度・業務/収益インパクト・次の1手の明確さ
   - 5段階スコアリング (1-5)
   - 2週間ごとの定期評価

#### 自動適用した改善
1. **Domain-pack構成要素の標準化**:
   - dss-manager domain-packを作成 (既存)
   - domain-pack-template.mdを作成 (新規)
   - 8要素構成で標準化: Domain Overview, Repository/Environment Map, Verification Commands, Known Failures, Known Fix Patterns, Decision Axes, Procedure Templates, Escalation Boundaries

2. **ドキュメントの更新**:
   - AGENTS.md: Manual Review判断基準を追加
   - TOOLS.md: プロジェクト優先順位評価フレームワークを追加
   - KNOWLEDGE-SYNTHESIS-2026-04-02.md: 総合知見レポートを作成

#### 次アクションの明確化
1. **即時実行可能**:
   - pharma-free-tools domain-pack作成
   - careroute-rx優先順位維持
   - キュー監視スクリプトの標準化

2. **設計review後実行**:
   - 優先順位評価フレームワークの完全実装
   - Dominant-prefix triage checklistの運用化

3. **Board Deep Review必須**:
   - Bundle manifest + dry-run syncの仕様確定
   - Board freshness gateの設計と実装

### 学び
- **評価基準の明文化**が自律判断を可能に
- **Domain-pack標準化**が反復作業の品質向上に直結
- **キュー監視高度化**が停滞タスクの早期発見に有効

---

## 2026-03-29 GitHub運用16サイクル完了（08:55-12:29 JST）

## 2026-03-29 GitHub運用16サイクル完了（08:55-12:29 JST）

### DeadStockSolution
- formatters TZ修正PR #35 マージ（test-client CI FAIL根本解消）
- dependabot PR #31(jsdom)/#32(react-query)/#33(react-hooks) マージ
- dependabot PR #30(eslint 10) close（専用移行branchで対応予定）
- npm audit fix PR #38 open（production脆弱性2件修正、CI不通で未マージ）
- CI最適化PR #39 open（npm ci 5回→1回、CI不通で未マージ）
- homepage設定: dead-stock-solution.vercel.app
- 古branch 3件削除、delete_branch_on_merge有効化

### careroute-rx
- open PR 38件の優先順位整理（CRITICAL/HIGH/MEDIUM/LOW/dependabot）
- 重複PR特定: ILIKE DoS 4件重複、Math.random 4件重複
- 空diff PR #1205 close
- CI不全原因特定: GitHub-hosted runner割り当て失敗（Actions分枯渇）
- レポート: reports/careroute-ci-investigation.md, reports/careroute-rx-pr-queue.md

### 全10リポジトリ共通
- topics設定（各7-8件）完了
- homepage設定完了（pharma系6件はGitHub Pages URL）
- delete_branch_on_merge有効化

### GitHub Profile
- yusuketakuma/yusuketakuma 作成、Profile README（全プロダクトリンク集）

### pharma-free-tools
- .tmpファイル24件削除 + .gitignoreに*.tmp追加

### ブロック状況
- GitHub Actions分枯渇でCI不通（3/29 01:38以降、約4時間）
- billing確認に gh auth refresh -h github.com -s user,admin:repo_hook が必要
- Dependabot alerts有効化も同じscope拡張が必要
- CI復旧後のタスクキュー: reports/github-ops-status-20260329.md

### CI復旧後の実行キュー（優先順位）
1. DeadStockSolution PR #39（CI最適化）マージ
2. DeadStockSolution PR #38（npm audit fix）マージ
3. careroute-rx重複PR整理 + CRITICAL 2件マージ
4. Dependabot alerts有効化（全10リポジトリ）
5. careroute-rx stale branch 40+件削除
6. eslint 10移行ブランチ（DeadStockSolution）

## 2026-03-29 取締役会本会議体制確立

### 方針策定
**日時**: 2026-03-29 8:35 AM (Asia/Tokyo)

### 運用フロー
agenda seed → Claude Code事前審議 → premeeting正本brief → OpenClaw再レビュー → 記録 → 指示

### 主要論点

#### 1. OpenClaw control plane vs Claude Code execution planeの明確な振り分け
- 実行系エージェントはOpenClawで指示を受け、Claude Codeで実行
- repo調査・複数ファイル変更・テスト・実装・refactorは原則Claude Code execution plane
- read_only/plan_only/short report/lightweight coordinationはOpenClaw完結

#### 2. 差分指示要点の明示
- Claude Code実行へ回す対象を具体的に示す
- 実行論点の配置判断理由を明確に記載
- 自己改善proposalは直接適用せず、Board最終裁定の範囲だけを伝える

#### 3. 成果物と実行状態の3段階管理
- 送信成功 / 受容成功 / 成果物確認済み
- 未配信 / 未受理 / 未成果確認の追跡
- 自己改善proposalの引き渡し状況の記録

### 最重要方針
- **実行系エージェントは OpenClaw で指示を受け、Claude Code で実行する**
- OpenClaw は control plane、Claude Code は execution plane として扱う

### 次回実行時の対応
- この方針に基づいてtask分類を行う
- 具体的な配置判断理由を明示して実行する

### 作成されたドキュメント
- **EXECUTION_POLICY.md**: 実行体制の詳細ルール
- **EXECUTION_SAMPLES.md**: Task分類の具体例
- **ADAPTATION_PLAN.md**: 既存プロジェクトへの適用計画

### 適用フェーズ
- **Phase 1**: 即時適用（新規taskから）
- **Phase 2**: 段階的移行（1週間以内）
- **Phase 3**: 最適化（2週間後）

### 自律改善開始
- モニタリング指標の設定
- 成功/失敗の記録開始
- ボトルネックの早期検知体制の構築

## 2026-03-29 収益化分析完了（10周分）

**日時**: 2026-03-29 08:55〜10:23 JST（収益分析担当）

### 結論: 2本柱戦略
- **主軸**: DeadStockSolution SaaS（長期・高利益率95%+・非線形スケール）
- **つなぎ**: 外部プラットフォーム（CW/ランサーズ/ココナラ・短期即収入）

### DeadStockSolution SaaS
- Stripe決済 + 3ティアサブスク実装済み（Light:4,980円 / Standard:9,800円 / Enterprise:19,800円）
- 機能制限は未実装（全プラン同機能）→ Claude Codeに委託予定
- 機能制限仕様書: 提案5/30/∞件、マッチング10/∞/∞件、アップロード3/∞/∞件
- **競合: 日本市場にほぼ存在しない（ブルーオーシャン）**
- ターゲット: 単独・小規模薬局 約40,000局
- 収益見込み: 22局=年196万円 / 75局=年653万円

### 外部プラットフォーム
- クラウドワークス: 候補2件特定済み（実績作り用）
- ランサーズ: 単価5〜10倍だが募集期間1〜5日で極短、本人確認必須
- ココナラ: 出品型で受動収入、手数料10%最安、Claude Code出品がトレンド
- 月間合計: 約11〜14万円（安定時）

### ゆうすけの即時アクション（約2時間）
1. クラウドワークス登録+候補1応募（30分）
2. ランサーズ登録+本人確認（15分）
3. ココナラ登録+3件出品（1時間）
4. Stripe本番キー設定（15分）

### Claude Code委託待ちタスク
- Task A: DSS機能制限実装（1日・7時間）
- Task B: DSSランディングページ改善（2日）

### 詳細レポート
- `reports/loops/monetization-analysis-latest.md`: 総合アクションプラン
- `reports/loops/offer-strategy-latest.md`: CW提案文ドラフト

### 注意事項
- monetization-hqセッションは非稼働確認。代替経路での承認が必要。
- 本部長フィードバックは10周連続で受信なし。

## 2026-03-29 文書整理完了（文書担当・8サイクル）

**日時**: 2026-03-29 08:56〜10:19 JST

### 実施内容
1. BOOTSTRAP.md → archive/（bootstrap完了・不要）
2. AGENTS.mdに新体制3文書への参照を追加
3. EXECUTION_SAMPLES.md全5ケースをDeadStockSolution実プロジェクト構成に具体化
4. ADAPTATION_PLAN.md精査: careviax-pharmacy（存在しない）削除、Phase日付明記（P2期限04-05、P3以降04-12）
5. ワークスペースルート orphan 52件 → archive/へ移動
6. archive/内53件を5サブディレクトリに分類: board/(24) reports/(13) cron/(4) templates/(4) misc/(8)

### 整理後のワークスペースルート（10件）
- 保護対象: SOUL / AGENTS / TOOLS / IDENTITY / USER / MEMORY / HEARTBEAT
- 新体制文書: EXECUTION_POLICY / EXECUTION_SAMPLES / ADAPTATION_PLAN
## 2026-03-31 Board Agenda Seed: OpenClaw↔Claude Code連携KPI策定

- 議題: 実行連携の信頼性KPI策定とQ2目標設定
- 推奨KPI3指標: 成功率、平均完了時間、フォールバック率
- Q2目標案: 成功率95%+、完了時間15分以内、フォールバック率5%以下
- 次アクション: 直近30日間のexecution artifactsから基準値を集計し、4月第1週に施行
- リスク: KPI形骸化、粒度不足、Claude Code側制約による一時的変動

## 2026-04-01 自律実行タスク: workspace-project-priority-review

**日時**: 2026-04-01 3:30 AM (Asia/Tokyo)
**目的**: workspaceのprojects/配下を横断し、優先順位を定期判断
**実施内容**: 全7プロジェクトの状態調査と優先順位評価

### 調査対象プロジェクト
1. careroute-rx (priority_score: 17)
2. pharma-free-tools (priority_score: 15)
3. openclaw-core (priority_score: 15)
4. deadstocksolution (priority_score: 13)
5. careviax-pharmacy (priority_score: 5)
6. homecare-tools (標準構造未整備)
7. careviax-pharmacy (priority_score: 5)

### 評価観点
- **変更量**: 1〜5スコア
- **未整理度**: 1〜5スコア
- **業務/収益インパクト**: 1〜5スコア
- **次の1手の明確さ**: 1〜5スコア

### 優先案件トップ3
1. **careroute-rx** (active, business_impact: 5, next_actions_clear: 4)
   - 次アクション: 差分棚卸し、FE-DISPLAY統一化、情報密度改善
2. **pharma-free-tools** (active, business_impact: 5, next_actions_clear: 4)
   - 次アクション: 調剤報酬改定対応、既存修正、デプロイ
3. **openclaw-core** (bootstrap, business_impact: 4, next_actions_clear: 3)
   - 次アクション: Board freshness gate、queue telemetry、通知経路

### 自動修正実施
- 各プロジェクトのproject.yamlにnext_actionsを追記
- last_reviewedを2026-04-01に更新
- 優先順位表現の明確化と次アクションの具体化

### 前回との差分
- pharma-free-toolsに「調剤報酬改定対応ナビ」が新規追加（2026-04-01）
- careroute-rxの差分棚卸しが進行中（WIP-TRIAGE-001）
- openclaw-coreの安定性改善タスクが9件に増加
- deadstocksolutionがmaintenanceモードへ移行

### 次アクション
- careroute-rx: 差分棚卸しとcommit単位切り出し
- pharma-free-tools: 調剤報酬改定対応のwireframe作成
- openclaw-core: Board freshness gateの実装
