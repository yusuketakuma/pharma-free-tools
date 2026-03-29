# Workflow: Review / Publish

1. reviewer は `execution-result.json` を確認
2. `review-report.json` で `publish` / `hold` / `approval_required` を判定
3. `final-response.md` は `publish_result.py` 経由でのみ生成
4. publish 成功時に `state.json` を `PUBLISHED` に更新する
