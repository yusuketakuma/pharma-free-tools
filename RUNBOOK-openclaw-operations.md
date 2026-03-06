# OpenClaw Runbook (Yusuke)

## Scope
- Telegram 3-group split operations
- DeadStockSolution preview-first development
- Commit-required recovery policy

## Channel/Agent mapping
- main (DM): `5385492291`
- coding group: `-5103716630`
- homecare group: `-5120826308`
- sidebiz group: `-5147669676`

## Mandatory rules
1. Development target branch: `preview` only
2. Every change must be committed
3. 8-hour summary reports must be posted per channel
4. High-risk actions require explicit confirmation

## Incident response
### 1) Telegram no response
- Check OpenClaw status/logs
- Verify bot in group and permissions
- Verify `groupPolicy`, `groups`, `allowFrom`
- Verify BotFather privacy mode if needed

### 2) OpenClaw update failure
- Confirm `update.channel=stable`
- Run `openclaw doctor --non-interactive`
- Restart gateway

### 3) DeadStockSolution connector failure
- Check `OPENCLAW_CONNECTOR_MODE=gateway_cli`
- Check `OPENCLAW_CLI_PATH`
- Verify handoff smoke test (`accepted=true`)

## Rollback
- Use Git commit history in `preview`
- Revert latest commit and re-run tests

## Reporting template (8h)
1. Changes
2. Test results
3. Risks / unresolved
4. Next action
5. Commit IDs
