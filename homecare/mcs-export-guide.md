# MedicalCareStation 処方データ抽出ガイド

**作成日**: 2026年3月7日
**目的**: 経過措置薬品387品目との照合用データ抽出

---

## 手順

### 1. 処方データエクスポート

1. MedicalCareStationを起動
2. **レポート** → **処方履歴** を選択
3. 期間を指定（例: 過去3ヶ月）
4. **エクスポート** → **CSV形式** を選択
5. 以下のカラムを含める:
   - 患者ID
   - 患者名
   - 薬品名
   - 規格
   - 用法
   - 用量
   - 処方日
   - 医師名

### 2. ファイル配置

抽出したCSVファイルを以下の名前で保存:
```
/Users/yusuke/.openclaw/workspace/homecare/prescriptions_export.csv
```

### 3. 照合実行

```bash
cd /Users/yusuke/.openclaw/workspace/homecare
python3 transition-drugs-387-matcher.py
```

### 4. 結果確認

出力ファイル: `transition_drugs_match_result.json`

---

## カラム名の調整

MedicalCareStationのエクスポート形式に合わせて、スクリプト内のカラム名を調整:

```python
# 例: MedicalCareStationのカラム名が異なる場合
drug_name_col='薬品名'  # → '品名' や '医薬品名' に変更
```

---

## 注意事項

- 個人情報を含むため、取り扱いに注意
- 照合後のJSONファイルも機密情報として扱う
- 用途が終わったらファイルを削除または暗号化

---

## 次のステップ

1. データ抽出実施
2. 照合スクリプト実行
3. high_priority_patients（成分単位削除対象）を優先確認
4. 医師への相談リスト作成
