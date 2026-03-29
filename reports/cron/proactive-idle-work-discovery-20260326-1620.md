# Proactive Idle Work Discovery — Board Review

Date: 2026-03-26 16:20 JST

## 結論
今回は **workspace ↔ live runtime の bundle sync / dry-run / smoke を 1ページ化して、次の反映手順を迷わない形に固定すること** を採用した。

理由は、今朝からの board で bundle sync 自体は一致している一方、**smoke 範囲と stop 条件がまだ薄い** ため、実反映前に判断を短くする補助物が必要だったから。

## 今回見つけた候補（最大3件）
1. **bundle sync dry-run / smoke mini-spec を追加する**
   - 目的: `.openclaw/` の live reflection を bundle 単位で扱い、partial sync を止める
   - board 判定: **採用**

2. **openclaw-core の最小メトリクスを 1 枚にする**
   - 目的: `proposal → implementation → 定着` を追える最小指標を揃える
   - board 判定: **保留**
   - 理由: 重要だが、今回は bundle sync の不確実性の方が先

3. **board runtime producer map の統一案を詰める**
   - 目的: board 側の append / producer 経路を一本化する
   - board 判定: **保留**
   - 理由: 調査継続中で、今は smoke 固定の方が先に効く

## board の採否判断
- **採用**: 1
- **保留**: 2, 3

### Board の評価
- **Board Visionary**: 1 は live reflection の事故を bundle 単位で抑えるので、今後の反映コストを下げる。
- **Board User Advocate**: 1 は 1ページで済み、運用負荷が低い。
- **Board Operator**: 1 は doc 追加だけで前進でき、実反映を急がない。
- **Board Auditor**: 1 は partial sync を stop condition にできるため安全。
- **Board Chair**: 今日は「反映する前の型」を固定するのが正解。

## その中で実際に着手したもの（最大1件）
- `projects/openclaw-core/docs/bundle-sync-dry-run-smoke.md` を新規作成
- `projects/openclaw-core/ops/RUNBOOK.md` の runtime bundle sync section をこの doc に接続
- `projects/openclaw-core/backlog/queue.md` の bundle sync 項目に参照を追加

## 残した成果物 / 差分
- 新規: `projects/openclaw-core/docs/bundle-sync-dry-run-smoke.md`
- 更新: `projects/openclaw-core/ops/RUNBOOK.md`
- 更新: `projects/openclaw-core/backlog/queue.md`
- 新規報告: `reports/cron/proactive-idle-work-discovery-20260326-1620.md`

## 見送った理由
- **openclaw-core 最小メトリクス**: 価値は高いが、bundle sync の安全性固定より後
- **board runtime producer map の統一**: 継続審議中で、今は調査段階
- **Telegram 設定変更**: 禁止
- **auth / trust boundary / routing / approval の根幹変更**: 禁止
- **高リスクな live reflection**: bundle 単位の dry-run 前なので未着手

## 次アクション
1. bundle sync 実行時は `projects/openclaw-core/docs/bundle-sync-dry-run-smoke.md` を先に参照する
2. 次回の board では、bundle sync の smoke 結果が出た場合のみ再審議する
3. openclaw-core の最小メトリクスは、次の exploration で候補化する
4. 通常通知は行わず、定期報告へ集約する
