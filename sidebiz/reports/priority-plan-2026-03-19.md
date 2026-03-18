# 翌日施策 優先順位整理

**作成日時**: 2026-03-18 23:15 JST
**対象日**: 2026-03-19（木）

---

## 優先順位

### 1. GA4 Batch4（残り25ファイル → 65%→100%目標）⭐最重要

**理由**: 計測なくして改善なし。全ファイルGA4カバレッジ100%達成が最優先。
**対象**: GA4未導入の25ファイル（全72ファイル中47ファイルは導入済み）
**作業見積**: バッチスクリプトで一括処理可能。2-3サイクルで完了見込み。
**注意**: Measurement ID は引き続き `G-XXXXXXXXXX` プレースホルダー。実IDが来たら一括置換で対応。

### 2. 残り6チェックリスト相互リンク追加（Batch3）

**理由**: チェックリスト系は全17ファイル中11ファイル完了済み。残り6ファイルを追加すればチェックリスト系100%完了。
**対象ファイル**:
1. `pharmacy-5s-checklist.html`
2. `pharmacy-accessibility-checklist.html`
3. `pharmacy-emergency-response-checklist.html`
4. `pharmacy-quality-management-checklist.html`
5. `pharmacy-risk-management-checklist.html`
6. `pharmacy-safety-health-management-checklist.html`

**作業見積**: Batch1/Batch2と同フォーマット。1サイクルで完了見込み。

### 3. ai-prompts-lp.html 内部リンク追加

**理由**: 全ツールのCTA先であるLPからのアウトバウンドリンクが0件。SEO評価にマイナス。主要ツール3-4件へのリンクで改善。
**候補リンク先**:
- `pharmacy-cashflow-diagnosis.html`（収益改善系）
- `doac-dosing.html`（臨床系人気ツール）
- `polypharmacy-assessment.html`（多剤併用系）
- `index.html`（ポータル）

**作業見積**: 手動でLP末尾に「関連ツール」セクション追加。1サイクル内で完了。

### 4. 診断ツール系アウトバウンド0ファイル対応（11ファイル）

**理由**: 0リンクファイル28件のうち最大ブロック。ただしチェックリストほど定型化されていないため個別マッピングが必要。
**対象**: crosslink-audit-update レポート参照（12ファイル中 pharmacy-talent-development.html 除く11ファイル）
**作業見積**: 2-3サイクル。関連度マッピングを先に作成し、バッチ処理。

---

## 保留事項（翌日解消不可）

| 項目 | 状態 | ブロッカー |
|---|---|---|
| GA4 Measurement ID | `G-XXXXXXXXXX` | ゆうすけの実ID取得待ち |
| 販売プラットフォーム開設 | 未着手 | ゆうすけのアカウント開設待ち |
| pharmacy-talent-development.html 削除 | 承認待ち | ゆうすけ承認待ち |
| Brave Search API | 月次上限到達（402） | 4月初旬リセット待ち |

---

## 1日の目標（達成可能ライン）

- GA4カバレッジ: **65% → 100%**（Batch4完了）
- チェックリスト相互リンク: **11/17 → 17/17**（Batch3完了）
- ai-prompts-lp.html: **0リンク → 4リンク**
- 診断ツール系: **0/11 → 5-11**（進捗次第）

**全達成時のクロスリンク率見込み**: 61.1% → **約80-85%**
