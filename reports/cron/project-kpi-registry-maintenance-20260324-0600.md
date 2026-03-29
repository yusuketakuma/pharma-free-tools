# Project KPI Registry Maintenance — 2026-03-24 06:00 JST

## 結論
- **pharma-free-tools** は最も前進判定しやすいが、まだ `公開後の直接成果` が弱く、現状は theme ranking + repo activity に寄っている。
- **sidebiz** は旧 affiliate / funnel KPI が残っている一方、現在の主タスクは scout であり、**成果定義がズレている**。現状は `ベースライン再形成が必要`。
- **polymarket** は research log しかなく、**ベースライン未形成**。案の数でなく `PoC化率 / 棄却理由 / 次実験接続率` で見るべき。
- **workspace improvement loop** は比較的健全。proxy はあるが、`提案が実装された率` のような直接KPIはまだ弱い。
- 今回は安全な範囲で、**横断KPIレジストリ** と **sidebiz scout rubric** を新設した。

## 現在の指標状況

### pharma-free-tools
- 判定: **指標はあるが弱い**
- 使えるもの:
  - 優先テーマ順位と差分理由
  - source repo latest commit: `2026-03-22T17:17:07+09:00`
  - 未コミット差分: 20 files（tracked 10 / untracked 10）
  - 直近実ファイル更新: `dashboard-data.json`, `index.html`, `sitemap.xml`, `drug-interaction-checker.html` ほか
  - docs 更新: `status/backlog/learn` が 2026-03-24 に揃って更新
- 見立て:
  - 優先順位整理は強い
  - ただし「本当に前進したか」は、現状まだ docs / diff / low-risk fix に偏っている

### sidebiz
- 判定: **指標不足で判断不能**
- 使えるもの:
  - `reports/cron/sidebiz-project-scout-20260323-0900.md`（03/23更新）
  - 旧 `affiliate-kpi` / `funnel-kpi`（最終更新は03/10）
  - scope 内49ファイルのうち、直近7日で更新確認できた実ファイルは1件
- 見立て:
  - KPIファイルはあるが current initiative と噛み合っていない
  - いま必要なのは `idea count` ではなく `PoCに進んだか` と `なぜ捨てたか` の記録

### polymarket
- 判定: **指標不足で判断不能**
- 使えるもの:
  - `research/polymarket-bot-research.md`（03/23更新）
- 見立て:
  - 技術調査は進んだが、検証設計・compliance・paper trade 以前で止まっている
  - 現時点でスコア化するより `未形成` と書く方が正確

### workspace improvement loop
- 判定: **指標は比較的明確だが、直接KPIがまだ弱い**
- 使えるもの:
  - `projects/openclaw-core/docs/status.md` / `backlog/queue.md` / `learn/improvement-ledger.md` が03/24更新
  - `reports/cron/workspace-report-learning-review-20260324-0300.md`
  - `memory/cron-reports/workspace-project-priority-review-2026-03-24-0330.md`
- 見立て:
  - proxy と差分管理はかなり良い
  - ただし `前回提案がどれだけ実装されたか` の conversion はまだ弱い

## 指標不足
- pharma-free-tools:
  - 公開後の利用計測（visit / start / completion / CTA）がない
  - 改善で十分だったのか、新規作成が必要だったのかの事後判定がない
- sidebiz:
  - current initiative 用の共通 funnel がない
  - owner / due / success criteria 付き next action が固定化されていない
- polymarket:
  - compliance matrix, paper trading plan, stop rule がない
- workspace improvement loop:
  - 提案→実装→定着 の conversion 指標がない
  - telemetry / baseline / smoke の運用遵守率が未定義

## 追加すべき指標
- pharma-free-tools:
  - 出力型改善の公開件数
  - 優先1〜3テーマのワイヤー確定→実装→公開完了数
  - CTA / 完了イベント到達率
- sidebiz:
  - PoC化率
  - 棄却理由の明確さ
  - 次実験接続率
  - owner付き次アクション率
- polymarket:
  - 調査→検証設計の PoC化率
  - compliance checklist 完成率
  - strategyごとの棄却理由明確化率
- workspace improvement loop:
  - 新規発見率
  - 重複率
  - safe auto-fix件数
  - owner付き次アクション率
  - 前回提案の実装確認率

## 実際に修正したこと
1. `docs/project-kpi-registry.md` を新規作成
   - 4対象の最小レジストリを追加
   - `direct KPI / proxy KPI / missing KPI / 継続条件 / 強化条件 / 停止検討条件` を統一表現で定義
2. `docs/sidebiz/scout-rubric.md` を新規作成
   - sidebiz の scout を候補列挙で終わらせず、PoC接続まで見える評価枠へ整理

## レジストリ更新案
- 今後は以下の扱いに統一する。
  - **プロダクト**: direct KPI を `公開反映・利用・完了` で見る
  - **研究系**: direct KPI を `PoC着手 / 検証完了` に置き、proxy は `PoC化率 / 棄却理由 / 次実験接続率`
  - **監督系**: direct KPI を `提案実装率 / 再発リスク削減件数` に置き、proxy は `新規発見率 / 重複率 / safe auto-fix件数 / owner付き次アクション率`
- `sidebiz` は旧 affiliate/funnel KPI を archive 扱いにし、current scout 指標とは分離して扱うのがよい。
- `polymarket` は収益期待で追わず、まず compliance / paper trading 前提を direct KPI にすべき。
- `pharma-free-tools` は GA / イベント計測が入るまでは、repo/diff を proxy としつつ、公開された出力型改善件数を主KPIに寄せるべき。

## 前回との差分
- **前回の明示的な横断KPIレジストリは見当たらなかった**。今回はその空白を埋めたのが主差分。
- pharma-free-tools:
  - 優先テーマ整理は前回までに進んでいた
  - 今回は `何をもって前進とみなすか` を docs/repo/activity ベースから direct/proxy/missing に分解した
- sidebiz:
  - 前回 scout は baseline report だった
  - 今回は `old affiliate KPI ≠ current scout KPI` を明文化し、ベースライン再形成が必要と判定した
- polymarket:
  - 前回は調査ログのみ
  - 今回は `ベースライン未形成` を正式に明記し、PoC化率中心の評価枠を置いた
- workspace improvement loop:
  - 前回までの learning review は知見整理が中心
  - 今回は supervisory KPI として `新規発見率 / 重複率 / safe auto-fix件数 / owner付き次アクション率` を明示した

## 次アクション
1. **pharma-free-tools**: 優先1位 `薬歴下書き・要点整理支援` で、ワイヤーと出力要件を1枚に固定する。
2. **sidebiz**: `docs/sidebiz/scout-rubric.md` を使って、次回 scout から owner / due / success criteria を必須化する。
3. **polymarket**: compliance matrix と paper trading plan を作るまでは、収益性評価を進めない。
4. **workspace improvement loop**: 次回レビューで `前回提案の実装確認率` を追加で記録する。
