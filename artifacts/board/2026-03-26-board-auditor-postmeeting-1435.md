# board-auditor postmeeting 2026-03-26 14:35 JST

- 受理しました。監視ではなく、triage から分離した security audit の着手条件・順序・範囲を固定します。
- 着手条件: triage の結果が確定し、auth / routing / trust boundary に変更案が残る場合のみ manual review 前提で着手。
- 順序: 1) triage 確定 → 2) 例外条件の固定 → 3) manual review → 4) 必要時のみ security audit。
- 範囲: security audit は triage 対象外の追加調査に限定し、auth / routing / trust boundary の変更は必ず手動確認を外さない。
- scope 拡大は不要です。例外条件と順序の固定に留めます。
