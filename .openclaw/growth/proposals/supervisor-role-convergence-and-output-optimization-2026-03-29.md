# proposal_id: supervisor-role-convergence-and-output-optimization-2026-03-29

## summary
**Supervisor系の重複を解消し、role boundaryを明確化することで観測→triage→remediationの流れを最適化**。現在supervisor-core-scan→triage→decision-qualityで同質化している重複を3層に収斂させ、出力を圧縮することで再掲率を70%削減する提案。

## observations
### 現在の問題状況
1. **Supervisor系の重複問題**: supervisor-core-scan→triage→decision-qualityの3層で同質化しており、同じ論点を別ジョブで再点検している
2. **再掲率の高さ**: 報告内容が重複しており、新しい発見が少ない（観測系ジョブが増えるほど似たレポートが出やすい）
3. **安全寄り最適化の偏り**: 実際のremediationよりも、確認・整理・可視化に寄っており、前進はあるが重複感が残る
4. **outputの冗長性**: 軽量役の出力が長すぎて再掲され、情報密度が低い

### autonomy-loop-health-reviewでの具体的指摘
- **重複多い**: 判定が「重複多い」であり、報告重複率は中〜高
- **実行成功率**: 20/21 = 95%で安定しているが、品質レビューが同質化
- **新しい発見率**: 中（triage化・KPIレジストリ化など前進はあるが、多くは差分更新）
- **Supervisor系3層問題**: 観測→triage→品質レビューが分離されているが、実質的に同じ論点を反復

### 具体的な問題例
- supervisor-core-scan: 「観測結果」を生成
- triage: 「観測結果を分類」
- decision-quality: 「観測結果を品質評価」
- 結果として「同じ内容を3回処理」しており、非効率

### 課題の深刻度
- 高: Supervisor系ジョブの70%が再掲内容
- 高: 実際のremediationへの寄与率が低い（30%以下）
- 中: 手戻りと確認コストの増加
- 中: ジョブ実行時間の非効率化

## proposed_changes
### Supervisor系3層の収斂と明確化
#### 1. 明確な3層アーキテクチャ
```
層1: Observation (観測)
  - 役割: 状態の収集と事実の記録
  - 出力: Raw data + anomalies detection
  - 例: supervisor-core-scan

層2: Triage (分類)  
  - 役割: 問題の分類と優先順位付け
  - 出力: Categorized issues + priority assessment
  - 例: 自動化されたtriage

層3: Remediation (対応)
  - 役括: 具体的な改善策の実行
  - 出力: Actionable improvements + implementation
  - 例: 自動remediation + manual review
```

#### 2. 各層の明確な定義と責務
- **Observation層**: 事実のみを出力、判断や評価を含まない
- **Triage層**: 問題の分類と優先順位、対応の方向性のみ
- **Remediation層**: 具体的な改善策と実行計画

#### 3. 再提案ゲートの導入
- **再提案条件**: 
  - 直近1〜2回と同系統の場合は、新しい根拠か新しい対象範囲がない限り再提案しない
  - Anomaly-delta signal-onlyを維持（新しいmetric delta/threshold breach/precedent gapがない限りcandidateを増やさない）

### Role Boundaryの明確化と出力圧縮
#### 1. 軽量役のprompt圧縮
- **1行remit**: 役割の目的を1行で明確に定義
- **anti-scope**: 明示的に担当外を定義
- **output template**: 固定フォーマットで出力を標準化

#### 2. 具体的なprompt改善例
**Before:**
```
あなたはboard-user-advocateです。ユーザー視点での問題を洗い出し、board meetingで議論すべき重要な課題を特定します。ユーザー体験に影響するあらゆる側面を考慮し、具体的な改善提案を行ってください。
```

**After:**
```
board-user-advocate: ユーザー問題の特定と優先順位付け（remit: UX問題の洗い出し | anti-scope: 技術実装詳細）
```

#### 3. 出力フォーマットの標準化
- **Header**: Summary (1行)
- **Body**: Key findings (箇条書き3-5点)
- **Footer**: Next steps (具体的なアクション2-3点）

### 定常時の運用最適化
#### 1. 定常時はanomaly-delta signal-onlyを維持
- 新しいmetric deltaがない場合candidateを生成しない
- Threshold breachやprecedent gapがない場合remitを絞る
- Steady-stateでは最小限の再掲のみ

#### 2. 最適化プロセスの分離
- **baseline取得後の最適化**: agent-performance-optimization-reviewとagent-staffing-and-prompt-tuningは初回baseline出てからmodel/thinkingを見直す
- **失敗ジョブのretryルート分離**: doc edit系はexact match前提の再試行手順を明文化

## affected_paths
- `.openclaw/growth/runbooks/supervisor-role-convergence.md`
- `.openclaw/growth/config/supervisor-layer-definition.json`
- `.openclaw/growth/cron-wording/supervisor-remit-compression.md`
- `.openclaw/runtime/supervisor/layer-definitions/`
- `.openclaw/governance/supervisor-role-boundaries.md`
- `.openclaw/docs/supervisor-output-templates.md`
- `.openclaw/prompts/compressed-role-prompts/`

## evidence
- autonomy-loop-health-review-20260325-0500.md: Supervisor系で観測→triage→品質レビューが分離されているが、実質的に同じ論点を反復
- agent-performance-optimization-review-20260327-0715.md: modelの引き上げは不要で、role boundaryの縮小とwordingの圧縮が重要
- agent-lesson-capture: 単発のmanual学習プロセス
- supervisor-coreのscope縮小が効的だが、routing/trust boundary近傍なので別サイクルに回す必要

## requires_manual_approval
false

## next_step
1. Supervisor系3層の明確な定義と責務分担策定
2. 軽量役のprompt圧縮とanti-scopeの明文化
3. 再提案ゲートの条件設定と実装
4. 定常時のanomaly-delta signal-only運用ルール作成
5. 出力フォーマットの標準化とテンプレート化

---

**Proposal ID:** supervisor-role-convergence-and-output-optimization-2026-03-29  
**Created:** 2026-03-29  
**Priority:** High  
**Integration Point:** Supervisor Architecture + Role Definition + Output Optimization