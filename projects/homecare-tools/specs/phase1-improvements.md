# フェーズ1: 既存改善仕様

> 対象期間: 1〜2日
> 対象ツール: record / scheduler / report

## 1. 共通デザインシステム

### 1.1 CSS変数（全ツール共通で `<style>` 先頭に定義）

```css
:root {
  --primary: #667eea;
  --primary-dark: #5a6fd6;
  --primary-light: #e8f0fe;
  --secondary: #764ba2;
  --danger: #dc3545;
  --warning: #ffc107;
  --success: #28a745;
  --text: #333;
  --text-secondary: #666;
  --text-light: #999;
  --bg-body: #f5f5f7;
  --bg-card: #fff;
  --bg-input: #fff;
  --border: #e0e0e0;
  --border-focus: #667eea;
  --radius: 12px;
  --radius-sm: 8px;
  --shadow: 0 2px 12px rgba(0,0,0,0.08);
  --shadow-hover: 0 4px 20px rgba(0,0,0,0.12);
  --font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}
```

### 1.2 共通コンポーネント

- **body**: `background: var(--bg-body)`, `padding: 16px`（recordのグラデ背景を廃止）
- **.container**: `max-width: 900px`, `background: var(--bg-card)`, `border-radius: var(--radius)`, `box-shadow: var(--shadow)`
- **h1**: `font-size: 1.4rem`, `color: var(--text)`
- **h2/.section-title**: `border-left: 4px solid var(--primary)`, `padding-left: 12px`
- **input/select/textarea**: `border: 1.5px solid var(--border)`, `border-radius: var(--radius-sm)`, `padding: 12px`, `font-size: 16px`（iOS zoom防止）
- **button.primary**: `background: linear-gradient(135deg, var(--primary), var(--secondary))`
- **button.secondary**: `background: var(--bg-body)`, `color: var(--text)`
- **button.danger**: `background: var(--danger)`
- **button.success**: `background: var(--success)`

### 1.3 モバイル最適化

- すべての `font-size: 16px` 以上（iOS Safariのauto-zoom防止）
- タッチターゲット最小 `44px × 44px`
- `input[type="date"]` に `min-height: 44px`
- ボタンの `padding: 14px` 以上
- `.row` は600px以下で1列化（現状維持）
- スクロール時のヘッダー固定は不要（短いフォームのため）
- フッターCTAのリンクは大きめのタップ領域を確保

## 2. record ツール改善

### 2.1 localStorage永続化

**保存対象**:
- 患者基本情報（全フィールド）
- 処方薬リスト（動的追加分含む）
- 訪問記録（動的追加分含む）
- 副作用記録（動的追加分含む）
- 次回訪問予定
- 出力形式の選択状態

**localStorageキー**: `homecare-record-data`

**データ構造**:
```json
{
  "patient": { "name": "", "kana": "", "age": "", ... },
  "prescriptions": [
    { "drugName": "", "dosage": "", "startDate": "", "category": "", "note": "" }
  ],
  "visits": [
    { "date": "", "duration": "", "adherence": "", "note": "" }
  ],
  "sideEffects": [
    { "date": "", "drug": "", "symptom": "", "severity": "", "action": "" }
  ],
  "nextVisit": { "date": "", "type": "", "note": "" },
  "outputFormat": "full"
}
```

**保存タイミング**: `input`/`change`/`blur` イベントで自動保存（debounce 300ms）
**復元タイミング**: `DOMContentLoaded` で全フィールド復元
**UI**: 保存インジケータ（画面右上に小さな「保存済み ✓」を1.5秒表示）

### 2.2 エクスポート機能

- **CSV**: 処方薬リストをCSV形式でダウンロード（薬品名, 用量, 開始日, 分類, メモ）
- **テキスト**: 生成済みレポートを.txtでダウンロード（既存の出力エリア内容）
- **ボタン**: 出力セクションに「📥 CSVダウンロード」「📥 テキストダウンロード」を追加

### 2.3 モバイル改善

- 処方薬/訪問記録/副作用の各アイテムの削除ボタンを `44px` 以上に拡大
- `textarea` に `min-height: 80px` を設定
- 出力エリアにスクロール可能な最大高さ `400px` を設定

## 3. scheduler ツール改善

### 3.1 localStorage キー統一

**現状**: `homecare-patients` → **変更**: `homecare-shared-patients`（フェーズ2で他ツールと共有するため）
**移行**: `DOMContentLoaded` で旧キーから新キーへマイグレーション

### 3.2 エクスポート機能追加

- **CSV**: 患者リストをCSV形式でダウンロード（患者名, 年齢, 訪問頻度, 前回訪問, 優先度, 要介護度, 処方薬数, リスク因子, メモ）
- 既存のJSONエクスポートは維持

### 3.3 UI統一

- body背景を `var(--bg-body)` に変更（現状のグラデ背景を廃止）
- ボタンスタイルを共通デザインシステムに合わせる
- tab の active 状態の色を `var(--primary)` に統一

## 4. report ツール改善

### 4.1 localStorage永続化

**localStorageキー**: `homecare-report-data`

**データ構造**:
```json
{
  "reportType": "doctor",
  "patient": { "name": "", "age": "", "gender": "", "careLevel": "" },
  "visitDate": "",
  "prescriptions": "",
  "checkItems": { "adherence": true, "sideEffect": true, "storage": true, "remaining": true, "interaction": true, "renal": true },
  "observations": "",
  "problems": "",
  "suggestions": "",
  "doctor": "",
  "pharmacist": ""
}
```

**保存タイミング**: recordと同様に自動保存
**復元タイミング**: `DOMContentLoaded` で全フィールド復元

### 4.2 エクスポート機能

- **テキスト**: 生成済み報告書を.txtでダウンロード
- ボタンを「📋 コピー」の横に「📥 テキスト保存」を追加

### 4.3 その他

- GAタグ（G-XXXXXXXXXX）を削除（無効なトラッキング）
- 収益化CTAセクションの整理（リンク先が `#` のものを一時非表示にするか、ポータルサイトへ誘導）

## 5. 実装順序（推奨）

1. 共通CSS変数定義 → 3ツールに適用
2. record: localStorage永続化実装（最優先）
3. record: エクスポート機能追加
4. report: localStorage永続化実装
5. report: エクスポート機能追加
6. scheduler: localStorageキー統一 + UI統一
7. scheduler: CSVエクスポート追加
8. 全ツール: モバイル最適化最終調整
9. 動作確認・GitHub push
