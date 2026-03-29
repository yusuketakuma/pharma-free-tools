# 既存HTML改善候補ランキング — 2026-03-24（existing-only）

## 結論
既存 `pharma-free-tools` のHTML群を再監査した結果、今回もっとも費用対効果が高いのは、**高需要テーマなのに「診断・チェックで止まっているページ」を、現場でそのまま使える出力型ツールへ寄せる改善**です。

既存HTML限定での上位5件は以下です。

1. 薬歴下書き・要点整理支援
2. 返戻再請求ナビ
3. 供給障害患者対応ワークベンチ
4. 在庫優先度ボード
5. 服薬フォローアップ記録支援

今回はテーマ評価だけでなく、実ファイル監査も入れました。特に、**上位候補周辺ページに generic な OGP/Twitter メタ上書きが残っており、SEO/共有品質を落としていた**点が明確でした。加えて、初回監査時点でルートHTML全体に同系統の generic メタ残りが 65本あり、今回はトップ候補だけ先行で補修しています。

### 評価軸
- UI/UXの古さ
- SEOの弱さ
- OGP / メタの弱さ
- CTA / 導線の弱さ
- テーマは良いのに完成度が低いか
- 実務インパクト（頻度・痛み・再訪可能性）
- 既存改善で回収しやすいか（費用対効果）

---

## 改善候補ランキング上位5件

### 1) 薬歴下書き・要点整理支援
- 対象HTML:
  - `pharmacy-medication-history-efficiency.html`
  - `medication-history-time-saving-checklist.html`
- 問題点:
  - UI/UXは診断・チェックリスト止まりで、SOAP下書き・患者説明メモ・次回確認事項の出力まで届いていない
  - 検索意図は強いのに、ページ体験が「自己評価」で終わる
  - CTAが汎用の別LP寄りで、薬歴作成の次アクションへ直結していない
  - OGP/Twitterに generic 英語メタの残りがあり、テーマ一致度を落としていた
- 期待改善効果:
  - 検索流入後にその場で使えるため、離脱率改善と再訪増が見込める
  - 「薬歴 時短」「薬歴 書けない」「SOAP 例」系の高意図流入と相性が良い
  - 診断ツールから実務支援ツールへの格上げ効果が最大
- 修正コスト感: 中
- 優先度: 最優先

### 2) 返戻再請求ナビ
- 対象HTML:
  - `pharmacy-rejection-template.html`
  - `pharmacy-claim-denial-risk-diagnosis.html`
- 問題点:
  - テンプレと診断が分断され、理由別ナビとして一気通貫になっていない
  - `pharmacy-rejection-template.html` に返戻表記の typo 残りがあり、信頼性とSEOを落としていた
  - OGP/Twitter が generic 上書き状態で、返戻・再請求テーマの訴求が弱かった
  - CTAが理由別の次手ではなく、汎用導線に逃げている
- 期待改善効果:
  - 「返戻」「再請求」などの高意図検索でCVしやすい
  - 実務でのコピペ需要が高く、再訪利用も見込める
  - typo + メタ修正だけでも、検索・共有・信頼の目減りをすぐ回収できる
- 修正コスト感: 小〜中
- 優先度: 高

### 3) 供給障害患者対応ワークベンチ
- 対象HTML:
  - `supply-disruption-patient-impact.html`
- 問題点:
  - テーマは強いのに、現状は「患者影響診断」で止まっている
  - 患者説明文・医師連絡文・薬歴記録文など、現場で欲しい出力がない
  - OGP/Twitter/canonical が page-specific に整っておらず、共有品質が弱かった
  - CTAが弱く、強い困りごとに対して導線の押し込みが足りない
- 期待改善効果:
  - 差別化しやすく、SNS共有・自然リンクとも相性が良い
  - 患者説明・医師連絡・記録を一画面で支援できれば、既存診断群より価値が高い
  - 供給不安が続く限り、継続再訪が期待できる
- 修正コスト感: 中
- 優先度: 高

### 4) 在庫優先度ボード
- 対象HTML:
  - `pharmacy-inventory-diagnosis.html`
  - `pharmacy-reorder-point-calculator.html`
  - `inventory-order-optimization-checklist.html`
- 問題点:
  - 診断・計算・チェックが分かれ、最終的な「今日どれを優先対応するか」が見えない
  - 3ページともメタ訴求が弱く、CTAも汎用的
  - 継続利用向きテーマなのに、単発利用で終わりやすい
- 期待改善効果:
  - 発注・期限・欠品・高薬価在庫をまとめて優先順位化できると実利用価値が高い
  - ブックマーク率・定期利用率が上がりやすい
  - 既存3本を束ねるだけでも完成度が一段上がる
- 修正コスト感: 中
- 優先度: 中高

