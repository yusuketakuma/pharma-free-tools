# step2 / step3 / step5 alignment

## 実装したこと
- 現在の 12 エージェント構成を、人間が読める agent 定義として整理した。
- CEO / Board / 実務 / 探索サービスの4層で部門マップを作った。
- 各 agent ごとに、役割・主な仕事・やらないこと・連携先・判断基準・共通参照を定義した。
- step3 の guidelines と step5 の templates を、どの agent が参照するかの導線を追加した。

## 今回の要点
- step2 は runtime config の生 JSON ではなく、運用者が読める agent 定義として搭載した。
- step3 は共通マニュアルとして、組織モデル・報告・handoff・state separation・security を共有化した。
- step5 は regular report / board decision / execution handoff / receipt reconciliation / backlog triage / DDS response の型を固定した。

## 良くなった点
- 現在の agent 配置を増やす前に、誰が何を担当するかが見えるようになった。
- 新規専用エージェント追加時に、どの guideline / template を使えばよいかが分かるようになった。
- Board / exec / DDS / reporting の言葉の意味を揃えやすくなった。

## まだ未実施
- 既存 runtime prompt から各 agent 定義ファイルを直接参照する配線はまだ入れていない。
- 新規 agent 追加自体は未実施。

## 推奨する次段階
1. Receipt / Delivery Reconciler を追加し、receipt-reconciliation template を直接使わせる
2. Queue / Backlog Triage Clerk を追加し、backlog-triage template を直接使わせる
3. Virtual Team Architect を追加し、新役追加時の設計審査を担わせる
