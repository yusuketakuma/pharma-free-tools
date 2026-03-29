# Claude Code ↔ OpenClaw 引継ぎ規約

## 原則
Claude Codeはタスク完了時に必ず完了報告ファイルを更新する。
OpenClawはexec完了イベント時にそのファイルを読んでユーザーへ報告する。

## Claude Code側ルール
- タスク開始時に `reports/claude-code/current-task.md` にタスク内容を書く
- タスク完了時に `reports/claude-code/completion-latest.md` に以下を書く:

```
# Claude Code 完了報告
- completed_at: <ISO日時>
- task: <タスク概要>
- status: success | failed | partial
- files_changed: <変更ファイル一覧>
- summary: <1〜3行の結果サマリ>
- next: <次にやるべきこと>
- blocked: <ブロック要因（あれば）>
```

## OpenClaw側ルール
- Claude Codeをbackground execで起動した後、完了イベントを待つ
- 完了イベント受信時に `reports/claude-code/completion-latest.md` を読む
- ユーザーに結果を報告する（中身があれば中身を、なければexec出力を）
- 報告時に次のアクション（フェーズ進行・ユーザー確認事項）を明示する

## 完了報告ファイルのパス
- 完了正本: `reports/claude-code/completion-latest.md`
- 現在タスク: `reports/claude-code/current-task.md`

## Claude Codeのプロンプト末尾に必ず付与するテンプレート
```
### 完了報告（必須）
タスク完了後、以下の内容で /Users/yusuke/.openclaw/workspace/reports/claude-code/completion-latest.md を作成してください:
- completed_at: <現在時刻>
- task: <タスク概要>
- status: success / failed / partial
- files_changed: <変更したファイル一覧>
- summary: <結果の1〜3行サマリ>
- next: <次にやるべきこと>
- blocked: <ブロック要因（なければ空>
```
