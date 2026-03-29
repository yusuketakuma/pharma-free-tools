# 議題: OpenClaw 自律運転の production-ready 化 — SLA 定義・認証フォールバック・監視体制の整備

- **状態**: proposed
- **作成日**: 2026-03-29
- **結論**: 自律運転（cron / subagent / 自律改善）について SLA を定義し、Claude Code lane 不通時の fallback 経路を文書化・テスト済みにする。auth 監視は毎日 cron で実施し、早期検知体制を整える。
- **理由**: 現状ベストエフォート運用で、lane不通・auth drift時の振る舞いが未検証。ゆうすけが寝ている間に処理が失敗して沈黙するケースは「寝ている間も回る仕組み」の核心に反する。SLA がないと劣化に気づけない。
- **リスク**: 
  - SLA ハードル过高 → 運用コスト増
  - fallback 実装バグ → 誤dispatch・重複実行・auth情報誤経路利用
  - subscription-only 制約下で fallback 先が限定的
  - 過剰アラートによるノイズ、監視テストでの auth session 消費・破壊
- **次アクション**:
  1. 直近2週間の cron / subagent 実行成功率・失敗パターンをログから定量化
  2. SLA ドラフト（成功率 ≥95%、失敗時エスカレーション ≦30分、沈黙期間上限など）を策定 → ゆうすけレビュー
  3. Claude Code lane 不通時 fallback パスの dry-run テスト → 結果を runbook に記録
  4. 毎日 cron での `claude auth status --json` auth ヘルスチェック（低リスク改善として auto-apply 可否検討）
  5. 許容 fallback スコープ（read-only / plan-only のみ等）を定義した runbook ドラフト作成
- **取締役会からの観点**: visionary / user-advocate / operator / auditor 各観点を統合。月1回 dry-run テスト定期実施の判断も必要。
- **関連議題**: 月次で承認済み自動化リスト・手動レビュー必須リストを棚卸し、実績ベースで自動化範囲を拡大/縮小する運用の導入（自動化範囲の継続性監査）
