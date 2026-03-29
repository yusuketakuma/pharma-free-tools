# 既存HTML改善候補ランキング — 2026-03-25（existing-only）

## 結論
変更なし。上位3件の顔ぶれは前回と同じで、今回は **供給障害患者対応ワークベンチを 2位、返戻再請求ナビを 3位** に調整した。

今回の焦点は、新規候補追加ではなく、**既存HTMLの改善余地が大きい順の再確認** と、低リスクな文面修正の先行適用。

## 改善候補ランキング上位5件

### 1) 薬歴下書き・要点整理支援
- 対象HTML:
  - `pharmacy-medication-history-efficiency.html`
  - `medication-history-time-saving-checklist.html`
- 問題点:
  - 診断・チェック中心で、SOAP要点や次回確認事項をそのまま下書きに使える形まで届いていない
  - 高需要テーマなのに、実務の最終出力が弱い
- 期待改善効果:
  - 薬歴記載の時短効果が最も大きく、再訪利用も見込みやすい
- 修正コスト感: 中
- 優先度: 最優先

### 2) 供給障害患者対応ワークベンチ
- 対象HTML:
  - `supply-disruption-patient-impact.html`
- 問題点:
  - 患者影響の診断で止まり、患者説明文・医師連絡文・薬歴記録文の出力がない
  - テーマは強いのに、実務で使える「対応ワークベンチ」になり切っていない
- 期待改善効果:
  - 限定出荷・供給停止時の現場対応を一気通貫で支援できる
- 修正コスト感: 中
- 優先度: 高

### 3) 返戻再請求ナビ
- 対象HTML:
  - `pharmacy-rejection-template.html`
  - `pharmacy-claim-denial-risk-diagnosis.html`
- 問題点:
  - テンプレと診断が分かれ、理由別ナビとして一体化しきれていない
  - ただし他候補より完成度は高く、残課題は「導線の整理」と「理由別の一気通貫化」
- 期待改善効果:
  - 返戻・再請求の高意図流入を取りやすい
- 修正コスト感: 小〜中
- 優先度: 高

### 4) 在庫優先度ボード
- 対象HTML:
  - `pharmacy-inventory-diagnosis.html`
  - `pharmacy-reorder-point-calculator.html`
  - `inventory-order-optimization-checklist.html`
- 問題点:
  - 診断・計算・チェックが分散し、今日どれを優先対応するかが見えにくい
- 期待改善効果:
  - 発注・欠品・期限・高薬価在庫をまとめて見る価値が高い
- 修正コスト感: 中
- 優先度: 中高

### 5) 服薬フォローアップ記録支援
- 対象HTML:
  - `pharmacy-followup-efficiency.html`
  - `graceful-period-patient-followup-checklist.html`
- 問題点:
  - 診断・チェックリスト止まりで、記録文生成や次回確認項目の整理が弱い
- 期待改善効果:
  - 電話フォロー後の記録負担を下げ、再利用しやすい
- 修正コスト感: 中
- 優先度: 中

## 各候補の実際の問題点
- 1位は「書けない」問題に直結するが、まだ診断型のまま
- 2位は強い痛みに対して出力が足りず、最も伸びしろが大きい
- 3位は完成度が高いので、今は大改修より導線統合が先
- 4位は継続利用向きだが、3ページ統合の設計が必要
- 5位は義務業務支援として有望だが、優先順位は上位4件より少し下

## 実際に修正したこと
### 低リスクな文面修正
- `返戣` → `返戻` を **94箇所** 一括修正
- 対象: 9件のHTMLファイル
  - `ai-prompts-lp.html`
  - `claim-denial-prevention-checklist.html`
  - `claim-denial-reduction-simulator.html`
  - `designated-abuse-prevention-drugs-checklist.html`
  - `dispensing-error-prevention-checklist.html`
  - `index.html`
  - `pharmacy-billing-checklist.html`
  - `pharmacy-claim-denial-diagnosis.html`
  - `renal-drug-dosing.html`
- これで、返戻系の信頼感を落としていた表記ゆれをまとめて解消した

## 優先順位の理由
- 1位は頻度・痛み・既存資産のバランスが最良
- 2位はテーマ強度が高く、診断止まりのギャップも大きい
- 3位は高意図テーマだが、現状でも比較的完成度が高い
- 4位・5位は継続利用価値があるが、出力設計の一段上げが必要

## 前回との差分
- **変更なし**（上位3件の顔ぶれは同じ）
- 順位だけ調整
  - 供給障害患者対応ワークベンチ: 3位 → 2位
  - 返戻再請求ナビ: 2位 → 3位
- 低リスク修正を先行適用
  - 返戻表記ゆれを一括修正
- 停止候補
  - 返戻系の「診断だけを増やす」方向の横展開は停止
  - 既存2本を理由別ナビへ寄せる方が費用対効果が高い

## 次アクション
1. `pharmacy-medication-history-efficiency.html` を「SOAP要点出力型」に寄せるワイヤーを切る
2. `supply-disruption-patient-impact.html` を「患者説明文 / 医師連絡文 / 薬歴記録文」の3出力に絞る
3. `pharmacy-rejection-template.html` と `pharmacy-claim-denial-risk-diagnosis.html` を理由別ナビ導線で統合する
4. 在庫系は 3本束ねの設計を先に作る
5. 返戻系の表記ゆれは今回で止め、以後は新しい表記ブレを増やさない
