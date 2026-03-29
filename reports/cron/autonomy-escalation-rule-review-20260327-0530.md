# Autonomy Escalation Rule Review — 2026-03-27 05:30 JST

## 結論
- 直近の定期ジョブ出力では、**同じ論点の再掲** がまだ残っている。
- **2回連続要判断事項あり** は実質該当。
- **3回連続差分なし** と **3日連続指標不足** は、今回も厳密判定に足る履歴がなく **履歴不足**。
- 安全に直せる範囲として、`due / evidence / stop condition` を triage 出力に追加し、`履歴不足` のときは新規規則を増やさない形に補強した。

## 検出した停滞/重複パターン
1. **同じ改善候補の反復残存**
   - `queue telemetry → triage → decision-quality` 系の論点が繰り返しやすい。
   - 似た報告を増やすより、prefix ごとの owner / next action / success criteria まで落とす段階。

2. **要判断事項の滞留**
   - 3/25 以降も unresolved judgment が残る。
   - 同じ open question を再掲するだけでは前進しない。

3. **実行はあるが具体アクションが薄い**
   - next action はあるが、owner / due / evidence / success criteria / stop condition が揃わないケースがある。

4. **履歴不足のまま規則を増やしがち**
   - 3回連続差分なし / 3日連続指標不足は、今回の比較範囲ではまだ証明できない。
   - ここで新規分岐を増やすと、ルールだけ増えて運用が鈍る。

## 推奨エスカレーション規則
- **3回連続差分なし**
  - 十分な履歴がある場合のみ発動。
  - 発動時は `前回から実質差分なし` を先頭にし、本文は短くする。
  - 履歴が足りない場合は `履歴不足`。

- **2回連続要判断事項あり**
  - priority review に昇格し、owner / due / evidence / success criteria / stop condition を必須化。
  - 同じ open question の再掲だけなら、次回は manual review に切り替える。

- **3日連続指標不足**
  - 十分な履歴がある場合のみ発動。
  - 総論を増やさず、最小指標を 1 つだけ定義する。
  - 以後は分析継続ではなく、計測設計へ切り替える。

- **同じ改善候補の反復残存**
  - 候補を統合し、前回レポートを引用して 1 件にまとめる。
  - 候補が変わっていないなら、重複リストを増やさない。

- **実行はあるが具体アクションが出ていない**
  - `due / evidence / stop condition` を必須化する。
  - それでも不十分なら blocked remediation とし、報告の再掲を止める。

## 実際に修正したこと
- `projects/openclaw-core/docs/queue-dominant-prefix-triage.md`
  - `due / evidence / stop condition` を triage 収集項目に追加
  - `Execution exists but no concrete action is produced` を `due / evidence / stop condition` 付きの blocked remediation に明確化
  - `Output template` に `due / evidence / stop condition` を追加
  - `Reporting style` に `履歴不足` の短絡ルールを追加
- `projects/openclaw-core/docs/queue-triage-analyst-runbook.md`
  - prefix 行の記録項目に `due / evidence / stop condition` を追加
  - evidence が薄いときは `履歴不足` で止める分岐を追加
  - output template を triage checklist と揃えた
- `projects/openclaw-core/docs/status.md`
  - Active Tasks に `due / evidence / stop condition` を追記
- `projects/openclaw-core/backlog/queue.md`
  - Dominant-prefix triage の項目に `due / evidence / stop condition` を追記

## 不足規則
- 厳密な **3回連続差分なし** の判定には、まだ十分な比較履歴が必要
- 厳密な **3日連続指標不足** の判定にも、まだ十分な dated run が必要
- `履歴不足` のときに新規規則を増やさず停止する運用は、今回明文化したが、実運用で定着確認が必要
- `next action` だけでなく `due / evidence / stop condition` を必須にする判定は、今後も継続監視が必要

## 前回との差分
- 前回は、同種レポートの再掲抑制と priority review への昇格が中心だった。
- 今回はそれに加えて、**triage 出力に due / evidence / stop condition を明示** し、**履歴不足時に規則を増やさない** 停止条件を補強した。
- 変更の実体は小さいが、再掲抑制の精度は上がった。

## 次アクション
1. 次回の同系統レポートで、`前回から実質差分なし` と `履歴不足` を短文で返せるか確認する。
2. 2回連続で要判断が残る対象は、owner / due / evidence / success criteria / stop condition を必須にする。
3. 3 日連続で指標不足が続く対象は、分析継続ではなく計測設計に切り替える。
4. queue 側はこの triage checklist をそのまま運用し、重複報告を減らす。
