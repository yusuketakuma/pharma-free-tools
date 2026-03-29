# Proactive Idle Work Discovery — Board Review

Date: 2026-03-25 22:20 JST

## 結論
今回の自律探索では、**CareRoute-RX の WIP-TRIAGE-001 を最優先の停滞解消候補として採用**し、DeadStockSolution の preview triage を副次候補に回した。

理由は、CareRoute-RX 側の未コミット差分が大きく、FE-DISPLAY 系 / security follow-up / unrelated WIP の切り分けが次 commit 単位の前提になっているから。ここが固まらないと、後続の UI 正常表示改善や security follow-up の優先順位がぶれやすい。

## 今回見つけた候補（最大3件）
1. **CareRoute-RX: WIP-TRIAGE-001 を keep / security follow-up / unrelated WIP に棚卸しする**
   - 目的: source repo の巨大差分を commit 単位に切り分ける
   - 直近 evidence: `git status` で **269 modified / 43 deleted / 44 untracked**
   - top-level concentration: `apps/` **271**, `frontend/` **42**, `tests/` **22**
   - 判定: **採用**

2. **DeadStockSolution: preview branch の削除-heavy 差分を keep / drop / relocate に分類する**
   - 目的: maintenance-first の境界を崩さずに棚卸しする
   - 直近 evidence: `git status` で **215 deleted / 5 modified / 5 untracked**
   - top-level concentration: `.claude/` **134**, `.sisyphus/` **28**, `client/` **21`, `server/` **18**
   - 判定: **保留寄り採用**

3. **OpenClaw Core の stale queue backlog safe-close / reopen policy**
   - 目的: board-routed backlog を件数ではなく政策で扱う
   - 判定: **保留**（既に board review が進行中で、新規差分が薄い）

## board の採否判断
- **採用**: 1
- **保留**: 2, 3

### Board の評価
- **Board Visionary**: 1 は「大きい差分」を commit 可能な単位へ分解するので、その後の FE-DISPLAY / security / unrelated の速度が上がる。
- **Board User Advocate**: 1 は次に何を見ればよいかが明確で、レビュー負荷を下げる。
- **Board Operator**: 1 は source repo の実作業前に棚卸しだけ進めるのが安全。2 は次点、3 は別 board 論点として扱う。
- **Board Auditor**: 1 は今の時点では分類まで。削除・移設の実行は、分類表が固まるまで保留。
- **Board Chair**: 今日は CareRoute の triage evidence を board decision 可能な形に整え、ソース編集はまだ行わない。

## その中で実際に着手したもの（最大1件）
- `reports/cron/proactive-idle-work-discovery-20260325-2220.md` を作成し、CareRoute-RX / DeadStockSolution の triage evidence を board review 形式で記録した。

## 残した成果物 / 差分
- 新規: `reports/cron/proactive-idle-work-discovery-20260325-2220.md`

## 見送った理由
- **source repo への直接編集**: 今回は棚卸し前の evidence 固めが先で、実編集に進むと review / rollback コストが上がる
- **DeadStockSolution の削除差分を先に触ること**: maintenance の境界が崩れやすく、CareRoute の triage より優先度が低い
- **OpenClaw Core の stale queue policy 再議論**: board review が進行中で、今日は新しい証跡がない
- **Telegram 設定変更 / auth / trust boundary / routing / approval の根幹変更**: 禁止

## 次アクション
1. CareRoute-RX の WIP-TRIAGE-001 を **FE-DISPLAY / security follow-up / unrelated WIP** の3 bucket に落とす
2. DeadStockSolution は preview branch の keep / drop / relocate だけに絞って次回 board に持ち込む
3. OpenClaw Core は backlog の safe-close / reopen policy の board decision 待ちに戻す
