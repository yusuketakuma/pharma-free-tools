# 取締役会運用ガバナンス

## 運用フロー

取締役会本会議の標準的な運用フロー：

```
agenda seed → Claude Code 事前審議 → premeeting 正本 brief → OpenClaw 再レビュー → 記録 → 指示
```

## 主要論点

### 1. Control Plane vs Execution Plane の明確な振り分け

**OpenClaw Control Plane の役割**:
- intake / routing
- task classification
- lead / subrole assignment  
- capacity / health 参照
- queue / rebalance
- review / publish
- growth / metrics / proposal
- memory / docs / runbook 更新
- read_only / plan_only / short report / lightweight coordination

**Claude Code Execution Plane の役割**:
- repo-wide 調査
- 複数ファイル変更
- テスト実行
- 実装
- refactor
- verification command 実行
- code-oriented specialist

### 2. 差分指示要点の明示

**Claude Code実行へ回す対象**:
- 複数ファイルを跨ぐ変更
- 実装を伴う作業
- テスト実行が必要な項目
- repo-wide調査を要する検討

**OpenClaw完結でよい論点**:
- 仕様整理・要約
- review / publish
- queue / rebalance / approval
- 単純な文章整備
- 低リスクの軽作業
- planning / analysis only

**実行配置の判断理由**:
- weight (複雑度・リスク・影響範囲)
- task type (read-only vs write)
- 是否需要worktree操作
- 是否需要専門execution specialist

### 3. 成果物と実行状態の3段階管理

**状態管理**:
1. **送信成功**: Claude Code実行依頼が正常に送信
2. **受容成功**: Claude Codeが実行を受け入れ
3. **成果物確認済み**: 完成した成果物がOpenClawで確認

**未完了追跡**:
- 未配信: 送信待ちのタスク
- 未受理: 受理待ちの依頼
- 未成果確認: 完成報告待ちの作業

**自己改善proposalの管理**:
- 直接適用せず、Board最終裁定の範囲だけを伝達
- 引き渡し状況の記録

## 最重要方針

### 基本原則
- **実行系エージェントは OpenClaw で指示を受け、Claude Code で実行する**
- OpenClaw は control plane、Claude Code は execution plane として明確に扱う
- lane 選択は provider / auth / health / heaviness / type に基づく

### 非交渉事項
- Telegram「たまAI」設定の保持
- OpenClaw を control plane としての正本地位
- Claude Code 認証の subscription-only 方針
- `ANTHROPIC_API_KEY` の主系使用禁止
- protected path / auth / approval / trust boundary の自動変更禁止

## 優先順位戦略

1. **実行性と再現性**: 派手さではなく信頼・有用性・再現性を優先
2. **リスク分散**: 一所に依存せず、複数の安全経路を確保
3. **自律改善**: 睡眠中でも安全に進む低リスク自動化を拡張
4. **専門協働**: 適切な専門エージェント配置で成果最大化

## Board Meeting Artifact 出力形式

### 標準出力項目
- 処理対象論点一覧
- Claude Code execution へ回す論点と理由
- OpenClaw 完結でよい論点
- 実行面の配置判断理由
- 状態管理の進捗状況

### 決定事項の記録
- 方針変更の承認
- 重要な統治ルールの修正
- アウトプット承認
- 改善提案の最終裁定

---
*最終更新: 2026-03-28*