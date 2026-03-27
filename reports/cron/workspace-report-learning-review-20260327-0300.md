# Workspace report learning review

- 実行時刻: 2026-03-27 03:00 JST
- 対象差分基準: `reports/cron/workspace-report-learning-review-20260326-0300.md`
- 今回確認した新規対象:
  - `reports/proactive-idle-work-discovery-2026-03-27.md`
  - `reports/board/idle-discovery-board-review-20260327.md`
  - `reports/board/agenda-seed-latest.md`
  - `reports/board/claude-code-precheck-latest.md`
  - `reports/board/board-premeeting-brief-latest.md`
  - `reports/cron/cross-agent-knowledge-sync-20260327-0035.md`
  - `reports/growth/self-improvement-verification-latest.md`
  - `reports/board/precedent-maintenance-latest.md`

## 結論
- 今回の追加知見で再利用価値が最も高いのは、**completion claim を証跡化すること**、**review / apply / manual_required / effect-confirmed を分けること**、**Queue Triage Analyst に繰り返し prefix を渡すこと** の3点。
- 3/26 までのテーマが「queue triage / bundle sync / stale backlog の標準化」だったのに対し、今回は **レポートの完了判定そのものを誤認しないための状態分離** が前面に出た。
- `reports/` 側では Board / verification / idle discovery が揃ってきたが、価値の中心は報告量ではなく、**報告をそのまま完了扱いしない運用** にある。

## 抽出した知見

### 今後の開発ルール候補
- completion claim を含むレポートは、**主証跡 + スポットチェック + 証跡メモ** を必須にする。
- `review-approved` / `apply-applied` / `apply-blocked` / `manual_required` / `pending_artifact` / `effect-confirmed` を一つの「done」にまとめない。
- `apply-applied` は「変更が入った」だけであり、**意図した効果が出た証明** とは別に扱う。
- queue telemetry は、同じ prefix が続くなら **Queue Triage Analyst** に渡し、supervisor-style の追加レビューを増やさない。
- board / verification の出力は、通常時は digest、異常時のみ candidate という **anomaly-delta** に寄せる。

### 避けるべき失敗
- 数値のあるレポートを、ファイル確認なしに `done` と書くこと。
- `apply-applied` を `verified` と同一視すること。
- manual_paths が残る状態を「完了」と誤記すること。
- 同じ prefix の telemetry を眺め続けて、triage に落とさないこと。
- report の文面だけ整えて、証跡がないまま完了宣言すること。

### 再利用できる施策
- `metric-claim-verification-checklist.md` による completion claim の証跡化。
- report verification state model による状態分離。
- dominant-prefix triage checklist + Queue Triage Analyst 路線。
- board / verification の anomaly-delta snapshot と candidate cap。
- stale queue の safe-close / reopen policy を board で固定する流れ。

### 文書化すべき運用知見
- completion claim の proof path（主証跡・スポットチェック・証跡メモ）。
- close record の必須項目（owner / next_action / success_criteria / review_after / linked_evidence）。
- report / apply / manual_required / effect-confirmed の状態遷移。
- Queue Triage Analyst への振り分け条件と、同一 prefix の再掲抑制。
- board / verification の「平常は digest、異常だけ candidate」契約。

## ルール化候補
1. **Proof-path required**: completion claim は証跡が揃うまで完了扱いにしない。
2. **State separation**: review / apply / manual_required / effect-confirmed を同じ完了状態にまとめない。
3. **Telemetry-to-triage**: 同一 prefix の反復は triage に接続し、観測だけで終わらせない。
4. **Anomaly-delta only**: board / verification は平常時に candidate を量産せず、異常時のみ上げる。

## 再発防止ポイント
- 数値のある報告は、**ファイル・ログ・サンプル** で必ず裏を取る。
- applied という事実と verified という事実を混同しない。
- manual_required や pending_artifact は、状態が残っている限り完了ではない。
- queue の観測を増やすより、prefix ごとの次アクションを早く確定する。

## 実際に修正したこと
- `projects/openclaw-core/docs/report-verification-state-model.md` を新規作成
- `projects/openclaw-core/docs/status.md` を更新
  - report / apply / manual_required / effect-confirmed の状態分離を current risk / active task に追加
- `projects/openclaw-core/backlog/queue.md` を更新
  - report verification state model を Ready に追加
- `projects/openclaw-core/ops/RUNBOOK.md` を更新
  - report verification states の運用メモを追加
- `projects/openclaw-core/learn/improvement-ledger.md` を更新
  - report lifecycle states と effect confirmation の分離を追加
- `trainer/summary.md` と `trainer/lessons-learned.md` を更新
  - completion claim の証跡化と state separation の教訓を追加
- `trainer/last-report-time.txt` を更新
- 本レビューを `reports/cron/workspace-report-learning-review-20260327-0300.md` として保存

## 前回との差分
- 前回の中心は、**dominant-prefix triage**、**stale backlog safe-close / reopen**、**bundle sync / dry-run** だった。
- 今回はその上に、**レポートや変更結果を完了扱いする前の証跡確認** が主要テーマとして追加された。
- 新規追加知見は主に以下:
  - completion claim は proof path がないと危険
  - applied change と verified outcome は別物
  - manual_paths / pending_artifact は完了状態ではない
  - board / verification は通常時に candidate を増やさず、異常だけを上げる
- `trainer/` 側は 3/21 以来の更新が止まっていたため、今回で最新の state separation 教訓を追記した。

## 次アクション
1. 次回の report / review では、数値や完了主張があれば `metric-claim-verification-checklist.md` を先に通す。
2. `review-approved` / `apply-applied` / `manual_required` / `pending_artifact` / `effect-confirmed` の状態語を混ぜない。
3. Queue Triage Analyst runbook は、prefix が繰り返すときだけ使い、観測を narrative で増やさない。
4. board / verification は平常 digest と異常 candidate の分離を維持し、再掲を増やさない。
5. report の完了宣言は、今後も proof path が揃うまで保留する。
