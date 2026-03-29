# Short Report — dominant prefix / staleness / reopen patterns

## 結論
`waiting_auth` と `waiting_manual_review` は、**同じ少数 prefix が反復し、かつ同じ滞留帯に張り付いている stale backlog** です。今回の短報では、再掲を増やさず、反復上位・滞留上位・reopen 条件になりやすい再発パターンだけを絞って整理します。

## 反復上位
### waiting_auth
1. `step6-dedupe` — 171
2. `step6-plan-auth-runtime` — 166
3. `lane-runtime-auth-ng` — 134

### waiting_manual_review
1. `step6-lane-write-blocked` — 167
2. `lane-runtime-partial-write` — 134
3. `step6-acp-mock-contract` — 40

## 滞留上位
- 両キューとも oldest/newest の幅が小さく、**03/22 の同一滞留帯** に固着している。
- `waiting_auth` と `waiting_manual_review` はともに **24h delta = 0** で、新規増加より停滞が主問題。
- したがって滞留上位は「古いものが残っている prefix」ではなく、**同一 prefix が何度も積み上がっている流れ** と見るのが正しい。

## reopen 条件になりやすい再発パターン
1. **auth 回復後も同系 prefix が残る**
   - 例: `step6-plan-auth-runtime` / `lane-runtime-auth-ng`
   - 条件: 認証要因が解消しても queue が自動で減らず、owner / next action が未固定のまま再出現する。

2. **write blocked / partial write が review 側へ再流入する**
   - 例: `step6-lane-write-blocked` / `lane-runtime-partial-write`
   - 条件: partial write の扱いが safe-close されず、次サイクルで同じ review gate に戻る。

3. **同じ prefix が 2 サイクル以上続いても action が増えない**
   - 条件: telemetry は増えるが、owner / due / success criteria が付かない。
   - これは reopen 候補ではなく、**reopen ではなく board 再判断** に回すべきサイン。

## 短い見立て
- 反復の中心は `step6-*` 系と `lane-runtime-*` 系。
- 滞留の中心は「古い個体」より「同一 choke point の反復」。
- reopen は、**解消済みのはずの auth / review gate が同じ prefix で再発する場合** にだけ考える。

## 参照
- `reports/cron/openclaw-queue-telemetry-2026-03-24.md`
- `projects/openclaw-core/docs/queue-dominant-prefix-triage.md`
- `reports/cron/board-postmeeting-agent-dispatch-20260326-0744.md`
