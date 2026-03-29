{
  "proposal_id": "proposal-20260328-board-input-freshness-contract",
  "status": "APPROVED",
  "phase": "propose",
  "created_at": "2026-03-28T10:30:00+09:00",
  "created_by": "self-improvement-proposal-synthesis",
  "summary": "Board cycle の input artifact (agenda-seed / claude-code-precheck / premeeting-brief) 間の freshness contract を明確化し、slot 不整合時の graceful degradation を標準化する",
  "observations": [
    "verification report (2026-03-28T08:52) で agenda-seed-latest の slot ルール違反が指摘された",
    "board-premeeting-brief-latest は 20260327-1835 で止まっており、最新 slot と不整合",
    "claude-code-precheck-latest は stale_input を明示したが、board assembly 側での処理が未統一",
    "slot 不整合が発生しても downstream の board assembly / dispatch が input_gate の状態を一貫して扱っていない",
    "freshness 判定ロジックが各ジョブの prompt に分散しており、contract として明文化されていない"
  ],
  "proposed_changes": [
    "board input freshness contract を docs/runbook に明文化: slot 定義 (HH:20 seed / HH:25 precheck / HH:30 brief / HH:33 normalize / HH:35 assembly) と、各 artifact の expected_slot / tolerance のルール",
    "input_gate 判定を各ジョブで一貫させる: stale 検出時は upstream に戻すか、degraded モードで明示的に進める",
    "freshness 不整合を board-runtime の signal_event として記録し、anomaly-delta monitor で追跡可能にする",
    "各 cron prompt の freshness 判定セクションを contract に寄せ、prompt 内の重複記述を減らす"
  ],
  "affected_paths": [
    "reports/board/agenda-seed-latest.md (freshness metadata 追加)",
    "reports/board/claude-code-precheck-latest.md (input_gate 判定の統一)",
    "reports/board/board-premeeting-brief-latest.md (freshness status 追加)",
    ".openclaw/runbook/board-input-freshness-contract.md (新規作成)",
    "cron: board-claudecode-precheck, board-premeeting-all-agent-business-report, board-premeeting-brief-normalize, board-agenda-assembly (prompt の freshness セクション更新)"
  ],
  "evidence": [
    "reports/growth/self-improvement-verification-latest.md: 'agenda-seed-latest の board_cycle_slot_id: 20260328-0820 を slot ルール違反として差し戻した'",
    "reports/growth/self-improvement-verification-latest.md: 'board-premeeting-brief-latest は依然 20260327-1835 時点の ready / fresh 前提で止まっており、最新 precheck の stale_input 判定と整合しない'",
    "claude-code-precheck-latest.md: 'expected slot=20260328-0835 に対し stale_input と判定'"
  ],
  "requires_manual_approval": false,
  "next_step": "Resolve blocked/manual paths before verification.",
  "cycle_id": "proposal-20260328-board-input-freshness-contract",
  "status_history": [
    {
      "status": "INBOX",
      "at": "2026-03-28T16:41:20+09:00",
      "note": "loaded for review"
    },
    {
      "status": "UNDER_REVIEW",
      "at": "2026-03-28T16:41:20+09:00",
      "note": "review started by board-auditor"
    },
    {
      "status": "APPROVED",
      "at": "2026-03-28T16:41:20+09:00",
      "note": "decision=approve"
    }
  ],
  "reviewed_at": "2026-03-28T16:41:20+09:00",
  "review": {
    "decision": "approve",
    "reviewer": "board-auditor",
    "reason": "Board裁定でapprove候補：docs/runboard/cron-promptの更新で低リスクかつ可逆性高い。protected path・auth・routing root・trust boundary非該当。freshness contractの明確化はboard cycleの安定性向上に直結。",
    "apply_mode": "assisted",
    "approved_paths": [
      ".openclaw/runbook/board-input-freshness-contract.md (新規作成)",
      "cron: board-claudecode-precheck, board-premeeting-all-agent-business-report, board-premeeting-brief-normalize, board-agenda-assembly (prompt の freshness セクション更新)",
      "reports/board/agenda-seed-latest.md (freshness metadata 追加)",
      "reports/board/board-premeeting-brief-latest.md (freshness status 追加)",
      "reports/board/claude-code-precheck-latest.md (input_gate 判定の統一)"
    ],
    "blocked_paths": [],
    "notes": [],
    "reviewed_at": "2026-03-28T16:41:20+09:00"
  },
  "review_path": "/Users/yusuke/.openclaw/workspace/.openclaw/growth/reviews/proposal-20260328-board-input-freshness-contract.review.json",
  "apply_result_path": "/Users/yusuke/.openclaw/workspace/.openclaw/growth/apply-results/proposal-20260328-board-input-freshness-contract.apply.json"
}
