# CEO Reporting Flow

## Goal
ユーザー向け報告を CEO（たまAI）に一本化し、旧 trainer 集約ラインを廃止する。

## Flow
1. 部門代表ジョブが `org/departments/<dept>.md` と関連 role 定義を読む。
2. 実装・文書更新・検証が必要な作業は、OpenClaw が `.openclaw/` 契約に従って route decision / context pack / execution request を作る。
3. 重い実行は Claude Code adapter (`.openclaw/scripts/run_claude_code.sh`) 経由で処理する。
4. 各部門は `reports/company/<dept>-latest.md` を更新し、同時に `reports/company/archive/<dept>-YYYY-MM-DD-HHMM.md` を保存する。
5. CEO job は以下を読む:
   - `org/organization.md`
   - `org/operating-model.md`
   - `.openclaw/README.md`
   - `reports/company/*-latest.md`
   - `CURRENT_STATUS.md`
6. CEO job は差分を要約し、必要なら `CURRENT_STATUS.md` を更新する。
7. CEO job だけがユーザーに announce する。

## Escalation rules
- 重大障害、cron停止、データ欠損、法務/セキュリティ懸念は studio-operations or testing が `alert` にする。
- project-management は alert を優先順位に変換する。
- CEO は alert を先頭にまとめてユーザーへ通知する。

## File authority
- 組織・責務の正本: `org/`
- 実行システムの正本: `.openclaw/`
- 現況の正本: `CURRENT_STATUS.md`
- 部門ごとの差分ログ: `reports/company/`
- 旧 `homecare/` `sidebiz/` `trainer/` 配下は履歴として保持するが、新運用の正本ではない。
