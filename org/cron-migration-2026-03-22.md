# Cron migration - 2026-03-22

## Disabled legacy jobs
- sidebiz-30m-assign
- sidebiz-30m-maintenance
- homecare-30m-assign
- trainer-30m-internet-research-dispatch
- Reddit副業ネタ提案（OpenClaw自律収益のみ）
- trainer-4h-regular-report
- self-improvement-daily
- self-improvement-weekly-meta-review
- weekly-healthcheck-report（社長向け）
- weekly-link-checker
- weekly-model-usage-report（社長向け）
- weekly-session-log-review（社長向け）
- 経過措置医薬品患者抽出リマインド（期限1週間前）
- 経過措置リマインド（3/25期限1週間前）

## Added company jobs
- ceo-tama-report — every 4h — announce to main DM
- project-management-cycle — every 4h — internal only
- studio-operations-cycle — every 4h — internal only
- engineering-department-cycle — every 6h — internal only
- product-department-cycle — every 6h — internal only
- marketing-department-cycle — every 8h — internal only
- design-department-cycle — every 8h — internal only
- testing-department-cycle — every 8h — internal only

## Policy changes
- User-facing delivery is now CEO-only.
- Legacy homecare / sidebiz / trainer directories remain as history, not as active command structure.
- `org/` and `reports/company/` are the new operating surfaces.
