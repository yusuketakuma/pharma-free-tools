# フェーズ2: 統合強化仕様

> 対象期間: 2〜4日
> 前提: フェーズ1完了済み

## 1. 共有患者データストア

### 1.1 設計方針

- **localStorage の same-origin 制約**を利用したデータ共有
- 3ツールはすべて `yusuketakuma.github.io` 配下のため、同じオリジンで localStorage を共有可能
- 専用の共有キー `homecare-shared-patients` に患者の基本情報を保存
- 各ツール固有のデータは別キーで管理

### 1.2 共有データ構造

**localStorageキー**: `homecare-shared-patients`

```json
[
  {
    "id": "p_1711000000000",
    "name": "山田 太郎",
    "nameInitial": "YT",
    "kana": "ヤマダ タロウ",
    "age": 78,
    "gender": "男性",
    "careLevel": "要介護3",
    "insurance": "後期高齢者",
    "address": "〇〇県〇〇市...",
    "phone": "090-1234-5678",
    "emergency": "03-1234-5678",
    "doctor": "〇〇クリニック 〇〇先生",
    "diagnoses": "高血圧、糖尿病",
    "allergies": "ペニシリン系",
    "management": "一部介助",
    "createdAt": "2026-03-28T...",
    "updatedAt": "2026-03-28T..."
  }
]
```

### 1.3 各ツールの読み書き

#### record ツール
- **読み**: ページロード時に共有ストアから患者一覧を取得し、セレクタに表示
- **書き**: 患者基本情報を保存時、共有ストアに upsert（名前+電話で重複判定）
- **UI**: ページ上部に「患者を選択」ドロップダウンを追加（「新規患者」も選択肢に含む）

#### scheduler ツール
- **読み**: 既存の患者管理データを共有ストアに統合
- **書き**: 患者登録時に共有ストアにも基本情報を保存
- **移行**: 既存の `homecare-patients` データを `homecare-shared-patients` 形式に変換

#### report ツール
- **読み**: ページロード時に共有ストアから患者一覧を取得し、セレクタに表示
- **書き**: 生成時に患者基本情報を共有ストアに upsert
- **UI**: ページ上部に「患者を選択」ドロップダウンを追加

### 1.4 共有ユーティリティ（各HTMLにインライン埋め込み）

```javascript
// 共有患者データアクセス
const HomecareDB = {
  KEY: 'homecare-shared-patients',
  
  getAll() {
    return JSON.parse(localStorage.getItem(this.KEY) || '[]');
  },
  
  save(patients) {
    localStorage.setItem(this.KEY, JSON.stringify(patients));
  },
  
  getById(id) {
    return this.getAll().find(p => p.id === id);
  },
  
  upsert(patient) {
    let patients = this.getAll();
    const idx = patients.findIndex(p => p.id === patient.id);
    if (idx >= 0) {
      patients[idx] = { ...patients[idx], ...patient, updatedAt: new Date().toISOString() };
    } else {
      patient.id = patient.id || 'p_' + Date.now();
      patient.createdAt = patient.createdAt || new Date().toISOString();
      patient.updatedAt = new Date().toISOString();
      patients.push(patient);
    }
    this.save(patients);
    return patient;
  },
  
  delete(id) {
    this.save(this.getAll().filter(p => p.id !== id));
  },
  
  populateSelect(selectEl, placeholder = '患者を選択') {
    selectEl.innerHTML = `<option value="">${placeholder}</option>`;
    this.getAll().forEach(p => {
      const opt = document.createElement('option');
      opt.value = p.id;
      opt.textContent = `${p.name}${p.age ? `（${p.age}歳）` : ''}`;
      selectEl.appendChild(opt);
    });
  }
};
```

## 2. 訪問前チェックリスト機能

### 2.1 配置先

- **record ツール**の訪問記録セクションに追加
- チェックリストは患者ごとに保存

### 2.2 チェック項目

訪問薬剤管理指導の実務プロセスに基づく標準項目:

```
□ 患者カルテ・処方箋の確認
□ 前回訪問時の指導内容の確認
□ 処方変更の有無（前回との差分チェック）
□ 残薬確認（処方日数 vs 経過日数）
□ 服薬状況の確認（自己申告＋残薬数）
□ 副作用の有無
□ 保管状況の確認（温度・湿度・整理）
□ アドヒアランス評価
□ 新規薬剤の服薬指導準備
□ 医師への報告事項の整理
□ 次回訪問日の調整
□ 引継ぎ事項の確認
```

### 2.3 データ構造

各訪問記録に `checklist` フィールドを追加:

```json
{
  "checklist": {
    "prescriptionCheck": true,
    "previousGuidance": true,
    "prescriptionChange": false,
    "remainingDrugs": true,
    "adherenceCheck": true,
    "sideEffects": true,
    "storage": true,
    "adherenceEval": true,
    "newDrugGuidance": false,
    "doctorReport": false,
    "nextVisitSchedule": false,
    "handover": false
  },
  "checklistNote": "前回の残薬が2日分多かったため確認要"
}
```

### 2.4 UI

- アクセサビリティに配慮したチェックボックスリスト
- チェック済み項目は `var(--success)` のチェックマークで表示
- 未チェック項目は `var(--warning)` の背景色
- 「全てチェック」ボタンと「リセット」ボタン

## 3. 処方変更アラート機能

### 3.1 配置先

- **record ツール**の処方薬リストセクションに追加
- **report ツール**の処方内容セクションに追加

### 3.2 機能仕様

#### 処方変更検出
- 患者選択時に、前回保存時の処方薬リストと現在の処方薬リストを比較
- 比較ロジック: 薬品名でマッチングし、用量・用法の変更を検出
- 新規追加・削除も検出

#### アラート表示
```
⚠️ 処方変更を検出しました
  + 追加: メトホルミン 500mg
  - 削除: ビグアナイド 250mg
  ~ 変更: アムロジピン 5mg → 10mg
```

#### アラート時の追加確認項目
- 処方変更の理由確認フィールド（textarea）
- 相互作用再チェックのリマインダー
- 医師への報告要否チェックボックス

### 3.3 データ構造

患者データに処方薬のスナップショットを保存:

```json
{
  "prescriptions": [...],
  "prescriptionsSnapshot": {
    "savedAt": "2026-03-14T...",
    "drugs": [
      { "name": "アムロジピンOD錠5mg", "dosage": "1回1錠 1日1回 朝食後" }
    ]
  }
}
```

## 4. 実装順序（推奨）

1. HomecareDB 共有ユーティリティを作成
2. scheduler: 共有ストアへの移行
3. record: 患者セレクタ追加 + HomecareDB 連携
4. report: 患者セレクタ追加 + HomecareDB 連携
5. record: チェックリスト機能追加
6. record: 処方変更アラート機能追加
7. report: 処方変更アラート機能追加
8. 動作確認・GitHub push
