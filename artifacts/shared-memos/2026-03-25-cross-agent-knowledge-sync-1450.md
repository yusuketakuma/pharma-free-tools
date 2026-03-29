# Cross-Agent Knowledge Sync Memo

Date: 2026-03-25 14:50 JST
Scope: Board Chair / cross-agent-knowledge-sync
Status: Durable shared memo created from recent agent runs.

## 結論
- 直近の実行を横断すると、再利用価値が高い知見は **OpenClaw Core の運用手順化**、**Opportunity Scout の候補を「実行できる粒度」に落とす型**、**Polymarket の compliance-first 方針**、**sidebiz の no-show / 追客 / 請求消込の共通基盤化** に集約された。
- 既存 playbook を RUNBOOK に接続する方針は **採用**。実際に `projects/openclaw-core/ops/RUNBOOK.md` へ反映済み。
- Polymarket は **技術的実現性は高いが、本番売買は保留**。先に paper trading / monitoring / compliance matrix を固定するのが妥当。
- sidebiz は **予約確認・ノーショー対策** を最優先候補として扱い、同じ Sheet ベース基盤で **問い合わせ/見積追客** と **請求・入金消込** に横展開するのが効率的。

## board の主要論点
### 1) OpenClaw Core: 既存 playbook を使える運用へ接続
- queue telemetry を眺め続けるより、`queue-dominant-prefix-triage.md` / `artifact-retention-policy.md` / `stale-report-detection-spec.md` を RUNBOOK に束ねる方がレバレッジが高い。
- 追加で候補になった `pre-update baseline / post-update smoke checklist` は有効だが、今回は **保留**。
- `.openclaw/tasks/` の棚卸し / 退避 / 削除は誤削除リスクがあるため **追加調査**。

### 2) Polymarket: 技術は可能、難所は運用と規制
- オフチェーン約定 + オンチェーン清算の hybrid CLOB、heartbeat、relayer 上限、kill switch、inventory skew など、運用設計が主戦場。
- 収益化の前に、**paper trading + 監視基盤 + compliance matrix** を先に固定する方針を **採用**。
- 日本居住者としての適法性、規約、地理制限は **追加調査**。

### 3) sidebiz: 手作業の痛点は 3 系統に収束
- 強いシグナルは、**予約確認・ノーショー対策**、**問い合わせ/見積追客**、**請求・入金消込**。
- 3案は別々に見えて、実際は `Sheet + ステータス管理 + 定型文 + cron` の共通基盤でつながる。
- 最優先は **予約確認・ノーショー対策**。次点で追客、維持で請求消込。

### 4) board 運用の学び
- 実データが薄い時は、一般論で埋めず「未検出」と明示するのが正しい。
- 共有メモは「誰が何に使うか」まで書いて初めて再利用できる。
- 高リスク判定対象の auth / trust boundary / routing / approval / Telegram 根幹変更は、今回の共有内容には **該当なし**。

## 今回共有すべき知識
### A. OpenClaw の運用知識
- `RUNBOOK` に接続すべき既存 playbook:
  - `queue-dominant-prefix-triage.md`
  - `artifact-retention-policy.md`
  - `stale-report-detection-spec.md`
- 使い方の要点:
  - queue は prefix 単位で triage する
  - artifact は keep / archive / purge を分ける
  - stale report は「見つける」より「使う」手順にする
- 使うべきエージェント:
  - `ops-automator`
  - `doc-editor`
  - `qa-manager`
  - `supervisor-core`

### B. Opportunity Scout の共通化できる探索知見
- sidebiz の有望テーマは次の 3 系統に収束:
  - 予約確認 / no-show 対策
  - 問い合わせ / 見積追客
  - 請求 / 入金消込
- 比較軸として固定すべき項目:
  - 痛みの強さ
  - 初期コスト
  - 実現可能性
  - 法務 / 規約リスク
  - 最小実験
- 使うべきエージェント:
  - `research-analyst`
  - `doc-editor`
  - `ops-automator`
  - `dss-manager`

### C. Polymarket 調査の実務知見
- BOT は作れるが、勝敗は監視・在庫・停止条件・規制対応で決まる。
- 最小構成の考え方:
  - market channel 監視
  - user channel 監視
  - heartbeat watchdog
  - cancel-all / kill switch
  - inventory skew 管理
- 使うべきエージェント:
  - `research-analyst`
  - `ops-automator`
  - `qa-manager`
  - `legal-compliance-checker`

## 再利用先エージェント
- `supervisor-core`: 監督レイヤーの重複抑制、再配置判断
- `research-analyst`: 調査結果の比較軸化、次の探索候補抽出
- `doc-editor`: RUNBOOK / 共有メモ / 手順書への転記
- `ops-automator`: cron / checklist / 定型運用の実装
- `dss-manager`: 優先順位付け、投資判断、採否判断
- `qa-manager`: smoke / retention / stale report / cancel-all の検証観点
- `legal-compliance-checker`: Polymarket の法務・規約・地域制限の確認

## 重複回避示唆
- OpenClaw core では、もう `queue telemetry を眺めるだけ` の再探索はしない。
  - 既存 playbook の接続と運用化を優先する。
- sidebiz では、別々の問題に見えても共通基盤化できるものを先にまとめる。
  - 予約 / 追客 / 請求は `Sheet + cron + 定型文` に寄せる。
- Polymarket では、技術可能性と事業成立性を混同しない。
  - 技術レビューと法務レビューを分ける。
- 実データがない場合は、一般論で埋めず「未検出」と明記する。

## 成果物/共有メモ
- 新規メモ: `artifacts/shared-memos/2026-03-25-cross-agent-knowledge-sync-1450.md`
- 参照レポート:
  - `reports/cron/proactive-idle-work-discovery-20260325-1420.md`
  - `reports/polymarket/2026-03-25-1000-autonomous-bot-research.md`
  - `reports/cron/sidebiz-project-scout-20260325-0900.md`
  - `reports/cron/cross-agent-knowledge-sync-20260325-1250.md`
- 既存更新:
  - `projects/openclaw-core/ops/RUNBOOK.md`

## 次アクション
1. `projects/openclaw-core/docs/status.md` に、RUNBOOK へ接続した playbook 群の要約を反映するか判断する。
2. `pre-update baseline / post-update smoke checklist` を RUNBOOK へ接続するか、次回 board で再評価する。
3. `.openclaw/tasks/` の棚卸しは、証跡付きで安全候補を絞ってから着手する。
4. Polymarket は日本法務・規約・地域制限を追加調査し、paper trading 設計に落とす。
5. sidebiz は 予約確認・ノーショー対策を先に1業種へ絞って最小実験する。
