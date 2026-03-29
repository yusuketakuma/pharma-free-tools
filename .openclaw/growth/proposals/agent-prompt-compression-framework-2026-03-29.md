# proposal_id: agent-prompt-compression-framework-2026-03-29

## summary
**軽量エージェントのプロンプトを標準化されたフレームワークで圧縮し、出力の再掲・役割逸脱・冗長性を削減する**。github-operator・doc-editorのような軽量役割のremit・anti-scope・output formatを標準化し、5行以内の出力を強制するプロンプト圧縮フレームワーク。

## observations
### 直近レビューで明確化された問題
1. **再掲の多さ**: supervisor-coreで「観測→triage→品質レビュー」が同質化し、再掲が多い
2. **役割逸脱**: 軽量エージェントが本来のscope外に広がり、出力が長くなる
3. **冗長な出力**: 結論・理由・次アクションが5行を超え、time-to-understandが増加
4. **不一致なフォーマット**: 各エージェントの出力形式がバラバラで再利用性が低い
5. **ベースラインの曖昧さ**: github-operatorのような軽量エージェントの成功条件が不明確

### 既存の課題
- 軽量エージェントのプロンプトが長く、再掲と冗長性を生む
- 出力形式が統一されておらず、scan→triage→executeの流れが遅延
- remitとanti-scopeの境界が明確でなく、役割が広がりやすい
- 圧縮の基準がないため、いかに短くしても品質が担保されない
- cross-agentでの出力互換性が低い

### 影響範囲
- 高: supervisor-coreの重複抑制効果
- 中: 全エージェントの出力速度改善
- 中: handoffの clarity 向上
- 低: トークン使用量の削減

## proposed_changes
### 標準化されたプロンプト圧縮フォーマット
- **remitテンプレート**: 1行で「私は何をするか」を明確化
  - 例: `GitHub PR / repo hygiene / link correction / cleanup`
- **anti-scopeテンプレート**: 1行で「私は何をしないか」を明確化
  - 例: `調査・設計・判断・ユーザー対話`
- **outputフォーマット**: 原則「結論/理由/次アクション」の5行以内
  - 行1: 結論（必須）
  - 行2: 理由（選択、必要なら1行）
  - 行3: 次アクション（必須、exact target含む）
  - 行4-5: 補足（選択）
- **compression triggers**: 条件付き圧縮ルールの導入
  - 確立されたパターン: 完全圧縮
  - 新規探索: 基本フォーマット+詳細
  - エラー時: 通常フォーマット+debug情報

### 軽量エージェントの専用フレームワーク
- **github-operator専用テンプレ**:
  - remit: `PR cleanup / repo hygiene / link fix / GitHub Pages`
  - anti-scope: `調査・設計・ドキュメント作成`
  - output: `PR merge / 清掃完了 / リンク修正 / 状態`
- **doc-editor専用テンプレ**:
  - remit: `runbook / checklist / wording normalize / short doc`
  - anti-scope: `調査・実装・アーキテクチャ`
  - output: `準備完了 / 手順更新 / チェックリスト`
- **ops-automator専用テンプレ**:
  - remit: `cron / cleanup / retry / state hygiene`
  - anti-scope: `設計・判断・ユーザー対話`
  - output: `実行完了 / 状態 / 次トリガー`

### 圧縮品質保証メカニズム
- **compression validation**: 圧縮後の出力が必要情報を含むか検証
- **remit violation detection**: anti-scope外への逸脱を検知
- **output completeness**: 結論・次アクションの必須項目チェック
- **quality gate**: 圧縮による情報損失がないか自動評価
- **fallback mechanism**: 圧縮で品質が担保できない場合は通常フォーマット

### 圧縮効果の測定と最適化
- **compression metrics**: 圧縮率・再掲率・理解時間の測定
- **quality tracking**: 圧縮前後の品質比較
- **usage patterns**: 各エージェントの圧縮使用パターン分析
- **continuous improvement**: 圧縮ルールの定期的な見直し

## affected_paths
- `.openclaw/growth/prompts/lightweight-agent-compression-framework.md`
- `.openclaw/growth/runbooks/prompt-compression-validation.md`
- `.openclaw/growth/config/agent-compression-standards.json`
- `.openclaw/growth/templates/github-operator-compressed.md`
- `.openclaw/growth/templates/doc-editor-compressed.md`
- `.openclaw/growth/templates/ops-automator-compressed.md`
- `.openclaw/growth/cron-wording/compression-effectiveness-monitor.md`
- `.openclaw/runtime/metrics/compression-quality.json`

## evidence
- agent-performance-optimization-review-20260327-0715.md: 軽量エージェントの出力圧縮必要性
- agent-staffing-and-prompt-tuning-board-20260326-0630.md: github-operator/doc-editorの短文化提案
- agent-scorecard-review-20260325-0600.md: 軽量エージェントのbaseline不明確さ
- autonomy-loop-health-review-20260325-0500.md: supervisor-coreの重複問題
- supervisor-core-scan-2026-03-24.md: 再掲と冗長性の具体例

## requires_manual_approval
false

## next_step
1. 軽量エージェントの現行プロンプト分析
2. 圧縮フレームワークのプロトタイプ開発
3. 圧縮品質保証メカニズムの設計
4. github-operator/doc-editor専用テンプレの作成
5. 圧縮効果の測定指標定義

---

**Proposal ID:** agent-prompt-compression-framework-2026-03-29  
**Created:** 2026-03-29  
**Priority:** High  
**Integration Point:** Agent Performance + Prompt Engineering + Output Standardization