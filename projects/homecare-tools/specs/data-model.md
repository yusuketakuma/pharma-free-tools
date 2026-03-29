# 共通データモデル・localStorage設計

> 対象: 全ツール共通

## 1. localStorageキー一覧

| キー | 用途 | 対象ツール |
|------|------|-----------|
| `homecare-shared-patients` | 患者基本情報（共有） | 全ツール |
| `homecare-record-data` | record ツール固有データ | record |
| `homecare-report-data` | report ツール固有データ | report |
| `homecare-calendar-data` | calendar ツール固有データ | calendar（新規） |
| `homecare-contact-data` | contact ツール固有データ | contact（新規） |
| `homecare-team-data` | team ツール固有データ | team（新規） |

### 廃止予定

| キー | 状態 |
|------|------|
| `homecare-patients` | scheduler旧キー → `homecare-shared-patients` に移行 |

## 2. 患者データモデル（共有）

```typescript
interface Patient {
  id: string;              // "p_" + timestamp
  name: string;            // 氏名
  nameInitial?: string;    // イニシャル
  kana?: string;           // カナ
  age?: number;            // 年齢
  gender?: '男性' | '女性';
  careLevel?: string;      // 要介護度（要支援1〜要介護5/なし）
  insurance?: string;      // 保険種別
  address?: string;        // 住所
  phone?: string;          // 電話番号
  emergency?: string;      // 緊急連絡先
  doctor?: string;         // 主治医
  diagnoses?: string;      // 病名（カンマ区切り）
  allergies?: string;      // アレルギー・禁忌
  management?: string;     // 服薬管理状況
  createdAt: string;       // ISO 8601
  updatedAt: string;       // ISO 8601
}
```

## 3. 各ツール固有データモデル

### 3.1 record ツール

```typescript
interface RecordData {
  patientId?: string;       // 共有患者ID（null = 新規/未選択）
  patient: Patient;         // 基本情報（共有ストアと同期）
  prescriptions: Prescription[];
  visits: VisitRecord[];
  sideEffects: SideEffect[];
  nextVisit: NextVisit;
  outputFormat: 'full' | 'summary' | 'doctor' | 'handover';
}

interface Prescription {
  drugName: string;
  dosage: string;          // "1回1錠 1日1回 朝食後"
  startDate?: string;      // YYYY-MM-DD
  category?: string;       // 降圧薬/糖尿病薬/...
  note?: string;
}

interface VisitRecord {
  date: string;            // YYYY-MM-DD
  duration?: string;       // "30分"
  adherence?: string;      // 良好/概ね良好/一部問題あり/問題あり
  note?: string;
  checklist?: Checklist;
}

interface Checklist {
  prescriptionCheck: boolean;
  previousGuidance: boolean;
  prescriptionChange: boolean;
  remainingDrugs: boolean;
  adherenceCheck: boolean;
  sideEffects: boolean;
  storage: boolean;
  adherenceEval: boolean;
  newDrugGuidance: boolean;
  doctorReport: boolean;
  nextVisitSchedule: boolean;
  handover: boolean;
}

interface SideEffect {
  date?: string;
  drug?: string;
  symptom: string;
  severity?: '軽微' | '中等度' | '重度';
  action?: string;
}

interface NextVisit {
  date?: string;
  type?: string;           // 定期/臨時/退院後/紹介
  note?: string;
}
```

### 3.2 scheduler ツール

```typescript
// フェーズ2以降は homecare-shared-patients に統合
// scheduler 固有の拡張フィールドは患者データに直接追加

interface SchedulerExtension {
  patientId: string;       // 共有患者IDへの参照
  visitFreq: 'weekly' | 'biweekly' | 'monthly' | 'bimonthly';
  lastVisit: string;       // YYYY-MM-DD
  drugCount?: number;
  risks: {
    prescription: boolean;
    side: boolean;
    adherence: boolean;
    cognitive: boolean;
    fall: boolean;
    polypharmacy: boolean;
  };
  memo?: string;
}
```

