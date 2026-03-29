# Triage Policy Minimal Runbook — 2026-03-26

## 目的
triage policy を、日次運用で迷わない最小手順に落とし込む。

## 最小運用手順
1. **分類する**
   - まず `waiting_auth` / `waiting_manual_review` / `EXECUTION_FAILED` / `READY_FOR_EXECUTION` のどれかに置く。
2. **原因を 1 行で書く**
   - 例: `auth drift`, `manual review backlog`, `runtime error`, `queue saturation`。
3. **次アクションを 1 つだけ決める**
   - `reopen`, `escalate`, `wait`, `close`, `requeue` のいずれか。
4. **queue に反映する**
   - backlog/queue.md の Ready / Waiting Approval / Blocked / Archived のどこかへ 1 行追加する。
5. **判断不能なら hold**
   - ルーティングや trust boundary に触るものは自動で進めず、manual review に倒す。

## 判定ルール
- **Ready**: そのまま実行可能
- **Waiting Approval**: 権限・承認待ち
- **Blocked**: 外部依存、再現待ち、入力不足
- **Archived**: 完了・却下・不要化

## queue反映可否
- **可**: いまの構成では、`projects/careviax-pharmacy/backlog/queue.md` に反映可能。
- **条件**: docs 更新に留めること。protected path / auth / routing / approval の根幹変更はしない。
- **推奨**: まずは Ready に 1 件だけ載せて、運用に乗るか確認する。

## 推奨する次の一手
- queue.md に `triage policy minimal runbook の運用化` を Ready として追加
- その後、必要なら `reports/cron/` 側で日次チェック項目にする

## 備考
- これは実装ではなく、運用の最小共通手順。
- 迷いを減らすことを優先し、判断項目を増やしすぎない。
