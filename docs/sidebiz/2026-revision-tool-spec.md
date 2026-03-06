# 施策M: 機能仕様書（詳細）

## 1. 重症患者割合モニタリング機能

### 1.1 概要
訪問患者の重症患者割合を自動計算・可視化し、20%要件の達成状況をモニタリング

### 1.2 重症患者の定義（2026年改定）
以下のいずれかに該当する患者を「重症患者」と判定:
1. 在宅時医学総合管理料の対象患者
2. 訪問看護ステーションと連携している患者
3. がん末期・終末期の患者
4. 要介護度4-5の患者
5. 中心静脈栄養・在宅酸素療法等の医療機器使用患者

### 1.3 データ入力方法
- **手動入力**: 患者ごとに重症度フラグを設定
- **CSVインポート**: 既存システムからの患者データ移行
- **自動判定（将来）**: お薬手帳データからの推定

### 1.4 UI構成

#### ダッシュボード画面
```
┌─────────────────────────────────────────┐
│ 重症患者割合モニタリング                  │
├─────────────────────────────────────────┤
│ 現在の割合: ████████░░ 25.3% (38/150)   │
│ 要件: 20%以上                            │
│ ステータス: ✅ 達成中                     │
├─────────────────────────────────────────┤
│ [患者一覧] [推移グラフ] [アラート設定]    │
└─────────────────────────────────────────┘
```

#### アラート機能
- 割合が22%を下回った場合: 警告表示
- 割合が20%を下回った場合: 緊急アラート
- 週次レポート: メール/通知

### 1.5 計算ロジック
```
重症患者割合 = (重症患者数 / 総訪問患者数) × 100

※ 算定月の月初時点での患者数で計算
※ 月途中の増減は翌月反映
```

---

## 2. 訪問診療薬剤師同時指導料 算定支援

### 2.1 概要
新設の「訪問診療薬剤師同時指導料」（300点/6ヶ月）の算定管理

### 2.2 算定要件
1. 医師と薬剤師が同時に患家を訪問
2. 服薬指導を実施
3. 6ヶ月に1回まで算定可能
4. 同一患者に対して継続的な管理

### 2.3 UI構成

#### 患者ごとの算定カレンダー
```
┌─────────────────────────────────────────┐
│ 山田太郎（78歳）- 同時指導料             │
├─────────────────────────────────────────┤
│ 前回算定: 2025年12月15日                 │
│ 次回算定可能: 2026年6月15日以降          │
│                                         │
│ [カレンダー表示]                         │
│  3月    4月    5月    6月               │
│  ░░░░   ░░░░   ░░░░   ██████            │
│  不可   不可   不可   算定可能           │
│                                         │
│ [同時訪問スケジュール登録]               │
└─────────────────────────────────────────┘
```

#### 一覧画面
| 患者名 | 前回算定 | 次回可能 | ステータス |
|--------|----------|----------|------------|
| 山田太郎 | 2025/12/15 | 2026/06/15 | ⏳ 待機中 |
| 佐藤花子 | 2025/09/20 | 2026/03/20 | ✅ 算定可能 |
| 鈴木一郎 | 未算定 | 即時 | 🆕 新規 |

### 2.4 通知機能
- 算定可能日の1ヶ月前にリマインダー
- 医師との同時訪問調整リマインダー
- 月次の算定機会一覧

---

## 3. データモデル

### 3.1 患者テーブル (patients)
```sql
CREATE TABLE patients (
  id UUID PRIMARY KEY,
  pharmacy_id UUID NOT NULL,
  name VARCHAR(100) NOT NULL,
  birth_date DATE,
  is_severe BOOLEAN DEFAULT false,
  severe_criteria TEXT[], -- ['要介護5', '在宅酸素']
  visit_count INTEGER DEFAULT 0,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### 3.2 同時指導料テーブル (simultaneous_visits)
```sql
CREATE TABLE simultaneous_visits (
  id UUID PRIMARY KEY,
  patient_id UUID NOT NULL,
  visit_date DATE NOT NULL,
  doctor_name VARCHAR(100),
  pharmacist_name VARCHAR(100),
  notes TEXT,
  billed_at DATE,
  created_at TIMESTAMP
);
```

### 3.3 月次サマリーテーブル (monthly_summaries)
```sql
CREATE TABLE monthly_summaries (
  id UUID PRIMARY KEY,
  pharmacy_id UUID NOT NULL,
  year_month VARCHAR(7) NOT NULL,
  total_patients INTEGER,
  severe_patients INTEGER,
  severe_ratio DECIMAL(5,2),
  simultaneous_visit_count INTEGER,
  created_at TIMESTAMP
);
```

---

## 4. APIエンドポイント設計

### 4.1 患者管理
- `GET /api/patients` - 患者一覧取得
- `POST /api/patients` - 患者登録
- `PUT /api/patients/:id` - 患者情報更新
- `PATCH /api/patients/:id/severe` - 重症フラグ更新

### 4.2 モニタリング
- `GET /api/monitoring/severe-ratio` - 重症割合取得
- `GET /api/monitoring/trend` - 月次推移取得

### 4.3 同時指導料
- `GET /api/simultaneous-visits` - 同時訪問一覧
- `POST /api/simultaneous-visits` - 同時訪問登録
- `GET /api/simultaneous-visits/eligible` - 算定可能患者一覧

---

## 5. 開発優先順位

### MVP（Phase 2）
1. 重症患者割合モニタリング（基本機能）
2. 同時指導料カレンダー（表示のみ）
3. 患者CRUD

### Phase 3
1. アラート機能
2. CSVインポート
3. レポート出力

### 将来機能
1. 医師スケジュール連携
2. 電子カルテ連携
3. 自動重症判定

---

## ステータス
- **作成日**: 2026-03-06
- **状態**: 仕様策定完了
- **次のアクション**: UIワイヤーフレーム作成
