# Operating Model

## Core principles
- 旧組織名（homecare / sidebiz / trainer）を新しい報告系統として使わない。
- ユーザー向け報告は CEO たまAI の announce job のみが行う。
- 各部門代表ジョブは **差分中心・短く・再利用可能** なレポートを残す。
- 重要情報は削除せず残す。旧資料は履歴扱いとし、新規運用は `org/` と `reports/company/` を正本にする。
- 1 role = 1常時ジョブにはしない。代表ジョブが role 群を束ねて判断する。
- `.openclaw/` は **OpenClaw × Claude Code 実行基盤の正本** とし、`org/` とは責務を分離する。
- OpenClaw は軽量オーケストレータ / 文脈管理層、Claude Code は重量実行エンジンとして扱う。

## Department-to-job mapping
| Department | Representative job | Main responsibility | Output |
|---|---|---|---|
| engineering | engineering-department-cycle | 実装・設計・自動化・試作 | `reports/company/engineering-latest.md` |
| product | product-department-cycle | 課題発見・需要整理・優先順位 | `reports/company/product-latest.md` |
| marketing | marketing-department-cycle | 発信・露出・成長実験 | `reports/company/marketing-latest.md` |
| design | design-department-cycle | UI/UX/ブランド/見せ方 | `reports/company/design-latest.md` |
| project-management | project-management-cycle | 進行・依存・出荷判断 | `reports/company/project-management-latest.md` |
| studio-operations | studio-operations-cycle | 保守・分析・法務・財務・基盤 | `reports/company/studio-operations-latest.md` |
| testing | testing-department-cycle | 品質・性能・運用検証 | `reports/company/testing-latest.md` |
| executive | ceo-tama-report | 最終集約・優先順位・対ユーザー報告 | `reports/company/ceo-tama-latest.md` |

## Standard output contract for department jobs
1. status: done / no_progress / alert
2. scope checked
3. top findings (max 5)
4. decisions / proposed next actions
5. blockers / dependencies
6. handoff to CEO

## CEO contract
- 全部門レポートを確認する
- `CURRENT_STATUS.md` の更新が必要なら反映する
- `.openclaw/` の review / final-response / recent-summary 流れを前提に最終判断する
- ユーザーには「結論 / 次アクション / 補足」の順で短く報告する
- report は facts-first。誇張しない

## Execution system boundary
- `org/` は会社組織・責務・報告系統の正本
- `.openclaw/` は route decision / context pack / execution request / review / publish の正本
- protected path の approval_required 判定は `.openclaw/config/approval-policy.yaml` に従う
- 実装の heavy execution は原則 Claude Code adapter 経由で扱う

## Cadence policy
- 30分の旧巡回は廃止
- 最小運用 cadence:
  - project-management / studio-operations: 4時間
  - engineering / product: 6時間
  - marketing / design / testing: 8時間
  - CEO summary: 4時間
- 緊急アラート時は次の CEO cycle まで待たず、次回 CEO report で先頭に `[ALERT]` を出す
