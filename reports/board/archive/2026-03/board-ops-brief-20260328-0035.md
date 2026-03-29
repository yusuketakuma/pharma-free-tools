# Board 運用ブリーフ

- board_cycle_slot_id: 20260328-0035
- generated_at: 2026-03-28T00:30:00+09:00
- input_gate: degraded

## 入力 freshness / gate 判定
- agenda seed: `reports/board/agenda-seed-latest.md`
  - artifact board_cycle_slot_id: `20260327-2220`
  - expected slot: `20260328-0035`
  - 判定: **stale**（slot 不一致）
- Claude Code precheck: `reports/board/claude-code-precheck-latest.md`
  - artifact board_cycle_slot_id: **欠落**
  - expected slot reference in body: `20260328-0035`
  - 判定: **degraded**（必須の board_cycle_slot_id 欠落）

## Board へ上げる短い運用判断
1. **今回の入力 gate は degraded。** このまま Board 入力に使うなら「参考入力」扱いに留めるべき。
2. **主因は agenda seed の stale。** `20260327-2220` のため、今回本会議スロット `20260328-0035` の正本ではない。
3. **Claude Code precheck も完全 ready ではない。** 本文では `20260328-0035` を前提に stale 判定しているが、artifact 自体の `board_cycle_slot_id` が明示されていない。
4. **推奨運用は再生成優先。** まず `agenda-seed-latest.md` を `20260328-0035` で再生成し、その後 precheck を同 slot で再出力する。
5. **再生成完了までは意思決定を増やしすぎない。** 古い seed をもとに新規 Issue 化や担当化まで進めるのは避ける。

## Board 候補論点（暫定・最大6件）
1. seed 運用を正本化して再現性を上げる
2. 論点を絞って重複を先に統合する
3. 成長仮説と機会候補の優先順位を決める
4. ゆうすけの負担を減らす境界を決める
5. 自動運転の監視と失敗復旧を強化する
6. 決定を実装へ速く落とし込む

## 推奨アクション
- A. `20260328-0035` slot で agenda seed を再生成
- B. 同 slot で Claude Code precheck を再実行
- C. 両 artifact に `board_cycle_slot_id` を明示してから Board 入力を確定
