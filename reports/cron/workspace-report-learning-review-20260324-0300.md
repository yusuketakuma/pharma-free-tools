# Workspace report learning review

- 実行時刻: 2026-03-24 03:00 JST
- 対象差分基準: 前回レビュー `reports/cron/workspace-report-learning-review-20260323-0300.md`
- 今回確認した新規対象:
  - `reports/cron/growth-proposal-20260323-1103-queue-telemetry.md`
  - `reports/openclaw-cli-stability-2026-03-23.md`
  - `reports/openclaw-preupdate-baseline-2026-03-23.md`
  - `reports/cron/sidebiz-project-scout-20260323-0900.md`
- 補足: `trainer/` 配下は前回レビュー以降の新規更新を確認できず、今回は既存教訓との整合確認のみ実施。

## 結論
- 今回の追加知見で再利用価値が最も高いのは、**件数だけに依存しない queue telemetry**, **CLI の呼び出し経路固定**, **更新前 baseline → 更新後 smoke check の標準化**, **probe-specific warning と実障害の切り分け** の4点。
- 破壊的な自動変更は不要だったため、今回は **OpenClaw Core の project docs 3点だけを軽微更新** し、次回実装候補を backlog / ledger / status に反映した。
- `trainer/` 由来の新知見追加は今回はなく、差分の中心は `reports/cron/` と OpenClaw 運用レポート側に移っている。

## 抽出した知見

### 今後の開発ルール候補
- backlog 健全性は **件数だけで判断しない**。少なくとも `count / oldest / newest / top prefixes / invalid JSON / 24h delta` をセットで見る。
- OpenClaw 更新や障害切り分けでは、**version 差分より先に invocation path 差分**（shell PATH / symlink / LaunchAgent `ProgramArguments`）を確認する。
- 更新作業は **pre-update baseline → change → post-update smoke check** を1セットにする。
- `gateway.probe_failed` のような警告は、**Telegram / browser / gateway の実機能が生きているか** と分けて解釈する。
- 外部アイデア探索は、単なる列挙で終わらせず **地域適合・自動化適合・競争密度・実装難度** で絞る。

### 避けるべき失敗
- `waiting_auth=476` のような **大きい数字だけで緊急度を決める** こと。
- CLI 不安定をすぐ **バージョン不整合のせい** と決めつけること。
- 更新前の状態を残さず、更新後に **何が悪化したのか比較できない** まま調査すること。
- `missing scope: operator.read` を見ただけで、**実際の Telegram/gateway 障害と誤認** すること。
- 市場調査で需要だけを見て、**自分たちの自動化適合性や日本市場適合を検証しない** こと。

### 再利用できる施策
- queue の **read-only telemetry snapshot** を `reports/cron/` に定期出力する方式。
- `~/.local/bin/openclaw` のような **固定入口** を作り、login shell と LaunchAgent の参照先を揃える方式。
- 更新前に **version / service state / auth scopes / known warnings / file hashes** を記録する baseline テンプレート。
- 更新後に **Telegram / browser / cron / subagent / CLI path** をまとめて確認する smoke checklist。
- project scout で **pain point → Japan fit → OpenClaw fit → feasibility → intentionally deprioritized** の順で整理する評価枠。

### 文書化すべき運用知見
- `waiting_auth` / `waiting_manual_review` の telemetry 項目定義と snapshot 出力場所。
- OpenClaw 更新時の baseline テンプレートと post-update smoke 手順。
- `gateway.probe_failed` を実障害と見なす条件 / 見なさない条件。
- CLI path / LaunchAgent target の確認コマンド集。
- sidebiz 系の project scout を継続するなら、評価基準テンプレート化。

## ルール化候補
1. **Count-only monitoring 禁止**: queue / backlog は件数単独で判定しない。
2. **Update baseline 必須**: OpenClaw 更新前に baseline を保存しない更新は原則避ける。
3. **Path-first debugging**: CLI 異常時は version より先に PATH / symlink / LaunchAgent を確認する。
4. **Probe warning 分離**: deep probe warning は実機能ヘルスと分けて扱う。
5. **Scout filtering 標準化**: 事業アイデア探索は feasibility と除外理由まで残す。

## 再発防止ポイント
- backlog 観測は `件数` ではなく **増減と古さ** を見る。
- 更新系作業は **比較可能な before/after** を必ず残す。
- 「警告が出た」ことと「サービスが死んだ」ことを混同しない。
- shell と daemon で別バイナリを踏む事故を防ぐため、**実行経路を固定** する。
- 調査レポートは「採用案」だけでなく **明示的な非採用理由** を残す。

## docs / project docs に反映すべき内容
- `projects/openclaw-core/docs/status.md`: queue observability と probe-specific warning を current risk / active task に追加する。
- `projects/openclaw-core/backlog/queue.md`: queue telemetry、pre-update baseline、post-update smoke を Ready に追加する。
- `projects/openclaw-core/learn/improvement-ledger.md`: queue telemetry / path ambiguity / baseline-aware troubleshooting を ledger 化する。
- 追加提案のみ: sidebiz の scouting を継続するなら、後日 `docs/sidebiz/` に scout rubric を1枚作ると再利用しやすい。

## 実際に修正したこと
- `projects/openclaw-core/docs/status.md` を更新
  - queue count-only monitoring の弱さ
  - probe-specific warning の解釈リスク
  - baseline / smoke / telemetry の active task
- `projects/openclaw-core/backlog/queue.md` を更新
  - queue telemetry snapshot
  - pre-update baseline checklist
  - post-update smoke checklist
- `projects/openclaw-core/learn/improvement-ledger.md` を更新
  - queue observability
  - CLI path ambiguity
  - baseline-aware troubleshooting
- 本レビューを `reports/cron/workspace-report-learning-review-20260324-0300.md` に保存

## 前回との差分
- 前回の中心は **中央報告停止の単一点障害 / metric verification / artifact retention** だった。
- 今回はそこに加えて、**観測の粒度** と **更新時の比較可能性** が主要テーマとして追加された。
- 新規追加知見は主に以下:
  - queue backlog は件数だけでは運用判断できない
  - CLI 問題は version より invocation path を疑うべき場面がある
  - pre-update baseline があると warning の意味を過大評価しにくい
  - sidebiz scout は「需要あり」だけでなく「やらない理由」まで残すと再利用性が高い
- `trainer/` 側の新規更新はなく、知見ソースが **旧 trainer 運用から reports / project docs 側へ移行** していることが確認できた。

## 次アクション
1. `waiting_auth` / `waiting_manual_review` の read-only telemetry snapshot を小さなスクリプトか cron report として実装する。
2. OpenClaw 更新用の baseline / smoke checklist をテンプレ化する。
3. `gateway.probe_failed` の扱いを、実害あり/なしの判断基準として1枚に切り出す。
4. sidebiz の project scout を続けるなら、評価 rubric を `docs/sidebiz/` に新設する。
5. 次回 review では、今回 backlog に積んだ3項目（telemetry / baseline / smoke）の実装有無を差分確認する。
