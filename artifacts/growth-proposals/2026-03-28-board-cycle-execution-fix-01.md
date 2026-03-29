# Growth Proposal

- proposal_id: GP-2026-03-28-board-cycle-execution-fix-01
- title: Boardサイクルの実行確実性向上と差分指示フロー改善
- status: proposed
- risk: low
- requires_manual_approval: false

## Summary

Board最終裁定のartifact取得と差分指示配信において、**実行時の参照先解決**と**差分指示の分割送信**に課題がある。特に、board final裁定artifactが取得できない場合、全体サイクルがブロックされ、適用すべき差分指示が送信されない。差分指示の「範囲指定」と「確実な送信」の分離により、全体ブロックを防ぎつつ安全な更新が可能になる。

## Observed Signals

1. 2026-03-27の差分指示配信では、Board最終裁定artifactの参照先解決に失敗し、配信が未完了となった
2. decision-ledgerへの依存が強すぎて、直接の差分指示パスと競合する
3. 送信成功→受理成功→成果物確認の3段階で、どれか1つでも失敗すると全体がリセットされる脆弱性がある
4. 差分指示対象エージェントごとに、参照解決失敗の影響範囲が異なる（supervisor-coreは最も影響が大きい）

## Proposed Change

差分指示フローを「範囲指定」と「確実な送信」の2段階に分割し、参照解決失敗時でも部分的な適用が可能にする。

### 2段階差分指示フロー

#### Stage 1: 範囲指定 (Reference Resolution)
- Board最終裁定artifactを参照し、対象エージェントと変更内容を確定
- artifact取得に失敗した場合は、前回成功時の範囲をfallbackとして維持
- resolution状態をログとして明示記録（成功/失敗/fallback適用）

#### Stage 2: 確実な送信 (Segmented Delivery)
- エージェントごとに独立した送信単位を設定
- 送信成功したエージェントは「completed」マークを付け、以降の再試行から除外
- 送信失敗したエージェントだけを再試行対象とする
- フェイルセーフ：全体ブロック時でも、成功したエージェントの適用は維持

### Resolution Priority Levels
- Level 1 (最高): Board最終裁定artifact直接参照
- Level 2 (fallback): decision-ledger参照
- Level 3 (最終fallback): 前回成功時の差分指示範囲

## Expected Benefits

- Boardサイクル全体のブロックリスクを削減
- 一部エージェントの参照解決失敗でも、成功した部分の適用を継続
- 再試行処理の精度向上（失敗エージェントだけに集中）
- fallbackパターンの明示化による運用安定性向上

## Non-Goals

- Boardサイクル自体の変更
- artifact生成プロセスの変更
- エージェント定義の根本変更

## Suggested Next Step

1. 差分指示を2段階（範囲指定→確実送信）に分割する
2. 各エージェントの送信状態を独立して追跡
3. resolution priority fallbackロジックを実装
4. 1エージェント失敗時の全体再試行を避けるsegmented deliveryを実装