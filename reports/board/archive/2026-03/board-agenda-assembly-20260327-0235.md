# 取締役会本会議 事前整理（2026-03-27 02:35 JST）

## Agenda seed
1. **live runtime reflection の手順標準化**
   - bundle manifest を必須化
   - live 反映前に dry-run diff + 最小 smoke check
   - 対象は docs / reports / runbook / cron wording に限定

2. **light-edit / scout / PoC handoff の preflight 追加**
   - exact target / owner / due / success criteria を 1 行で確認
   - 埋まらない handoff は保留
   - routing root / auth / trust boundary は触らない

3. **supervisor-core の triage scope 縮小**
   - 観測・triage・品質レビューの同居を縮める
   - dominant-prefix triage は専任経路へ寄せる
   - ただし boundary / staffing 変更を混ぜず、revise 前提で切り分ける

## 自己改善 proposal の扱い
- **inbox 件数**: 3
- **Board が扱った件数**: 3
- **approve 候補**
  - proposal-20260327-bundle-manifest-dryrun-sync
  - proposal-20260327-handoff-preflight-guardrail
- **reject 候補**
  - なし
- **revise 候補**
  - proposal-20260326-supervisor-boundary-preflight

## 会議後に渡す proposal_id
- review/apply: `proposal-20260327-bundle-manifest-dryrun-sync`
- review/apply: `proposal-20260327-handoff-preflight-guardrail`
- revise/resubmit: `proposal-20260326-supervisor-boundary-preflight`

## 判断メモ
- 低リスク文書系なので前2件は `approve + assisted` が妥当。
- supervisor-core 件は low-risk 文書更新と routing/trust boundary の論点が混ざるため、`revise`。
- Board で長く議論しない。最重要の自己改善 proposal は 2件までに絞る。
