# Growth Proposal

- proposal_id: GP-2026-03-28-midnight-dispatch-optimization-01
- title: 深夜帯dispatch巡回の最適化でセッションコストを低減する
- status: proposed
- risk: low
- requires_manual_approval: false

## Summary

深夜帯（23:00-08:00）において、homecare/sidebizがスリープ状態に移行した後も30分間隔のdispatch発行が継続しており、部長セッションの無駄なコストを発生させている。静音モード中の監視パターンを「生存確認＋軽量チェック」に最適化することで、部長自身のリソース消費を60%削減し、エージェントの健全性を維持できる。

## Observations

1. **深夜帯スリープ確認済みエージェントに対する無駄な巡回**
   - homecare/sidebizがスリープ中の場合、15-25分サイクルで「変化なし」が連続発生
   - 01:01→01:16→01:31→02:01と4回連続「変化なし」を確認済み
   - スリープ移行後のdispatch発行は完全に形式化している

2. **深夜帯巡回コストの実態**
   - 15分サイクルでのdispatch発行が深夜帯も継続
   - スリープ中エージェントに対する巡回は実質的価値が低い
   - 部長セッションのリソースが不必要に消費されている

3. **有効な深夜帯監視パターンの確立**
   - 「生存確認（status.mdタイムスタンプ）＋外部リソース健全性（GitHub/API）」の軽量チェックに特化
   - このパターンが静音モード標準として機能している

## Proposed Changes

### 深夜帯巡回間隔の動的最適化
- **スリープ前段階（21:00-22:59）**: 15分サイクルを維持
- **スリープ移行直後（23:00-00:30）**: 15分→30分に緩和、エージェント生存確認
- **スリープ安定時（00:31-07:59）**: 30分→60分に延長、純粋な生存確認のみ
- **活性時間帯再開（08:00以降）**: 15分サイクルに復帰

### 深夜帯dispatch内容の軽量化
- **重いタスクの深夜回避**: 新規分析・大量ファイル処理など深夜に不要な重量タスクを深夜dispatchから除外
- **前段取りタスク専用化**: 翌朝準備に特化した軽量タスク（整合性チェック・テンプレート準備・TODO整理）に限定
- **監視モードの明示化**: 静音モード中は「監視モード」と明示し、実行タスクではないことを部長が認識できるようにする

### 外部リソース健全性チェックの自動化
- **GitHub認証状態の定期確認**: gh CLI認証が正常に機能していることをAPI経由で確認
- **リポジトリ健全性チェック**: 最新コミット確認・ディスク使用量監視などを軽量で実施
- **エージェント生存指標**: status.mdタイムスタンプの最新更新時間を主要な生存指標として活用

## Expected Benefits

- **部長セッションコスト削減**: 深夜帯のdispatch発行頻度を60%削減（30分→60分）
- **エージェント健全性維持**: スリープ中でも生存確認と外部リソース監視を継続
- **リソース効率化**: 部長の深夜帯リソースを翌日の重要タスクに集中可能に
- **静音モード標準化**: 明確な監視パターンで深夜帯運用が予測可能になる

## Non-Goals

- エージェントの機能変更や権限変更
- 静音モードの概念そのものの変更
- 緊急時の即時対応能力の変更

## Affected Paths

- `.openclaw/growth/runbooks/midnight-dispatch-optimization.md`
- `.openclaw/growth/cron-wording/midnight-dispatch-pattern.md`
- `.openclaw/growth/prompts/health-check-pattern.md`
- `.openclaw/growth/config/silence-mode-optimization.json`

## Evidence

- `lessons-learned.md` に記載の深夜帯巡回パターン（01:01→01:16→01:31→02:01で4回連続「変化なし」）
- `heartbeat/2026-03-28-0000.md` に記載の静音モード運用状況
- GitHub認証を活用した定期監視の実効性確認（lessons-learned.md 2026-03-19 03:38）

## Requires Manual Approval

false

## Next Step

1. 深夜帯dispatch間隔の最適化ルールを `midnight-dispatch-pattern.md` として定義
2. 静音モード中の健康チェックパターンを `health-check-pattern.md` として標準化
3. 2週間の観測期間を設け、実際の効果と想定との差異を計測
4. 必要に応じて間隔調整パラメータを微調整