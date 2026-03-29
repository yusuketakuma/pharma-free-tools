# Agent Workforce Expansion Review — 2026-03-26 06:45 JST

## 結論
**追加不要。**

今回の反復は確かにあるが、主因は「役割不足」より **既存役割の広さと再掲癖**。すでに `Queue Triage Analyst` へ dominant-prefix triage を切り出したことで、最も重い重複は 1 段階解消済み。次の改善は新規採用ではなく、`supervisor-core` の縮退と board / heartbeat / scorecard の signal-only 化で進めるのが妥当。

## board の主要論点
### Visionary
- レバレッジが高いのは、役割を増やすことではなく **広すぎる役割を細く切ること**。
- すでに `Queue Triage Analyst` を入れたので、次は役割追加より境界固定が効く。

### User Advocate
- 役職を増やしすぎると、運用の見通しが悪くなる。
- 現状のボトルネックは「誰がやるか」より「同じ論点を何度も出すか」。

### Operator
- まずは次の 3 点を定着させるのが最小コスト。
  1. repeated dominant-prefix は `Queue Triage Analyst` に流す
  2. board / heartbeat / scorecard は平常時 signal-only にする
  3. light handoff に `owner / due / success criteria` を必須化する

### Auditor
- auth / trust boundary / routing / Telegram 設定に触れる新規追加は high-risk。
- 今回の候補には、そのラインをまたぐ必要性はない。

### Chair
- **保留ではなく却下寄りの追加不要**。
- 追加するなら、今後 `decision-quality` 側で明確な差分不足が続いた場合に限る。

## 反復業務の分析
### 反復しているもの
- `queue telemetry → triage → decision-quality` の流れ
- board / heartbeat / scorecard の類似レポート
- stale queue backlog の safe-close / reopen 論点
- scout / PoC handoff での `owner / due / success criteria` 不足

### どこが広すぎるか
- **supervisor-core** が観測・triage・品質レビューを同居させていて広い。
- ただし triage は `Queue Triage Analyst` に切り出し済み。
- 残る重複は、役割の追加ではなく **再掲抑制ルール** で先に止めるべき。

### 既存エージェントで足りる理由
- `Queue Triage Analyst` が dominant-prefix triage の受け皿として機能する
- `doc-editor` で runbook / checklist を圧縮できる
- `ceo-tama` が最終集約を担うため、board 専任の新設は現時点で過剰

## 追加 / 不要の判断
**不要。**

理由:
1. 同種業務は反復しているが、主戦場は既に `Queue Triage Analyst` に切り出し済み
2. 追加候補はあるものの、どれも現状は再掲抑制・境界固定で吸収可能
3. 新規追加は、ユーザー視点では複雑さ増加の方が先に立つ
4. Telegram 設定・auth 根幹・trust boundary を触らない low-risk 追加の必要性がまだ弱い

## 追加した場合の新エージェント定義
**該当なし。**

### 参考として保留した候補
- name: `Decision Quality Analyst`
- purpose: triage 後の decision-quality レビューを専任化し、再掲・差分不足を止める
- status: **保留**
- 理由: まだルール面で吸収できる差分が残っており、役職追加よりも `supervisor-core` の縮退と再掲抑制の方が先

## 次アクション
1. `Queue Triage Analyst` を優先経路として固定運用する
2. `supervisor-core` は観測集約に寄せ、decision-quality の再掲を抑える
3. board / heartbeat / scorecard は平常時 signal-only へ寄せる
4. 2回連続で decision-quality の差分不足が出た場合のみ、`Decision Quality Analyst` を deep review 候補に戻す
5. 通常通知は出さず、定期報告へ集約する
