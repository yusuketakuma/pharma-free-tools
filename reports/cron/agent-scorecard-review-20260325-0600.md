# Agent Scorecard Review — 2026-03-25 06:00 JST

## 結論
- 全体としては前進しているが、**観測・整理が強い一方で、実行接続が弱い役割がいくつか残っている**。
- 直近で信頼度が高いのは **ceo-tama / supervisor-core / ops-automator / dss-manager / opportunity-scout**。
- **research-analyst / github-operator / doc-editor** は専用の直近実行証跡が薄く、今回は近接成果物ベースの **暫定スコア**。
- 最大の改善点は、**supervisor-core の重複抑制** と、**研究・文書化・repo運用を PoC / 実装 / publish に接続すること**。

## 前提
- 評価軸: 速度 / トークン効率 / 成果物の具体性 / 再利用性 / 手戻り率 / 指示逸脱率 / 実務インパクト
- `手戻り率` と `指示逸脱率` は **低いほど良い**。
- `research-analyst` / `github-operator` / `doc-editor` は、直近の専用 run が見つからなかったため、近接成果物からの暫定評価。

## エージェント別スコア要約

### 1) ceo-tama
**証跡**: `reports/company/ceo-tama-latest.md`, `reports/company/project-management-latest.md`

- 速度: 速い
- トークン効率: 中
- 成果物の具体性: 高い
- 再利用性: 高い
- 手戻り率: 低い
- 指示逸脱率: 低い
- 実務インパクト: 高い

**強み**
- 会社横断の要点集約が安定している。
- `P0/P1/P2` の並び替えと依存関係の言語化がうまい。

**弱み**
- 現場の未完了事項は見えるが、最後の実行は依存先に残りやすい。
- 情報が良い意味で安全寄りだが、緊急時は少し保守的。

**再配置示唆**
- 最終集約・優先順位付け・対ユーザー報告に固定。
- 低レベルの実行や反復調査は渡しすぎない。

**次アクション**
- blocker ごとに `owner / due / success criteria` を必須で残す運用を継続。

---

### 2) supervisor-core
**証跡**: `reports/supervisor-core-scan-2026-03-24.md`, `reports/supervisor-core-triage-2026-03-25.md`, `reports/supervisor-core-decision-quality-review-2026-03-25.md`, `reports/cron/autonomy-loop-health-review-20260325-0500.md`

- 速度: 中
- トークン効率: 低〜中
- 成果物の具体性: 高い
- 再利用性: 高い
- 手戻り率: 中
- 指示逸脱率: 低い
- 実務インパクト: 中

**強み**
- queue telemetry / prefix / mtime / delta など、根拠の具体性が高い。
- triage checklist 化や escalation ルール化に向いている。

**弱み**
- `queue telemetry → triage → decision-quality` の論点が重複しやすい。
- 観測は強いが、remediation への接続がまだ弱い。

**再配置示唆**
- 「観測役」から「triage + 重複抑制 + remediate へ橋渡し」へ寄せる。
- 同系統の再提案は抑制。

**次アクション**
- dominant-prefix 単位で `owner / next action / success criteria` を1行化し、再掲を減らす。

---

### 3) research-analyst
**証跡**: `reports/cron/sidebiz-project-scout-20260324-0900.md`, `reports/cron/project-kpi-registry-maintenance-20260324-0600.md`, `reports/cron/cross-agent-knowledge-sync-20260324-2250.md`

- 速度: 中
- トークン効率: 中
- 成果物の具体性: 高い
- 再利用性: 高い
- 手戻り率: 低い
- 指示逸脱率: 低い
- 実務インパクト: 高い

**強み**
- 痛点抽出が鋭い。`reseller listing fatigue` / `quote follow-up silence` / `invoice matching` のように、信号を整理して出せている。
- 需要の列挙で終わらず、`Japan fit` / `OpenClaw fit` / `difficulty` まで落とせる。

**弱み**
- PoC への接続はまだ弱く、次工程の owner が抜けやすい。
- 研究結果が増えるほど、比較の粒度が揃っていないと散らばりやすい。

**再配置示唆**
- 研究専任で使い、実装判断は別役割に渡す。
- `research -> rubric -> PoC` の橋渡しを固定化。

**次アクション**
- すべての scout 結果に `owner / due / success criteria` を必須化。
- 既存 baseline との差分がない候補は再掲しない。

---

### 4) github-operator
**証跡**: 直近の専用 run は未確認。近接証跡として repo 変更・GitHub Pages / Vercel まわりの整理、commit 履歴を参照。

- 速度: 中
- トークン効率: 中
- 成果物の具体性: 中〜高
- 再利用性: 中
- 手戻り率: 中
- 指示逸脱率: 低い
- 実務インパクト: 中

**強み**
- GitHub / repo 側の整理、URL 置換、リンク修正のような定型運用と相性がよい。
- repo hygiene に寄せるなら価値が出る。

**弱み**
- 直近の専用証跡が薄く、評価の確度が低い。
- 研究や判断を混ぜると役割がぼやけやすい。

**再配置示唆**
- GitHub 連携、PR 整理、リンク修正、リポジトリ清掃に限定。
- 調査系や設計系には寄せない。

**次アクション**
- 1〜2件の GitHub 側の具体 run を作り、baseline を明確化する。

---

