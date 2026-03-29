# project-management department report

**実行時刻**: 2026-03-22 00:07 JST
**job**: project-management-cycle

---

## title: 全社進行・依存関係チェック（第2サイクル）

## status: alert

## scope checked
- reports/company/*.md（全部門レポート）
- memory/cron-reports/（直近5時間）
- CURRENT_STATUS.md
- org/roles/*.md（project-management配下）

---

## top findings（3件）

### 1. 🔴 経過措置患者抽出：期限超過リスク
- **期限**: 2026-03-22（本日）
- **状態**: 未着手
- **担当**: ゆうすけ（MCS操作必要）
- **影響**: 薬局業務のコンプライアンスリスク
- **source**: homecare-30m-assign 2026-03-21 23:14

### 2. 🆕 ikitama.com ドメイン不存在
- **発見時刻**: 2026-03-21 23:07
- **状態**: Whois確認済み（"No match for domain"）
- **影響**: 独自ドメインでのアクセス不可
- **回避策**: GitHub Pages URL使用中
- **判断待ち**: ドメイン再取得要否（ゆうすけ依存）
- **source**: sidebiz-30m-maintenance 2026-03-21 23:07

### 3. ⚠️ 旧30m系cronジョブのconsecutiveErrors
- **対象**: trainer-30m, homecare-30m, sidebiz-30m, brave-api-monitor
- **状態**: エラー継続中
- **影響**: 新組織体制では旧ジョブは停止対象のため影響限定
- **source**: CURRENT_STATUS.md

---

## next actions

| 優先度 | アクション | 担当 | 期限 |
|--------|-----------|------|------|
| P0 | 経過措置患者抽出のリマインド送信 | CEO（たまAI） | 即時 |
| P1 | ikitama.com 取得判断の確認 | ゆうすけ | 今週中 |
| P2 | 旧30m系ジョブの停止・無効化 | engineering | 計画中 |

---

## blockers / dependencies

- **Brave Search API**: 月次上限到達中（4月初旬復旧）→ 新規Web探索不可
- **MCS操作**: ゆうすけの現場操作が必要（自動化不可）
- **ドメイン取得**: クレジットカード + レジストラアカウント必要

---

## CEO handoff（2-4行）

経過措置患者抽出が本日期限で未着手。早朝へのリマインド推奨。
ikitama.comドメイン消失を確認、再取得要否の判断が必要。
旧30m系ジョブは新体制で停止対象、engineeringへ引き継ぎ予定。
