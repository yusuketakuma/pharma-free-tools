# ゆうすけ復帰時 オンボーディング手順書

作成日: 2026-03-29T10:11 JST
対象: 40時間以上の不在からの復帰時

## 1. まず確認すること（5分）

### 安否確認
- 連絡未着時間を確認
- 48時間超過の場合は緊急通知済みか確認

### 各担当の状態
| 担当 | 状態 | 報告パス |
|------|------|----------|
| direct-support | reports/loops/direct-support-latest.md | — |
| schedule | reports/loops/schedule-latest.md | blocked（期日データ未提示） |
| mail | reports/loops/mail-latest.md | suspended（アクセス設定待ち） |
| homecare | reports/loops/homecare-support-latest.md | paused（訪問予定未提示） |
| secretariat | reports/loops/secretariat-latest.md | 全体統括 |

## 2. 復帰後の優先アクション

### 最優先: 1件だけ依頼を投げる
何でもよい。「〇〇を調べて」「このメール確認して」の1件で全ループが再開する。

### 推奨: プロジェクトの次アクション決定
準備済みの決定シートから1つ選ぶだけで即着手できる：
- **DeadStock Solution**: `docs/sidebiz/deadstock-next-action.md`
- **CareViaX Pharmacy**: `docs/sidebiz/careviax-next-action.md`

### mail 再開
`docs/mail-access-setup.md`（または同等の手順書）に沿ってアクセス設定を行う。

### schedule 再開
予定・期限を1件でも提示すれば即再開。

## 3. 待機中に整備済みのもの一覧

| 成果物 | パス | 用途 |
|--------|------|------|
| DeadStock 次アクション決定シート | docs/sidebiz/deadstock-next-action.md | 復帰後即判断 |
| CareViaX 次アクション決定シート | docs/sidebiz/careviax-next-action.md | 復帰後即判断 |
| 重症患者割合チェックシート仕様 | docs/sidebiz/severe-patient-ratio-checksheet.md | 実装待ち |
| NotionテンプレートMVP企画 | docs/sidebiz/notion-template-pharmacy-mvp.md | 出品申請待ち |
| 実行ポリシー | EXECUTION_POLICY.md | OpenClaw/Claude Code連携 |
| 適用計画 | ADAPTATION_PLAN.md | プロジェクト適用フェーズ |

## 4. 本部長への伝達

復帰したら本部長（secretariat）に「復帰しました」の1行でよい。
各担当のblocked/waitingは入力1件で自動解除される。
