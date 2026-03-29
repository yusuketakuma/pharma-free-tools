# Proactive Idle Work Discovery — 2026-03-27 Follow-up

## 結論
今回は **OpenClaw Core の既存 triage 成果物を運用導線に載せる** ことを優先した。Board Review の結果、最も低リスクで即効性があるのは **Queue Triage Analyst runbook を status に露出させること**。

## Board review
### Board Visionary
- すでに runbook があるなら、次は「見つけやすさ」を上げるのがレバレッジになる。
- triage を再発見コスト込みで回すより、status から 1 クリックで辿れる方が継続運用に効く。

### Board User Advocate
- ゆうすけが次に見る場所は status。ここに入口があるのが一番わかりやすい。
- 新しい仕組みを増やすより、既存の案内を整える方が負担が小さい。

### Board Operator
- 今すぐできる最小実行案は、`projects/openclaw-core/docs/status.md` に runbook への案内を1行追加すること。
- コードや routing に触れないので、可逆性が高い。

### Board Auditor
- auth / routing / approval / Telegram の根幹変更は不要。
- 既存ドキュメントの参照導線を増やすだけなので、危険度は低い。

### Board Chair
- 争点は「新規の検知を増やすか」ではなく「既存の triage 資産を使える状態にするか」。
- 採否は、runbook の入口整備を採用。

## 今回見つけた候補
1. **採用**: Queue Triage Analyst runbook を `openclaw-core` status から辿れるようにする
   - 目的: 再発する dominant-prefix triage の入口を固定する
   - 効果: 次回以降の判断コストを下げる
   - リスク: 低

2. **保留**: Artifact retention policy の実運用化
   - 目的: `.openclaw/tasks/` / `reports/cron/` / `*.html.tmp` の蓄積抑制
   - 理由: 重要だが、今回の即効性は runbook 入口整備より弱い

3. **保留**: Stale-report detection の read-only snapshot 化
   - 目的: CEO / department reporting job の停止検知を実測で見える化する
   - 理由: 有用だが、今回は既存 triage の導線整備を優先

## Board の採否判断
- 候補1: 採用
- 候補2: 保留
- 候補3: 保留

## 実際に着手したもの
- `projects/openclaw-core/docs/status.md` を更新し、`projects/openclaw-core/docs/queue-triage-analyst-runbook.md` を operator entrypoint として明示

## 残した成果物 / 差分
- 更新: `projects/openclaw-core/docs/status.md`
- 新規: `reports/proactive-idle-work-discovery-2026-03-27-followup.md`

## 見送った理由
- Telegram 設定変更は探索禁止領域
- auth / trust boundary / routing の根幹変更は高リスク
- 既存 backlog を壊す横入りは避けるべき
- 追加の一般論調査は価値が薄い

## 次アクション
1. 次回の board review で artifact retention policy を候補化する
2. stale-report detection の snapshot 取得が可能なら read-only で実測確認する
3. queue triage の出番があれば、この runbook を基点に処理する
