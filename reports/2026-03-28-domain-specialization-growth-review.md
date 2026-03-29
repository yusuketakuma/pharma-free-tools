# Domain / Repo 特化能力 強化レビュー

- Date: 2026-03-28 07:04 JST
- Trigger: cron:b8bf0aeb-d438-462f-b206-8a9a47cfa8eb
- Scope: dss-manager / pharma-free-tools / sidebiz / polymarket

## 前提

- memory_search では、今回テーマに直接対応する過去メモはヒットしなかった。
- そのため本レビューは、現在の運用方針・ワークスペース文脈・対象領域の性質から組み立てた Supervisor Core 提案である。
- 事実と推測を分けるため、実観測済みと推奨整備項目を分離して記載する。

## 結論

優先度順の推奨は以下。

1. **repo/domain ごとの knowledge pack を標準化する**
   - 専属エージェントごとに頭の中で持つのではなく、`domain-pack` として外部化する。
   - 最低限の構成は以下。
     - verification commands
     - known failures
     - fix patterns
     - decision axes
     - procedure templates
     - escalation boundaries

2. **最初に厚くするべき対象は dss-manager**
   - 既に専属名があり、DeadStockSolution 系は反復オペレーション化しやすい。
   - 仕様確認、差分確認、障害切り分け、修正後検証、運用判断の再現性が最も上げやすい。

3. **次点は pharma-free-tools 専属担当の準備**
   - 薬局/薬剤師文脈は一般ソフトウェア知識だけでは足りず、用語・法規配慮・業務手順・安全性観点が必要。
   - 後追いで都度説明するより、早めに domain pack 化した方がレバレッジが大きい。

4. **sidebiz / polymarket は「市場監視・仮説評価・実行判断」のテンプレ整備を優先**
   - 実装知識より、比較軸・リスク判定・チェックリストの標準化が効く。

## 特化候補領域

### 1. dss-manager（最優先）

想定反復作業:
- repo 状態確認
- 不具合再現と影響範囲切り分け
- 修正前後の差分確認
- 既知障害との照合
- リリース前の最小検証
- 運用上の優先順位整理

repo/domain 専用に持つべきもの:
- **verification commands**
  - 開発サーバ起動
  - 単体/統合テスト
  - lint/typecheck/build
  - 主要ユースケースの smoke test
  - データ整合性確認コマンド
- **known failures**
  - よく壊れる画面/処理
  - 外部依存の不安定ポイント
  - seed / migration / env mismatch
  - stale cache / build artifact 起因の不具合
- **known fix patterns**
  - データ欠損時の初動
  - migration 不整合時の回復手順
  - 環境差分による再現不能バグの詰め方
  - UI 崩れ / API mismatch / 型ずれの定番修正
- **comparison axes**
  - 正しさ > 速度
  - 局所修正 vs 再発防止
  - 既存運用への影響
  - 追加コストに対する恒久性
- **procedure templates**
  - バグ調査テンプレ
  - 修正提案テンプレ
  - release readiness チェック
  - hotfix 判定テンプレ

### 2. pharma-free-tools 専属担当（高優先）

想定反復作業:
- 薬局業務フローに沿った機能要件整理
- 用語・データ項目・UI 文言の妥当性確認
- 現場オペレーションに合うかのレビュー
- リスク高い誤解を招く表現の除去
- 現場導入時の手順化

repo/domain 専用に持つべきもの:
- **verification commands**
  - フォーム/入力系の回帰確認
  - 主要画面の文言確認手順
  - CSV / PDF / 帳票系の生成確認
  - role/permission ごとの動作確認
- **known failures**
  - 用語の揺れ
  - 現場フローと UI 導線の不一致
  - 帳票出力の項目欠落
  - 入力制約不足による運用事故
- **known fix patterns**
  - 用語辞書に基づく修正
  - UI 文言と業務フローを揃える修正
  - 入力チェック追加
  - 手順説明/ヘルプの補強
- **comparison axes**
  - 現場の誤操作防止
  - 学習コスト
  - 説明責任のしやすさ
  - 業務フローとの一致度
- **procedure templates**
  - 薬局業務ヒアリングテンプレ
  - 現場導線レビュー表
  - 文言レビュー checklist
  - 導入前確認テンプレ

### 3. sidebiz 担当（中優先）

想定反復作業:
- 施策案の比較
- 実行コスト/期待値/再現性の評価
- 小さく試す順序づけ
- KPI 仮置きと検証設計
- 継続/停止判断

repo/domain 専用に持つべきもの:
- **verification commands / checks**
  - KPI 更新確認
  - 流入/成約/継続率の定点確認
  - 実験ログ記録
- **known failures**
  - 施策が単発で終わる
  - 測定不能な施策を打つ
  - 実行コスト過大
  - 再現条件が曖昧
