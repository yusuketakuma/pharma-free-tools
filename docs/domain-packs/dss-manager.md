# dss-manager Domain Pack - 初版

最終更新: 2026-03-29
対象ドメイン: DeadStockSolution (薬局業務管理システム)

---

## Domain Overview

### 何を最適化する領域か
- 薬局の在庫管理・発注業務のデジタル化
- 処方箋管理と患者情報の統合管理
- 薬剤師の業務効率化とコンプライアンス管理

### 主要 KPI / 成功条件
- 在庫精度: 99%以上
- 処方箋処理時間: 70%削減
- エラー率: 0.1%以下
- スタッフ満足度: 4.0/5.0以上

### やってはいけないこと
- 現場の既存ワークフローを大幅に変更すること
- 隠れコスト（手動データ入力など）を生じさせること
- 個人情報のセキュリティを損なう設計

---

## Repository / Environment Map

### repo 一覧
- `DeadStockSolution/` - メインリポジトリ
- `DeadStockSolution-preview-bot/` - プレビューボット
- `repos/DeadStockSolution-preview-bot/` - プレビューボットのコピー

### 主要ディレクトリ
```
DeadStockSolution/
├── src/           # ソースコード
├── tests/         # テストコード
├── docs/          # ドキュメント
├── scripts/       # 実行スクリプト
├── data/          # サンプルデータ
└── dist/          # ビルド成果物
```

### 起動/テスト/ビルド方法

#### 開発サーバ起動
```bash
cd DeadStockSolution/
npm run dev
# または
npm start
```

#### 単体テスト
```bash
npm run test
npm run test:watch
```

#### 統合テスト
```bash
npm run test:integration
```

#### lint/typecheck/build
```bash
npm run lint
npm run type-check
npm run build
```

#### 主要ユースケースのsmoke test
```bash
npm run test:e2e -- --spec smoke.spec.ts
npm run test:e2e -- --spec pharmacy-workflow.spec.ts
```

#### データ整合性確認コマンド
```bash
npm run db:check-consistency
npm run db:backup
npm run db:restore -- latest
```

### 環境変数の要点
```bash
NODE_ENV=development
API_BASE_URL=http://localhost:3000
DATABASE_URL=postgres://user:pass@localhost:5432/pharmacy
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-key
```

---

## Verification Commands

### Normal Path (通常検証)
```bash
# 完全な検証フロー
npm run lint && npm run type-check && npm run build && npm run test

# 主要機能の動作確認
npm run test:e2e -- --spec main-workflow.spec.ts
```

### Fast Path (高速検証)
```bash
# コード品質のみ
npm run lint && npm run type-check

# ビルドと主要テスト
npm run build && npm run test:unit
```

### Pre-merge Minimum (マージ前最低限)
```bash
# CI/CDパイプラインエミュレーション
npm run lint && npm run type-check && npm run test:integration
```

### Release Gate (リリース前検証)
```bash
# 本番デプロイ前の最終確認
npm run test:e2e -- --spec production-critical.spec.ts
npm run db:migration:test
npm run security:audit
```

---

## Known Failures

### 1. 認証フローの不安定
**症状:**
- ログイン成功後にリダイレクトが失敗する
- JWTトークンの有効期限切れによる403エラー
- セッションタイムアウト時の挙動が不安定

**原因候補:**
- frontend/backendのタイム同期不良
- localStorageのクリーンアップ漏れ
- CORS設定の問題

**初動確認:**
```bash
# ブラウザ開発者ツールでネットワークタブを確認
# コンソールエラーをチェック
localStorage.clear()
```

**再現条件:**
- 10分間アイドル後に操作
- 複数タブで同時使用
- キャッシュクリア後の初回アクセス

**回避策:**
```bash
# セッション再確保スクリプト
npm run session:refresh
```

### 2. 外部依存の不安定ポイント (決済API)
**症状:**
- 決済処理中にタイムアウト
- ステータス更新の遅延
- キャンセル処理の不整合

**原因候補:**
- 外部APIのレートリミット
- ネットワーク遅延
- データベーストランザクションの競合

**初動確認:**
```bash
# 外部APIのステータス確認
curl -X GET https://api.payment-service.com/health
# ログファイルの確認
tail -f logs/payment-service.log
```

**再現条件:**
- 決済が同時に複数件発生
- ネットワークの不安定時
- 大規模データ処理中

**回避策:**
```bash
# 決済リトライスクリプト
npm run payment:retry -- --transaction-id TX12345
```

### 3. Seed/Migration/Env Mismatch
**症状:**
- 開発環境と本番環境でデータ構造が異なる
- マイグレーションファイルの競合
- 環境変数の不一致

**原因候補:**
- マイグレーションファイルの順序誤り
- 環境間の設定同期漏れ
- データシードの依存関係

**初動確認:**
```bash
# データベーススキーマ比較
npm run db:diff --env dev --env prod
# マイグレーション状態確認
npm run db:migration:status
```

