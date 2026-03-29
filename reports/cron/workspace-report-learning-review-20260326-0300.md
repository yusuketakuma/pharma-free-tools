# Workspace report learning review

- 実行時刻: 2026-03-26 03:00 JST
- 対象差分基準: `reports/cron/workspace-report-learning-review-20260325-0300.md`
- 今回確認した新規対象:
  - `reports/cron/autonomy-loop-health-review-20260325-0500.md`
  - `reports/cron/autonomy-escalation-rule-review-20260325-0530.md`
  - `reports/cron/agent-scorecard-review-20260325-0600.md`
  - `reports/cron/agent-lesson-capture-20260325-0615.md`
  - `reports/cron/agent-workforce-expansion-review-20260325-0645.md`
  - `reports/cron/agent-performance-optimization-review-20260325-0715.md`
  - `reports/cron/domain-specialization-growth-review-20260325-0700.md`
  - `reports/cron/cross-agent-knowledge-sync-20260325-0850.md`
  - `reports/cron/cross-agent-knowledge-sync-2026-03-25-1250.md`
  - `reports/cron/proactive-idle-work-discovery-20260325-1420.md`
  - `reports/cron/board-agenda-assembly-20260325-1635.md`
  - `reports/cron/board-agenda-assembly-20260325-1835.md`
  - `reports/cron/board-agenda-assembly-20260325-2035.md`
  - `reports/openclaw-live-runtime-reflection-audit-2026-03-25.md`
  - `reports/heartbeat-governance-implementation-2026-03-25.md`
  - `reports/heartbeat-prompt-diff-2026-03-25.md`
  - `reports/board-runtime-implementation-plan-2026-03-25.md`
  - `reports/board-layer-rollout-plan-2026-03-25.md`
  - `reports/board-hardening-followup-2026-03-25.md`
  - `reports/anomaly-delta-migration-before-after-2026-03-25.md`
  - `reports/cron/sidebiz-project-scout-20260325-0900.md`
  - `reports/cron/project-kpi-registry-maintenance-20260324-0600.md`
- `trainer/` 配下は 2026-03-21 以降の新規更新を確認できず、今回も既存教訓との整合確認のみ実施した。

## 結論
- 今回の追加知見で再利用価値が最も高いのは、**dominant-prefix telemetry を専任 triage に切ること**、**heartbeat / scorecard / board を通常レビューから anomaly-delta monitor に縮退すること**、**workspace ↔ live runtime の反映を bundle 単位に固定すること** の3点。
- `supervisor-core` 系は「観測・整理・品質レビュー」を同居させるほど重複しやすく、同じ論点を別名で増やしがちだった。今後は Queue Triage Analyst を前段に置いて、再掲を止めるのが妥当。
- `reports/` 側では board / heartbeat / scout / runtime の各レーンが揃ってきたが、価値の中心は「報告を増やすこと」ではなく、**同じ報告を繰り返さない運用へ移すこと** にある。

## 抽出した知見

### 今後の開発ルール候補
- queue telemetry は、同じ prefix が続くなら **Queue Triage Analyst** に渡し、supervisor-style の追加レビューを増やさない。
- heartbeat / scorecard / board 系は、平常時は digest、異常時のみ candidate という **anomaly-delta monitor** に寄せる。
- `agent-scorecard-review` と `autonomy-loop-health-review` は、通常時に board 候補を量産しない。
- workspace ↔ live runtime の差分反映は、個別 adapter の差し替えではなく **bundle manifest + dry-run** を必須にする。
- sidebiz は候補比較を続けるなら、**1候補1入口** と `owner / due / success criteria` の固定を崩さない。
- stale queue backlog は telemetry 問題ではなく、board-routed の **safe-close / reopen** 問題として扱う。

### 避けるべき失敗
- 似た prefix の telemetry を眺め続けて、triage に落とさないこと。
- 通常レビューと異常レビューを混ぜて、Board へ平常報告を流し込むこと。
- live runtime へ `run_claude_acp.py` / `run_claude_code.sh` / `execute_task.py` を部分同期すること。
- sidebiz の候補を増やすだけで、PoC 入口や次アクションを固定しないこと。
- stale backlog を「まだ telemetry を見る段階」と誤認し、safe-close / reopen の判断を先送りにすること。