- **known fix patterns**
  - 実験単位を縮小する
  - KPI を 1～2 個に絞る
  - 施策前に停止条件を決める
  - 実験メモをテンプレ化する
- **comparison axes**
  - 期待値
  - 再現性
  - 着手コスト
  - 継続運用性
  - 法務/信用リスク
- **procedure templates**
  - 施策比較シート
  - 実験計画テンプレ
  - weekly review テンプレ

### 4. polymarket 担当（中優先、ただし厳格ガード必須）

想定反復作業:
- 市場テーマの整理
- 仮説の明文化
- 情報源の信頼度評価
- エントリー/見送り判断
- 事後検証

repo/domain 専用に持つべきもの:
- **verification checks**
  - 情報源の一次性確認
  - 市場流動性確認
  - イベント定義確認
  - 時間軸・解決条件確認
- **known failures**
  - テーマ理解不足での誤判定
  - 流動性不足の見落とし
  - ルール/解決条件の読み違い
  - ノイズ情報への過剰反応
- **known fix patterns**
  - 一次情報確認を必須化
  - 解決条件の先読み確認
  - ポジション理由を文章化
  - 見送り基準の明文化
- **comparison axes**
  - edge の明確さ
  - 流動性
  - 時間拘束
  - 下振れ時の損失限定
  - 情報優位の根拠
- **procedure templates**
  - 市場評価テンプレ
  - 見送り判断テンプレ
  - 事後レビュー記録

## 蓄積すべき知識（共通フォーマット）

各専属エージェントに対し、以下の共通フォーマットで蓄積するのがよい。

1. **Domain Overview**
   - 何を最適化する領域か
   - 主要 KPI / 成功条件
   - やってはいけないこと

2. **Repository / Environment Map**
   - repo 一覧
   - 主要ディレクトリ
   - 起動/テスト/ビルド方法
   - 環境変数の要点

3. **Verification Commands**
   - normal path
   - fast path
   - pre-merge minimum
   - release gate

4. **Known Failures**
   - 症状
   - 原因候補
   - 初動確認
   - 再現条件
   - 回避策

5. **Known Fix Patterns**
   - 典型修正
   - 修正時の副作用
   - 追加で見るべき関連箇所

6. **Decision Axes**
   - 何を優先して比較するか
   - スピード/品質/安全性/運用性の重み

7. **Procedure Templates**
   - 調査
   - 修正
   - レビュー
   - 報告
   - エスカレーション

8. **Escalation Boundaries**
   - 自動で進めてよい範囲
   - manual review 必須条件
   - 触ってはいけない protected 領域

## 追加候補エージェント

推奨順:

1. **pharma-ops-manager**
   - 目的: 薬局/薬剤師業務フローに沿った要件・UI・運用妥当性の監督
   - 向く仕事: 用語整備、業務導線レビュー、現場導入チェック

2. **market-hypothesis-manager**
   - 目的: sidebiz / polymarket 系の仮説評価、比較、見送り判断の標準化
   - 向く仕事: 情報整理、比較軸適用、リスク判定、実験レビュー

3. **dss-qa-operator**
   - 目的: dss-manager 配下での検証専任
   - 向く仕事: verification command 実行、既知障害照合、回帰確認、報告テンプレ化

補足:
- いきなり agent を増やしすぎるより、まず **dss-manager に domain-pack を実装** し、その後に分業が必要なら派生させるのがよい。

## 次アクション

### 推奨
1. `dss-manager` 用の初版 domain-pack を作る
2. 同じフォーマットで `pharma-free-tools` 用の空テンプレを作る
3. sidebiz / polymarket は agent 追加より先に比較軸テンプレを作る
4. 定期報告では「新規知識候補」「確定済み知識」「未検証仮説」を分けて集約する

### 最小実装案
- `agents/domain-packs/dss-manager.md`
- `agents/domain-packs/pharma-free-tools.md`
- `templates/market-hypothesis-review.md`
- `templates/bug-investigation.md`
- `templates/release-readiness.md`

## Supervisor Core としての判断

- **今すぐ増やすべき専属は 1 つに絞るなら `dss-manager` の強化が最善。**
- **pharma-free-tools は専属 agent 追加候補として有望だが、まず domain-pack 先行が安全。**
- **sidebiz / polymarket は専属化より、評価軸と見送り基準の標準化が先。**

## 定期報告向け要約

- 結論: dss-manager を最優先で domain-pack 化し、次に pharma-free-tools。sidebiz / polymarket は agent 増設より評価テンプレ整備を優先。
- 特化候補領域: dss-manager / pharma-free-tools / sidebiz / polymarket
- 蓄積すべき知識: verification commands / known failures / known fix patterns / comparison axes / procedure templates / escalation boundaries
- 追加候補エージェント: pharma-ops-manager / market-hypothesis-manager / dss-qa-operator
- 次アクション: dss 初版 pack 作成、pharma テンプレ化、market 比較テンプレ作成
