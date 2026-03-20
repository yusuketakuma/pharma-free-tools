# MCS抽出後ハンドオフカード（2026-03-19）

**目的**: `prescriptions_export.csv` を保存した直後に、照合→患者別対応ログ転記までを5〜10分で進めるための1枚メモ  
**対象**: ゆうすけ / homecare  
**所要時間**: 約5〜10分  
**完了条件**: `transition_drugs_match_result.json` が生成され、患者別対応ログへ初回転記が始まっていること

---

## 先に確認する3点

- [ ] `prescriptions_export.csv` が保存できている
- [ ] `transition-drugs-387-matcher.py` と同じフォルダに置いてある
- [ ] `drugs_54_component_delete.csv` が同じフォルダにある

> 迷ったら: まず **テリパラチド** が含まれているかだけ先に見ればOK。

---

## Step 1: スクリプト実行

```bash
cd ~/Desktop/openclaw-cowork/homecare/
python3 transition-drugs-387-matcher.py
```

### 正常なら起きること
- 画面に件数サマリーが出る
- `transition_drugs_match_result.json` が生成される
- 成分単位削除対象患者がいれば名前と薬剤が見える

### 止まった時
- `prescriptions_export.csv` の名前違いを確認
- 保存先が違う場合は matcher と同じフォルダへ移す
- `drugs_54_component_delete.csv` がない場合は54品目判定が弱くなる

---

## Step 2: 最優先だけ先に見る

この順番で確認:
1. **テリパラチド**（3/28返品期限）
2. アモキサピン
3. リラグルチド
4. ガランタミン
5. メマンチン
6. トラニラスト

### 判定の目安
- **A**: 即日
- **B**: 3営業日以内
- **C**: 今週中
- **D**: 監視

---

## Step 3: 患者別対応ログへ1件でも転記する

転記先:
- `outputs/homecare-transition-patient-action-log-template-2026-03-19.md`

最低限この列だけ埋めれば前進:
- 患者名
- 成分/商品
- 優先度
- 次回訪問/受診
- 代替候補
- 医師照会要否
- 完了期限

### 最初の1件はこれを優先
- テリパラチド患者がいれば最優先で転記
- いなければアモキサピン or リラグルチド

---

## 今日ここまでできればOK

- [ ] matcher実行完了
- [ ] JSON生成完了
- [ ] 患者別対応ログへ1件以上転記
- [ ] テリパラチド該当有無が分かった

---

## trainer集約メモ欄
- status:
- 要点:
- 次アクション:
- 期待する阻害要因除去条件:
- 必要権限:
- 次サイクルへ反映する学習ポイント:

---

## 参照ファイル
- `homecare/outputs/mcs-phase1-quick-card-2026-03-19.md`
- `homecare/outputs/transition-matcher-final-check-2026-03-18.md`
- `outputs/homecare-transition-patient-action-log-template-2026-03-19.md`
- `homecare/outputs/teriparatide-3day-action-2026-03-19.md`
