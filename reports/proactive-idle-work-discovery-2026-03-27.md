# Proactive Idle Work Discovery — 2026-03-27

## 結論
今回は **OpenClaw Core の滞留解消を優先** した。Board Review の結果、最もレバレッジが高く、かつ低リスクで今すぐ残せる成果物は **Queue Triage Analyst 用 runbook の固定**。

## Board review
### Board Visionary
- いま最も価値が高いのは、個別の停滞を1件ずつ追うことではなく、dominant-prefix triage を再利用可能な業務として固定すること。
- これにより `waiting_auth` / `waiting_manual_review` の反復を、観測から remediation へ移せる。

### Board User Advocate
- ゆうすけが後から読んでも迷わない形がよい。
- 1枚で owner / next action / success criteria が分かる runbook は運用負担が小さい。

### Board Operator
- 今すぐできる最小実行案は、既存 checklist を runbook 化して成果物として残すこと。
- コードや routing には触らず、読み物ではなく運用手順として固定するのが最短。

### Board Auditor
- auth / routing / approval / Telegram 根幹変更は避けるべき。
- 低リスクの docs 追加に留めれば可逆性が高い。

### Board Chair
- 争点は「何を実行するか」ではなく「何を再利用可能な形で残すか」。
- 採否は、再利用性と低リスクを両立する runbook 固定を採用。

## 今回見つけた候補
1. **採用**: Queue Triage Analyst runbook の固定
   - 目的: dominant-prefix triage を毎回やり直さない
   - 効果: stall 解消の判断コストを下げる
   - リスク: 低

2. **保留**: Artifact retention policy の実運用化
   - 目的: `.openclaw/tasks/` や `*.html.tmp` の増殖抑制
   - 理由: 重要だが、今回のボトルネックに対する即効性は triage runbook より弱い

3. **保留**: Stale-report detection の read-only 追跡強化
   - 目的: CEO / department report の停止検知を確実にする
   - 理由: 既存 spec はあるため、今回は観測の補強より triage ループ固定を優先

## Board の採否判断
- 候補1: 採用
- 候補2: 保留
- 候補3: 保留

## 実際に着手したもの
- `projects/openclaw-core/docs/queue-triage-analyst-runbook.md` を新規作成
- 既存の dominant-prefix triage checklist を、実際の運用に落とし込む runbook として固定

## 残した成果物 / 差分
- 新規: `projects/openclaw-core/docs/queue-triage-analyst-runbook.md`
- 新規: `reports/proactive-idle-work-discovery-2026-03-27.md`

## 見送った理由
- Telegram 設定変更は探索禁止領域
- auth / trust boundary / routing の根幹変更は高リスク
- 既存の backlog を壊す横入りは避けるべき
- 追加の一般論調査は価値が薄い

## 次アクション
1. この runbook を backlog / status から参照しやすい位置にリンクする
2. 次回の queue snapshot で runbook の出番があるか確認する
3. 必要なら artifact retention policy を次の低リスク候補として固定する
