# Trust Boundary / Auth Policy

## Core policy
### 1 Gateway = 1 trust boundary
OpenClaw では **1 Gateway = 1 trust boundary** を原則とします。

同一 Gateway 配下では以下を同じ信頼境界として扱います。
- credentials
- process execution
- approval context
- logs / artifacts
- runtime queue / metrics

したがって、異なる信頼水準の対象を 1 Gateway に混在させるべきではありません。

## Mixed-trust handling
mixed-trust が必要な場合は、最低でも次を分離します。

- **gateway 分離**
- **credentials 分離**
- **OS user 分離**
- **host 分離**

理想順:
1. host 分離
2. OS user 分離
3. gateway 分離
4. credentials 分離

単一 host / 単一 user / 単一 Gateway に mixed-trust を押し込まないこと。

## Auth priority
### This workspace / current runtime
- **この workspace の Claude 認証は Claude subscription (`claude.ai`) のみ** とする
- `claude auth status` で確認し、`authMethod=claude.ai` を正本とする
- API key / setup-token はこの workspace の標準経路としては使わない
- `claude --bare` は `claude.ai` 認証を読まないため、subscription-only 運用では `cli_backend_safety_net` を常用 lane とみなさない

### Operational rule
- 認証方式は `claude.ai` サブスクリプションに固定する
- auth preflight は fail-closed を維持する
- `claude auth status` が不成立なら `AUTH_REQUIRED` として停止する
- mixed-trust を同一 Gateway に載せない前提はそのまま維持する

## Fail-closed auth preflight
Claude 実行前に auth preflight を行い、失敗時は **fail-closed** にします。

### Expected behavior
- auth OK: 実行へ進む
- auth NG: `AUTH_REQUIRED` へ遷移
- publish / execute auto-run は行わない
- auth 回復後は rebalance で `READY_FOR_EXECUTION` に戻すだけ

### Why fail-closed
- 実行 plane 側の曖昧な権限状態を防ぐ
- mixed-trust 誤接続を早期に止める
- fallback を policy bypass にしない

## Prompt vs enforcement
prompt は policy 共有には使うが、強制制御の主役にはしません。

### Do use prompt for
- task intent
- project convention
- reviewer focus
- append-only system guidance

### Do not rely on prompt for
- permission enforcement
- path protection
- auth guarantees
- trust boundary separation

### Enforce with
- hooks
- permissions
- allow / deny
- protected path
- approval policy
- process boundary

## Process boundary first, native plugin last
native plugin は便利ですが、trust boundary が曖昧になりやすいため **最後の選択** です。

推奨順:
1. process boundary
2. CLI / ACP adapter boundary
3. structured artifact boundary
4. native plugin

つまり、まずは別 process・別 credential・別 artifact 契約で閉じることを優先します。

## Operational implications
- ACP primary / CLI secondary は trust policy の範囲内でのみ切り替える
- CLI fallback でも trust boundary を越えない
- provider 切り替えは auth / capacity / policy を再確認してから行う
- protected path を含む task は approval を必須にする

## Review checklist
- この Gateway に mixed-trust が混在していないか
- credentials は boundary ごとに分離されているか
- auth preflight は fail-closed か
- 認証方式が `claude.ai` サブスクリプションに固定されているか
- prompt で安全制御を代替していないか
- native plugin を process boundary より先に選んでいないか
