# Autonomy Escalation Rule Review — 2026-03-25 05:30 JST

## 結論
- **改善ループの反復は確認**。特に `queue telemetry → triage → decision-quality` の流れが繰り返され、同じ論点を再掲しやすい状態。
- **2回連続要判断事項あり** は実質的に該当。3/24 の KPI 维护系と 3/25 の health review で、未解決の判断が残っている。
- **3回連続差分なし** と **3日連続指標不足** は、厳密判定に必要な同条件の履歴が足りず、今回は **履歴不足**。
- 安全に直せる範囲として、**runbook に escalation gates を追加** し、`変更なし` / `前回から実質差分なし` / `履歴不足` を明示するようにした。

## 検出した停滞/重複パターン
1. **同じ改善候補の反復残存**
   - queue telemetry と dominant-prefix triage が、3/24 → 3/25 で継続して主論点。
   - 似た報告を増やすより、prefix ごとの owner / next action / success criteria に落とす段階。

2. **要判断事項の滞留**
   - 3/24 の KPI registry maintenance で `sidebiz` / `polymarket` が判断不能、3/25 の health review でも要判断事項が残存。
   - 判断保留が続くと、報告だけ増えて処理が進まない。

3. **実行はあるが具体アクションが薄い**
   - `next action` はあるが、owner / due / success criteria まで固定されない報告がまだある。
   - そのため、実行済みなのに次の一手が曖昧なまま反復しやすい。

4. **履歴不足のまま規則を増やしがち**
   - 3回連続差分なし / 3日連続指標不足は、今回の範囲では厳密な streak を証明できない。
   - ここで無理に新規規則を足すと、ルールだけ増えて実効性が落ちる。

## 推奨エスカレーション規則
- **3回連続差分なし**
  - 厳密に同条件の 3 回が揃った場合のみ `前回から実質差分なし` を明記。
  - その後は本文を短くし、新しい根拠 / 新しい対象 / 新しい owner がない限り再提案しない。
  - 履歴が足りない場合は `履歴不足`。

- **2回連続要判断事項あり**
  - priority review に昇格し、owner / due / success criteria を必須化。
  - 同じ open question を再掲するだけなら、次回は報告ではなく manual review に切り替える。

- **3日連続指標不足**
  - 3 日分の dated run が揃った場合のみ `baseline 未形成` と明記。
  - 以後は分析を続けず、metric definition / instrumentation に切り替える。

- **同じ改善候補の反復残存**
  - 候補を統合し、前回レポートを引用して 1 件にまとめる。
  - 候補が変わっていないなら、重複リストを増やさない。

- **実行はあるが具体アクションが出ていない**
  - 1 行の next action ではなく、owner / due / success criteria を揃える。
  - それでも不十分なら blocked remediation 扱いにして、報告の再掲を止める。

## 実際に修正したこと
- `projects/openclaw-core/docs/queue-dominant-prefix-triage.md`
  - `Escalation rules` を追加
  - `Reporting style` を追加
  - no-diff / judgment / missing-metric / repeated-candidate / actionless-execution の分岐を明文化
- `projects/openclaw-core/docs/status.md`
  - Active Tasks に escalation rules を追記
- `projects/openclaw-core/backlog/queue.md`
  - Dominant-prefix triage の項目に escalation rules を追記

## 不足規則
- 厳密な **3回連続差分なし** の判定規則
- 厳密な **3日連続指標不足** の判定規則
- `前回から実質差分なし` を短文で返すフォーマット規則
- `履歴不足` のときに新規規則を増やさない停止規則
- 「next action はあるが owner/due がない」場合の強制昇格規則

## 前回との差分
- 前回は **triage checklist** が中心だった。
- 今回はそれに加えて、**同じ報告を繰り返さないための条件分岐** を明文化した。
- つまり、観測・分類だけでなく、**再掲抑制 / 頻度縮小 / priority review への昇格** までを含む形に進んだ。
- 変更の実体は小さいが、運用効果は大きい。

## 次アクション
1. 次回の同系統レポートで、`前回から実質差分なし` が出せるか確認する。
2. 2回連続で要判断が残る対象は、次回から owner / due / success criteria を必須にする。
3. 3 日連続で指標不足が続く対象は、分析継続ではなく計測設計に切り替える。
4. queue 側はこの triage checklist をそのまま運用し、重複報告を減らす。
