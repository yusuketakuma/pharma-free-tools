# Workspace report learning review

- 実行時刻: 2026-03-25 03:00 JST
- 対象差分基準: `reports/cron/workspace-report-learning-review-20260324-0300.md`
- 今回確認した新規対象:
  - `reports/supervisor-core-scan-2026-03-24.md`
  - `reports/supervisor-core-decision-quality-review-2026-03-25.md`
  - `reports/supervisor-core-triage-2026-03-25.md`
  - `reports/cron/cross-agent-knowledge-sync-20260324-2250.md`
  - `reports/cron/openclaw-queue-telemetry-2026-03-24.md`
  - `reports/cron/proactive-idle-work-discovery-2026-03-24.md`
  - `reports/cron/sidebiz-project-scout-20260324-0900.md`
  - `reports/cron/project-kpi-registry-maintenance-20260324-0600.md`
  - `reports/dds-agent-integration-audit-2026-03-24.md`
  - `reports/dds-agent-runner-progress-2026-03-24.md`
  - `reports/dds-agent-live-register-checklist-2026-03-24.md`
  - `reports/dds-agent-live-run-2026-03-24.md`
  - `reports/dds-agent-overall-review-2026-03-24.md`
  - `reports/dds-agent-review-remediation-2026-03-24.md`
- `trainer/` 配下は 2026-03-21 以降の新規更新を確認できず、今回は既存教訓との整合確認のみ実施。

## 結論
- 今回の追加知見で再利用価値が最も高いのは、**queue telemetry を dominant-prefix triage に変換すること**、**sidebiz scout で隣接する痛点を混ぜず owner / due / success criteria を必須化すること**、**DDS remote runner の実接続後に secret / state をすぐ片付けること** の3点。
- 以前のレビューは「観測を整える」比重が高かったが、今回は **観測 → triage → 実行** に進めるための形が見えてきた。
- `trainer/` 由来の新規知見は今回はなく、学びの中心は `reports/` 側に完全に移っている。

## 抽出した知見

### 今後の開発ルール候補
- queue telemetry は、同じ prefix が反復したら **prefix 単位の triage checklist** に落とす。
- 研究 / 探索の候補は、同じ funnel でも **入口が違う痛点は別候補として扱う**。
- sidebiz のように initiative が変わったら、**旧 KPI を流用せず baseline を再形成** する。
- remote worker / launcher 系は、register 成功後の **bootstrap secret 除去** と、terminal callback 後の **active state クリア** を標準化する。

### 避けるべき失敗
- telemetry を何度も取るだけで、triage と owner 割り当てに進まないこと。
- quote follow-up / missed-call / invoice matching のような隣接課題を、1つの案件として雑にまとめること。
- 旧 affiliate / funnel KPI を、現在の sidebiz scout の成果判定にそのまま使うこと。
- DDS のような remote runner で、消費済み bootstrap token や stale active ids を state に残したまま運用すること。

### 再利用できる施策
- `reports/cron/` に置く read-only queue telemetry snapshot。
- dominant-prefix ごとに **owner / next action / success criteria** を1行で残す triage runbook。
- sidebiz scout 用の比較テンプレート（pain point / customer / Japan fit / OpenClaw fit / difficulty / competition density / why now / deprioritized reason / next action / owner / due / success criteria）。
- DDS remote runner の live register / heartbeat / claim / E2E で使える安全停止・secret cleanup パターン。

### 文書化すべき運用知見
- blocked queue の dominant-prefix triage 手順。
- sidebiz の候補を混同しない比較ルール。
- current initiative に合わせて KPI baseline を引き直すルール。
- remote runner の secret cleanup / active state cleanup / retry jitter。

## ルール化候補
1. **Telemetry-to-triage 必須化**: queue telemetry は観測で終わらせず、dominant-prefix triage へ接続する。
2. **Problem separation**: 隣接する pain point を同じ候補に混ぜない。
3. **Initiative-specific KPI**: 新しい探索テーマに入ったら旧 KPI を archive し、現行テーマ用の baseline を作り直す。
4. **Runner secret hygiene**: register 後の bootstrap secret 除去と、terminal callback 後の active state クリアを標準化する。

## 再発防止ポイント
- queue の観測を増やすより、prefix ごとの次アクションを早く確定する。
- 需要の強さだけで比較せず、どの入口で PoC するかを固定してから比較する。
- KPI は「以前の流れ」ではなく「今のテーマ」に合わせる。
- remote runner は、成功しても secret/state が残っていないかを最後に必ず確認する。

## 実際に修正したこと
- `projects/openclaw-core/docs/queue-dominant-prefix-triage.md` を新規作成
- `projects/openclaw-core/docs/status.md` を更新
  - dominant-prefix triage を current risk / active task に追加
- `projects/openclaw-core/backlog/queue.md` を更新
  - dominant-prefix triage checklist を Ready に追加
- `projects/openclaw-core/learn/improvement-ledger.md` を更新
  - queue triage / sidebiz problem separation / DDS runner hardening の3知見を追加
- `docs/sidebiz/scout-rubric.md` を更新
  - adjacent pain points を混ぜない problem separation rule を追加
- 本レビューを `reports/cron/workspace-report-learning-review-20260325-0300.md` に保存

## 前回との差分
- 前回の中心は **queue telemetry の baseline 化**、**stale-report detection**、**artifact retention** だった。
- 今回はその次の段階として、**telemetry を triage に変える運用** が主要テーマになった。
- sidebiz は、単なる候補整理から **問題クラスの分離** と **owner / due / success criteria の必須化** へ進んだ。
- DDS は、接続可否の確認から **実運用に耐える後片付け**（secret/state cleanup）へ論点が移った。
- `trainer/` 側の新規更新はなく、差分の主戦場が完全に `reports/` に移っている点は前回と同じだが、今回はその内容がより実装寄りになった。

## 次アクション
1. queue telemetry が次回も同じ prefix を示したら、この triage doc をそのまま運用に使う。
2. 次回 sidebiz scout では、候補を混ぜずに1候補1入口で比較し、owner / due / success criteria を必ず埋める。
3. DDS 由来の secret/state cleanup パターンを、他の remote worker / launcher 系にも横展開できるか確認する。
4. もし queue 側で triage が回り始めたら、次は各 prefix の owner 実装 / review へ進める。