> **設計方針**: scheduler 固有のフィールド（visitFreq, risks等）は
> `homecare-shared-patients` の患者オブジェクトに直接含める。
> これによりツール間のデータ整合性を担保する。

```typescript
// 統合後の患者データモデル
interface SharedPatient extends Patient {
  // scheduler 由来
  visitFreq?: 'weekly' | 'biweekly' | 'monthly' | 'bimonthly';
  lastVisit?: string;
  drugCount?: number;
  risks?: {
    prescription: boolean;
    side: boolean;
    adherence: boolean;
    cognitive: boolean;
    fall: boolean;
    polypharmacy: boolean;
  };
  schedulerMemo?: string;
  
  // record 由来
  prescriptionsSnapshot?: {
    savedAt: string;
    drugs: Prescription[];
  };
}
```

### 3.3 report ツール

```typescript
interface ReportData {
  patientId?: string;
  reportType: 'doctor' | 'record' | 'handover';
  patient: { name: string; age: string; gender: string; careLevel: string };
  visitDate: string;
  prescriptions: string;       // テキスト形式
  checkItems: {
    adherence: boolean;
    sideEffect: boolean;
    storage: boolean;
    remaining: boolean;
    interaction: boolean;
    renal: boolean;
  };
  observations: string;
  problems: string;
  suggestions: string;
  doctor: string;
  pharmacist: string;
}
```

### 3.4 calendar ツール（新規）

```typescript
interface CalendarData {
  patientId?: string;
  prescriptions: {
    drugName: string;
    dosage: string;
    timing: ('朝食後' | '昼食後' | '夕食後' | '就寝前' | '食間' | '頓用')[];
    days: number;
    note?: string;
  }[];
  periodType: 'weekly' | 'monthly';
  startDate: string;
}
```

### 3.5 contact ツール（新規）

```typescript
interface ContactData {
  patientId?: string;
  contactType: 'inquiry' | 'sideEffect' | 'adherence' | 'remaining' | 'proposal' | 'discharge';
  templateId?: string;
  pharmacyName?: string;
  pharmacistName?: string;
  customTemplates: {
    id: string;
    name: string;
    type: string;
    content: string;
  }[];
}
```

### 3.6 team ツール（新規）

```typescript
interface TeamData {
  members: {
    id: string;
    role: 'pharmacist' | 'nurse' | 'caremanager' | 'pt' | 'ot' | 'st' | 'doctor' | 'other';
    name: string;
    organization?: string;
    contact?: string;
    patientIds?: string[];    // 担当患者のID配列
  }[];
  handovers: {
    id: string;
    patientId: string;
    fromRole: string;
    toRole: string;
    date: string;
    content: string;
  }[];
}
```

## 4. データフロー図

```
┌─────────────────────────────────────────┐
│        homecare-shared-patients          │
│  （患者基本情報 + scheduler拡張）        │
├─────────────────────────────────────────┤
│  Record ──→ upsert(patient)              │
│  Scheduler ──→ upsert(patient+risks)     │
│  Report ──→ upsert(patient)              │
│  Calendar ──→ read(patient)              │
│  Contact ──→ read(patient)               │
│  Team ──→ read(patient)                  │
└─────────────────────────────────────────┘

各ツールの固有データは別キーで保存:
  homecare-record-data     (record)
  homecare-report-data     (report)
  homecare-calendar-data   (calendar)
  homecare-contact-data    (contact)
  homecare-team-data       (team)
```

## 5. 注意事項

- **localStorage容量**: ブラウザにより5〜10MB。患者数100件程度なら問題なし
- **データ損失リスク**: ブラウザのデータクリアで消失。エクスポート機能を必ず実装
- **same-origin**: 全ツールが `yusuketakuma.github.io` 配下であればデータ共有可能
- **ID衝突**: `p_` + `Date.now()` で一意性を担保（同一ミリ秒での作成は実務上発生しない）
- **移行**: scheduler の旧データは `DOMContentLoaded` で自動マイグレーション
