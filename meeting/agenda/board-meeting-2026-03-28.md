# 取締役会議事録 - 2026年3月28日

## 会議情報
- **日時**: 2026年3月28日 13:35 UTC (22:35 JST)
- **議題**: OpenClaw運営体制の明確化と実行プロセスの最適化
- **議事フロー**: agenda seed → Claude Code事前審議 → premeeting正本brief → OpenClaw再レビュー → 記録 → 指示

---

## 主要論点（3件）

### 1. OpenClaw control plane vs Claude Code execution planeの明確な振り分け

**現状課題**:
- エージェント間の役割分担が不明確
- 実行プロセスの遷移が非効率
- 両システムの境界条件が曖昧

**提案解決策**:
- **OpenClaw (Control Plane)**: 
  - intake / routing / タスク分類
  - 主担当/サブ担当の自動選定
  - queue / approval / rebalance / review / publish
  - memory / docs / runbook更新
  - lightweight coordination / plan-only / short report

- **Claude Code (Execution Plane)**:
  - 重いコード読解・複数ファイル変更
  - 実装・テスト・refactor
  - repo-wide調査・verification
  - worktreeベース作業
  - code-oriented specialist実行

**配置基準**:
- **OpenClaw完結**: read_only / plan_only / lightweight coordination
- **Claude Code実行**: multi-file change / tests / implementation / repo-wide analysis

### 2. 差分指示要点の明示

**指示プロセス改善**:
- 具体的な実行対象の明示
- 配置判断理由の明記
- 自己改善proposalの扱い方の統一

**差分化ポイント**:
```
実行系エージェント:
- 主指示: OpenClawで受領
- 実行: Claude Codeで実行
- 委任ルール: 明示的な配置判断に基づきrouting

自己改善proposal:
- 適用範囲: Board最終裁定のみ
- 経路: 再レビュー経由での反映
- 場所: 成果物の引き渡し記録として残す
```

### 3. 成果物と実行状態の3段階管理

**管理フレームワーク**:
```
ステージ1: 送信成功
- エージェントへのタスク配信完了
- 状態: "dispatched"

ステージ2: 受容成功  
- エージェントによる受領完了
- 状態: "accepted"

ステージ3: 成果物確認済み
- 完成物の検証完了
- 状態: "verified"
```

**未完了状態追跡**:
- 未配信: dispatch前の状態
- 未受理: 受領待ちの状態  
- 未成果確認: 完成待ちの状態

**成績管理**:
- 各ステージの成功率
- 平均処理時間
- 再度作業の比率

---

## 最重要方針

### 根幹原則
- **実行系エージェントは OpenClaw で指示を受け、Claude Code で実行する**
- OpenClaw は control plane、Claude Code は execution plane として明確に分離
- システム間の連携プロセスは自動化・標準化

### ガバナンス体制
- 定期的な方針レビュー（月次）
- 成績指標に基づいた最適化（四半期）
- 危機対応プロセスの定常化

---

## 実行アクション

### Claude Code execution へ回す論点
1. 複数ファイルにまたがるコード変更
2. テスト実行とverification
3. repo-wideな調査分析
4. 実装を伴うrefactor
5. code-oriented specialistタスク

### OpenClaw 完結でよい論点
1. 要約・仕様整理
2. タスク分解
3. docs更新・review/publish
4. 軽量な文章整備
5. queue/rebalance/approval処理

### 実行面の配置判断理由
- **重量判断**: CPU/RAM使用量、ディスクI/O、ネットワーク帯域幅
- **リスク判断**: 信頼性、セキュリティ、バックアップ要件
- **品質判断**: 完了度、検証レベル、維持コスト
- **スケジュール判断**: 必要時間、依存関係、クリティカルパス

---

## 次回進行

1. **短期**: 具体実装計画の策定（1週間以内）
2. **中期**: プロセス標準化の完了（2週間以内）  
3. **長期**: 定常的な成績レビュー体制の構築（1ヶ月以内）

---

## 議決事項

□ OpenClaw/Claude Codeの役割分担の確定  
□ 3段階管理プロセスの導入承認  
□ 自己改善proposalの扱い方の定義承認  
□ 次回進行計画の承認

---

*この議事録は自動生成され、必要に応じて修正されます*