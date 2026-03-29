# proposal_id: handoff-automation-system-2026-03-29

## summary
**エージェント間の受け渡しを標準化された形式で自動化し、owner/due/success criteriaの必須化と接続漏れを解決する**。research→PoC→executionの流れで必須のhandoff formatを強制し、接続漏れと手戻りを削減する受け渡し自動化システム。

## observations
### 直近レビューで明確化された問題
1. **接続漏れ**: research-analystのscout結果にowner/due/success criteriaが不足し、PoCへ繋がらない
2. **手戻り**: 不完全なhandoffの次工程で「どこから始めればいいか」が不明確
3. **非標準化**: 各エージェントのhandoff形式がバラバラで、理解コストが高い
4. **再作業**: opportunity-scoutで発見した候補がそのまま放置され、実行に繋がらない
5. **確認漏れ**: handoff前に「本当に実行可能か」の事前確認が不十分

### 既存の課題
- 手動でのhandoffチェックが非効率で、ミスが発生
- scout→research→executeの流れで情報が断絶する
- success criteriaが不明確なため、完了判定が難しい
- ownerが不明なため、責任の所在が曖昧
- due dateがないため、優先順位付けができない

### 影響範囲
- 高: research→PoC→executionの流れの効率化
- 中: 手戻り率の削減
- 中: 再作業率の削減
- 低: エージェント間の接続性向上

## proposed_changes
### 標準化されたHandoffフォーマット
- **必須フィールドの定義**:
  - `exact_target`: 正確な対象（ファイル/URL/問題文）
  - `owner`: 次工程の担当エージェント
  - `due`: 期限（相対時間/絶対時間）
  - `success_criteria`: 成功の具体的条件
  - `dependencies`: 依存関係（なければ空）
- **handoffテンプレート**:
  - scout→research: `exact_target + owner + due + success_criteria`
  - research→PoC: `findings + recommendation + owner + due + success_criteria`
  - PoC→execution: `scope + approach + owner + due + success_criteria`
- **validationルール**:
  - all fields必須チェック
  - owner存在確認
  - due形式検証
  - success_criteria具体性検証

### Handoff前の自動検証システム
- **実行可能性チェック**:
  - targetの存在確認
  - ownerのavailability確認
  - dependenciesの解決可能性評価
  - resourcesの十分性検証
- **品質保証チェック**:
  - success criteriaの具体性評価
  - dueの妥当性検証
  - scopeの明確性確認
- **リスク評価**:
  - 失敗リスクの自動評価
  - blocking要因の特定
  - fallbackパスの提示

### 自動化されたHandoffワークフロー
- **handoff生成**: 標準フォーマットで自動生成
- **validation実行**: フォーマットと品質の自動検証
- **approvalゲート**: 必須項目の欠落による手戻り防止
- **通知システム**: handoffの即時通知と状態追跡
- **完了検知**: success criteria達成の自動検知

### 接続漏れ防止メカニズム
- **continuous connection mapping**: エージェント間の接続関係の可視化
- **gap detection**: 接続漏れの自動検出
- **remediation suggestions**: 接続漏れへの改善提案
- **connection quality metrics**: 接続品質の測定と改善

## affected_paths
- `.openclaw/growth/runbooks/handoff-automation-workflow.md`
- `.openclaw/growth/prompts/standard-handoff-format.md`
- `.openclaw/growth/config/handoff-validation-rules.json`
- `.openclaw/growth/templates/scout-to-research-handoff.md`
- `.openclaw/growth/templates/research-to-poc-handoff.md`
- `.openclaw/growth/templates/poc-to-execution-handoff.md`
- `.openclaw/growth/cron-wording/handoff-effectiveness-monitor.md`
- `.openclaw/runtime/metrics/handoff-completion-rate.json`
- `.openclaw/governance/connection-standards.md`

## evidence
- agent-staffing-and-prompt-tuning-board-20260326-0630.md: owner/due/success criteriaの必須化提案
- agent-scorecard-review-20260325-0600.md: research-analystの接続漏れ問題
- agent-performance-optimization-review-20260327-0715.md: handoffの非効率性
- opportunity-scoutの実行例: 候発見→放置のパターン
- autonomy-loop-health-review-20260325-0500.md: 手戻り問題の影響

## requires_manual_approval
false

## next_step
1. 標準handoffフォーマットの設計
2. validationルールの実装
3. handoff自動化システムのprototype開発
4. 接続漏れ検出アルゴリズムの実装
5. 効果測定指標の定義

---

**Proposal ID:** handoff-automation-system-2026-03-29  
**Created:** 2026-03-29  
**Priority:** High  
**Integration Point:** Agent Coordination + Workflow Automation + Quality Assurance