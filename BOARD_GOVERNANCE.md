# BOARD_GOVERNANCE.md

## 取締役会本会議 決定事項

### 日付
2026-03-29

### 決定内容：OpenClaw + Claude Code 実行体制の明確化

## 運用フロー
**agenda seed → Claude Code 事前審議 → premeeting 正本 brief → OpenClaw 再レビュー → 記録 → 指示**

## 主要論点決定

### 1. Control Plane vs Execution Plane の明確な振り分け
**決定**: 明確な境界線を設定
- **実行系エージェント**: OpenClawで指示を受け、Claude Codeで実行
- **Claude Code実行対象**: 
  - repo調査
  - 複数ファイル変更
  - テスト実行
  - 実装
  - refactor
- **OpenClaw完結対象**:
  - read_only（コード読解、ファイル確認）
  - plan_only（タスク分解、仕様定義）
  - short report（軽量レポート、要約）
  - lightweight coordination（協調、調整）

### 2. 差分指示要点の明示
**決定**: 詳細な指示伝達プロセスを標準化
- **具体的な対象提示**: Claude Code実行へ回す対象を具体的に示す
- **配置判断理由**: 実行論点の配置判断理由を明確に記載
- **提案伝達範囲**: 自己改善proposalはBoard最終裁定範囲だけを伝達

### 3. 成果物と実行状態の3段階管理
**決定**: 管理プロセスを3段階で明確化
- **成功段階**: 
  - 送信成功（Claude Codeへ指示送信完了）
  - 受容成功（Claude Codeでタスク受容完了）
  - 成果物確認（期待された成果物が生成・確認済み）
- **未完了段階**:
  - 未配信
  - 未受理
  - 未成果確認
- **提案管理**: 自己改善proposalの引き渡し状況の記録

## 最重要方針
- **実行系エージェントは OpenClaw で指示を受け、Claude Code で実行する**
- **OpenClaw は control plane、Claude Code は execution plane として扱う**

## 実行指示プロセス
```
Task種別 → 判断理由 → 配置決定 → 具体的な指示
```

## 提案管理ルール
- **自己改善提案**: Board最終裁定範囲のみを伝達
- **直接適用禁止**: 新方針は記録・承認を経てから適用
- **提案内容明示**: 理由・効果・リスクを含めて記述

## 重要制約
- 実行系エージェントはOpenClawで指示を受け
- Claude Codeは純粋な実行planeとして扱う
- 認証はsubscription-onlyを厳守
- protected path変更はmanual review必須

## 適用時期
- **即時適用**: 新規タスク全般
- **段階的移行**: 既存処理の次回実行から

## 文書管理
- **保管先**: `/Users/yusuke/.openclaw/workspace/BOARD_GOVERNANCE.md`
- **関連文書**: 
  - `EXECUTION_POLICY.md`（詳細運用ルール）
  - `AGENTS.md`（エージェント体制）
  - `TOOLS.md`（道具・経路定義）

## 次回アクション
- 適用開始後のモニタリング
- フィードバック収集と調整