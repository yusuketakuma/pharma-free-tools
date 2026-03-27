# Anomaly-delta contract verification — 2026-03-27 19:26 JST

## 結論
- signal-only 契約は report 側まで反映された。
- 平常時は candidate を増やさず、`delta / threshold breach / precedent gap` が出た時だけ候補化する方針が揃った。

## 確認した要点
1. scorecard は「新規 anomaly なし → signal-only」を維持する文言になった。
2. autonomy health は、定常時は anomaly-delta signal-only を維持する改善提案へ揃った。
3. lesson / heartbeat / board 系の report でも、steady-state は signal-only に寄せる方向が一貫している。

## 効果確認
- review/apply と report-side wording が一致したため、この proposal は effect-confirmed 扱いにできる。