**再現条件:**
- 新しいマイグレーションを適用した後
- 環境切り替え時
- チームメンバー間の作業同期時

**回避策:**
```bash
# マイグレーションのリセットと再適用
npm run db:migrate:fresh
npm run db:seed
```

### 4. Stale Cache/Build Artifact 起因の不具合
**症状:**
- 古いキャッシュによる表示異常
- ビルドアーティファクトの不整合
- ソースコード更新後の反映遅延

**原因候補:**
- 開発サーバのホットリロード失敗
- CDNキャッシュの未更新
- Dockerコンテナのキャッシュ

**初動確認:**
```bash
# キャッシュ状態の確認
find . -name "*.cache" -ls
npm cache verify
```

**再現条件:**
- ソースコードの大幅変更後
- 依存パッケージの更新後
- 環境変数の変更後

**回避策:**
```bash
# キャッシュクリア
rm -rf node_modules/.cache
npm run clean:build
docker system prune -a
```

---

## Known Fix Patterns

### 1. データ欠損時の初動
**典型修正:**
```bash
# データ欠損箇所の特定と修復
npm run db:repair -- --table medications --column stock_quantity
npm run data:reindex -- --type stock
```

**修正時の副作用:**
- 在庫履歴の再計算が必要
- レポートデータの一時的な不整合
- APIレスポンス時間の増加

**追加で見るべき関連箇所:**
- 在庫管理API (`/api/stock/*`)
- レポート生成機能 (`/api/reports/*`)
- アラート通知システム (`/api/alerts/*`)

### 2. Migration 不整合時の回復手順
**典型修正:**
```bash
# マイグレーションのロールバックと再適用
npm run db:migrate:down -- --step 1
npm run db:migrate:up -- --step 1
npm run db:seed
```

**修正時の副作用:**
- データの一時的な消失（ロールバック時）
- 依存機能の一時停止
- ユーザーセッションの切断

**追加で見るべき関連箇所:**
- データベースバックアップシステム
- ユーザーセッション管理
- 外部連携APIの同期状態

### 3. 環境差分による再現不能バグ
**典型修正:**
```bash
# 環境設定の同期と再起動
npm run env:sync
npm run restart:all
```

**修正時の副作用:**
- サービスの再起動による一時停止
- キャッシュクリアによる性能変動
- 外部依存サービスの再接続

**追加で見るべき関連箇所:**
- 環境設定ファイル (`config/*`)
- サービス起動スクリプト (`scripts/*`)
- モニタリング設定 (`monitoring/*`)

### 4. UI 崩れ / API Mismatch / 型ずれの定番修正
**典型修正:**
```bash
# TypeScript型の修正と同期
npm run type:check
npm run type:generate
npm run build

# APIスキーマの同期
npm run api:schema:sync
npm run test:integration
```

**修正時の副作用:**
- コンパイル時間の増加
- テストケースの追加が必要
- データシリアライズの調整

**追加で見るべき関連箇所:**
- TypeScript設定ファイル (`tsconfig.json`)
- APIスキーマ定義 (`schema/*`)
- コンポーネントテスト (`tests/components/*`)

---

## Comparison Axes

### 1. 正しさ > 速度
**優先軸:**
- 正確性: データの一貫性、計算精度、ビジネスロジックの正確性
- 速度: 処理速度、UI応答性、APIレスポンスタイム

**判断基準:**
- 薬品の在庫数量、金額計算などは「正しさ」を最優先
- UIの描画速度、検索結果表示などは「速度」を許容範囲内で調整

### 2. 局所修正 vs 再発防止
**優先軸:**
- 局所修正: 即座な問題解決、影響範囲の限定
- 再発防止: 根本原因の解決、類似問題の予防

**判断基準:**
- 緊急度が高い場合は「局所修正」で対応
- 再発頻度が高い場合は「再発防止」を優先

### 3. 既存運用への影響
**優先軸:**
- 既存運用: 現場のワークフロー、慣習、習慣
- 新機能: 付加価値、効率化、改善効果

**判断基準:**
- 変更コストが高い場合は段階的導入を検討
- 現場の抵抗が予想される場合は利便性を可視化

### 4. 追加コストに対する恒久性
**優先軸:**
- 追加コスト: 開発工数、保守コスト、学習コスト
- 恒久性: 利用期間、スケーラビリティ、汎用性

**判断基準:**
- 一時的な機能は追加コストを最小化
- 長期的に利用する機能は恒久性を確保

---

## Procedure Templates

