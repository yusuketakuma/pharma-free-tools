# proposal_id: board-artifact-freshness-governance-2026-03-29

## summary
**Board cycle のアーティファクト鮮度を publish 時点で厳格に管理する**。agenda-seed-latest.md のような重要アーティファクトが stale 状態で publish されないように、publish gate での freshness validation を導入する提案。

## observations
### 反復している問題
1. **publish gate の不備**: board_cycle_slot_id が古い agenda-seed-latest.md が publish され、precheck で初めて問題が発覚
2. **遅い検出**: freshness が precheck でしか検出されておらず、board cycle の進行が遅延
3. **publish contract の曖昧さ**: どの時点で freshness が保証されるのかが不明確
4. **再発リスク**: 同様の問題が他の board アーティファクトでも発生する可能性がある

### 既存の課題
- publish gate に freshness validation が存在しない
- precheck が freshness の唯一の検出点になっており、遅すぎる
- board cycle の進行が stale artifact でブロックされる
- root cause analysis に手間がかかる

### 影響範囲
- 高: board cycle の全体的な進行遅延
- 中: precheck 時間の無駄
- 低: manual correction の手間

## proposed_changes
### Publish Gate の Freshness Validation
- **slot 一致チェック**: publish 時点で board_cycle_slot_id が current slot と一致することを必須化
- **freshness threshold**: artifact の生成時間が current slot の範囲内であることを検証
- **atomic publish**: freshness が保証される状態でのみ publish を許可
- **fail-fast 原則**: stale な artifact は publish gate で即時拒否

### Board アーティファクトのライフサイクル管理
- **artifact versioning**: 各 artifact に version と timestamp を明示
- **freshness status**: artifact ごとの freshness 状態を可視化
- **stale artifact handling**: stale artifact は別のストレージに保存し、分析用に利用
- **artifact health dashboard**: 全 board アーティファクトの鮮度状況をダッシュボード化

### Freshness コントラクトの明文化
- **freshness definition**: 「鮮度」の具体的な定義を contract として明文化
- **validation timing**: どの段階で freshness が保証されるのかを明確化
- **exception handling**: 例外ケースの handling プロセスを定義
- **rollback mechanism**: freshness 問題が発生した場合の rollback プロセス

### 監視とアラート
- **freshness monitoring**: publish 時の freshness 状態を常時監視
- **anomaly detection**: freshness の異常を自動検知
- **alert system**: freshness 問題が発生した場合の即時通知
- **metrics tracking**: freshness 関連の指標を追跡

## affected_paths
- `.openclaw/growth/runbooks/board-artifact-freshness-validation.md`
- `.openclaw/growth/config/board-freshness-contract.json`
- `.openclaw/growth/cron-wording/board-publish-gate-validation.md`
- `.openclaw/runtime/board/publish-gate/`
- `.openclaw/runtime/board/freshness-metrics.json`
- `.openclaw/governance/board-artifact-lifecycle.md`
- `.openclaw/docs/board-freshness-specification.md`

## evidence
- board/2026-03-28-board-seed-freshness-publish-gate-agenda-candidate.md: stale agenda-seed-latest.md 問題
- agenda-seed-latest.md: board_cycle_slot_id=20260327-2220 (stale)
- claude-code-precheck-latest.md: expected_board_cycle_slot_id=20260328-0235 との不一致
- board-premeeting-brief-latest.md: 古い cycle の表示
- publish gate の freshness validation 不足

## requires_manual_approval
false

## next_step
1. board publish gate の freshness validation の設計
2. slot 一致チェックの実装
3. board artifact lifecycle の整理
4. freshness contract の明文化
5. 監視システムの prototype 開発

---

**Proposal ID:** board-artifact-freshness-governance-2026-03-29  
**Created:** 2026-03-29  
**Priority:** High  
**Integration Point:** Board Governance + Artifact Lifecycle + Publish Contracts