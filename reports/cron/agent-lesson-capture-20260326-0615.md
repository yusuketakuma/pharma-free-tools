# agent-lesson-capture — 2026-03-26 06:15 JST

## 結論
- lesson の収集は dense に維持しつつ、Board へ上げるのは policy 化価値のあるものに絞った。
- 今回は **signal_event 6件**、**agenda_candidate 3件** を runtime に書き込んだ。
- 収集した lesson は runtime の signal として残し、Board の審議対象は candidate に分離した。
- 今回の収束は主に 4 つ。
  1. Supervisor 系の重複は、観測ではなく triage 変換の問題
  2. 定常監視は signal-only、candidate は anomaly-delta のみ
  3. 軽微タスクと scout/PoC handoff は、exact target / owner / due / success criteria の preflight が必要
  4. `review-approved` / `apply-applied` / `manual_required` / `pending_artifact` / `effect-confirmed` は別状態として扱う

## runtime に書いた signal_event 件数
- 6件

### signal_event 要約
1. Supervisor 系は観測・triage・品質レビューを同居させると重複しやすく、dominant-prefix triage を専任経路に切る必要がある。
2. 履歴が薄いときは新しい規則を増やさず、既存候補の統合と owner/due/success criteria の補強を先にする。
3. 軽微タスクでも exact target mismatch は retry cost を増やすので、対象確認を先に入れる。
4. blocked は failure ではなく user input waiting なので、completed / blocked / failed を分けて扱う。
5. scout / PoC handoff は owner / due / success criteria がないと止まりやすく、探索だけで完結させない。
6. board / heartbeat / scorecard は steady-state では signal-only に寄せ、candidate は anomaly delta のときだけ出すのがよい。

## runtime に書いた agenda_candidate 件数
- 3件

### agenda_candidate 要約
1. Queue Triage Analyst に dominant-prefix triage を切り出し、supervisor-core の boundary を縮める。
2. routine の board / heartbeat / scorecard は signal-only contract に固定し、candidate は anomaly-delta のみとする。
3. light-edit / scout handoff に exact-target preflight と owner / due / success criteria の gate を入れる。

## 回収した lesson

### ceo-tama
**success**
- 定時報告の集約先を 7:00 / 12:00 / 17:00 / 23:00 に統一
- 性能最適化を staffing 再配置だけでなく model / thinking / subagents.thinking の観点まで含める方向に拡張

**failure**
- 監督ジョブが別名で重複しやすい
- 軽微タスクで exact target mismatch が起きる

**lesson**
- 再配置だけでは足りず、性能最適化まで一体で見る方が実務的
- 軽微修正でも先に対象確認を入れるべき

**next_change**
- staffing / prompt tuning を exact-target preflight とセットで回す
- 監督系ジョブは統合・縮小・再掲抑制を優先する

### supervisor-core
**success**
- queue telemetry → triage → decision-quality の反復に対して、エスカレーション規則を明文化
- owner / due / success criteria を必須化する方向に進めた

**failure**
- 同じ改善候補が残存しやすい
- 履歴不足のまま規則を増やしがち

**lesson**
- 履歴が足りないときは規則を増やさず、候補の統合を先にやる
- 観測と triage と品質レビューは同居させない方がよい

**next_change**
- dominant-prefix triage を専任経路へ送る
- 2回連続要判断事項は priority review に昇格

### dss-manager
**success**
- completed / blocked / failed / PR 報告の経路分岐が明確になった
- blocked を user input waiting として止められている

**failure**
- blocked の意味が曖昧だと retry 方針がぶれる
- failed を実障害と誤解しやすい

**lesson**
- blocked は failure ではなく待ち
- 成功・失敗・blocked を分けて扱う必要がある

**next_change**
- blocked 経路は「利用者からの回答待ち」を明示
- retry criteria と cleanup を固定

### research-analyst / opportunity-scout
**success**
- pain point 抽出は強い
- 候補比較の再利用性が高い

**failure**
- PoC 接続が弱い
- scout だけで完結しやすい

**lesson**
- 探索は価値があるが、handoff まで持っていかないと積み上がらない

**next_change**
- owner / due / success criteria を必須化
- PoC 入口がない候補は保留ではなく明示的に切る

### github-operator / doc-editor
**success**
- repo hygiene と runbook / checklist 圧縮は強い

**failure**
- 役割を広げると証跡が薄くなる
- 実行判断まで抱えるとぼやける

**lesson**
- narrow scope の方が再利用性が高い
- 文書化と実行判断は分ける

**next_change**
- github-operator は repo hygiene 専任
- doc-editor は runbook / checklist 圧縮専任

### ops-automator
**success**
- live 接続、cleanup、retry の運用が強い

**failure**
- 設計まで抱えると役割がぼける

**lesson**
- 運用と検証は強いが、設計は別レーンに渡した方がよい

**next_change**
- dss-manager とペア運用を標準化
- cleanup / retry / state hygiene に寄せる

### agent-scorecard-review / autonomy-loop-health-review
**success**
- 新規 anomaly がない cycle を signal-only で扱えた
- 停滞は見えるが、定常時は大崩れしていない

**failure**
- 同じ supervisor 系論点が何度も再掲されやすい
- candidate が増えると Board noise が増える

**lesson**
- steady-state は digest で十分
- candidate は anomaly-delta のときだけでよい

**next_change**
- routine review は signal-only に固定
- anomaly-delta だけ candidate 化する

## 反復 lesson / 反復失敗
- **Supervisor / monitoring の重複** が複数レポートで繰り返し出ている
- **履歴不足なのに規則を増やす** 傾向がある
- **exact target mismatch** が軽微タスクでも retry cost を生む
- **scout / PoC handoff の停滞** が owner / due / success criteria 不足と結びついている
- **定常監視の candidate 化** は Board noise を増やしやすい

## policy 化候補
1. **Queue Triage Analyst 専任化**
   - dominant-prefix triage を supervisor-core から切り出し、役割境界を縮める
2. **Anomaly-delta only contract**
   - board / heartbeat / scorecard は steady-state では signal-only、candidate は異常時のみ
3. **Handoff preflight gate**
   - light-edit と scout / PoC handoff に exact target と owner / due / success criteria を必須化

## 次アクション
1. Queue Triage Analyst の runbook / owner / success criteria を 1 枚に落とす
2. board / heartbeat / scorecard の signal-only contract を次回の定期報告へ反映する
3. light-edit / scout handoff の preflight を定型化する
4. 次回の 7:00 / 12:00 / 17:00 / 23:00 報告では、今回の候補が減ったかだけを見る

## 備考
- signal / candidate は runtime に残した
- 通常通知は行わず、定期報告へ集約する
