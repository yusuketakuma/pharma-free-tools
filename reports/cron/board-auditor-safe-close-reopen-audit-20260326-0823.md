# Board Auditor Audit — safe-close / reopen ambiguity check

- 実行時刻: 2026-03-26 08:23 JST
- 対象: `waiting_auth` / `waiting_manual_review` の safe-close 後 silent failure と reopen 条件

## 結論
現行ドキュメントは、**safe-close / reopen / hold / escalate の分岐自体は用意できている**。  
ただし、**safe-close が silent failure にならないための客観条件** と、**reopen を発火させる条件** はまだ抽象度が高く、運用者の解釈差が入りうる。

## 確認できたこと
- `projects/openclaw-core/docs/stale-queue-safe-close-reopen-policy.md` で、
  - safe-close / reopen / hold / escalate の4状態を定義済み
  - runtime queue state は read-only のまま board decision を待つ方針
  - dominant-prefix triage は `Queue Triage Analyst` に分離する方針
- `projects/openclaw-core/docs/queue-dominant-prefix-triage.md` で、
  - 各 prefix に owner / next action / success criteria を持たせる方針
  - 3回無差分や judgment gap 継続時は board decision へ寄せる方針
- `reports/cron/queue-prefix-staleness-reopen-shortreport-20260326-0816.md` で、
  - `lane-runtime-partial-write` / `step6-lane-write-blocked` は reopen ではなく board 再判断に回すべき、という補足がある

## まだ曖昧な点
### 1) safe-close の silent failure 防止条件が定量化されていない
`safe-close` 条件は記述されているが、次が曖昧。
- 「stale relative to cadence」の閾値
- 「durable summary / checklist / board note に吸収済み」の判定基準
- 「closing しても operational risk を隠さない」の判定基準

結果として、**見た目上 close できても、次サイクルで同一 prefix が再燃したときに “誤って閉じた” と検知しづらい**。

### 2) reopen 条件が広く、再開の発火点が曖昧
`reopen` 条件は妥当だが、以下が未固定。
- 新しい evidence の最小要件
- 「new owner / due / success-criteria signal」の具体的な差分
- 何サイクル以内の再出現を reopen とみなすか
- 同一 prefix の再発を reopen と board 再判断のどちらに振るか

### 3) close 後の監視チェックが policy からはまだ見えにくい
`deferred_item.review_after` と `reopen_if` はあるが、
- close 後に誰が
- いつまでに
- 何を見て
- どの条件なら reopen に切り替えるか

が明示されていない。

## 監視上の見立て
- 今の実装は「無条件自動 drain」を避ける方向には寄っている。
- ただし、**silent failure の防止は “read-only” だけでは足りず、close record の必須項目と reopen トリガーの固定が必要**。

## 推奨
1. safe-close 記録に必須項目を追加する
   - `owner`
   - `next_action`
   - `success_criteria`
   - `review_after`
   - `linked_evidence`
2. reopen トリガーを明文化する
   - 同一 prefix が `N` 回以内に再出現
   - 新しい owner / due / success criteria が付いた
   - 依存タスクが block された
   - evidence が増えた
3. silent failure 検知を追加する
   - safe-close 後に同 prefix が再燃したら、まず reopen ではなく「close 判定の妥当性」を記録
   - 2回以上続くなら board 再判断へ昇格

## 参照
- `projects/openclaw-core/docs/stale-queue-safe-close-reopen-policy.md`
- `projects/openclaw-core/docs/queue-dominant-prefix-triage.md`
- `projects/openclaw-core/backlog/queue.md`
- `reports/cron/queue-prefix-staleness-reopen-shortreport-20260326-0816.md`
