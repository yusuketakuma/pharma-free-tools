# step3 / step5 rollout

## 実装したこと
- 共通マニュアル群 `guidelines/` を追加した。
- 出力テンプレート群 `templates/` を追加した。
- 現在のたまAI運用に合わせて、Board / reporting / escalation / security / collaboration / tools の共通ルールを文書化した。

## 共通マニュアルの要点
- 組織モデルは OpenClaw intake / Claude Code execution / Board exception review を前提にする。
- report は内容ベースを先に説明し、ファイル名列挙を主報告にしない。
- handoff は exact target / owner / due / success criteria を必須にする。
- review / apply / live receipt / artifact / effect-confirmed を混ぜない。
- protected path / trust boundary / routing root / Telegram 設定は manual review。
- 仮想チームは「作って終わり」ではなく育てるものとして扱う。

## テンプレートの要点
- regular report は「実行したこと / 実行できなかったこと / 私に求めること / 次に行うこと」に固定。
- Board decision は proposal の中身と理由を分けて扱う。
- execution handoff は preflight 情報を漏らさない。
- receipt reconciliation は sent / live_receipt / artifact_confirmed / effect_confirmed を分離する。
- backlog triage は close / reopen / escalate / suppress の判断型を固定する。
- DDS response は既存 JSON 契約をテンプレ化した。

## まだやっていないこと
- これらを各エージェント prompt / runbook へ全面参照接続する作業は未実施。
- 新規専用エージェントへの組み込みは次段階。

## 推奨する次段階
1. Receipt / Delivery Reconciler を追加し、この templates/guidelines を直接参照させる
2. Queue / Backlog Triage Clerk を追加し、stale / reopen / suppress を標準化する
3. Virtual Team Architect を追加し、新規役追加時の設計審査を一元化する
