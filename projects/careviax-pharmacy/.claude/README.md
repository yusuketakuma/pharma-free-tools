# Claude project template

この directory は **project-scoped Claude Code 設定** です。

- OpenClaw = control plane
- Claude Code = execution plane
- primary transport = ACP
- secondary transport = CLI

## Files
- .claude/settings.json: team-shared template
- .claude/agents/: coding-oriented specialists
- CLAUDE.md: project 固有の実行規約

## Policy
- coding-oriented specialist のみを常設する
- product / design / ops を全部 active agent 化しない
- 安全制御は prompt ではなく hooks / permissions / protected paths を優先する
