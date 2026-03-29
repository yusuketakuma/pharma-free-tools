# 訪問薬剤管理ツール群 — 開発計画

> 作成日: 2026-03-28
> 対象: pharma-homecare-record / pharma-homecare-scheduler / pharma-homecare-report + 新規3ツール

## 1. 現状分析サマリ

### 既存ツールの技術・機能概要

| ツール | localStorage | エクスポート | UI方式 | モバイル対応 |
|--------|:---:|:---:|--------|:---:|
| record | ✗ | コピー/印刷のみ | 縦スクロールcard | grid有り（600px以下で1列化） |
| scheduler | ○（患者データ） | JSON エクス/インポート | tab UI | grid有り |
| report | ✗ | コピーのみ | type-selector | flex有り（600px以下で縦） |

### 課題

1. **record**: localStorageなし → ブラウザ閉じると入力消失。最も致命的
2. **report**: localStorageなし。GAタグがダミー（G-XXXXXXXXXX）
3. **scheduler**: 唯一localStorageありだが、キーが `homecare-patients` で他ツールと不統一
4. **3ツール間で患者データが独立** → 同じ患者を3回入力
5. **デザイン不統一**: record=紫グラデ背景+白card、scheduler=紫グラデ背景+白コンテナ、report=グレー背景+白セクション
6. **CTAセクション**: 各ツールにNotion/AIプロンプトの販売CTAが貼られているがリンク先が `#`（未実装）

## 2. 開発フェーズ

### フェーズ1: 既存改善（1〜2日）
- localStorage永続化（record, report）
- データエクスポート（CSV/テキスト）
- モバイル最適化（タッチ操作改善、スクロール最適化）
- UI統一デザインシステム適用

### フェーズ2: 統合強化（2〜4日）
- 共有患者データストア設計・実装
- 訪問前チェックリスト機能
- 処方変更アラート機能

### フェーズ3: 新規開発（4〜7日）
- 服薬カレンダー生成ツール（新規リポジトリ）
- 医師連絡文面生成ツール（新規リポジトリ）
- 在宅ケアチーム情報共有ツール（新規リポジトリ）

## 3. 制約

- 単一HTMLファイル（サーバー不要）
- vanilla JS + CSS（フレームワーク不使用）
- GitHub Pages ホスト
- 日本語UI
- スマホファースト
- データはブラウザ内のみ保存

## 4. 成果物一覧

| ファイル | 内容 |
|----------|------|
| `development-plan.md` | 本ファイル |
| `specs/phase1-improvements.md` | フェーズ1詳細仕様 |
| `specs/phase2-integration.md` | フェーズ2詳細仕様 |
| `specs/phase3-new-tools.md` | フェーズ3詳細仕様 |
| `specs/data-model.md` | 共通データモデル・localStorage設計 |

## 5. 優先度判断

**最優先**: recordのlocalStorage永続化（現状使い物にならないため）
**次優先**: schedulerの患者データをrecord/reportと共有
**推奨**: フェーズ1完了後にGitHubへpushし、実務で使いながら不具合を洗い出してからフェーズ2へ進む
