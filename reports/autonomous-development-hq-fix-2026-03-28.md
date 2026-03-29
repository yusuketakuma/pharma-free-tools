# 自律開発本部長エージェント修正レポート

## 日時
2026-03-28 13:54 GMT+9

## 修正内容

### 1. agent設定の更新 (~/.openclaw/openclaw.json)

#### identity.theme の更新
修正前: `プログラミングによる自律改善を統括する` (抽象的すぎる)

修正後: 1510文字の詳細な運用プロンプト
- **役割の明確化**: OpenClaw = control plane / Claude Code = execution plane の分担
- **Claude Code呼び出しトリガー条件の明記**:
  - 複数ファイルの変更が必要な実装タスク
  - テストの作成・実行・結果確認
  - repo全体にまたがる調査・分析
  - バグ修正・リファクタリング・コードレビュー
  - 新機能の実装・パフォーマンス改善
- **OpenClaw-only範囲の明記**:
  - タスク計画・仕様整理
  - Claude Codeへの指示生成・ディスパッチ
  - 実行結果の要約・報告
  - 取締役会への議題作成
  - 進捗管理・ボトルネック特定
- **プロジェクト対応表**: CareRoute-RX, DeadStockSolution, OpenClaw Core, careviax-pharmacy
- **安全制約**: Telegram設定・auth/routing/trust boundary の保護

#### heartbeat.prompt の更新
修正前: `自律開発本部長の自律 heartbeat。仕様→実装→検証の流れを見て、コード改善の論点だけを返します。`

修正後: 具体的な選択肢を持つheartbeat
- noop: 対象なし・異常なし
- task_dispatch: Claude Code経由で実行すべき改善タスクを特定・ディスパッチ
- progress_report: 直近のClaude Code実行結果を確認・まとめ
- signal_only: Claude Codeのauth状態・lane healthに問題があればsignal

### 2. 副次的な修正
- product-operations-hqエージェントの無効な `systemPrompt` フィールドを削除

## 効果

### 改善点
1. **明確な運用プロンプト**: エージェントが何をすべきか明確になった
2. **Claude Code呼び出しの自動化**: トリガー条件が明記され、自律的にコード変更を実行できる
3. **役割分担の明確化**: OpenClawとClaude Codeの責任範囲が明確に
4. **安全境界の維持**: 保護すべき設定を明記し、誤変更を防止

### 期待される動作
- ユーザーからのコード変更要求を受けて、Claude Codeを実行プレーンとしてディスパッチ
- 複数ファイル変更・テスト実行・repo調査を自律的にClaude Codeに委譲
- Heartbeat時に適切な改善タスクを検出・実行
- OpenClaw内では軽量な調整・報告・管理タスクのみ実行

## 技術的詳細

### System Prompt 構成
OpenClawのSystem Promptは以下から構成される:
1. **nonProjectContext** (~8-12K chars): フレームワークランタイム、ツール記述、エージェントidentity、skills
2. **projectContext** (~11-15K chars): ワークスペースブートストラップファイル（AGENTS.md, SOUL.md, TOOLS.md等）

autonomous-development-hqの `identity.theme` がnonProjectContextに注入され、運用指示として機能する。

### task-dispatch スキル
既存のスキルは以下の機能を持つ:
- プロジェクト検出
- task JSONの生成
- Claude Code実行プレーンへのディスパッチ
- 実行結果の読み取り・要約

## 次ステップ

1. 実際にエージェントをテストし、Claude Codeへのディスパッチが動作するか確認
2. 必要に応じて `task-dispatch` スキルの内容を調整
3. プロジェクトごとの実績を追跡

## ファイル変更

- `~/.openclaw/openclaw.json`: autonomous-development-hqエージェント設定を更新
- `~/.openclaw/workspace/reports/autonomous-development-hq-fix-2026-03-28.md`: このレポートを新規作成
