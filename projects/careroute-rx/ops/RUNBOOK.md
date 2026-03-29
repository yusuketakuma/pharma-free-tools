# CareRoute-RX Runbook

## 運用方針
- PHI 保護要件が厳格。security review 必須。
- source repo の大きい未コミット差分は FE-DISPLAY 系 / security follow-up / unrelated WIP に棚卸しして commit 単位を切る。
- Source: `projects/careroute-rx/docs/status.md`

## Development
```bash
cd /Users/yusuke/careroute-rx
pnpm dev:setup
pnpm dev
```

## Verification
```bash
pnpm check:fast           # Quick checks
pnpm test                 # Full test suite
pnpm check:phi-detection  # PHI leak detection
pnpm lint:secrets         # Secret scanning
pnpm check:all            # Comprehensive
```

## Deploy
- Approval required via OpenClaw
- Cloudflare Workers deployment

## Incident Response
- PHI leak → immediate escalation to owner
- Security issue → [ALERT] via CEO たまAI
