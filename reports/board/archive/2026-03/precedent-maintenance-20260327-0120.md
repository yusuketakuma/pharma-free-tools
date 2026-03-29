# Board precedent / standing approval maintenance — 2026-03-27 01:20 JST

- reviewer: Board Chair / ceo-tama
- window: last 24h of decision ledger, centered on 2026-03-27 01:20 JST
- records reviewed: 79
- source: `.openclaw/runtime/board/decision-ledger.jsonl`

## 結論

**新規の standing approval は 2 件までに絞るのが妥当** です。

- 低リスクで反復しているものは、`signal_only` と `direct validation` の 2 系統だけを standing approval 化する
- `waiting_auth / waiting_manual_review` 系の backlog triage は precedent 化はできるが、**standing approval までは上げない**
- `queue triage analyst` / `bundle manifest + dry-run sync` / `safe-close record fields` は重要だが、**境界・routing・approval に近いので deep review 継続**

要するに、**routine を fast lane に寄せるのは進めるが、auth / trust boundary / routing root に触るものは Board 直結のまま残す** のが安全です。

## 反復している同型案件の見立て

### 1) stale backlog triage が 9 回反復
- summary: `waiting_auth / waiting_manual_review の stale backlog を、単発棚卸しではなく board 裁定済みの triage policy と follow-up 導線に変える候補。`
- proposal: `proposal-20260325073850-ddcd1999feeb`
- decision count: 9
- status: investigate only
- interpretation: backlog triage の閉じ方が未固定なので、毎回同じ論点に戻っている

### 2) routine monitoring の signal_only 化が 8 回反復
- summary: `定常時の board / heartbeat / scorecard は digest に固定し、candidate 化は anomaly delta があるときだけに絞る。`
- proposal: `proposal-20260325211500-delta-monitor`
- decision count: 8
- status: investigate only
- interpretation: ここは最も precedent 化しやすい。Board のノイズ抑制ルールとして定常化できる

### 3) direct board_runtime write の独立検証が 7 回反復
- summary: `Validate that board_runtime direct write and assemble paths still function when heartbeat mapping is bypassed.`
- proposal: `proposal-direct-e2e-065209`
- decision count: 7
- status: investigate only
- interpretation: synthetic / diagnostic の定常検証として安定している。live boundary を動かさない限り fast lane でよい

### 4) 重い境界論点は 8 回ずつ反復
- `Queue Triage Analyst` への分離
- `bundle manifest + dry-run sync` への runtime reflection 変更
- `safe-close record fields` の構造化
- `handoff guardrail` の exact-target / owner-due-success criteria 強制

これらは同じテーマが繰り返し出ているが、**境界・routing・approval に近いので precedent 化はできても standing approval はまだ危険** です。

---

## 新規 precedent 候補

### P1. stale backlog triage policy
**候補種別:** precedent candidate

- **applies_if**
  - `waiting_auth` / `waiting_manual_review` が stale 化している
  - 既存の auth / approval ルートを変えずに、closure / reopen / escalate の扱いだけを決める
  - same-prefix の backlog が反復している

- **excludes_if**
  - auth / trust boundary / routing / Telegram 根幹の変更を伴う
  - live runtime reflection, protected path, CEO↔Board↔Execution 境界の変更を伴う
  - 自動 drain や自動 close に踏み込む

- **default_lane**
  - `fast` だが、close 実行は `review` 扱い

- **required_guardrails**
  - `owner`, `next_action`, `success_criteria`, `review_after`, `linked_evidence` を必須化
  - exact-target 確認
  - ambiguity が残る場合は safe-close しない
  - reopen 条件を明文化する

- **monitoring_requirements**
  - reopen rate
  - stale backlog count
  - 7-day stale count
  - false-close / silent-failure count
  - time-to-reopen

- **expires_at / review 条件**
  - **review_after: 2026-04-03 JST**
  - もしくは `waiting_auth` / `waiting_manual_review` の構成比が変わった時
  - もしくは false-close が増えた時

**判断:** precedent 化は可。ただし standing approval までは上げない。

### P2. dedicated Queue Triage Analyst path
**候補種別:** precedent candidate, deep review required

- **applies_if**
  - dominant-prefix の triage が supervisor-core に重なっている
  - 同種レビューが複数サイクルで反復している
  - owner 固定と checklist 化で再発抑制できる

- **excludes_if**
  - routing root の再設計
  - auth / approval / trust boundary の変更
  - Telegram / user-facing boundary の変更

- **default_lane**
  - `review` / `deep`

- **required_guardrails**
  - escalation fallback を残す
  - supervisor-core へ戻せる rollback を明示
  - role boundary drift の監視
  - checklist / owner / success criteria を固定

- **monitoring_requirements**
  - supervisor-core 重複率
  - triage lead time
  - owner reassignment rate
  - escalation fallback 使用率
  - same-prefix recurrence rate

- **expires_at / review 条件**
  - **review_after: 2026-04-10 JST**
  - もしくは dominant-prefix の形が変わったら再審議
  - もしくは role boundary drift が検出されたら即 reopen

**判断:** precedent 候補として保持。**standing approval にはしない**。

### P3. bundle manifest + dry-run sync before live runtime reflection
**候補種別:** precedent candidate, deep review required

