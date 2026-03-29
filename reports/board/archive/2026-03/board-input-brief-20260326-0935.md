# Board input brief — 20260326-0935

## freshness check
- current meeting slot: `20260326-0935`
- `reports/board/agenda-seed-latest.md`: `board_cycle_slot_id=20260326-1835` → **mismatch**
- `reports/board/claude-code-precheck-latest.md`: `board_cycle_slot_id=20260326-1835` → **mismatch**
- generated_at: `2026-03-26 18:23 JST` / `09:23 UTC` → timestamp freshness is okay, but slot binding is stale for this run

## input_gate
- `input_gate=degraded`

## board candidates（最大6件）
1. **滞留 triage の運用標準化**
   - waiting_auth / waiting_manual_review を個別判断で処理せず、triage ルールに固定する。

2. **safe-close / reopen / escalate 基準の固定**
   - 1ページで迷わない粒度に落とし、再審議の基準を明文化する。

3. **owner / next action / success criteria の固定**
   - prefix ごとに担当と次アクションを1行で決め、滞留再発を抑える。

4. **監視指標の絞り込み**
   - reopen率、滞留中央値、7日超滞留件数だけを追い、ノイズを増やさない。

5. **新規施策・更新適用の一時抑制**
   - 滞留棚卸しと triage 基準整備が終わるまで、追加更新は後回しにする。

6. **監査・影響確認の分離レビュー**
   - security audit と DDS 影響確認は triage とは別枠で扱い、論点を混ぜない。

## board向け一言
- いま承認すべき中心論点は「新規前進」ではなく、**滞留 triage を再現可能なルールに落とすこと**。