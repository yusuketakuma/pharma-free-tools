# EXECUTION_SAMPLES.md

## Task分類サンプル

### Case 1: 新規機能開発
**Task**: 「DeadStockSolution在庫管理APIのRESTエンドポイントを3つ実装」

**配置判断**:
- 複数ファイル変更（API実装 + テスト）
- 新規実行が必要
- **配置**: Claude Code Execution Plane

**具体指示例**:
```
# Claude Code実行指示

Task: DeadStockSolution在庫管理API実装
理由: 新規機能開発・複数ファイル変更・テスト実行が必要
配置: Claude Code Execution Plane

指示内容:
1. 在庫照会エンドポイント (/api/inventory)
2. 在庫更新エンドポイント (/api/inventory/update)
3. 在庫警告エンドポイント (/api/inventory/warning)

成果物:
- 3つのAPIエンドポイント実装
- 対応するテストコード
- APIドキュメント更新
```

### Case 2: 既存コード調査
**Task**: 「DeadStockSolution認証ミドルウェアの現状を調査し、テストカバレッジと改善点を整理」

**配置判断**:
- read_only（コード読解・テスト分析・問題点整理）
- 複数ファイル変更不要
- **配置**: OpenClaw Control Plane完結

**具体指示例**:
```
# OpenClaw実行指示

Task: DeadStockSolution認証ミドルウェア調査
理由: read_only調査・テスト分析・問題点整理のみで実行不要
配置: OpenClaw Control Plane完結

調査対象ファイル:
- server/src/middleware/auth.ts（認証ミドルウェア本体）
- server/src/test/auth-middleware-coverage.test.ts
- server/src/test/auth-middleware-deep.test.ts
- server/src/test/auth-middleware-ultra.test.ts
- server/src/test/auth-service.test.ts
- server/src/test/auth-route-deep.test.ts

指示内容:
1. auth.ts の認証フロー（JWT検証・ロール判定・エラーハンドリング）を整理
2. 既存テストのカバレッジ・重複・欠落を分析
3. テストファイル間の重複パターンを特定
4. 改善提案（統合方針・追加ケース）をdraft作成

成果物:
- 認証フロー図（テキスト）
- テストカバレッジ分析レポート
- 重複パターンと改善提案draft
```

### Case 3: テスト実行
**Task**: 「DeadStockSolutionのmatching-service関連テストを全件実行し、失敗件数と傾向を報告」

**配置判断**:
- テスト実行が必要（複数ファイル・複数サービス）
- 失敗分析が伴う
- **配置**: Claude Code Execution Plane

**具体指示例**:
```
# Claude Code実行指示

Task: matching-service系テスト全件実行と失敗分析
理由: 複数テストファイルの実行・結果分析が必要
配置: Claude Code Execution Plane

対象テスト:
- server/src/test/matching-service.test.ts
- server/src/test/matching-service-deep.test.ts
- server/src/test/matching-service-coverage.test.ts
- server/src/test/matching-service-final.test.ts
- server/src/test/matching-service-ultra.test.ts
- server/src/test/matching-score-service.test.ts（-coverage/-final/-ultra含む）
- server/src/test/matching-filter-service.test.ts
- server/src/test/matching-priority-service.test.ts
- server/src/test/integration/matching-snapshot-service.integration.test.ts

実行コマンド: npx vitest run --reporter=verbose
成果物:
- 実行結果サマリ（pass/fail/skip）
- 失敗テストのエラーメッセージと傾向分析
- 再現手順（ある場合）
```

### Case 4: 軽量コード更新（単一ファイル）
**Task**: 「DeadStockSolutionの新規エンドポイント追加に伴い、OpenAPI contractテストを更新」

**配置判断**:
- 単一テストファイルの軽量更新
- 既存パターンの追従
- **配置**: OpenClaw Control Plane完結

**具体指示例**:
```
# OpenClaw実行指示

Task: OpenAPI contractテストに新エンドポイント追記
理由: 単一ファイルの軽量更新・既存パターン追従
配置: OpenClaw Control Plane完結

対象ファイル: server/src/test/openapi-contract.test.ts
更新内容:
1. 新規エンドポイントのpath・method・status codeを追加
2. request/response schema検証を既存パターンに合わせて追記

成果物:
- 更新済み openapi-contract.test.ts
```

### Case 5: 複雑なリファクタリング
**Task**: 「DeadStockSolutionのupload系サービスの重複ロジックを統合し、共通ユーティリティに抽出」

**配置判断**:
- upload-service / upload-confirm-service / upload-diff-service 等複数ファイル横断
- 共通ロジック抽出・テスト更新が必要
- **配置**: Claude Code Execution Plane

**具体指示例**:
```
# Claude Code実行指示

Task: upload系サービスの重複ロジック統合リファクタリング
理由: 複数ファイル横断変更・テスト更新・動作確認が必要
配置: Claude Code Execution Plane

対象ファイル:
- server/src/services/upload-service.ts
- server/src/services/upload-confirm-service.ts
- server/src/services/upload-diff-service.ts
- server/src/test/upload-service-coverage.test.ts
- server/src/test/upload-confirm-service-*.test.ts
- server/src/test/upload-diff-service.test.ts

指示内容:
1. 3サービス間の重複ロジックを特定
2. 共通ユーティリティ（server/src/utils/upload-common.ts等）に抽出
3. 各サービスを共通ユーティリティ参照に変更
4. 既存テストが全件passすることを確認
5. 抽出したユーティリティの単体テストを追加

成果物:
- リファクタリング済みサービス群
- 新規共通ユーティリティ + テスト
- 全テストpass確認レポート
```

### 状態管理例

#### 成功ケース
```
[送信成功] → [受容成功] → [成果物確認済み]
    ↓            ↓            ↓
  指示送信   Claude Code実行  期待通りの
               完了        成果物生成
```

#### 問題発生ケース
```
[送信成功] → [受容成功] → [成果物未確認]
    ↓            ↓            ↓
  指示送出   実行開始    期待通らず
               完了      或いはtimeout
```
**対応**: Blockerを明示して再指示

### 適用後の期待効果
1. **明確な責任分担**: Control/Executionの分離で役割明確化
2. **効率化**: 適切な配置で無駄な手戻り削減
3. **品質向上**: 専門的な実行環境での処理
4. **追跡可能性**: 3段階管理で状態把握容易化