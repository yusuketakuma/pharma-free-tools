# Workspace report learning review

- 実行時刻: 2026-03-23 03:00 JST
- 対象差分基準: `trainer/last-report-time.txt` の 2026-03-21 00:01 JST 以降
- 対象: `reports/`, `reports/company/`, `reports/cron/`, `trainer/`

## 結論
- 3/21 00:01 以降の新規知見で再利用価値が高いのは、**中央集約ジョブ停止の単一点障害**, **報告値の実ファイル検証の標準化**, **復旧確認を2段階で扱う運用**, **アーティファクト保管/清掃ルール不足** の4点。
- 新組織移行により、今後の正本は `org/` / `reports/company/` / `CURRENT_STATUS.md` / `projects/*` に寄せるべきで、`trainer/` は履歴・教訓の抽出元として扱うのが妥当。

## 抽出した知見

### 今後の開発ルール候補
- 大きな品質改善・一括修正タスクは、完了報告前に **実ファイル検証（grep / 件数 / サンプル確認）** を必須にする。
- 復旧系タスクは **「起動確認」と「成果物確認」** を分けて扱う。
- 中央集約ジョブ依存の運用では、**stale-report 検知** と **代替通知経路** をセットで設計する。
- 運用レポートの正本は新組織系 (`org/`, `reports/company/`) に寄せ、旧 `trainer/` 系は履歴扱いに固定する。

### 避けるべき失敗
- status 更新だけで「復旧完了」と見なすこと。
- 報告値を実データで裏取らずに 100% / 完了 と表現すること。
- 中央ジョブ停止時の代替手段を持たないまま期限管理を任せること。
- `.openclaw/tasks/` や `*.html.tmp` のような生成物を無方針で放置し、後で判断コストを上げること。

### 再利用できる施策
- grep / ファイル件数 / サンプル確認による **報告値の自動検証**。
- 再起動後 dispatch に **CRITICAL 未処理確認を先頭配置** する復旧テンプレート。
- `reports/company/*-latest.md` へ差分中心で集約するレポート構造。
- cleanup 前に **keep / archive / purge** を分けて棚卸しする非破壊レビュー方式。

### 文書化すべき運用知見
- CEO / 部門レポートの stale-report 閾値と通知先。
- 期限付きタスクの direct reminder 条件（中央停止時のエスカレーション）。
- `.openclaw/tasks/`, `reports/cron/`, `*.html.tmp` の保管期間と清掃手順。
- 「復旧確認 → 成果物確認」の2段階ヘルスチェック。

## docs / project docs に反映すべき内容
- `projects/openclaw-core/docs/status.md`: 単一点障害と artifact sprawl を current risk に追加。
- `projects/openclaw-core/backlog/queue.md`: stale-report 検知、fallback reminder、artifact retention、metric verification を Ready に追加。
- `projects/openclaw-core/learn/improvement-ledger.md`: 3/22-3/23 の教訓を ledger 化。
- `org/` 本体は今回は未編集。ルール本体化は別タスクで安全に実施するのが適切。

## 実際に修正したこと
- `projects/openclaw-core/docs/status.md` を更新
- `projects/openclaw-core/backlog/queue.md` を更新
- `projects/openclaw-core/learn/improvement-ledger.md` を更新
- 本レビューを `reports/cron/workspace-report-learning-review-20260323-0300.md` に保存

## 前回との差分
- 専用の learning review 記録は検出できず、**今回が初回ベースライン**。
- ただし `trainer` 最終巡回（2026-03-21 00:01）以降の新規差分として、以下を追加抽出:
  - 3/22: 旧 trainer 系から CEO + 部門別レポート体制へ移行
  - 3/20-3/21: 39時間停止と復旧運用の教訓
  - 3/22: testing による `.openclaw/tasks/` 180+ アーティファクト問題の顕在化
  - 3/20-3/21: sidebiz の実ファイル検証による「報告と実態の乖離」解消

## 次アクション
1. OpenClaw Core 側で stale-report 検知仕様を1枚にする（閾値・通知先・対象ジョブ）。
2. artifact retention ポリシー案を作る（`.openclaw/tasks/`, `reports/cron/`, `*.html.tmp`）。
3. metric verification checklist をテンプレ化し、部門レポートの完了条件へ組み込む。
4. ルール本体化が必要なら、次回は `org/operating-model.md` / `org/reporting-flow.md` に最小追記を提案する。
