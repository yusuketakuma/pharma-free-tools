# memory/ ディレクトリ

## Purpose

このディレクトリは、自律探索・定期チェック・タスク実行の成果物を蓄積する場所です。

MEMORY.md には長期安定情報のみを残し、本ディレクトリには日次・セッション単位の成果物を置きます。

## ファイル命名規則

- `YYYY-MM-DD-<category>-<short-name>.md`
- category: `discovery` / `report` / `proposal` / `runbook` / `checklist` / `template` / `retrospective`

## 例

- `2026-03-28-discovery-idle-exploration-001.md`
- `2026-03-28-proposal-auto-cleanup-queue.md`
- `2026-03-28-runbook-healthcheck-daily.md`

## 保存対象

自律探索で見つけた仕事の成果物は、可能な限り次のいずれかの形でここに残します。

- report: 調査結果のまとめ
- proposal: 改善提案（採用/保留/却下を明記）
- runbook: 手順書・運用マニュアル
- checklist: 確認項目リスト
- template: 再利用可能なテンプレート
- retrospective: セッション振り返り

## 保存不要なもの

- 変更なし / no-op のセッション
- 他の成果物に統合済みの内容
- 一般論のみで具体性のないもの

## 整理ルール

- 30日を超えた成果物は要約して archive/ に移動
- 同種テーマは最新版に統合
- 採用された提案は実装済みフラグを付与