- **applies_if**
  - workspace ↔ live runtime の reflection がある
  - file-by-file sync で contract drift の可能性がある
  - live side の support surface が old contract に依存している

- **excludes_if**
  - read-only audit only
  - live sync を伴わない
  - manifest / backup gate を使わない小変更ではない

- **default_lane**
  - `review` / `deep`

- **required_guardrails**
  - bundle manifest
  - dry-run diff
  - backup gate
  - rollback plan
  - no partial live mirror

- **monitoring_requirements**
  - contract mismatch rate
  - missing-file detection rate
  - dry-run diff failures
  - rollback usage
  - live sync success rate

- **expires_at / review 条件**
  - **review_after: 2026-04-10 JST**
  - もしくは runtime contract surface が更新されたら再審議
  - もしくは missing support files が解消されたら scope を縮小

**判断:** precedent 候補として保持。**standing approval にはしない**。

---

## standing approval 候補

### S1. routine board / heartbeat / scorecard は signal_only
**候補種別:** standing approval candidate

- **applies_if**
  - routine cycle で新しい anomaly delta がない
  - precedent gap がない
  - board touch を増やす新情報がない

- **excludes_if**
  - `board_touch_high`
  - `exploration_drift_risk`
  - 新しい metric delta
  - auth / routing / boundary 変更
  - 例外的な precedent gap

- **default_lane**
  - `fast`

- **required_guardrails**
  - routine は `signal_only`
  - candidate 化は anomaly / delta / precedent gap のみ
  - narrative review に流し込みすぎない
  - evidence refs を残す

- **monitoring_requirements**
  - candidate_rate
  - candidate_to_board_touch_ratio
  - board_touch_high
  - exploration_drift_risk
  - false-negative anomaly misses

- **expires_at / review 条件**
  - **review_after: 2026-04-03 JST**
  - もしくは monitoring contract を変えるとき
  - もしくは threshold miss が出たとき

**判断:** standing approval にしてよい。

### S2. direct board_runtime write / assemble path validation
**候補種別:** standing approval candidate

- **applies_if**
  - synthetic / diagnostic validation
  - heartbeat mapping を bypass して direct write を確かめるだけ
  - live side を動かさない

- **excludes_if**
  - protected path / routing / approval boundary を触る
  - live runtime sync を実施する
  - user-facing state を更新する

- **default_lane**
  - `fast`

- **required_guardrails**
  - isolated test item
  - no production apply
  - synthetic record は後で prune / ignore 可能にしておく
  - schema mismatch を観測するだけに留める

- **monitoring_requirements**
  - direct write success
  - assemble success
  - schema mismatch rate
  - synthetic noise count

- **expires_at / review 条件**
  - **review_after: 2026-04-03 JST**
  - もしくは board_runtime の write contract が変わった時

**判断:** standing approval にしてよい。

---

## revoke / expiry 候補

### E1. routine narrative review の暗黙許可を期限切れにする
- **対象:** routine heartbeat / scorecard を Board で都度 narrative 化する慣行
- **理由:** signal_only precedent と衝突し、Board noise を増やす
- **扱い:** **expire**
- **条件:** S1 が有効になった時点で即時

### E2. high-risk boundary candidates は standing approval にしないまま維持
- **対象:** `Queue Triage Analyst path`, `bundle manifest + dry-run sync`, `safe-close record fields`, `handoff guardrail`
- **理由:** auth / trust boundary / routing / approval に近い
- **扱い:** **revoke ではなく、standing approval への昇格を見送る**
- **条件:** deep review で guardrail と監視が固まるまで

### E3. stale-close の過剰な自動化を期限切れにする
- **対象:** backlog を自動 drain するような運用
- **理由:** 誤クローズと reopen drift を招きやすい
- **扱い:** **expire**
- **条件:** P1 にある guardrail が未実装の間は継続禁止

---

## precedent coverage の見立て

### いま precedent で覆えている範囲
- routine monitor のノイズ抑制
- synthetic/direct validation の定常化
- backlog triage の閉じ方の標準化

### まだ Board に残すべき範囲
- auth / trust boundary
- routing root の再設計
- approval / apply の分離
- live runtime reflection
- Telegram など根幹設定

### ざっくりしたカバレッジ感
- **routine / low-risk:** 70% くらいは precedent 化可能
- **boundary / routing sensitive:** 30% は deep review を残すべき

この比率が今のところ妥当です。**全部を standing approval に寄せるのは危険** です。

## 次アクション

1. **S1 と S2 を precedence registry に登録候補として固定**
2. **P1 を backlog triage policy の本文に落とす**
3. **P2 / P3 は deep review キューに残す**
4. **E1 / E3 を監視ルールとして明示し、暗黙許可を消す**
5. 次回定期報告（7:00 / 12:00 / 17:00 / 23:00）で、`reopen rate` と `board_touch_high` の変化だけを見る

---

## 補足

- 明示的な `precedent_id` を revoke すべきものは、この ledger 範囲では見当たりませんでした。
- あるのは **同じ判断の反復** と **暗黙運用の expiry** です。
- なので今回の主眼は「新しいルールを増やすこと」ではなく、**ルール化できる routine を fast lane に逃がし、境界案件は Board に残す** ことです。
