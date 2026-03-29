# proposal_id: cross-agent-coordination-automation-2026-03-30

## summary
**cross-agent handoff の停滞を解消し、opportunity-scout → research-analyst → ops-automator / dss-manager の流れを自動化する**。exact target / owner / due / success criteria を必須化し、接続のボトルネックを解決することで、agent 間の協働を効率化する提案。

## observations
### 反復している失敗パターン
1. **handoff の停滞**: `opportunity-scout` → `research-analyst` → `ops-automator` の流れで、最後の接続が止まりやすい
2. **exact target mismatch**: 軽微タスクでも対象が不明確で、retry cost が発生
3. **success criteria の欠如**: owner / due / success criteria が設定されていないため、完了判断が難しい
4. **接続ポイントの曖昧さ**: 各 agent の役割境界が不明確で、どこまでやるべきかわからない

### 既存の課題
- scout だけで終わってしまい、実行に移らない
- handoff の際に必要情報が不足している
- 結果が積み上がらず、散在している
- 接続のコストが高く、継続的な改善が進まない

### 課題の深刻度
- 高: 探索と実行の断絶が生産性を低下させている
- 中: 手戻りが頻発し、効率が悪い
- 中: 結果の積み上がりが見えにくい

## proposed_changes
### Handoff Preflight Gate の必須化
- **exact target validation**: handoff の前に exact target を必須チェック
- **owner assignment**: 明確な担当者を必須化
- **due date setting**: 期限を設定しない限り handoff を許可しない
- **success criteria definition**: 成功条件が定義されていない場合は保留扱い

### 接続フローの自動化
- **opportunity-scout → research-analyst**: 探索結果を自動的に rubric 化し、PoC 候補に変換
- **research-analyst → ops-automator**: 比較整理結果を自動的に E2E 実行計画に変換
- **ops-automator → dss-manager**: 実行結果を自動的に live integration 計画に変換
- **handoff status tracking**: 各接続ポイントの状態を可視化

### 接続ボトルネックの検知
- **stalled handoff detection**: 48時間以上停滞している handoff を自動検知
- **success rate tracking**: 接続成功率を監視し、成功率の低いフローを特定
- **retry cost measurement**: handoff の失敗による retry cost を測定
- **connection quality score**: agent 間の接続質をスコアリング

### 接続改善の自動提案
- **handoff template の標準化**: 成功した handoff パターンをテンプレート化
- **connection optimization**: 接続成功率に基づく最適化提案
- **bottleneck resolution**: ボトルネックとなっている接続点を特定し、改善案を生成
- **connection metrics dashboard**: 接続関連の指標をダッシュボード化

## affected_paths
- `.openclaw/growth/runbooks/cross-agent-coordination-automation.md`
- `.openclaw/growth/config/handoff-preflight-gate.json`
- `.openclaw/growth/prompts/handoff-preflight-validation.md`
- `.openclaw/growth/cron-wording/connection-monitoring.md`
- `.openclaw/runtime/coordination/`
- `.openclaw/runtime/metrics/connection-quality.json`
- `.openclaw/governance/handoff-standards.md`

## evidence
- agent-lesson-capture-20260326-0615.md: handoff が止まりやすい問題の指摘
- agent-staffing-and-prompt-tuning-board-20260326-0630.md: owner / due / success criteria の必須化の提案
- opportunity-scout の実行結果: 探索は強いが、実行への接続が弱い
- research-analyst の output: 比較整理は強いが、E2E 化が進まない
- ops-automator / dss-manager のペア: 運用は強いが、手動接続が必要

## requires_manual_approval
false

## next_step
1. handoff preflight gate の設計と実装
2. 接続フローの自動化プロトタイプ開発
3. 接続ボトルネック検知システムの実装
4. 接続改善自動提案機能の開発
5. 接続 metrics ダッシュボードの作成

---

**Proposal ID:** cross-agent-coordination-automation-2026-03-30  
**Created:** 2026-03-30  
**Priority:** High  
**Integration Point:** Agent Coordination + Handoff Optimization + Connection Quality**