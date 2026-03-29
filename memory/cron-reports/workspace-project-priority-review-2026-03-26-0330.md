# Workspace Project Priority Review — 2026-03-26 03:30 JST

## 結論
- **Top3 は前回維持**: `openclaw-core` → `careroute-rx` → `pharma-free-tools`。
- ただし、今回は `pharma-free-tools` の優先順位が「新規探索」よりも「既存改善の実装待ち」へさらに寄った。
- `deadstocksolution` は差分量と未整理度が極めて高いが、maintenance-first のため Top3 には入れず、棚卸し対象として継続監視が妥当。
- `careviax-pharmacy` は project slot はあるが、まだ executable backlog が薄い。

## 4観点の軽い採点

| Project | 変更量 | 未整理度 | 業務/収益インパクト | 次の1手の明確さ | 補足 |
|---|---:|---:|---:|---:|---|
| openclaw-core | 4 | 4 | 5 | 5 | source_repo なし。docs / backlog ベースで評価。全体レバレッジ最大。 |
| careroute-rx | 5 | 4 | 5 | 4 | source repo が最大級に dirty。WIP-TRIAGE が最優先。 |
| pharma-free-tools | 3 | 2 | 4 | 5 | 既存改善優先が整理済みで、低リスク成果化に最も入りやすい。 |
| deadstocksolution | 5 | 5 | 3 | 3 | deletion-heavy だが maintenance-first。先に棚卸し。 |
| careviax-pharmacy | 1 | 4 | 2 | 1 | bootstrap 段階で executable backlog が薄い。 |

## 優先案件トップ3

### 1) openclaw-core
- **現状**: stale-report detection、fallback notification、evidence-based verification、queue telemetry、pre/post-update checklist など、Ready が具体化している。
- **優先すべき理由**: workspace 全体の自律実行品質・レビュー品質・更新安全性を底上げできる。
- **次の最小アクション**: Ready #1 `stale-report detection for CEO / department jobs` の仕様を 1 枚に落とす。

### 2) careroute-rx
- **現状**: P0 security fixes は完了後、UI 正常表示改善フェーズ。source repo に大きな未コミット差分が残る。
- **優先すべき理由**: 事業/運用インパクトが非常に高く、差分肥大化で review / rollback / security 確認コストが跳ねやすい。
- **次の最小アクション**: source repo を `FE-DISPLAY 系 / security follow-up / unrelated WIP` に棚卸しし、次 commit 単位を切り出す。

### 3) pharma-free-tools
- **現状**: 2026-03-25 existing-only refresh で Top3 が固定され、返戻表記ゆれの低リスク修正も先行適用済み。運用は「実需調査→既存改善」にかなり収束している。
- **優先すべき理由**: 実需ベースで改善候補が絞られており、低リスクで成果を積みやすい。今は新規探索より実装・補修の方が効く。
- **次の最小アクション**: 1位候補 `薬歴下書き・要点整理支援` のワイヤーと出力要件（SOAP / 次回確認事項 / 患者説明メモ）を 1 枚に固定する。

## Top3 以外の理由

- **deadstocksolution**: 差分量と未整理度は最大級だが maintenance-first。今すぐの価値は「実装」ではなく「削除差分の棚卸し」にあるため、Top3 よりは一段後ろ。
- **careviax-pharmacy**: project slot はあるが、まだ requirements capture の段階で、今すぐ深掘る executable backlog が薄い。

## 実際に修正したこと
- 本レビューを `reports/cron/workspace-project-priority-review-20260326-0330.md` として保存。

## 前回との差分
- **Top3 の顔ぶれは維持**。
- 前回と比べて、`pharma-free-tools` は 2026-03-25 existing-only refresh により「次に何を実装するか」がさらに明確になった。
- `careroute-rx` は巨大 WIP の棚卸し必要性が変わらず最優先で、今も source repo の差分量が圧倒的。
- `openclaw-core` は backlog がさらに具体化しており、横断レバレッジ優先の判断を維持。
- `deadstocksolution` は削除-heavy の危険性が明確なままだが、maintenance-first のため Top3 には上げない判断を継続。
- `careviax-pharmacy` は前回同様、まず project-local の整理が先で、優先度は上がらなかった。

## 次アクション
1. **openclaw-core** の `stale-report detection` 仕様を 1 枚化する。
2. **careroute-rx** の巨大差分を `FE-DISPLAY / security follow-up / unrelated WIP` に切る。
3. **pharma-free-tools** の 1位候補をワイヤー化して実装待ちにする。
4. **deadstocksolution** は preview branch の keep / drop / relocate 棚卸しを待つ。
5. **careviax-pharmacy** は backlog を作れる最小粒度の要求整理を先に行う。
