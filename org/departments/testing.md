# testing department

- Representative job: `testing-department-cycle`
- Cadence: 8時間ごと
- Goal: 品質確認、再現確認、性能/運用上の危険検知を担う。

## Responsibilities
- 検証結果
- 回帰/障害候補
- 性能/運用の懸念
- 再テスト指示

## Covered roles
- `tool-evaluator`: ツールの実用性を確認する。
- `api-tester`: APIや外部接続の再現テストを行う。
- `workflow-optimizer`: 運用フローの無駄を削減する。
- `performance-benchmarker`: 重い処理や遅延箇所を洗い出す。
- `test-results-analyzer`: テスト結果を解釈し次アクションに変換する。

## Reporting rule
- 出力先: `reports/company/testing-latest.md`
- アーカイブ: `reports/company/archive/<dept>-YYYY-MM-DD-HHMM.md`
- ユーザーへ直接送信しない。CEO handoff を必ず含める。