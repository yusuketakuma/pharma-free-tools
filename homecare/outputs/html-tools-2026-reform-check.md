# 在宅関連HTMLツール 2026年改定対応チェック結果

**所要時間**: 約15分
**作成日**: 2026-03-18 22:20
**担当**: 薬剤師エージェント（homecare-30m-assign）

---

## 1. チェック対象ファイル一覧

| ファイル名 | 用途 | 在宅関連 |
|-----------|------|---------|
| doac-dosing.html | DOAC用量チェック | ❌ なし |
| antibiotic-stewardship.html | 抗菌薬適正使用 | ❌ なし |
| dispensing-error-prevention-checklist.html | 調剤過誤防止 | ❌ なし（在宅医療支援への言及のみ） |
| designated-abuse-prevention-drugs-checklist.html | 指定濫用防止 | ❌ なし（2026年5月施行対応済み） |
| dementia-elderly-medication-support-checklist.html | 認知症高齢者服薬支援 | ⚠️ 在宅医療への言及あり（点数記載なし） |
| **homecare-revenue-simulator.html** | 在宅医療収益シミュレーター | ✅ あり |
| **severe-patient-ratio-checksheet.html** | 重症患者割合チェック | ✅ あり |
| **homecare-joint-visit-checklist.html** | 同時指導チェックリスト | ✅ あり |
| homecare-efficiency-diagnosis.html | 訪問薬剤管理効率化 | ⚠️ 在宅関連だが点数記載なし |
| pharmacy-revision-2026.html | 2026改定診断 | ⚠️ 地域支援・供給体制加算（在宅特化ではない） |

---

## 2. 点数・算定要件の整合性チェック

### ✅ 正しい記載

| ファイル | 項目 | 記載点数 | 正確点数 | 判定 |
|---------|------|---------|---------|------|
| homecare-revenue-simulator.html | 在宅薬学総合体制加算1 | 30点 | 30点 | ✅ |
| homecare-revenue-simulator.html | 訪問薬剤管理指導料 | 425点 | 425点 | ✅ |
| homecare-revenue-simulator.html | 医師同時訪問指導料 | 300点 | 300点 | ✅ |
| homecare-joint-visit-checklist.html | 訪問診療薬剤師同時指導料 | 300点 | 300点 | ✅ |
| severe-patient-ratio-checksheet.html | 重症患者割合要件 | 20% | 20% | ✅ |

### ❌ 不整合・誤記載

| ファイル | 項目 | 記載点数 | 正確点数 | 修正優先度 |
|---------|------|---------|---------|-----------|
| **homecare-revenue-simulator.html** | 在宅薬学総合体制加算2 | **45点** | **A=100点 / B=50点** | 【高】 |

---

## 3. 不整合詳細と修正内容

### 【高】homecare-revenue-simulator.html - 加算2点数誤り

**現状**（L566）:
```javascript
const kasan2Point = 45; // 在宅薬学総合体制加算2: 45点
```

**修正内容**:
加算2はA/B区分に細分化されたため、単一の点数ではなく条件分岐が必要。

```javascript
// 修正案
const kasan2PointA = 100; // 在宅薬学総合体制加算2（A）: 100点
const kasan2PointB = 50;  // 在宅薬学総合体制加算2（B）: 50点
```

**UI修正**（L417）:
```html
<!-- 現状 -->
<option value="2">加算2（45点）</option>

<!-- 修正案 -->
<option value="2A">加算2（A・100点）</option>
<option value="2B">加算2（B・50点）</option>
```

**参照元**: `outputs/zaitaku-kaisan-hayami-2026-06.md`

---

## 4. 2026年4月改定の在宅薬学総合体制加算 変更点まとめ

| 加算区分 | 旧点数（〜2026.5） | 新点数（2026.6〜） | 主な要件変更 |
|----------|-------------------|-------------------|------------|
| **加算1** | 15点 | **30点** ↑ | 訪問実績要件: 24回/年 → 48回/年 |
| **加算2（A・個人宅・緊急対応）** | 50点 | **100点** ↑ | 個人宅等240回/年 + 全体2割超 OR 480回/年 + 全体1割超 |
| **加算2（B・施設在宅）** | 50点 | **50点** ↔ | 無菌製剤処理設備基準廃止 |

---

## 5. 次アクション

| 優先度 | タスク | 所要時間 | 担当 |
|--------|--------|----------|------|
| 【高】 | homecare-revenue-simulator.html 加算2点数修正（45→A=100/B=50） | 15分 | sidebiz |
| 【中】 | 修正後の動作確認・git commit | 5分 | sidebiz |
| 【低】 | 他HTMLツールの改定対応状況の定期チェック（月次） | 10分 | homecare |

---

## 6. チェック方法（再現手順）

```bash
# 在宅関連HTMLの点数記載確認
grep -n "点" homecare-revenue-simulator.html severe-patient-ratio-checksheet.html homecare-joint-visit-checklist.html

# 加算2点数の確認
grep -n "kasan2Point\|加算2" homecare-revenue-simulator.html

# 正確な点数の参照
cat homecare/outputs/zaitaku-kaisan-hayami-2026-06.md | grep -A5 "加算2"
```

---

## 7. 改善学習ポイント

1. **点数変更の即時反映**: 改定情報取得後、関連HTMLツールの点数記載を即座に更新するフローが必要
2. **単一値→条件分岐への対応**: 加算2のように区分が細分化される場合、UIの選択肢追加と条件分岐ロジックが必要
3. **正確な参照元の明記**: HTMLツールのコメントに「参照元: zaitaku-kaisan-hayami-2026-06.md」等を記載し、更新時の確認を容易化

---

**報告ログ**: 本チェック結果は trainer-2h-regular-report に集約
