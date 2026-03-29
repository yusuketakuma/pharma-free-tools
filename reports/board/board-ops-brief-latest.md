# Board Ops Brief

- board_cycle_slot_id: `20260328-0835`
- generated_at: `2026-03-28T08:30:00+09:00`
- input_gate: `degraded`
- expected_slot: `20260328-0835`

## Input Freshness Check

- agenda-seed: `stale`
  - found board_cycle_slot_id: `20260328-0820`
  - expected: `20260328-0835`
  - note: current slot rule is JST `HH:35`; seed is slot-mismatched.
- claude-code-precheck: `stale`
  - found board_cycle_slot_id: `missing`
  - expected: `20260328-0835`
  - note: precheck body references expected slot=`20260328-0835` and marks `stale_input`, but required canonical field is absent.

## Board Input Summary

現時点の入力正本は freshness 条件を満たしていない。したがって今回の Board 入力は **degraded 運用** とし、正式採択ではなく「再生成・再確認前提の暫定審議メモ」として扱うのが妥当。

## Provisional Candidate Topics (max 6)

1. **取締役会入力パイプラインの固定化**  
   seed → precheck → review → record の正本運用、命名、保存先、失敗時フォールバックを固定する。
2. **Queue / Rebalance / Review の滞留監視**  
   実行能力より先に、詰まり・手戻り・滞留の可視化と閾値管理を整える。
3. **Protected path / approval 境界の監査**  
   自動改善と manual review 必須の境界を四半期監査項目として固定する。
4. **成長投資配分の再決定**  
   OpenClaw 自動運用基盤を優先しつつ、DSS と薬局支援は停止条件付きで扱う。
5. **利用者負担削減 KPI の優先**  
   新機能より、確認待ち・差し戻し・曖昧返答の削減を優先する。
6. **北極星指標の再定義**  
   実行件数ではなく、翌朝に残る有効 artifact 数と採用率を主要指標候補にする。

## Recommended Board Handling

- 判定: **input_gate=degraded**
- 扱い: 上記 6 件は discussion seed としては有効だが、slot 整合済み artifact 再生成までは正式入力扱いにしない。
- 即時アクション:
  1. `agenda-seed-latest.md` を `board_cycle_slot_id=20260328-0835` で再生成
  2. `claude-code-precheck-latest.md` に canonical `board_cycle_slot_id` を明記して再出力
  3. `latest` 更新を slot 一致時のみ許可する fail-closed 運用へ寄せる
