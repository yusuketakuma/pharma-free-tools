# 取締役会本会議運用仕様

## 概要

取締役会本会議は1時間ごとに開催され、agenda seed → Claude Code 事前審議 → premeeting 正本 brief → OpenClaw 再レビュー → 記録 → 指示 の順で運用する。

## 運用フロー

### 1. agenda seed
- 議題候補のseedを作成
- 全社戦略、重要プロジェクト、リスク要因を網羅
- 各論点に対するpriorityとscopeを明示

### 2. Claude Code 事前審議
- agenda seedをClaude Code execution planeで調査・分析
- repo調査・複数ファイル変更が必要な論点はここで実施
- 論点ごとの実行配置を判定
- premeeting brief用の分析結果を生成

### 3. premeeting 正本 brief
- Claude Codeからの分析結果を元に正議題を3件に圧縮
- 各論点のbackgroundとcontingencyを明示
- 裁定基準を適用しexecution plane振り分け

### 4. OpenClaw 再レビュー
- control plane視点での最終確認
- バランス、リスク、実行可能性の総合評価
- 指示の最終調整

### 5. 記録
- 運用の全工程をMEMORY.mdに記録
- 決定論点と理由を明示
- チェックポイントを保存

### 6. 指示
- 担当者への明確な指示を生成
- execution plane振り分けを明示
- timelineとdeliverablesを定義

## 主要論点の圧縮ルール

### 優先度判定基準
1. **収益・成長影響度** - 直近の収益貢献度と長期戦略への貢献度
2. **リスク・コンプライアンス** - 緊急性と影響範囲の大きさ
3. **実行可能性** - 担当リソースとタイムラインの現実性

### 圧縮方法
- 全議題を3段階評価（高/中/低）
- 高評価の論点を最大3件選択
- 残論点はwatch listに追加

## Control Plane / Execution Plane 役割分担

### OpenClaw Control Plane 担当項目
- 議題の優先順位付けと圧縮決定
- 最終レビューとバランス調整
- 指示生成とプロジェクト管理
- 記録とmemory管理
- read_only / plan_only / short report
- lightweight coordination
- approval処理

### Claude Code Execution Plane 担当項目
- repo調査とコード分析
- 複数ファイル変更・テスト・実装・refactor
- 複雑な不具合修正
- 高重量verification
- code-oriented specialist実行
- 実行詳細の調査と提案

## 論点の実行配置判定ルール

### Claude Code execution へ回す論点
```
条件：
- 複数ファイル変更が必要な場合
- repo-wide調査が必要な場合
- テスト実行が必要な場合
- 実装・refactorを伴う場合
- 高重量verificationが必要な場合
- code-oriented specialistが明確な場合

例：
- API設計変更と実装
- 大規模なリファクタリング
- パフォーマンス改善調査
- テストコード修正
- コードレビューと修正
```

### OpenClaw 完結でよい論点
```
条件：
- read_only調査のみで十分な場合
- plan_onlyで完了可能な場合
- short reportで伝達可能な場合
- lightweight coordinationで十分な場合
- 単純な文章整備・更新の場合
- 低リスクの軽作業の場合

例：
- 戦略ドキュメントの要約
- プロジェクト計画の調整
- 非技術的な進捗報告
- 軽規格のドキュメント更新
- 実行指示の生成と配布
```

## 実行配置判定プロセス

### 判定フロー
1. **論点タイプ判定** - read_only / plan_only / code_change のいずれか
2. **重量評価** - 複雑さ・影響範囲・リスクの評価
3. **専門性判定** - code-oriented specialistが必要かどうか
4. **配置決定** - OpenClaw完結かClaude Code execution
5. **明示理由** - 判定の根拠を明記

### 判定例
```
論点: APIエンドポイントの変更提案
- タイプ: code_change
- 重量: 中（API設計変更+実装）
- 専門性: backend-architectが必要
- 配置: Claude Code execution
- 理由: 複数ファイル変更と専門知識が必要なため

論点: Q2業績予測の調整
- タイプ: plan_only
- 重量: 低（単純な調整）
- 専門性: なし
- 配置: OpenClaw完結
- 理由: read_only調査と軽量調整で完了可能
```

## 記録フォーマット

### 運用記録
```markdown
## 取締役会議事録 [YYYY-MM-DD HH:MM]

### 選択論点（最大3件）
1. [論点名]
   - 背景: [詳細]
   - 配置: [OpenClaw完結 / Claude Code execution]
   - 理由: [判定根拠]

2. [論点名]
   - 背景: [詳細]
   - 配置: [OpenClaw完結 / Claude Code execution]
   - 理由: [判定根拠]

3. [論点名]
   - 背景: [詳細]
   - 配置: [OpenClaw完結 / Claude Code execution]
   - 理由: [判定根拠]

### 振り分け理由
- Claude Code execution へ回す論点: [数件]
  - [理由1]
  - [理由2]
- OpenClaw 完結でよい論点: [数件]
  - [理由1]
  - [理由2]

### 実行面の配置判断理由
- [具体的な判断プロセス]
- [特に重要な考慮事項]
```

## チェックリスト

### agenda seed 作成時
- [ ] 全社戦略と重要プロジェクト網羅
- [ ] リスク要因の洗い出し
- [ ] 各論点のpriorityとscope明示
- [ ] 関連ドキュメントの参照準備

### Claude Code 事前審議時
- [ ] repo調査の必要性確認
- [ ] 複数ファイル変更の有無判定
- [ ] テスト実行の必要性確認
- [ ] code-oriented specialistの必要評価
- [ ] premeeting briefデータの準備

### premeeting 正本 brief時
- [ ] 論点を3件に圧縮
- [ ] 各論点のbackgroundとcontingency明示
- [ ] execution plane振り分け判定
- [ ] 配置理由の明示

### OpenClaw 再レビュー時
- [ ] バランスとリスクの評価
- [ ] 実行可能性の確認
- [ ] 最終的な指示文生成

### 記録時
- [ ] 全工程の記録
- [ ] 決定論点と理由の保存
- [ ] チェックポイントの記録

### 指示時
- [ ] 担当者の明確化
- [ ] timelineとdeliverablesの定義
- [ ] execution plane振り分けの明示

## 自動化ポイント

- agenda seedの半自動生成
- execution plane振り分けの自動判定
- 圧縮プロセスの半自動化
- 記録の自動更新
- チェックリストの自動検証

## 注意事項

- 重要な戦略決定はmanual review必須
- 配置変更の際は明示的な理由が必要
- 運用プロセスの改善は定期的に実施
- 記録はMEMORY.mdに追記し、継続的に改善