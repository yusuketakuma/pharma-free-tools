# Sidebiz Project Scout - 2026-03-24 09:00 JST

## Sources used
- Reddit thread pages (browser extraction of score/comment counts)
  - r/reselling: My "Death Pile" keeps getting bigger because I dislike typing descriptions. Help. (248 pts / 226 comments, 2026-02-17)
  - r/smallbusiness: What do you usually do when a client goes silent after a quote? (76 pts / 86 comments, 2026-03-14)
  - r/smallbusiness: Is price really the reason clients stop replying after a quote (2 pts / 23 comments, 2026-03-07)
  - r/smallbusiness: Spent my Saturday manually matching 47 invoices to bank payments, there has to be a better way (67 pts / 77 comments, 2026-01-12)
- Prior baseline: reports/cron/sidebiz-project-scout-20260323-0900.md
- Rubric: docs/sidebiz/scout-rubric.md

## High-signal pain points found
1. Reseller listing fatigue / death pile
   - Signal: 248 pts / 226 comments
   - Core pain: 写真は撮れるが、タイトル・説明文・価格確認・出品作業が重く、在庫が積み上がる。
2. Quote follow-up silence / ghosting
   - Signal: 76 pts / 86 comments, plus related thread 2 pts / 23 comments
   - Core pain: 見積送付後に顧客が無言化し、値下げすべきか、何回追客すべきか、失注判断をどうするかが曖昧。
3. Invoice / payment matching
   - Signal: 67 pts / 77 comments
   - Core pain: 入金名義や参照番号が不揃いで、請求書と銀行入金の突合に数時間を消耗する。

## Filtered ideas worth keeping (Japan + OpenClaw automatable)

### 1) フリマ出品下書き・再出品アシスタント
- pain point: 出品文作成・相場確認・再出品が面倒で在庫が滞留する
- customer: メルカリ / Yahoo!フリマ / ラクマの個人〜小規模出品者
- Japan fit: 高い。国内フリマ文化に直結し、小さく個人販売から始めやすい
- OpenClaw fit: 高い。画像整理、タイトル草案、再出品チェック、ブラウザ操作、cron巡回と相性がよい
- difficulty: 中
- competition density: 中〜高
- why now: 痛みの強さが大きく、PoC価値を説明しやすい
- deprioritized reason: なし（最上位維持）
- next action: メルカリ1商品群で「写真→下書き→再出品候補抽出」の半自動フローPoCを作る
- owner: OpenClaw
- due: 次回 scout まで
- success criteria: 10商品で手作業時間を50%以上削減できる見込みを確認

### 2) 見積追客・失注判定アシスタント
- pain point: 見積送付後の無反応案件を追い切れず、値引き・再送・放置の判断が属人化する
- customer: 工務店、清掃、修理、制作受託、個人サービス業
- Japan fit: 高い。メール/LINE/フォーム起点で小規模導入しやすい
- OpenClaw fit: 高い。見積一覧の巡回、期限超過検知、定型追客文生成、失注候補化がやりやすい
- difficulty: 低〜中
- competition density: 中
- why now: 今回の差分で fresh signal が増え、電話連携なしでもPoC可能と分かった
- deprioritized reason: なし（新規採用）
- next action: Google Spreadsheet or Notion ベースで「見積日・回答期限・追客回数・ステータス」管理テンプレを作る
- owner: OpenClaw
- due: 次回 scout まで
- success criteria: 20件の見積案件で追客漏れゼロ・追客文面自動生成まで再現

### 3) 請求・入金消込フォローアシスタント
- pain point: 請求書と入金の照合、未入金催促、部分入金判定が面倒
- customer: 個人事業主、小規模受託、月40〜60件程度の請求がある事業
- Japan fit: 中〜高。請求書運用は普遍ニーズだが freee / マネフォとの競合は強い
- OpenClaw fit: 中〜高。CSV突合、未入金抽出、催促文面生成、台帳更新は相性がよい
- difficulty: 中
- competition density: 高め
- why now: 痛みは強いが会計連携の深さがMVPの制約になりやすい
- deprioritized reason: 最上位ではない。銀行/会計の本格連携が必要になると重い
- next action: 銀行CSV + 請求台帳CSV のみで突合候補を返す read-only PoC を作る
- owner: OpenClaw
- due: 次回 scout まで
- success criteria: 50件の請求データで 80%以上の自動候補提示

## Intentionally deprioritized this cycle
- Appointment / missed-call assistant
  - Need remains real, but Japan-first MVPだと電話/IVR連携が初手で重い。
  - 今回は同じ追客領域でも、より軽く始められる「見積追客」に寄せる方がよい。

## Diff vs previous report (2026-03-23 09:00)
- New: 「見積送付後の無反応」を独立 pain point として採用。 fresh signal が強く、トップ3に新規ランクイン。
- Rank up: quote follow-up assistant を 2位へ。
- Rank down: appointment / inquiry follow-up は need は維持だが、電話連携の重さを理由に今サイクルでは後退。
- Unchanged: reseller listing/cross-post assistant は引き続き最有力。
- Slightly weaker priority: invoice matching は需要継続だが、競合/会計連携の重さで 3位維持。

## Emergency notification candidate
- None
