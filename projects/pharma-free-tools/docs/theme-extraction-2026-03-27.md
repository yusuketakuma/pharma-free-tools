# テーマ抽出レポート — 2026-03-27

## 結論
変更なし。前回のトップ3をそのまま維持した。

- 既存HTMLとの重複判定も変化なしで、上位3件は **既存改善で進める**。
- 新規トップ候補の追加はなし。
- 03-26 に薬歴テーマの wireframe proposal を切ったので、今回は需要再確認と順位維持の回。

## 今回見つかった困りごと
### 1) 薬歴下書き・要点整理が遅い
- 誰が困っているか: 薬局薬剤師
- 課題場面: SOAP要点、前回差分、患者説明メモがまとまらず、薬歴記載が後ろ倒しになる
- 評価: 発生頻度 5/5、痛みの強さ 5/5、既存代替の弱さ 4/5、HTML適性 5/5、既存改善で足りるか **はい**
- 既存重複: `pharmacy-medication-history-efficiency.html`, `medication-history-time-saving-checklist.html`
- 反復残存: **はい** / 最小修正済み（wireframe proposal あり）

### 2) 供給障害時の患者対応が重い
- 誰が困っているか: 薬局薬剤師、管理薬剤師
- 課題場面: 代替候補整理、患者説明、医師連絡、薬歴記録が同時に発生する
- 評価: 発生頻度 5/5、痛みの強さ 5/5、既存代替の弱さ 4/5、HTML適性 5/5、既存改善で足りるか **はい**
- 既存重複: `supply-disruption-patient-impact.html`
- 反復残存: **はい** / 人判断待ち（出力テンプレの固定が未完）

### 3) 返戻再請求の手順が迷いやすい
- 誰が困っているか: 薬局事務、請求担当、管理薬剤師
- 課題場面: 返戻理由ごとの再請求手順、修正点の確認、オンライン返戻の処理で迷う
- 評価: 発生頻度 4/5、痛みの強さ 5/5、既存代替の弱さ 4/5、HTML適性 5/5、既存改善で足りるか **はい**
- 既存重複: `pharmacy-rejection-template.html`, `pharmacy-claim-denial-risk-diagnosis.html`, `claim-denial-prevention-checklist.html`
- 反復残存: **はい** / 最小修正済み（表記ゆれ修正済み、導線統合が残課題）

## 優先候補トップ3
1. 既存改善: 薬歴下書き・要点整理支援
2. 既存改善: 供給障害患者対応ワークベンチ
3. 既存改善: 返戻再請求ナビ

## 新規/改善の判定
- **新規作成なし**
- **既存改善で進めるもの**
  - 薬歴下書き・要点整理支援
  - 供給障害患者対応ワークベンチ
  - 返戻再請求ナビ
- 反復残存の扱い
  - 薬歴: wireframe proposal まで進行済み。実装待ち
  - 供給障害: 出力テンプレ未完。人判断待ち
  - 返戻: 既存2本を理由別ナビへ統合する最小改修待ち

## 実際に修正したこと
- `projects/pharma-free-tools/docs/theme-extraction-2026-03-27.md` を新規作成
- `projects/pharma-free-tools/docs/status.md` を 2026-03-27 版へ更新
- `projects/pharma-free-tools/backlog/queue.md` を 2026-03-27 版へ更新
- `projects/pharma-free-tools/learn/improvement-ledger.md` を 2026-03-27 版へ更新
- HTML本体は未変更（新規候補なしのため）

## 前回との差分
- **変更なし**
- トップ3は前回から維持
- 新規候補の追加なし
- ただし薬歴テーマは 03-26 に wireframe proposal まで進行済みで、実装候補として一段近づいた

## 次アクション
1. `pharmacy-medication-history-efficiency.html` を wireframe proposal に合わせて実装へ寄せる
2. `supply-disruption-patient-impact.html` を「患者説明文 / 医師連絡文 / 薬歴記録文」の3出力に固定する
3. `pharmacy-rejection-template.html` と `pharmacy-claim-denial-risk-diagnosis.html` を理由別ナビ導線で統合する
4. 新規テーマは、既存3件の改善が進むまで保留
