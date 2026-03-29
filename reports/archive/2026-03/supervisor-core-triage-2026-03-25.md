# Supervisor Core Triage Proposal — 2026-03-25

## 結論
今この瞬間に着手すべき内部業務は、**queue telemetry を“観測”で終わらせず、dominant prefix ごとの triage checklist に落とすこと**。  
低リスクで、滞留解消に直接つながり、しかも再利用しやすい。

## 現在の詰まり / 滞留
- `.openclaw/tasks/` では **REVIEWING 5件 / READY_FOR_EXECUTION 3件 / EXECUTION_FAILED 2件** が残っている。
- 失敗例は `smoke-read-001`, `smoke-read-002`。前者はセッション実行失敗、後者は runtime error (`list` object has no attribute `get`)。
- REVIEWING のタスク群は 2026-03-22 起点で停滞しており、回転が弱い。
- 直近の queue telemetry では `waiting_auth=476`, `waiting_manual_review=343`, 24h delta は両方 0。つまり**新規増加より停滞**が主問題。
- cron 系は `coding-30m-assign` が 4本、`sidebiz-project-scout` と `workspace-report-learning-review` がそれぞれ 2本あり、**同系統の反復がやや多い**。

## 候補トップ3
1. **queue dominant-prefix triage checklist**（推奨）
   - `step6-dedupe` / `step6-plan-auth-runtime` / `lane-runtime-auth-ng`
   - `step6-lane-write-blocked` / `lane-runtime-partial-write` / `step6-acp-mock-contract`
   - それぞれに「確認観点」「切り分け順」「次アクション」を固定する
   - 効き目: 観測を triage に変えて、再発時の判断負担を下げる

2. **artifact retention policy**
   - `.openclaw/tasks/`, `reports/cron/`, 一時 `*.html.tmp` の保管ルールを明文化
   - 効き目: 生成物の増殖と探索コストを下げる

3. **stale-report detection の read-only 追跡強化**
   - 既存 spec はあるので、新規変更ではなく「未成功時の見え方」を固定する補助物に限定
   - 効き目: 期限系の見落とし防止

## 実際に着手したもの（最大1件）
- `queue dominant-prefix triage checklist` の草案を、このレポートとして作成した。

## 残した成果物 / 差分
- 新規: `reports/supervisor-core-triage-2026-03-25.md`
- 中身: current stall の要約 / 候補トップ3 / 推奨案 / 次アクション

## 見送った理由
- **Telegram 設定変更**: 禁止
- **auth / trust boundary / routing の根幹変更**: 禁止
- **stale-report detection の実装本体**: 既に spec があり、今回は観測→triage の橋渡しが先
- **artifact retention policy の実装本体**: 重要だが、今回の停滞への即効性は triage checklist より弱い

## 次アクション
1. この checklist を runbook 化する
2. dominant prefix ごとに owner / next action / success criteria を 1 行で固定する
3. その後、必要なら小さな自動集計に落とす
