# Polymarket 定期調査レポート
- 実行時刻: 2026-03-25 10:00 JST
- テーマ: 市場構造 / 監視運用 / 規制・報酬の再確認

## 結論
Polymarket の BOT は**技術的には十分構築可能**。ただし、
**「稼げる自律BOT」まで持っていく難所は技術ではなく、監視・在庫管理・報酬条件・法規制・解決遅延**にある。

現時点の推奨は、
**本番売買より先に paper trading + 監視基盤 + compliance matrix を固定すること**。
これを飛ばして収益化を追うのは危険。

## 今回の調査テーマ
今回は以下を深掘りした。
- 市場構造: order lifecycle / resolution / neg risk
- API: auth / rate limits / rewards / rebates / geoblock
- 監視: WebSocket / heartbeat / user updates
- 運用前提: builder tiers / relayer / gasless / inventory ops

## わかったこと
### 1) 市場構造
- 取引は **オフチェーンでマッチ、オンチェーンで清算** する hybrid CLOB。
- 注文は **EIP-712 署名** が必要。
- 注文タイプは **GTC / GTD / FOK / FAK**。
- **post-only** は即時約定するなら拒否され、maker だけを狙える。
- resolution は **UMA Optimistic Oracle** ベース。
  - 通常は約 **2時間** で終わるが、 dispute が入ると **4〜6日** かかりうる。
- neg risk は multi-outcome での資本効率を上げるが、実装は単純 2択より複雑。

### 2) API / 実装要件
- 公開データは **Gamma API / Data API / CLOB read** で無認証取得可能。
- 取引系は **L1(秘密鍵) → L2(API key)** の2段階。
- 公式 SDK は **TypeScript / Python / Rust**。
- API rate limits は比較的高いが、**relayer submit は 25 req/min** と小さい。
- **heartbeat を送らないと open order が自動キャンセル**。

### 3) 監視・運用
- 監視の主軸は次の3系統。
  1. **market channel**: orderbook / best bid ask / trade / new market / market_resolved
  2. **user channel**: 自分の order / trade 状態（MATCHED / MINED / CONFIRMED / RETRYING / FAILED）
  3. **heartbeat watchdog**: セッション生存確認と自動 cancel 前提
- これに加えて、`cancel-all` を即時に打てる kill switch が必要。

### 4) inventory / 取引運用
- market maker には **split / merge / redeem** が必須。
- neg risk は別契約を使う。
- quoting では inventory skew を見て、片側偏りを定期的に戻す必要がある。
- 解決後は **open order cancel → redeem → 残在庫 merge** の順が基本。

### 5) 報酬・手数料
- rewards は市場ごとに条件があり、`rewards_min_size` / `rewards_max_spread` / `rate_per_day` で判定される。
- 現在の rewards API は **ページングあり**、市場単位で配置される。
- maker rebate は **日次 USDC 返還** の仕組みがある。
- fee rate は固定前提で持たず、**`get fee rate` で都度取得する設計** が安全。

### 6) 法規制・地域制限
- geoblock endpoint では、今回の確認時点で **JP は blocked=false**。
- ただし、これは **IP ベースの可否** であって、
  **日本居住者としての法的適法性を保証するものではない**。
- blocked / close-only 国が明示されており、地域制限は実装上の必須チェック。

### 7) Builder / Relayer
- Builder Program は、**他者の注文を Polymarket 経由でルーティングする場合**に意味が大きい。
- 自分専用 BOT なら必須ではないが、
  **gasless / attribution / weekly rewards / relayer 余力** が必要なら検討対象。
- tiers は **Unverified 100 relays/day / Verified 3,000/day / Partner unlimited**。

## 実現可能性評価
- **技術実現性**: 高い
- **監視運用の実現性**: 中〜高
- **収益実現性**: 中〜低
  - 流動性、競争、報酬条件、手数料変動に強く依存
- **自律運用の安定性**: 中
  - heartbeat / cancel-all / inventory skew を固めれば改善する
- **本番難易度**: 高
  - 「作る」より「壊れずに回す」が難しい

## 主なリスク
- **法規制 / 規約 / 地域制限**
  - 日本居住者としての適法性は別途確認必須
- **heartbeat 断** による意図しない全キャンセル
- **WS 不調 / 遅延** による stale quote
- **在庫偏り** による片張り損失
- **resolution dispute** による資金拘束
- **reward 条件の読み違い**
  - spread / size 条件を満たしても競争配分で外れる
- **relayer 制限**
  - gasless / builder 系は別の上限がボトルネックになりうる

## 緊急通知候補
- 現時点では **個別緊急通知は不要**。
- ただし、次のどれかが確認された場合は即エスカレーション候補。
  1. 日本居住者が実質的に利用不可、または違法リスクが高い
  2. 規約上、BOT / 自動売買が明確に禁止されている
  3. geoblock / KYC / 監視回避が必要になる

## 前回との差分
- 前回は **API / マーケットメイクの実装可否** が中心だった。
- 今回はそれに加えて、
  - **market channel / user channel / heartbeat** による監視運用
  - **resolution の遅延構造**
  - **neg risk の運用難易度**
  - **builder tiers / relayer 制約**
  - **geoblock の現況確認（JP blocked=false）**
  を追加で確認できた。
- 逆に、前回で挙げた **2026-03-30 の fee 改定** は今回の公式 docs では再確認できなかった。
  - したがって、fee 前提は固定せず **API 取得前提** に置き換えるのが安全。

## 次に調べるべきこと
1. **日本法務・規約**
   - 日本居住者の利用可否、BOT 可否、税務影響を確認
2. **paper trading 設計**
   - 実弾を使わず、quote / fill / cancel / inventory / heartbeat を模擬
3. **市場選別ルール**
   - rewards 条件、spread、流動性、resolution まで含めてランキング化
4. **最小 BOT 構成**
   - 監視 → quote → cancel-all → inventory の最小閉ループ
5. **停止条件の明文化**
   - 法務、地理制限、損失、WS 不安定、rewards 崩壊時の停止ルール

## 参照元
- docs.polymarket.com
- clob.polymarket.com
- gamma-api.polymarket.com
- polymarket.com/api/geoblock
