# Board postmeeting memo — 監査の着手条件と順序

## 固定する範囲
- **triage** と **security audit / boundary / DDS 影響確認** は分離する。
- Board の論点は増やさず、既存の **3 件圧縮** を維持する。
- **auth / routing / trust boundary** に触れる変更は、必ず manual review を外さない。

## 着手条件
1. **triage が先**
   - backlog の `safe-close / reopen / escalate` を先に整理する。
   - owner / next action / success criteria を各 prefix で 1 行に固定する。
   - ここでは security audit を混ぜない。

2. **audit は triage 後に開始**
   - triage の整理が終わり、対象と evidence が分離できた段階で着手する。
   - 追加更新・新規施策は止めたままにする。

## 実施順序
1. **triage**: backlog 整理と振り分け
2. **security audit**: Gateway / public surface / host 側の監査
3. **boundary review**: auth / routing / trust boundary の manual review
4. **DDS 影響確認**: 境界確認後に影響の有無だけ判定

## reopen 条件
- 新しい evidence が出たとき
- risk escalation が起きたとき
- Board review 要請が出たとき
- ただし、**auth / routing / trust boundary** に関わるものは reopen せず manual review に回す

## ひとことで
- **先に triage を閉じ、次に audit、境界変更は manual review、DDS 確認は最後。**
