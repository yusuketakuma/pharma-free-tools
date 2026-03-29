# テーマ抽出レポート — 2026-03-25

## 結論
変更なし。前回のトップ3をそのまま維持した。

- 既存HTMLとの重複判定も前回と同じで、上位3件は **既存改善で十分**。
- 新規候補のトップ3入りはなし。
- 2026年度調剤報酬改定まわりの需要は再確認したが、既存HTML群に吸収できるため新規化は見送った。

## 今回見つかった困りごと
### 1) 薬歴下書き・要点整理が遅い
- 誰が困っているか: 薬局薬剤師
- 課題場面: SOAPのA/P、前回差分、患者説明メモがまとまらず、記録が後ろ倒しになる
- 評価: 発生頻度 5/5、痛みの強さ 5/5、既存代替の弱さ 4/5、HTML適性 5/5、既存改善で足りるか **はい**
- 既存重複: `pharmacy-medication-history-efficiency.html`, `medication-history-time-saving-checklist.html`

### 2) 供給障害時の患者対応が重い
- 誰が困っているか: 薬局薬剤師、管理薬剤師
- 課題場面: 代替候補整理、患者説明、医師連絡、薬歴記録が同時に発生する
- 評価: 発生頻度 5/5、痛みの強さ 5/5、既存代替の弱さ 4/5、HTML適性 5/5、既存改善で足りるか **はい**
- 既存重複: `supply-disruption-patient-impact.html`

### 3) 返戻再請求の手順が迷いやすい
- 誰が困っているか: 薬局事務、請求担当、管理薬剤師
- 課題場面: 返戻理由ごとの再請求手順、修正点の確認、オンライン返戻の処理で迷う
- 評価: 発生頻度 4/5、痛みの強さ 5/5、既存代替の弱さ 4/5、HTML適性 5/5、既存改善で足りるか **はい**
- 既存重複: `pharmacy-rejection-template.html`, `pharmacy-claim-denial-risk-diagnosis.html`, `claim-denial-prevention-checklist.html`

### 補足: 2026年度調剤報酬改定の算定・説明整理
- 再確認したが、`pharmacy-dispensing-fee-revision-diagnosis.html` / `pharmacy-revision-2026.html` に吸収できるため、新規候補にはしない
- つまり「困りごととしては強い」が、「新規作成が必要」にはまだ達していない

## 優先候補トップ3
1. 薬歴下書き・要点整理支援
2. 供給障害患者対応ワークベンチ
3. 返戻再請求ナビ

## 新規/改善の判定
- **既存改善で進めるもの**
  - 薬歴下書き・要点整理支援
  - 供給障害患者対応ワークベンチ
  - 返戻再請求ナビ
- **新規作成なし**
  - 今回は新規トップ候補の追加なし
  - 既存HTMLで吸収できる需要は、改善側に寄せる

## 実際に修正したこと
- `projects/pharma-free-tools/docs/theme-extraction-2026-03-25.md` を新規作成
- `projects/pharma-free-tools/docs/status.md` に 2026-03-25 の再点検メモを追記
- `projects/pharma-free-tools/learn/improvement-ledger.md` に 2026-03-25 の変更なし記録を追加

## 前回との差分
- **変更なし**
- トップ3は 2026-03-24 から維持
- 新規トップ候補の追加なし
- `2026年度調剤報酬改定` の需要は再確認したが、既存HTMLに吸収可能なため候補化しなかった
- 既存HTMLの重複判定も前回から変化なし

## 次アクション
1. `pharmacy-medication-history-efficiency.html` の改善ワイヤーを1枚で切る
2. `supply-disruption-patient-impact.html` を「患者説明文 / 医師連絡文 / 薬歴記録文」の3出力に寄せる
3. `pharmacy-rejection-template.html` と `pharmacy-claim-denial-risk-diagnosis.html` の理由別ナビ統合を進める
4. 2026年度調剤報酬改定系は、新規追加ではなく既存ページの文面・導線補強に留める
