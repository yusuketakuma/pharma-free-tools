# pharma-free-tools 整合監査 — 2026-03-27

## 結論
- **root直下のツールHTML 73本** は、`meta description` / OGP / GA4 の最低要件を満たしていた。
- ただし、**公開導線の数値基準が混在**している。
  - `index.html` の可視リンク数: **54**
  - `index.html` の JSON-LD `ItemList`: **86**
  - `sitemap.xml` の URL 数: **99**（local 74 / external 25）
  - `dashboard-data.json` の `totalHtmlFiles`: **73**
- したがって、**ローカル実体は 73 ツールで整合**している一方、**index / sitemap / structured data は portal-wide の数え方が混在**している。

## 監査結果
### 1) 実ファイル
- root直下の `*.html`（`index.html` を除く）: **73本**
- `meta description` 欠落: **0**
- OGP 欠落: **0**
- GA4 欠落: **0**

### 2) index.html
- 可視のツールリンク: **54本**
- JSON-LD `itemListElement`: **86件**
- index本文・OGP・FAQに **86** の表記が多数
- `返戣` の表記ゆれは **修正済み**

### 3) sitemap.xml
- URL数: **99**
- 内訳: **local 74** / **external 25**
- root直下HTML 73本はすべて sitemap に含まれていた
- ただし、外部URLが 25 件混在しているため、**この sitemap は純粋なローカルサイトマップではない**

### 4) dashboard-data.json
- `totalHtmlFiles: 73` は root直下の tool HTML 数と一致
- ただし、`index.html` の 86 表記とは一致しない
- `lastUpdated` は 2026-03-24 01:00 JST のままで、監査時点ではやや古い
- `GA4実ID差し替え未実施` の警告は依然残っている（全ファイルで `G-XXXXXXXXXX` のプレースホルダー）

### 5) *.tmp 残存
- root直下に **24個** の `.html.tmp` が残存
- 破壊的削除は行っていないため、今回は残置

## ズレ / 不整合
1. **local実体 73本** と **indexの 86 表記** が一致しない
2. `index.html` の可視リンク 54本が、実体 73本をカバーしていない
3. `index.html` の JSON-LD 86件には、**外部URL 24件** と **local実体にない 11本** が含まれる
4. `sitemap.xml` は local 74本を含むが、**external 25件が混在**している
5. `dashboard-data.json` は local 実体基準では整っているが、homepage の数え方とはズレている

## 実際に修正したこと
- `返戣` → `返戻` を root直下の 9 ファイル・94箇所で一括修正
  - `pharmacy-billing-checklist.html`
  - `pharmacy-claim-denial-diagnosis.html`
  - `index.html`
  - `claim-denial-prevention-checklist.html`
  - `renal-drug-dosing.html`
  - `ai-prompts-lp.html`
  - `claim-denial-reduction-simulator.html`
  - `dispensing-error-prevention-checklist.html`
  - `designated-abuse-prevention-drugs-checklist.html`

## 優先修正項目
1. **source of truth の統一**
   - index / sitemap / dashboard のどれを「local 73本基準」にするか決める
2. **index の掲載網羅性改善**
   - 少なくとも root直下の 73本をどう扱うか方針化
   - 54本の可視リンクでよいのか、全件掲載に寄せるのかを決める
3. **外部URLの扱い整理**
   - sitemap / JSON-LD に残すなら「外部関連サイト」として明示
   - そうでないならローカルサイトマップへ切り分ける
4. **.tmp 残存の整理**
   - safe な生成物なら再生成 or クリーンアップを検討
5. **GA4 実ID差し替え**
   - プレースホルダー継続のため、実IDの投入先を別途確定する

## 前回との差分
- 9ファイルの `返戣` 表記ゆれを解消
- root直下の品質監査では、**meta description / OGP / GA4 欠落はなし**を確認
- ただし、**数え方の混在**（73 / 54 / 86 / 99）は依然として残存

## 次アクション
- まず **local 73本を正本にするのか、portal-wide 86本を正本にするのか** を決める
- その決定に合わせて、`index.html` のタイトル・説明・JSON-LD・FAQ、`sitemap.xml`、`dashboard-data.json` のカウント表記を揃える
- `.tmp` は破壊的削除ではなく、再生成か保留の方針を決めてから処理する