### 5) ops-automator
**証跡**: `reports/dds-agent-runner-progress-2026-03-24.md`, `reports/dds-agent-live-run-2026-03-24.md`, `reports/dds-agent-review-remediation-2026-03-24.md`, `reports/dds-agent-overall-review-2026-03-24.md`

- 速度: 速い
- トークン効率: 中
- 成果物の具体性: 高い
- 再利用性: 高い
- 手戻り率: 低い
- 指示逸脱率: 低い
- 実務インパクト: 高い

**強み**
- 実接続、heartbeat、claim、cleanup まで運用の骨格を通している。
- secret/state cleanup と retry/backoff の論点が明確で、運用安全に効く。

**弱み**
- まだ「実運用化」より「接続整備」が主戦場。
- 監視・再実行は強いが、長期の状態健全性はさらに固める余地あり。

**再配置示唆**
- cron / runner / cleanup / retry / state hygiene に固定。
- 実装設計の大枠より、運用の安全化を担当させるのがよい。

**次アクション**
- bootstrap token 削除、active state クリア、jitter 追加を標準手順化。

---

### 6) doc-editor
**証跡**: `reports/cron/workspace-report-learning-review-20260325-0300.md`, `reports/cron/cross-agent-knowledge-sync-20260324-2250.md`, `projects/*/ops/RUNBOOK.md`

- 速度: 中
- トークン効率: 高
- 成果物の具体性: 高い
- 再利用性: 高い
- 手戻り率: 低い
- 指示逸脱率: 低い
- 実務インパクト: 中

**強み**
- runbook / checklist / wording normalization に強い。
- 仕様や運用知見を、次回も使える短文に圧縮できる。

**弱み**
- 文書化が目的化すると、実行接続が薄くなる。
- 事実の整理は強いが、締め切りを進める役には単独ではなりにくい。

**再配置示唆**
- DDS runbook、queue triage、CLI 手順のような「短い運用文書」に固定。
- 長文解説より、実行者がそのまま使える短い手順を優先。

**次アクション**
- `接続・終了ステータス・PR/質問経路` を1枚 runbook に落とす。

---

### 7) dss-manager
**証跡**: `reports/dds-agent-live-run-2026-03-24.md`, `reports/dds-agent-overall-review-2026-03-24.md`, `reports/dds-agent-review-remediation-2026-03-24.md`

- 速度: 速い
- トークン効率: 中
- 成果物の具体性: 高い
- 再利用性: 中〜高
- 手戻り率: 中
- 指示逸脱率: 低い
- 実務インパクト: 中〜高

**強み**
- register / heartbeat / claim / callback / report の実接続が通っている。
- live run まで到達しており、単なる机上ではない。

**弱み**
- まだ実ワークアイテムの流量が少なく、実務インパクトはこれから。
- 初期は secret/state の残留があり、運用後片付けの癖づけが必要だった。

**再配置示唆**
- remote worker / live integration / E2E 接続の検証役として使う。
- 単独運用より、ops-automator と reviewer を組ませるのが安全。

**次アクション**
- 実ジョブを 1 件流して、question / pr / report の end-to-end を確認する。

---

### 8) opportunity-scout
**証跡**: `reports/cron/sidebiz-project-scout-20260324-0900.md`, `reports/cron/proactive-idle-work-discovery-2026-03-24.md`

- 速度: 速い
- トークン効率: 中
- 成果物の具体性: 高い
- 再利用性: 高い
- 手戻り率: 低い
- 指示逸脱率: 低い
- 実務インパクト: 高い

**強み**
- 需要を「候補列挙」で終わらせず、`pain point → customer → Japan fit → OpenClaw fit → difficulty` に落としている。
- フリマ出品、見積追客、請求消込のような、実際に動かしやすい候補を優先できている。

**弱み**
- 実行ランタイム側の制約（例: モデル alias 不足）に引っ張られると止まりやすい。
- 発見した候補をそのまま放置すると、PoC への接続が薄くなる。

**再配置示唆**
- 市場 / 現場の痛点発見に固定。
- PoC 設計は research-analyst / doc-editor に渡す。

**次アクション**
- scout 前の preflight を入れ、利用可能モデルと外部ソース到達性を確認する。
- 有望候補は次回までに 1 つだけ PoC 入口に落とす。

## 総括
- **強い**: ceo-tama, supervisor-core, ops-automator, dss-manager, opportunity-scout
- **要矯正**: supervisor-core の重複抑制、github-operator の baseline 取得、doc-editor の実行接続強化、research-analyst の PoC 化
- 今回の更新で、役割の見直しは「誰が賢いか」ではなく、**誰にどの段階を持たせると最も再利用性が高いか** に寄せるのが妥当

## 次回の配置判断
1. **探索**: opportunity-scout → research-analyst
2. **実装接続**: ops-automator → dss-manager
3. **集約**: supervisor-core → ceo-tama
4. **文書化**: doc-editor は runbook / checklist 専任
5. **repo運用**: github-operator は GitHub / PR / link cleanup 専任

## 次アクション
- 直近 24h で証跡が薄い `github-operator` と `doc-editor` の専用 run を1回ずつ確保する。
- `supervisor-core` は次回から重複抑制ルールを必須化する。
- `research-analyst` は scout 結果に必ず `owner / due / success criteria` を付ける。
- `dss-manager` は実ジョブ E2E を 1 件通す。
- `ops-automator` は secret/state cleanup と jitter を標準手順化する。