### 5) 服薬フォローアップ記録支援
- 対象HTML:
  - `pharmacy-followup-efficiency.html`
  - `graceful-period-patient-followup-checklist.html`
- 問題点:
  - 診断・チェックリスト止まりで、記録文生成や次回確認項目整理まで届いていない
  - OGP/Twitter が generic 上書き状態で、ページ固有のテーマ訴求が弱かった
  - CTAが汎用で、電話後記録・共有・再実施の導線が弱い
- 期待改善効果:
  - 義務業務の標準化ニーズに合い、再訪利用が期待できる
  - 記録文・未対応フラグ・次回確認事項まで出せると完成度が跳ねる
  - 管理薬剤師・対人業務強化文脈とも相性が良い
- 修正コスト感: 中
- 優先度: 中

---

## 実際に修正したこと
低リスクで明確なものだけ自動修正しました。

### 実ファイル修正
#### generic OGP/Twitter 上書きの解消 + page-specific メタ整備
- `pharmacy-medication-history-efficiency.html`
- `medication-history-time-saving-checklist.html`
- `supply-disruption-patient-impact.html`
- `pharmacy-rejection-template.html`
- `pharmacy-claim-denial-risk-diagnosis.html`
- `pharmacy-inventory-diagnosis.html`
- `pharmacy-reorder-point-calculator.html`
- `inventory-order-optimization-checklist.html`
- `pharmacy-followup-efficiency.html`
- `graceful-period-patient-followup-checklist.html`

上記10ファイルで、末尾に残っていた generic 英語系 OGP/Twitter メタを、ページ固有の日本語メタへ置換し、共有時のタイトル・説明・画像を `ogp.png` 基準へ揃えました。canonical が未整備だったページには canonical も追加しました。

#### typo 修正
- `pharmacy-rejection-template.html`
  - `返戣` → `返戻`
  - description / JSON-LD / 本文の表記ゆれを補修

### 管理ドキュメント修正
- 本レポートを `projects/pharma-free-tools/docs/html-improvement-ranking-2026-03-24-existing.md` に保存

---

## 優先順位の理由
- **1位 薬歴**は、発生頻度・検索意図・既存資産・改善後の再訪性のバランスが最良。
- **2位 返戻**は、1件あたりの痛みが強く、しかも typo / メタ / 導線分断という“すぐ効く欠点”が残っていたため、費用対効果で供給障害を上回った。
- **3位 供給障害**は、テーマ強度は非常に高いが、返戻よりも出力仕様の設計量が少し大きいため今回は一段下げた。
- **4位 在庫**は継続利用価値が高いが、3ページ統合の設計が必要でやや中コスト。
- **5位 フォローアップ**は有望だが、トップ4より差別化の勝ち筋がやや弱く、後順位。

---

## 前回との差分
前回比較は、`projects/pharma-free-tools/docs/theme-extraction-2026-03-24.md` と `projects/pharma-free-tools/docs/html-improvement-ranking-2026-03-23.md` を基準にしています。

- 今回は **existing-only（既存HTML限定）** で再評価した
  - `疑義照会・トレーシング連絡ナビ`
  - `長期収載品選定療養説明ナビ`
  は新規寄りのためランキング対象外にした
- 順位差分
  - 1位: 薬歴下書き・要点整理支援（維持）
  - 2位: 返戻再請求ナビ（3位 → 2位へ上昇）
  - 3位: 供給障害患者対応ワークベンチ（2位 → 3位へ後退）
  - 4位: 在庫優先度ボード（維持）
  - 5位: 服薬フォローアップ記録支援（維持）
- 新しい発見
  - 前回「修正済み」扱いに近かった上位候補周辺でも、generic OGP/Twitter 上書きが残っていた
  - `pharmacy-rejection-template.html` に返戻 typo の残りが実ファイル上で確認できた
- 今回は、提案だけでなく **低リスクなメタ修正と typo 修正を先行適用** した

---

## 次アクション
1. **1位 薬歴下書き・要点整理支援**
   - `pharmacy-medication-history-efficiency.html` のワイヤーを1枚切る
   - 出力要件を `SOAP要点 / 次回確認事項 / 患者説明メモ` に固定する
2. **2位 返戻再請求ナビ**
   - `pharmacy-rejection-template.html` と `pharmacy-claim-denial-risk-diagnosis.html` を理由別ナビ導線で統合する仕様を作る
3. **3位 供給障害患者対応ワークベンチ**
   - 最小出力を `患者説明文 / 医師連絡文 / 薬歴記録文` の3本に絞る
4. **低リスク別タスク**
   - ルートHTML全体に残る generic OGP/Twitter パターン（初回65本確認、今回補修後も55本残り）を、別バッチで順次解消する
5. 大規模UI改修はまだ自動適用しない
   - まずはトップ3のワイヤーと出力仕様を固めてから着手する
