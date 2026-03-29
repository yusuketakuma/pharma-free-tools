# Polymarket Autonomous Bot Research Report

- 対象: Polymarket
- 実施日時: 2026-03-27 10:00 JST
- 参照: 直近前回レポート `reports/polymarket/2026-03-26-1000-autonomous-bot-research.md`

## 結論

Polymarket の自律BOTは **技術的には十分構築可能** です。  
ただし、勝ち筋は単純な売買自動化ではなく、**市場選別・板監視・在庫管理・heartbeat・報酬条件・解決ルール・規制チェック** を含む運用設計です。  
現時点の推奨は、**本番売買より先に、監視基盤 + rewards-aware market selection + compliance gate を固めること** です。

## 今回の調査テーマ

- 市場構造: CLOB、価格形成、注文種別、resolution
- API/監視: 認証、注文、WebSocket、heartbeat、rate limits
- 戦略: maker/rewards、イベント駆動、neg risk
- リスク: 法規制、地理制限、監視断、解決遅延
- 周辺要素: builder program、relayer、market discovery

## わかったこと

### 1) 市場構造
- Polymarket は **Central Limit Order Book (CLOB)**。
- 価格は 0〜1 ドルで、**midpoint** や **best bid/ask** が実運用の基準になる。
- 注文は実質すべて **limit order**。
- 注文タイプは **GTC / GTD / FOK / FAK**。
- `post-only` で maker を狙える。
- `neg risk` 市場では、No から他 outcome の Yes へ変換でき、資本効率が上がる。
- resolution は **UMA Optimistic Oracle** ベースで、
  - 無争議: 約 2 時間
  - 争議あり: 4〜6 日規模
  まで伸びうる。

### 2) API / 監視
- 公開データは **Gamma API / Data API / CLOB read** で無認証取得可。
- 取引系は **L1（秘密鍵）→ L2（API key）** の 2段階認証。
- 監視は主に以下で組むのが実用的。
  - `market` WS: book / price_change / tick_size_change / last_trade_price / market_resolved
  - `user` WS: trade / order
  - heartbeat: **10 秒ごとに PING**
- heartbeat を止めると、**open order が自動キャンセル** される。
- CLOB の一般レート制限は **9,000 req / 10s**。
- リレイアの `/submit` は **25 req / 1 min** とかなり厳しい。

### 3) 収益補助と戦略候補
- Maker Rebates は **日次 USDC 還元**。
- rewards API で、`rewards_min_size` / `rewards_max_spread` / `rate_per_day` を見て市場選別できる。
- 有効そうな戦略候補は次の順。
  1. **rewards-aware market making**（最有力）
  2. **狭いスプレッドの passive MM + rebate 回収**
  3. **イベント駆動の短期反応戦略**
  4. **neg risk / 関連市場の相対価値取り**（難易度高）
- 市場データは `events` endpoint を軸にすると効率がよく、slug / tag / event の3経路で探索できる。

### 4) 規制 / 地理制限
- Geoblock は明示されており、**blocked region からの注文は拒否**。
- 公式の blocked country list あり。
- この実行環境での現在の geoblock 応答は **`JP / blocked:false`**。
- ただし、これは **IP レベルの可否** であって、**日本の法的適法性の保証ではない**。

### 5) BOTに必要な構成要素
- 市場探索・銘柄選定
- 板/約定/価格のリアルタイム監視
- 注文生成・署名・送信
- 在庫管理 / リバランス / 取消
- heartbeat watchdog / kill switch
- geoblock・規約・法務のチェック
- ログ・アラート・再接続・障害復旧

### 6) 周辺機能
- **Builder Program** は、他者注文を Polymarket にルーティングする事業者向け。
- builder には **relayer access / attribution / weekly rewards** がある。
- EOA 直接運用では relayer の gasless benefits は使えない。
- market making の初期セットアップでは、**USDC.e の入金・wallet deployment・token approval・API credentials 生成** が必要。

## 実現可能性評価

- **技術実現性**: 高
- **監視運用実現性**: 高
- **継続収益実現性**: 中〜低
- **本番運用難易度**: 高
- **法的実行可能性**: 未確認（要レビュー）

結論として、**作るのは簡単寄り、稼ぎ続けるのは難しい** です。  
特に、収益は「モデル精度」より **市場選別と運用事故防止** で決まります。

## 主なリスク

- 法規制 / 利用規約 / 地理制限
- heartbeat 断や WS 断による **stale quote** / 自動キャンセル
- 薄い板でのスリッページ / 在庫偏り
- resolution 争議による資金拘束
- fee / rebate / rewards 条件の変更
- neg risk の解釈ミス
- 秘密鍵・API key の漏えい
- relayer の低い送信上限に起因する執行詰まり

## 緊急通知候補

**現時点ではなし**。  
ただし、以下が確認された場合は個別緊急通知候補です。

- 日本居住者としての利用が明確に違法 / 禁止
- BOT 自動売買が規約上明確に禁止
- geoblock 回避や KYC 回避が必要になる

## 前回との差分

前回は「API で BOT を作れるか」の確認が中心でした。  
今回はそれに加えて、以下を深掘りしました。

- **監視の実装条件**がさらに具体化
  - market/user WS の event type
  - 10 秒 heartbeat
  - heartbeat 断で open order 自動キャンセル
  - CLOB / relayer のレート制限
- **収益設計**が具体化
  - Maker Rebates
  - rewards API の `rewards_min_size` / `rewards_max_spread`
  - 市場探索経路（slug / tag / events）
- **市場構造の実務条件**が具体化
  - order type の使い分け
  - neg risk の変換構造
  - UMA resolution の遅延
- **規制面**がより明確化
  - geoblock の blocked country list
  - 現環境の `JP / blocked:false`
- **周辺エコシステム**が整理
  - builder program の役割
  - relayer / gasless / attribution の位置づけ

要するに、前回は「作れるか」、今回は **「どの市場をどう監視し、どこで詰まるか」** まで一段進みました。

## 次に調べるべきこと

1. **rewards 対象市場の実データ収集**
   - spread / volume / rewards / min size を一覧化
2. **最小 BOT の設計固定**
   - WS 監視、注文、取消、heartbeat、kill switch
3. **収益モデルの再計算**
   - fee / rebate / rewards / slippage を織り込む
4. **日本からの利用に関する法務・税務確認**
   - 本番前の必須レビュー
5. **resolution 直前の停止ルール**
   - 何分前に新規注文停止するかを決める

## 推奨

次回は **「rewards 対象市場の実データ分析」** を優先するのが最も価値が高いです。  
理由は、BOT の可否より先に **期待値が出る市場だけを残せる** からです。
