# Status — pharma-free-tools

## Current Goal
「毎日1本増やす」運用をやめ、薬局・薬剤師の日常業務の実需を定期調査し、ニーズが強いテーマだけを開発・改善する。

## Current State
- 公開中ツール: 74本
- Deploy: GitHub Pages (yusuketakuma.github.io/pharma-free-tools)
- GitHub: yusuketakuma/pharma-free-tools
- 既存課題: index / sitemap / 実ファイル数の整合ずれあり
- 既存傾向: 診断・チェックリスト系は多いが、実務をその場で前進させる「実行ツール」は不足

## Latest Research Update (2026-03-27)
2026-03-27 の再点検では **変更なし**。前回のトップ3を維持し、新規トップ候補の追加はなかった。
- 反復残存テーマ: 薬歴下書き・要点整理支援 / 供給障害患者対応ワークベンチ / 返戻再請求ナビ
- 進展: 薬歴テーマは 2026-03-26 に wireframe proposal まで進行済み
- 方針: 既存改善を継続し、新規追加は保留

## Latest Research Update (2026-03-25)
2026-03-25の再点検では、トップ3は前回から変更なしだった。新規のトップ候補はなし。2026年度調剤報酬改定まわりの話題は確認したが、既存HTMLで吸収済みのため新規追加は見送った。
追加で既存HTMLの実ファイル監査を行い、返戻表記ゆれの低リスク修正を 9 件のHTML / 94 箇所に先行適用した。

## Latest Research Update (2026-03-24)
今回は「薬局・薬剤師が日常で繰り返し困ること」を再点検し、公開情報・業界記事・解説記事を横断して優先順位を見直した。

### Existing HTML audit update (2026-03-24)
既存HTML限定で再監査した結果、改善候補トップ5は以下。
1. 薬歴下書き・要点整理支援
2. 返戻再請求ナビ
3. 供給障害患者対応ワークベンチ
4. 在庫優先度ボード
5. 服薬フォローアップ記録支援

主な差分:
- existing-only スコープのため、新規寄り候補は今回のランキング対象外
- `返戻再請求ナビ` を 3位 → 2位へ繰り上げ
- `供給障害患者対応ワークベンチ` を 2位 → 3位へ調整
- 上位候補関連10ファイルで generic OGP/Twitter メタ残りを補修
- `pharmacy-rejection-template.html` の `返戣` typo を補修
- 参照傾向:
  - 薬歴業務負担 / SOAP記載 / A・Pで止まる問題
  - 供給障害 / 限定出荷 / 代替提案 / 患者説明 / 医師連絡
  - オンライン返戻再請求の運用混乱
  - 疑義照会 / トレーシングレポートの文面化負担
  - 長期収載品選定療養の患者説明負担
- 主な差分:
  - トップ3は維持
  - `疑義照会・トレーシング連絡ナビ` を新規4位候補として追加
  - `在庫優先度ボード` は4位→5位へ後退
  - `服薬フォローアップ記録支援` は5位→6位へ後退
  - `長期収載品選定療養説明ナビ` を新規監視候補として追加
- 理由:
  - 薬剤師本人が日常で詰まりやすい「文面化・医師連絡整理」の痛みを再評価した
  - 一方で、トップ3は頻度・痛み・実装容易性・既存資産活用のバランスが依然として最も良い

- 最優先1: 薬歴下書き・要点整理支援
  - 対象: `pharmacy-medication-history-efficiency.html` / `medication-history-time-saving-checklist.html`
  - 判定: 新規ではなく既存改善優先
  - 核心課題: 診断止まりで、SOAP下書き・患者説明メモ・次回確認事項の出力が弱い
- 最優先2: 供給障害患者対応ワークベンチ
  - 対象: `supply-disruption-patient-impact.html`
  - 判定: 新規ではなく既存改善優先
  - 核心課題: 患者説明文・医師連絡文・薬歴記録文の出力がない
