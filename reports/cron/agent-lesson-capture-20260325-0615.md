# agent-lesson-capture — 2026-03-25 06:15 JST

## 結論
直近の実行を見ると、**改善は進んでいるが、監督系ジョブの重複と再掲がまだ強い**です。

特に目立つのは次の3点です。
- Supervisor 系ジョブが近い論点を別ジョブで繰り返しやすい
- 指標・履歴が不足しているのに、追加ルールを増やしがち
- 一部の軽微タスクで exact target mismatch の再試行経路が弱い

## 回収した lesson

### 1) ceo-tama 系
**success**
- 定時報告の集約先を **7:00 / 12:00 / 17:00 / 23:00** に統一
- `agent-performance-optimization-review` を追加し、再配置だけでなく **model / thinkingDefault / subagents.thinking** の最適化も扱うように拡張

**failure**
- 監督ジョブの論点が重なりやすく、同じ方向の報告を別名で増やしやすい
- `pharma-free-tools-theme-extraction` で exact target mismatch が起きたため、対象確認の精度が不足

**lesson**
- 「再配置」だけでは足りず、**性能最適化まで一体で見る**ほうが実務的
- 監督ジョブは増やすより、**統合・縮小・再掲抑制** が効く

**next_change**
- `agent-staffing-and-prompt-tuning` を再配置だけでなく性能最適化に拡張
- `autonomy-loop-health-review` に性能最適化の評価項目を追加
- exact target を先に確認してから軽微修正をかける

### 2) supervisor-core 系
**success**
- `queue telemetry → triage → decision-quality` の反復に対して、**エスカレーション規則** を明文化できた
- 報告の再掲を抑え、owner / due / success criteria を必須化する方向へ進めた

**failure**
- 同じ改善候補が残存しやすく、履歴不足のまま 3回連続差分なし / 3日連続指標不足 を判定しがち

**lesson**
- **履歴が足りないときは規則を増やさない** のが正しい
- 似た報告は増やすより、**1件に統合して次アクションを具体化** するべき

**next_change**
- 2回連続要判断事項ありは priority review へ昇格
- 3回連続差分なし / 3日連続指標不足は、十分な履歴があるときだけ判定
- owner / due / success criteria を次回から強制

### 3) dss-manager 系
**success**
- DDS 連携の E2E テストで、**completed / blocked / failed / PR報告** の各経路を分けて確認できた
- PR報告経路は完了
- blocked は「追加情報待ち」として正しく停止できている

**failure**
- failed は意図的失敗で、実障害ではない
- blocked 経路の扱いを継続的に明確に保つ必要がある

**lesson**
- DDS のような経路分岐は、**成功・失敗・blocked を分けて扱う** ことが重要
- blocked は失敗ではなく、**ユーザー入力待ち** として整理すべき

**next_change**
- blocked 経路は「利用者からの回答待ち」を明示し、再試行基準を分ける
- failed / blocked / completed の意味をレポートで固定化する

## 反復失敗
- **監督ジョブの重複** が続いている
  - 再配置、lesson 回収、性能最適化、健康診断が同じ論点を繰り返しやすい
- **履歴不足なのに判定を進める** 傾向がある
  - 3回連続差分なし / 3日連続指標不足の扱いは慎重にする必要がある
- **軽微タスクの exact target mismatch**
  - 対象確認の前処理が弱い

## 次回の変更候補
1. 監督系ジョブをさらに統合し、重複論点の再掲を止める
2. exact target を使うタスクは、先に対象確認ステップを必須化する
3. 判定ルールに「履歴不足なら規則追加しない」を強める
4. 2回連続要判断事項ありを priority review に自動昇格する

## 次アクション
- 次回の定期報告では、
  - **重複論点の件数**
  - **owner / due / success criteria 付き比率**
  - **履歴不足扱いの件数**
  を簡易に追う
- 監督系ジョブの統合候補を 1 つに絞って提案する
