# Claude Code offload tuning — 2026-03-26

## 結論
軽作業まで無差別に Claude Code へ寄せるのではなく、**重い調査・実装・修正を Claude Code 優先**にする調整を入れた。

## 実行したこと
### 1. execution placement policy 調整
対象: `~/.openclaw/config/execution-placement-policy.yaml`

変更点:
- `openclaw_only` から `investigate` を外した
- `claude_code` 対象を `H1, H2` から **`H1, H2, H3`** に拡張した
- `operation_type` の Claude Code 対象を以下へ拡張した
  - `investigate`
  - `implement_small`
  - `implement_large`
  - `test_only`
  - `fix`
  - `refactor`
- **単一repo・単純サーフェスの H3** は Claude Code に全面委譲しやすくした
- **多サーフェス / 複数プロジェクトの H3** は split を維持した

### 2. routing policy 調整
対象: `~/.openclaw/config/routing-policy.yaml`

変更点:
- `routes.investigate.lane`
  - `cli` → **`acp_compat`**
- `routes.investigate.constraints.timeoutMinutes`
  - `15` → **`20`**

## ねらい
- OpenClaw は control plane に寄せる
- Claude Code は execution plane として使う
- repo-wide 調査 / 複数ファイル読解 / 実装修正を、前より Claude Code に流しやすくする
- ただし、軽い要約・整理・報告まで offload しない

## 入れなかったもの
- live runtime bundle 反映
- ACP backend / defaultAgent の大きな切替
- 全 agent 一律の Claude Code 化

理由:
- 今回の目的は「積極オフロード化」であり、runtime 反映工事まで一気にやるとリスクが高い
- まずは routing と placement の優先度調整だけに留めるのが安全

## 期待される変化
- repo investigation が OpenClaw に残りすぎない
- H3 単体作業が Claude Code に流れやすくなる
- 高重量 task で `acp_compat` がより主系として使われる

## 次に確認すべきこと
1. 次回の重い investigate / fix / refactor が Claude Code 側へ流れるか
2. `acp_compat` lane の成功率と待ち時間
3. `cli_backend_safety_net` に不要フォールバックしていないか
4. live runtime 反映を bundle 単位で行うかどうか
