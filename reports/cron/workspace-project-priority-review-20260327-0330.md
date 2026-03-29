# Workspace Project Priority Review — 2026-03-27 03:30 JST

## 結論
- **Top3 は前回維持**: `openclaw-core` → `careroute-rx` → `pharma-free-tools`。
- いま時間を使う優先度は、**横断レバレッジの大きい基盤整備** と **巨大 WIP の棚卸し** に寄せるのが最適。
- `deadstocksolution` は差分量・未整理度は高いが、maintenance-first で業務/収益インパクトが相対的に小さいため、今回は Top3 から外す。
- `careviax-pharmacy` は project slot はあるが、まだ executable backlog が薄い。

## 4観点の軽い採点

| Project | 変更量 | 未整理度 | 業務/収益インパクト | 次の1手の明確さ | 補足 |
|---|---:|---:|---:|---:|---|
| openclaw-core | 3 | 3 | 5 | 5 | source_repo なし。docs / backlog ベースだが、Ready が具体化していて control plane レバレッジが最大。 |
| careroute-rx | 5 | 5 | 5 | 4 | source repo が非常に dirty。P0 security 後の WIP-TRIAGE が最優先。 |
| pharma-free-tools | 4 | 3 | 4 | 5 | Top3 が固定され、既存改善に収束。実装待ちの形が最も明確。 |
| deadstocksolution | 5 | 5 | 2 | 3 | deletion-heavy だが maintenance-first。まず棚卸しは必要、ただし事業インパクトは相対的に低い。 |
| careviax-pharmacy | 1 | 2 | 2 | 1 | bootstrap 段階で、まだ薄い。 |

## 優先案件トップ3

### 1) openclaw-core
- **現状**: stale-report detection、verification checklist、queue telemetry、bundle sync など、Ready が「実装に落とせる粒度」まで具体化している。
- **優先すべき理由**: workspace 全体の自律実行品質・レビュー品質・更新安全性を底上げできる。ここを詰めると他案件の回転も上がる。
- **次の最小アクション**: Ready #1 `stale-report detection for CEO / department jobs` を 1 枚仕様に落とす。

### 2) careroute-rx
- **現状**: P0 security fixes は完了後フェーズだが、source repo に大きい未コミット差分が残る。今回も変更量が突出している。
- **優先すべき理由**: 事業/運用インパクトが最も大きく、差分肥大化で review / rollback / security 確認コストが一気に上がる。
- **次の最小アクション**: `FE-DISPLAY 系 / security follow-up / unrelated WIP` に棚卸しして、次 commit 単位を切り出す。

### 3) pharma-free-tools
- **現状**: 2026-03-27 refresh で Top3 維持。薬歴 / 供給障害 / 返戻の 3 テーマが既存改善として収束している。
- **優先すべき理由**: 実需ベースで改善候補が絞られており、低リスクで成果を積みやすい。新規探索より実装・補修の方が効く。
- **次の最小アクション**: 1位候補 `薬歴下書き・要点整理支援` のワイヤーと出力要件（SOAP / 次回確認事項 / 患者説明メモ）を固定する。

## Top3 以外の理由

- **deadstocksolution**: 大量削除差分の棚卸しは必要だが、maintenance-first で今の価値は「実装」より「keep / drop / relocate の整理」。事業インパクトが Top3 に届かない。
- **careviax-pharmacy**: project-local の整理は必要だが、現時点では実装に落とせる backlog が薄い。

## 実際に修正したこと
- 本レビューを `reports/cron/workspace-project-priority-review-20260327-0330.md` として保存。

## 前回との差分
- **Top3 の顔ぶれは維持**。
- `careroute-rx` は巨大 WIP の棚卸し必要性が変わらず最優先で、変更量も依然として突出。
- `openclaw-core` は backlog がさらに実装寄りに具体化し、control plane 優先の判断を維持。
- `pharma-free-tools` は 2026-03-27 refresh でも変更なしで、実装待ちの優先順位が安定。
- `deadstocksolution` は deletion-heavy の危険性は高いままだが、maintenance-first のため今回も Top3 には上げない。
- `careviax-pharmacy` は前回同様、まず project-local の整理が先で、優先度は上がらなかった。

## 次アクション
1. **openclaw-core** の `stale-report detection` 仕様を 1 枚化する。
2. **careroute-rx** の巨大差分を `FE-DISPLAY / security follow-up / unrelated WIP` に切る。
3. **pharma-free-tools** の 1位候補をワイヤー化して実装待ちにする。
4. **deadstocksolution** は preview branch の keep / drop / relocate 棚卸しを待つ。
5. **careviax-pharmacy** は backlog を作れる最小粒度の要求整理を先に行う。
