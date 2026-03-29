# OpenClaw CLI stability note — 2026-03-23

## 結論

`openclaw` CLI の不安定さは、バージョン差というより **呼び出し経路の曖昧さ** が原因だった。
現在は、対話シェル・LaunchAgent ともに **OpenClaw 2026.3.13** を参照していることを確認済み。

## 確認結果

### CLI 実体
- OpenClaw package: `/Users/yusuke/.nvm/versions/node/v24.14.0/lib/node_modules/openclaw`
- version: `2026.3.13`

### 対話シェルの固定
- symlink 作成: `~/.local/bin/openclaw`
- 実体: `/Users/yusuke/.nvm/versions/node/v24.14.0/bin/openclaw`
- login shell で確認:
  - `which openclaw` → `/Users/yusuke/.local/bin/openclaw`
  - `openclaw --version` → `OpenClaw 2026.3.13`

### LaunchAgent の参照先
#### ai.openclaw.gateway
- ProgramArguments[0]: `/usr/local/bin/node`
- ProgramArguments[1]: `/Users/yusuke/.nvm/versions/node/v24.14.0/lib/node_modules/openclaw/dist/index.js`
- Comment: `OpenClaw Gateway (v2026.3.13)`

#### ai.openclaw.node
- ProgramArguments[0]: `/usr/local/bin/node`
- ProgramArguments[1]: `/Users/yusuke/.nvm/versions/node/v24.14.0/lib/node_modules/openclaw/dist/index.js`
- Comment: `OpenClaw Node Host (v2026.3.13)`

## 追加修正

### `.zshrc`
存在しない completion ファイルを無条件 `source` していたため、login shell 起動時に警告が出ていた。
以下の形に修正した。

```zsh
[ -f "/Users/yusuke/.openclaw/completions/openclaw.zsh" ] && source "/Users/yusuke/.openclaw/completions/openclaw.zsh"
```

## 実務判断

- `2026.3.1` を CLI が使っている痕跡は、今回の確認範囲では見つかっていない
- 現時点では **2026.3.13 に統一されていると見てよい**
- 問題の本質は古いバージョン混在ではなく、**PATH / 呼び出し元の不安定さ** だった

## 次回チェック用コマンド

```bash
which openclaw
openclaw --version
launchctl print "gui/$UID/ai.openclaw.gateway" | rg 'program|openclaw|node|path' -i
launchctl print "gui/$UID/ai.openclaw.node" | rg 'program|openclaw|node|path' -i
```
