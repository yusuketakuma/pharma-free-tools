# OpenClaw pre-update baseline — 2026-03-23 23:30 JST

## Summary
- Current version: **OpenClaw 2026.3.13 (61d171a)**
- Target update under consideration: **2026.3.22**
- Gateway service: **loaded / running**
- Node service: **installed / not loaded**
- Telegram: **OK**
- Browser control server: **listening on 127.0.0.1:18791**
- Known remaining issue before update: **`gateway.probe_failed` / `missing scope: operator.read`** on deep status/audit

## Current status snapshot
### `openclaw status --all`
- Version: 2026.3.13
- OS: macos 26.3.1 (arm64)
- Node: 24.14.0
- Dashboard: http://127.0.0.1:18789/
- Gateway: local / loopback / `unreachable (missing scope: operator.read)`
- Gateway service: LaunchAgent installed · loaded · running
- Node service: LaunchAgent installed · not loaded · unknown
- Telegram account `default`: OK
- Agents: 7 total / 6 bootstrapping / 1 active / 40 sessions

### `openclaw health --json`
- `channels.telegram.probe.ok = true`
- Telegram bot probe succeeded
- Agent/session inventory visible

### `openclaw security audit --deep`
- Critical: 0
- Warn: 2
  1. `security.trust_model.multi_user_heuristic`
  2. `gateway.probe_failed` → `missing scope: operator.read`
- Info: attack surface summary only

## Services / LaunchAgents
### Gateway LaunchAgent
- Label: `ai.openclaw.gateway`
- Comment: `OpenClaw Gateway (v2026.3.13)`
- ProgramArguments:
  - `/usr/local/bin/node`
  - `/Users/yusuke/.nvm/versions/node/v24.14.0/lib/node_modules/openclaw/dist/index.js`
  - `gateway --port 18789`

### Node LaunchAgent
- Label: `ai.openclaw.node`
- Comment: `OpenClaw Node Host (v2026.3.13)`
- ProgramArguments:
  - `/usr/local/bin/node`
  - `/Users/yusuke/.nvm/versions/node/v24.14.0/lib/node_modules/openclaw/dist/index.js`
  - `node run --host 127.0.0.1 --port 18789`
- Current state: **not loaded**

## Auth / device baseline
### `~/.openclaw/identity/device-auth.json`
- deviceId: `f3934f2889285c40bf4e9f78080db110cad512c2a0c3d2d133cc8df1c64ce4f1`
- operator scopes:
  - `operator.admin`
  - `operator.approvals`
  - `operator.pairing`
  - `operator.read`
  - `operator.write`
- node scopes:
  - `operator.admin`
  - `operator.approvals`
  - `operator.pairing`
  - `operator.read`
  - `operator.write`

### `~/.openclaw/devices/paired.json`
- paired device role: `operator`
- roles: `[operator, node]`
- approvedScopes include `operator.read` and `operator.write`

## Config corrections already applied before update
1. **CLI path stabilization**
   - `~/.local/bin/openclaw` symlinked to NVM openclaw binary
   - login shell `openclaw --version` confirmed as 2026.3.13
2. **LaunchAgent cleanup**
   - removed legacy `com.openclaw.*` LaunchAgents
   - remaining: `ai.openclaw.gateway`, `ai.openclaw.node`
3. **Telegram allowlist cleanup**
   - removed negative group chat IDs from `channels.telegram.groupAllowFrom`
   - group permissions retained under `channels.telegram.groups`
4. **Node service noise reduction**
   - stopped `ai.openclaw.node` service to remove pairing-required noise during pre-update evaluation

## Remaining known issues
### 1. Deep gateway probe auth mismatch
- `openclaw status --all` still reports:
  - `Gateway ... unreachable (missing scope: operator.read)`
- `openclaw security audit --deep` still reports:
  - `gateway.probe_failed`
- This appears to be **probe-specific auth/cached session mismatch**, not a full Telegram/gateway outage.

### 2. Historical node pairing noise remains in logs
- `node.err.log` contains repeated historical:
  - `gateway connect failed: pairing required`
  - `node host gateway closed (1008): pairing required`
- Service is currently stopped; these are baseline historical artifacts.

## Log highlights
### `gateway.err.log`
- Historical node-host role-upgrade / pairing-required events around 23:21 JST
- Historical Telegram `Invalid allowFrom entry` warnings before config cleanup
- Temporary `sendChatAction` / `sendMessage` network failures around restart window

### `gateway.log`
- Gateway restart around config updates completed successfully
- Telegram provider restarted and resumed successfully
- Browser control listening on 127.0.0.1:18791
- Repeated deep-probe `missing scope: operator.read` responses remain

## File hashes
- `~/.openclaw/openclaw.json`
  - `a3e548f45651093325eeadcb768076199c94c76067b319a394fd3c9cb3f15e11`
- `~/.openclaw/identity/device-auth.json`
  - `eee2494cc5920e8a77fc347a16e2a269121527bd76a5e3428f1af6fec5b8bba1`
- `~/.openclaw/devices/paired.json`
  - `6bb86aacfb9cb86ab378b406bbd19e4a5282bdaa781437cb10612a62a72fbe5d`

## Recommended post-update checks
1. `openclaw --version`
2. `openclaw status --all`
3. `openclaw health --json`
4. `openclaw security audit --deep`
5. Telegram send/receive check
6. browser tool availability check
7. subagent spawn smoke test
8. cron list / run smoke test
9. verify `ai.openclaw.gateway` LaunchAgent still points to the expected binary
10. decide whether to re-enable `ai.openclaw.node` after update
