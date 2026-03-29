# Board Post-Meeting Agent Dispatch — 2026-03-26 07:44 JST

## 結論
直近の decision ledger を確認した結果、今回の会議後運用は **新規の大きな方針変更ではなく、stale queue backlog の triage / closure / reopen を実運用に落とすこと** が中心です。

特に、次の2点を優先します。

1. `waiting_auth` / `waiting_manual_review` の backlog を、再審議の連打ではなく **safe-close / reopen / escalate の運用ルール** に変える
2. routine な heartbeat / scorecard 系は **digest-only** に寄せ、candidate 化は anomaly / delta / precedent gap に限定する

auth / trust boundary / routing / approval / Telegram 根幹の変更は、今回の指示対象に含めません。

## 会議で確定した主要方針
- backlog は **単発棚卸しではなく triage policy** として扱う
- supervisor-core の重複しやすい review loop は、**runbook と owner ベースの運用** に寄せる
- routine output は **signal / digest** に留め、Board は例外と差分だけを見る
- `waiting_auth` / `waiting_manual_review` は **自動 drain しない**

## エージェント別指示一覧

| エージェント | Owner | 状態 | 次アクション | 期限 / 次の見直しタイミング | 止める条件 |
|---|---|---|---|---|---|
| ceo-tama | ceo-tama | 継続 | Board 方針を維持し、例外・差分・precedent gap だけを上げる。supervisor-core の triage draft を確認する。 | 次回 heartbeat / board cycle（12:00 JST 目安） | auth / trust boundary / routing / approval / Telegram 根幹に触れる必要が出たら停止 |
| supervisor-core | supervisor-core | 新規着手 | `waiting_auth` / `waiting_manual_review` の safe-close / reopen / escalate ルールを runbook 化し、dominant-prefix triage を分離する。 | 12:00 JST までに初稿、次回 board で再確認 | ルール変更が auth / trust boundary / approval に触れるなら停止し、Board にエスカレート |
| board-visionary | board-visionary | 監視 | ledger bridge / contract reuse の観点は維持するが、今は backlog triage の定着を優先して監視に留める。 | 次回 board cycle | 新たな precedent gap が出ない限り停止不要、ただし boundary 変更案は出さない |
| board-user-advocate | board-user-advocate | 監視 | 人間が迷わず使える文面かだけ確認し、条件が短く読めるかを見る。 | 次回 board review | 複雑化や手順増加が見えたら止めて簡素化案へ戻す |
| board-operator | board-operator | 継続 | triage policy を実行手順に落とし、queue 運用に反映する準備を進める。 | 12:00 JST までに反映可否を確認 | protected boundary をまたぐ変更が必要なら停止 |
| board-auditor | board-auditor | 監視 | backlog の safe-close が silent failure になっていないか、reopen 条件が曖昧でないかを監視する。 | 次回 board cycle | 自動 drain / 黙殺 / boundary drift の兆候が出たら停止 |
| research-analyst | research-analyst | 調査 | `waiting_auth` / `waiting_manual_review` の dominant prefix、滞留期間、reopen パターンを絞って調べる。 | 12:00 JST までに短い evidence-only 版 | 既存 telemetry の焼き直しになるなら停止 |
| github-operator | github-operator | 待機 | 現時点では repo 変更なし。doc/runbook の確定後にのみ実装へ入る。 | 次回 board cycle で再評価 | 承認済みでない doc / policy / protected path の変更が必要なら停止 |
| ops-automator | ops-automator | 継続 | stale queue の再発と reopen を監視し、勝手な自動 drain はしない。 | 次回 heartbeat（12:00 JST 目安） | policy 未確定のまま自動化を広げる必要が出たら停止 |
| doc-editor | doc-editor | 新規着手 | safe-close / reopen / escalate / owner / due / evidence を一枚で読める runbook 文面に整える。 | 12:00 JST までに初稿 | governance 変更や root contract 変更に発展するなら停止 |
| dss-manager | dss-manager | 待機 | 今回は DSS 固有の新規着手なし。今回は backlog triage の運用結果待ち。 | 次回 board cycle | DSS に転用可能なパターンが出ない限り待機 |
| opportunity-scout | opportunity-scout | 監視 | backlog churn を減らすか contract 境界を明確化するものだけ拾う。routine telemetry の再掲は抑制する。 | 次回 board cycle | 既存の stale-queue / ledger-bridge 系の焼き直しなら停止 |

## 即時着手項目
- supervisor-core: triage runbook 初稿
- doc-editor: 1ページ版の運用文面
- research-analyst: dominant prefix と滞留期間の要約
- ops-automator: 監視条件の整理

## 待機項目
- github-operator: 実装待ち
- dss-manager: DSS 転用可能なパターン待ち
- board-visionary / board-user-advocate / board-auditor: 新しい boundary 変更案は出さず監視

## 次回会議までの監視項目
- `waiting_auth` / `waiting_manual_review` の件数と 24h delta
- reopen 率と safe-close 後の再発率
- candidate→board-touch 比率の悪化有無
- routine report の candidate 化が再び増えていないか
- dominant-prefix triage が supervisor-core に再集中していないか

## 補足
- 今回は通常通知を行わず、内部運用の記録としてのみ残す
- 決定の性質は **investigate / follow-up owner 指定** であり、根幹の権限変更ではない
