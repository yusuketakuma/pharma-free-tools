# Proactive Idle Work Discovery — Board Review

Date: 2026-03-26 14:20 JST

## 結論
今日の board review では、**新規の大きな探索よりも、`waiting_auth` / `waiting_manual_review` の stale backlog を 1ページ runbook に固定して実運用へ落とすこと** を最優先にした。

直近の board ではすでに以下が一致している。
- stale backlog は **safe-close / reopen / escalate** で扱う
- routine output は **digest / signal-only** に寄せる
- dominant-prefix の反復は **Queue Triage Analyst** に分離する
- auth / trust boundary / routing / approval / Telegram 根幹は今回も触らない

## 今回見つけた候補（最大3件）
1. **stale backlog triage を 1ページ runbook に固定する**
   - 内容: `waiting_auth` / `waiting_manual_review` の safe-close / reopen / escalate / owner / due / evidence を 1枚に圧縮
   - 理由: 反復判断を減らし、再発時の迷いをなくせる
   - board 判定: **採用**

2. **dominant-prefix triage を `Queue Triage Analyst` に役割分離する**
   - 内容: `step6-dedupe` / `step6-plan-auth-runtime` / `lane-runtime-auth-ng` / `step6-lane-write-blocked` / `lane-runtime-partial-write` / `step6-acp-mock-contract` を、supervisor-core の再レビュー連打ではなく専任 triage に寄せる
   - 理由: 反復 prefix の処理を運用役割として固定した方が、判断の再利用性が高い
   - board 判定: **採用**（ただし実装は runbook と owner 定義に限定）

3. **workspace ↔ live runtime の bundle manifest + dry-run sync を進める**
   - 内容: `.openclaw/` の反映をファイル単位ではなく bundle 単位で確認する
   - 理由: 効果は高いが、実行層への波及範囲が広く、深い確認が必要
   - board 判定: **保留**

## board の採否判断
- **採用**: 1, 2
- **保留**: 3

### Board の評価
- **Board Visionary**: 1 と 2 は単発の掃除ではなく、再発を減らす運用構造に寄与する
- **Board User Advocate**: 1 は現場で使いやすく、2 は責務の境界が明確になる
- **Board Operator**: 1 は即日反映しやすく、2 は owner だけ先に固定すれば段階導入できる
- **Board Auditor**: 3 は高レバレッジだが、partial sync の失敗条件がまだ重い
- **Board Chair**: 今回は 1 を主軸、2 を補助、3 は deep review 待ち

## 実際に着手したもの（最大1件）
- 本報告を新規作成し、今日の board decision を `reports/cron/` に固定した

## 残した成果物 / 差分
- 新規: `reports/cron/proactive-idle-work-discovery-20260326-1420.md`
- 既存 board 記録の参照: `reports/board/board-premeeting-brief-latest.md`, `reports/board/agenda-seed-latest.md`, `reports/cron/board-postmeeting-agent-dispatch-20260326-0744.md`

## 見送った理由
- **bundle manifest + dry-run sync を即着手しない**: 効果は高いが、実行層の波及が広く deep review が必要
- **Telegram 設定変更**: 禁止
- **auth / trust boundary / routing / approval の根幹変更**: 禁止
- **既存 high-priority task を壊す横入り**: 回避

## 次アクション
1. `supervisor-core` の triage runbook 初稿を 1ページに圧縮する
2. `doc-editor` で owner / next action / success criteria を短文化する
3. `board-auditor` で safe-close / reopen の失敗条件だけ追加監査する
4. bundle manifest + dry-run sync は、bundle manifest / dry-run diff / smoke check を 1 セットの証跡として扱う前提で再審議する

## 通知
- 通常通知は行っていない
- 報告は定期報告へ集約する
