# Board Postmeeting Agent Dispatch 2026-03-27 20:45 JST

## 結論
- この実行環境では、Board 最終裁定の本文・approve候補の `proposal_id` を取得できなかったため、**差分指示の実配信は未完了**。
- 既知のエージェントには「通常業務継続 / 待機条件」のみを暫定適用するのが安全。
- 実配信は、decision-ledger または board final裁定 artifact が回収でき次第、再試行する。

## board_cycle_slot_id
- `cron:32ba03a1-c935-486d-8946-873b4235557e`
  - inbound task id を暫定 slot id として記録
  - 別途正式な slot id がある場合は差し替え

## 差分指示対象
- supervisor-core
- board-operator
- board-visionary
- board-user-advocate
- board-auditor
- ceo-tama

## 通常業務継続項目
- supervisor-core: 進行管理・整流化・未完了タスクの監視を継続
- board-operator: 通常のオペレーション確認、差分指示が来るまで待機
- board-visionary: 提案/方向性の通常整理を継続、Board 裁定待ち
- board-user-advocate: ユーザー影響/負担の観点レビューを継続
- board-auditor: 監査・整合性チェックを継続
- ceo-tama: control plane として待機し、裁定本文が来たら再配信

## Claude Code 実行へ回す対象
- board 最終裁定の本文に依存し、repo 調査 / 複数ファイル変更 / テスト / 実装が必要な項目
- 実行時は **Claude Code execution plane（acp_compat 優先）** 前提
- OpenClaw 側では read_only / plan_only / short report / lightweight coordination のみに限定

## 送信成功
- 未実施

## 受理成功
- 未受理

## 成果物確認済み
- 未確認

## 未配信 / 未受理 / 未成果確認
- 未配信: 全エージェント
- 未受理: 全エージェント
- 未成果確認: 全エージェント

## 自己改善 proposal 引き渡し
- `proposal_id`: 未確認
- review/apply ジョブへの引き渡し: 保留

## 再試行対象
- Board 最終裁定本文の回収
- approve候補の `proposal_id` 回収
- decision-ledger / board artifact の所在確認
- その後の差分指示再生成と再配信

## 次アクション
1. Board 最終裁定 artifact か decision-ledger の参照先を取得する
2. `proposal_id` があるなら review/apply ジョブに明示して引き渡す
3. 各エージェント向けに Board 最終裁定の範囲だけを再構成して配信する
4. 送信→受理→成果物確認の 3段階を再記録する