### 1. バグ調査テンプレ
```markdown
# バグ調査レポート

## 基本情報
- タイトル: [簡潔なタイトル]
- 発見日時: [YYYY-MM-DD HH:MM]
- 再現確率: [80-100% / 50-80% / 50%未満]
- 重大度: [Critical/High/Medium/Low]

## 再現手順
1. [ステップ1]
2. [ステップ2]
3. [ステップ3]

## 期待される挙動
[正しい挙動の説明]

## 実際の挙動
[実際に観測された挙動]

## 環境情報
- ブラウザ: [バージョン]
- デバイス: [種類]
- OS: [バージョン]
- ネットワーク: [状況]

## 進捗状況
- [ ] 原因特定済み
- [ ] 修正案作成中
- [ ] テスト実施中
- [ ] リリース待ち

## 関連ファイル
- [ファイルパス]
- [関連 issue 番号]
```

### 2. 修正提案テンプレ
```markdown
# 修正提案書

## 問題の定義
- 問題ID: [ID]
- 影響範囲: [範囲]
- リスク評価: [高/中/低]

## 修正の目的
[修正で達成したい目標]

## 修正内容
### 変更点1
[具体的な変更内容]

### 変更点2
[具体的な変更内容]

### 変更点3
[具体的な変更内容]

## 影響分析
### 肯定的影響
- [利点1]
- [利点2]

### 消極的影響
- [リスク1]
- [リスク2]

## テスト計画
- [ ] 単体テスト
- [ ] 統合テスト
- [ ] E2Eテスト
- [ ] ストレステスト

## 実行計画
- 開始日: [日付]
- 予想工数: [時間数]
- リリース予定: [日付]

## 申請者
- 名前: [名前]
- 役割: [役割]
- 承認者: [承認者]
```

### 3. Release Readiness チェック
```markdown
# リリース準備状況

## 機能チェック
- [ ] 新機能開発完了
- [ ] 既存機能のバグ修正完了
- [ ] パフォーマンステスト完了
- [ ] セキュリティテスト完了

## ドキュメント
- [ ] ユーザードキュメント更新
- [ ] 開発者ドキュメント更新
- [ ] 変更点ドキュメント作成
- [ ] トレーニング資料準備

## テスト
- [ ] 単体テスト 100%通過
- [ ] 統合テスト 100%通過
- [ ] E2Eテスト主要フロー通過
- [ ] ロードテスト完了

## デプロイ準備
- [ ] データベースマイグレーション準備
- [ ] バックアップ計画策定
- [ ] ロールバック計画策定
- [ ] 監視設定準備

## 最終確認
- [ ] コードレビュー完了
- [ ] スタッフトレーニング完了
- [ ] サポートチーム準備完了
- [ ] 法规制確認完了

## リリース承認
- 開発責任者: [名前] [承認日]
- プロダクトマネージャー: [名前] [承認日]
- 運営責任者: [名前] [承認日]
```

---

## Escalation Boundaries

### 自動で進めてよい範囲
#### 担当者: dss-manager
- 簡単なバグ修正（UI表示問題、ログ出力改善）
- コードリファクタリング（パフォーマンス改善、可読性向上）
- テスト追加（カバレッジ向上、エッジケース追加）
- ドキュメント更新（API仕様変更、チュートリアル追加）
- 小規模な機能追加（UI改善、設定項目追加）

#### 判断基準
- 単一ファイルの変更
- 2時間以内の作業量
- 既存のテストでカバー可能な範囲
- 外部依存関係がない
- リリース影響範囲が限定されている

### Manual Review 必須条件
#### 担当者: 開発チーム長 + プロダクトマネージャー
- データベーススキーマ変更
- APIエンドポイントの追加・変更
- 重要なビジネスロジックの変更
- セキュリティ関連の修正
- 大規模なUI/UX変更

#### 判断基準
- 複数ファイルの変更
- 1日以上の作業量
- 外部依存関係がある
- テストケースの大幅な追加が必要
- 既存ユーザーに影響が出る変更
- 新しいインフラ構成の変更

### 触ってはいけない Protected 領域
#### 禁止領域
- プロダクションデータベースの直接操作
- 認証・認可システムの根本変更
- 支払い処理ロジック
- 個人情報の保存形式変更
- 監視・ログシステムの停止

#### 判断基準
- ユーザーの個人情報に関わる変更
- 資金取引に関わる変更
- 法規制に準拠したシステム設定
- 監査ログに関わる変更
- 災害復旧システムの変更

---

## Next Actions

### 1. 緊急対応項目
- [ ] 決済APIの不安定問題の根本原因調査
- [ ] 認証フローのエラー率低下対策
- [ ] データベース接続プールの最適化

### 2. 短期改善項目
- [ ] キャッシュ管理の改善
- [ ] エラーハンドリングの標準化
- [ ] ログの構造化と分析効率化

### 3. 中期開発項目
- [ ] マイグレーションシステムの自動化
- [ ] テストカバレッジの90%達成
- [ ] パフォーマンスモニタリングの導入

### 4. 長期展望
- [ ] マイクロサービス化への移行
- [ ] AIによる在庫予測機能の追加
- [ ] 国際対応（多言語、多通貨）