### 再利用できる施策
- dominant-prefix triage checklist + Queue Triage Analyst 路線。
- board / heartbeat の anomaly-delta snapshot と candidate cap。
- bundle manifest + dry-run による live runtime 反映手順。
- board-routed stale queue backlog の safe-close / reopen policy。
- sidebiz scout の `pain point → customer → Japan fit → OpenClaw fit → difficulty → next action` テンプレ。

### 文書化すべき運用知見
- queue telemetry の read-only 運用と triage への接続条件。
- stale backlog の safe-close / reopen 条件と再掲抑制ルール。
- board / heartbeat の「平常は digest、異常だけ candidate」契約。
- workspace ↔ live runtime の bundle sync 手順と dry-run 要件。
- sidebiz の PoC 接続時に `owner / due / success criteria` を必須にするルール。

## ルール化候補
1. **Queue Triage Analyst 優先化**: repeated dominant-prefix は専任 triage に流し、supervisor-core の再掲を抑える。
2. **Anomaly-delta only**: board / heartbeat / scorecard は平常時に candidate を出さず、異常時だけ上げる。
3. **Bundle sync only**: live runtime 反映は bundle manifest + dry-run を必須化し、部分同期を禁止する。
4. **Board-backed stale backlog policy**: auth 回復後の stale backlog は safe-close / reopen を board で固定する。
5. **Sidebiz 1-entry policy**: 1候補1入口を崩さず、owner / due / success criteria を未記入の候補は保留にする。

## 再発防止ポイント
- telemetry を増やすより、**次アクションを確定する速度** を上げる。
- 同じ prefix の再掲が続くなら、報告ではなく triage 経路を変える。
- board 候補は routine と anomaly を混ぜず、必要なときだけ深掘りする。
- runtime 反映は file 単位ではなく、bundle 単位で前後比較する。
- sidebiz の候補は「やる理由」だけでなく「やらない理由」も残す。

## 実際に修正したこと
- `projects/openclaw-core/docs/status.md` を更新
  - live runtime の contract bundle drift リスクを追加
  - Queue Triage Analyst 路線と bundle-manifest / dry-run sync を active task に追加
- `projects/openclaw-core/backlog/queue.md` を更新
  - board-approved safe-close / reopen policy を Ready に追加
  - bundle manifest + dry-run sync を Ready に追加
- `projects/openclaw-core/ops/RUNBOOK.md` を更新
  - Queue Triage Analyst への振り分け
  - runtime bundle sync / live reflection safety を追加
- `projects/openclaw-core/learn/improvement-ledger.md` を更新
  - Queue Triage Analyst / stale backlog safe-close-reopen
  - workspace ↔ live runtime の bundle sync safety
- 本レビューを `reports/cron/workspace-report-learning-review-20260326-0300.md` として保存

## 前回との差分
- 前回の中心は、**観測の整備** と **triage checklist 化** だった。
- 今回はその次の段階として、**同じ観測を繰り返さない運用** に進んだ。
- 具体的には、`queue telemetry → triage → review` の重複を抑え、`heartbeat / board / scorecard` を anomaly-delta 化し、runtime は bundle 反映へ寄せる方針が明確になった。
- sidebiz は継続して再利用性が高いが、候補の入口を増やすより、PoC 化の入口を固定する方向がより重要になった。
- `trainer/` には新規更新がなかったため、今回は差分の主戦場が完全に `reports/` と `projects/openclaw-core/` 側に移った。

## 次アクション
1. 次回の queue / supervisor レビューでは、telemetry ではなく **dominant-prefix triage と owner / next action / success criteria** を先に出す。
2. stale queue backlog の safe-close / reopen 条件を board decision として固定する。
3. workspace ↔ live runtime の反映前に、bundle manifest と dry-run comparison を標準化する。
4. sidebiz は次回も候補比較を続けるなら、1候補1入口と PoC 接続を崩さない。
5. board / heartbeat は平常 digest と異常 candidate の分離を維持し、再掲を増やさない。
