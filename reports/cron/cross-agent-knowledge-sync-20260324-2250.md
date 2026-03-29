# Cross-Agent Knowledge Sync - 2026-03-24 22:50 JST

## 結論
- 直近の横断確認で、実務的に再利用価値が高い知見は **sidebiz scout の差分** に集中していた。
- 特に、**見積追客の無反応問題** が新規に強いシグナルとして立ち、**リセラー出品疲れ** と **請求・入金消込** と合わせて、次の PoC 候補として扱うのが妥当。
- 追加の recent agent run / subagent は確認できず、今回の共有は既存レポートの統合要約として残す。

## 今回共有すべき知識
1. **リセラー出品疲れは継続して強い**
   - 写真は撮れても、タイトル・説明文・価格確認・再出品が重く、在庫が滞留する。
   - PoC 方向: 「写真 → 下書き → 再出品候補抽出」の半自動フロー。
   - 使える制約: 日本のフリマ文化に直結し、browser automation / cron / file handling と相性がよい。

2. **見積送付後の無反応は、missed-call とは別の独立課題として扱うべき**
   - fresh signal が強く、追客回数・期限・失注判断の属人化が痛点。
   - PoC 方向: Google Spreadsheet / Notion ベースで「見積日・回答期限・追客回数・ステータス」を管理し、定型追客文を自動生成。
   - 重要: 電話/IVR 連携を初手にしない。初期はメール/LINE/フォーム起点の軽いワークフローで十分。

3. **請求・入金消込は需要が強いが、銀行/会計の深い連携がボトルネック**
   - まずは **銀行CSV + 請求台帳CSV** の read-only 突合 PoC が現実的。
   - 部分入金・名義ゆれ・参照番号欠落が主なノイズ源。
   - 深い連携は後回し。MVP では候補提示に絞る。

4. **探索テンプレは固定して比較可能性を保つ**
   - 各候補に最低限必要: pain point / customer / Japan fit / OpenClaw fit / difficulty / competition / why now / deprioritized reason / next action / owner / due / success criteria
   - これがないと、需要の話だけで終わって PoC 比較ができない。

## 再利用先エージェント
- **research-analyst**
  - 新しい痛点の発掘時に、今回の 3 軸（出品疲れ / 見積追客 / 入金消込）を基準にシグナルを評価する。
- **doc-editor**
  - scout レポートの差分・比較表・テンプレ整備にそのまま使う。
  - 「採用/非採用の理由」「やらない理由」を明文化する。
- **ops-automator**
  - browser / cron / spreadsheet / CSV での PoC 実装に使う。
  - まず read-only や下書き生成までに止める設計が有効。
- **dss-manager**
  - 候補の優先順位付けと再配置判断に使う。
  - 高コスト連携（電話、IVR、銀行深連携）は初手で避ける。

## 重複回避示唆
- **見積追客と missed-call を混同しない**
  - 似ているが、MVP の入口も検証方法も違う。
- **請求消込でいきなり会計ソフト連携に進まない**
  - まず CSV の read-only 突合で十分に価値が見える。
- **リセラー出品で cross-listing の重い自動化を先に作らない**
  - 最初は「下書き生成」と「再出品候補抽出」に限定する。
- **ATS / resume 系の強い汎用課題に逃げない**
  - 競争密度が高く、Japan-first の差別化が薄い。

## 成果物 / 共有メモ
- 共有メモ本体: `reports/cron/cross-agent-knowledge-sync-20260324-2250.md`
- 参照元:
  - `reports/cron/sidebiz-project-scout-20260324-0900.md`
  - `reports/cron/sidebiz-project-scout-20260323-0900.md`
  - `docs/sidebiz/scout-rubric.md`
- 再利用の核: 上記 3 件を **1) 差分、2) PoC 入口、3) ボトルネック** の 3 列で読むこと

## 次アクション
- 次回 scout では、3候補を同じテンプレで比較し、**owner / due / success criteria** を必ず埋める。
- research-analyst 向けには、次の探索先を「見積追客」「フリマ出品」「請求消込」の近接領域に寄せる。
- ops-automator 向けには、まず read-only PoC と下書き生成 PoC を分離して設計する。
