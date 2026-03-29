# careroute-rx CI Startup Failure 調査結果

**日時**: 2026-03-29 10:06 JST
**対象**: yusuketakuma/careroute-rx PR #1236, #1237, #1238

## 結論

**ワークフロー設定の問題ではなく、GitHub-hosted runner の割り当て失敗（インフラ問題）です。**

PR だけでなく main push の CI も全て同じ症状で失敗しています。コード変更による修正は不可能です。

## 調査事実

### 症状
- 全 job が `steps: 0` で `conclusion: failure`
- `runner_name: ""` (runner 未割り当て)
- 全 job が同時刻 (00:52:42Z) に開始し 3〜7秒で完了
- **3月22日以降の全 PR run が failure**（30件以上連続）
- **main push も同様に failure**（3月17日以降全て）

### 確認したこと
| 項目 | 結果 |
|------|------|
| Actions 有効 | ✅ `enabled: true` |
| Workflow YAML | ✅ 構文・構造に問題なし |
| composite action | ✅ `setup-node-pnpm` 正常 |
| Runner (self-hosted) | ❌ 0台（GitHub-hosted に依存） |
| 最近の success | ❌ CI workflow の success なし（Dependabot以外） |

### ユーザー認識との差分
「main push時のCIは正常に通る」とのことでしたが、実際には **main push の CI も 3月17日以降全て failure** です。おそらく Vercel のデプロイ成功と混同されている可能性があります（Vercel Preview Comments は SUCCESS になっています）。

## 推定原因

GitHub-hosted runner が割り当てられていません。考えられる理由:

1. **GitHub Free の Actions 分超過** — private repo の場合、Free plan では月 2,000 分/月、ストレージ 500MB。30+ job × 30+ jobs/run で容易に枯渇
2. **GitHub 側の一時的障害** — ただし 1週間以上継続しているため不太可能性
3. **Billing/account の問題** — 課金設定の不整合など

## 推奨アクション

1. **GitHub Settings → Billing → Actions** で使用量・残量を確認
2. `gh auth refresh -h github.com -s user` 後 `gh api users/yusuketakuma/settings/billing/actions` で API 経由でも確認可能
3. 分超過の場合: GitHub Pro へのアップグレード、または public repo 化を検討
4. 分超過でない場合: GitHub Support に連絡（runner allocation failure の報告）

## 補足

PR #1236 (fix/cwe-330-patient-id-...), #1237, #1238 は全て同じ branch pattern の別 PR です。branch 内容自体は CI failure の原因ではありません。
