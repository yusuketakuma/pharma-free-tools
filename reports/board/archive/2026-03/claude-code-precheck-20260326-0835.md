# Claude Code 側事前審議メモ

- 審議対象: board-claudecode-precheck
- 作成時刻: 2026-03-26 08:35 JST
- 位置づけ: Claude Code 実行プレーンでの事前ダブルチェック結果

## 結論

**進めてよい。** ただし、**部分同期・裸 CLI 常用フォールバック・publish 先行** は止める。  
現時点の lane health では **ACP primary は健全**、**CLI も健全**、一方で **cli_backend_safety_net は不健全** なので、運用判断は「ACP 主系 + 必要時のみ CLI compat fallback」に寄せるべき。

## Claude Code 側で重要と見た論点（最大5件）

1. **handoff contract は bundle 単位で守る必要がある**  
   `execution-request.json` / `execution-result.json` の契約は揃っているが、live runtime への反映は部分差し替えだと壊れやすい。旧 contract のままの経路が残るため、**単品上書きは危険**。

2. **lane は ACP primary、CLI は従系、bare safety net は常用不可**  
   2026-03-26 時点の probe では ACP/CLI は healthy、`cli_backend_safety_net` は unhealthy。OpenClaw 側の「フォールバックできるはず」という前提を、**bare CLI まで広げない** ことが重要。

3. **auth / trust boundary は prompt ではなく process boundary で担保する**  
   subscription-only (`claude.ai`) 前提と fail-closed は維持でよい。mixed-trust を同一 Gateway に押し込む設計は、execution plane では事故りやすい。

4. **runbook と実装のズレを先に潰すべき**  
   `.openclaw/tasks/` の保持・整理、stale report の検知、queue の read-only telemetry など、運用上の抜けがまだある。board で承認しても、実行後に詰まるのはここ。

5. **publish 前に dry-run / smoke の一段を必須化したい**  
   bundle sync 前提、dry-run 比較、最低限の smoke check を通してから publish。partial execution や degraded success は board の再レビュー対象に残すべき。

## OpenClaw 側で再レビューすべき点

- この案件が **protected path** を含むか
- approval が必要な範囲を、task artifact で明示しているか
- lane health の snapshot が古すぎないか
- ACP から CLI への fallback が **compat transport 限定** になっているか
- `.openclaw/tasks/` と report artifact の保持方針が、この案件の後工程と矛盾しないか

## そのまま採用でよい点

- **OpenClaw = control plane / Claude Code = execution plane** の分離
- **ACP primary** を基本にする方針
- execution contract に **changed_files / verification_results / remaining_risks** を含める設計
- bundle sync + dry-run を前提にする運用
- OpenClaw 側で review / publish を最終判定にする流れ

## 却下 / 保留を勧める点

- **部分同期**（例: `run_claude_acp.py` だけ差し替え）
- **bare CLI safety net の常用化**
- **publish を dry-run 前に進めること**
- partial execution / side-effect 可能性がある結果の即時 auto-publish

## 次の会議へ渡す短い要約

**ACP 主系で進行可。ただし、契約は bundle 単位、フォールバックは compat 限定、publish は dry-run 後。** OpenClaw 側は protected path と approval 範囲、artifact 保持、lane snapshot の鮮度を再確認してから次判断へ。
