# EXECUTION_POLICY.md

## OpenClaw + Claude Code 実行体制

### 取締役会本会議運用フロー
**agenda seed → Claude Code 事前審議 → premeeting 正本 brief → OpenClaw 再レビュー → 記録 → 指示**

### ラインポリシー

### ラインポリシー

#### OpenClaw Control Plane（ここで処理）
- **read_only**: コード読解、ファイル確認、仕様整理
- **plan_only**: タスク分解、仕様定義、計画立案
- **short report**: 軽量レポート、要約、レビュー
- **lightweight coordination**: 協調、調整、ルール更新

#### Claude Code Execution Plane（ここで実行）
- **repo調査**: 大規模なコードベース調査
- **複数ファイル変更**: 複数ファイルにわたる修正・実装
- **テスト実行**: テストコード作成・実行
- **実装**: 新機能開発、bugfix
- **refactor**: 大規模なリファクタリング

### 指示伝達プロセス

#### 1. 配置判断
```
Task種別 → 判断理由 → 配置決定 → 具体的な指示
```

#### 2. 成果物管理（3段階）
- **送信成功**: Claude Codeへ指示送信完了
- **受容成功**: Claude Codeでタスク受容完了
- **成果物確認**: 期待された成果物が生成・確認済み

#### 3. 状態追跡
- 未配信 → 未受理 → 未成果確認
- 各段階でblockerがある場合は明示的に報告

### 提案管理ルール
- **自己改善提案**: Board最終裁定範囲のみを伝達
- **直接適用禁止**: 新方針は記録・承認を経てから適用
- **提案内容明示**: 理由・効果・リスクを含めて記述

### 重要制約
- 実行系エージェントはOpenClawで指示を受け
- Claude Codeは純粋な実行planeとして扱う
- 認証はsubscription-onlyを厳守
- protected path変更はmanual review必須

### 主要論点（取締役会本会議）

#### 1. **OpenClaw control plane vs Claude Code execution planeの明確な振り分け**
- **実行系エージェント**: OpenClawで指示受け、Claude Codeで実行
- **Claude Code実行対象**: repo調査・複数ファイル変更・テスト・実装・refactor
- **OpenClaw完結対象**: read_only/plan_only/short report/lightweight coordination

#### 2. **差分指示要点の明示**
- **具体的な対象提示**: Claude Code実行へ回す対象を具体的に示す
- **配置判断理由**: 実行論点の配置判断理由を明確に記載
- **提案伝達範囲**: 自己改善proposalはBoard最終裁定範囲だけを伝達

#### 3. **成果物と実行状態の3段階管理**
- **成功段階**: 送信成功 / 受容成功 / 成果物確認済み
- **未完了段階**: 未配信 / 未受理 / 未成果確認の追跡
- **提案管理**: 自己改善proposalの引き渡し状況の記録

### 最重要方針
- **実行系エージェントは OpenClaw で指示を受け、Claude Code で実行する**
- **OpenClaw は control plane、Claude Code は execution plane として扱う**

### 適用時期
- **即時適用**: 新規タスク全般
- **段階的移行**: 既存処理の次回実行から