- 最優先3: 返戻再請求ナビ
  - 対象: `pharmacy-rejection-template.html` / `pharmacy-claim-denial-risk-diagnosis.html`
  - 判定: 新規ではなく既存改善優先
  - 核心課題: テンプレと診断が分散、理由別ナビ導線が弱い
- 優先4: 疑義照会・トレーシング連絡ナビ
  - 対象: 周辺資産あり (`prescription-reception-checklist.html`, `dispensing-error-prevention-checklist.html`, `ai-prompts-lp.html`)
  - 判定: 新規寄り
  - 核心課題: 専用HTMLがなく、疑義照会文・トレーシング文・薬歴記録文を一気通貫で出せない
- 優先5: 在庫優先度ボード
  - 対象: `pharmacy-inventory-diagnosis.html` / `pharmacy-reorder-point-calculator.html` / `inventory-order-optimization-checklist.html`
  - 判定: 既存改善優先
  - 核心課題: 診断・計算・優先順位表示が分散し、今日の対応順が見えない
- 優先6: 服薬フォローアップ記録支援
  - 対象: `pharmacy-followup-efficiency.html` / `graceful-period-patient-followup-checklist.html`
  - 判定: 既存改善優先
  - 核心課題: 診断・チェックリスト止まりで、記録文生成まで届いていない
- 優先7: 長期収載品選定療養説明ナビ
  - 対象: 周辺資産あり (`generic-drug-switch-revenue-checklist.html`, `graceful-period-drug-switch-checklist.html`, `ai-prompts-lp.html`)
  - 判定: 新規寄り
  - 核心課題: 患者説明・判定確認・旧様式処方箋チェックが専用化されていない

## Research-based Priorities
1. 薬歴下書き・要点整理支援（既存改善）
2. 供給障害患者対応ワークベンチ（既存改善）
3. 返戻再請求ナビ（既存改善）
4. 疑義照会・トレーシング連絡ナビ（新規寄り）
5. 在庫優先度ボード（既存改善）
6. 服薬フォローアップ記録支援（既存改善）
7. 長期収載品選定療養説明ナビ（新規寄り）

## Latest Low-risk Fixes (2026-03-24)
- `projects/pharma-free-tools/backlog/queue.md`
  - 候補整理を 2026-03-24 版へ更新
  - 新規候補2件を追加
  - 優先順位を再配置
- `projects/pharma-free-tools/docs/status.md`
  - 最新リサーチ要約を更新
- `projects/pharma-free-tools/learn/improvement-ledger.md`
  - 今回の差分と学びを追記
- `projects/pharma-free-tools/docs/theme-extraction-2026-03-25.md`
  - 2026-03-25 の変更なしレポートを新規作成
- `projects/pharma-free-tools/docs/theme-extraction-2026-03-24.md`
  - 詳細レポートを新規作成

## Operating Rule
- 新規作成は「高頻度 × 強い痛み × 代替の弱さ × HTML実装しやすさ」を満たす場合のみ
- 既存ツールの改善で足りるなら、新規追加より改善を優先
- リサーチ結果は毎回、前回との差分を残す
- 大規模改修前に、まずワイヤーと出力要件を1枚で定義する

## Risks
- 似た診断ツールの重複追加で全体価値が下がる
- 実需要が弱いテーマに時間を使う
- GitHub Pages ビルド失敗（CI で検証）

## Reference
- 詳細レポート: `projects/pharma-free-tools/docs/theme-extraction-2026-03-27.md`
- 詳細レポート: `projects/pharma-free-tools/docs/theme-extraction-2026-03-25.md`
- 既存HTMLランキング: `projects/pharma-free-tools/docs/html-improvement-ranking-2026-03-24-existing.md`
- 前回ランキング: `projects/pharma-free-tools/docs/html-improvement-ranking-2026-03-23.md`

## Recovery Note (2026-03-25)
- 2026-03-25 朝の自動更新では exact-match 編集失敗が一度出たが、status 内容自体は当日版の研究更新と existing HTML 監査差分を反映済みだったため、ここでは回収確認メモのみ追記した。

## Last Updated
- 2026-03-27
