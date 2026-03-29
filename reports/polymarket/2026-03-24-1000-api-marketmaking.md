# Polymarket 定期調査レポート
- 実行時刻: 2026-03-24 10:00 JST
- テーマ: API / マーケットメイク実装要件 / 報酬構造

## 結論
Polymarket BOT の技術実装は十分可能。特に `CLOB API + WebSocket + 在庫管理 + kill switch` を備えたマーケットメイク BOT は作れる。
ただし、利益源は単純売買よりも **流動性報酬・maker rebate・イベント選別** への依存が大きく、法規制・地理制限・解決遅延・在庫偏りを無視すると壊れやすい。

## 今回の調査テーマ
API / 市場構造 / 報酬設計 / 運用監視の実装観点を深掘り。

## わかったこと
- Polymarket は **オフチェーン約定 + Polygon オンチェーン清算** の hybrid CLOB。
- 注文は **EIP-712 署名**、API 呼び出しは **L2 HMAC 認証**。
- BOT 実装には最低でも以下が必要:
  - Polygon 上の USDC.e
  - ウォレット/署名管理
  - API credential 導出
  - 注文・取消・残高・約定監視
  - WebSocket 購読
  - heartbeat 送信
  - 障害時 cancel-all
  - split / merge / redeem を含む在庫管理
- heartbeat を定期送信しないと **全 open order が自動キャンセル**。
- REST は高レートだが、実運用では **batch 注文 + WebSocket 主体** が前提。
- rewards は市場ごとに `rewards_min_size` / `rewards_max_spread` / `rate_per_day` が違う。
  - 実サンプルでは `rate_per_day` が **0.001〜30 USDC/day** と大きく差がある。
  - `rewards_min_size` は **20 / 50 / 100**、`rewards_max_spread` は **0.2〜5.5 cents** の例を確認。
- maker rebate は taker fee 原資で **日次 USDC 支払い**。
- 2026-03-30 から taker fee 適用カテゴリが拡大予定で、収益計算前提が変わる。
- neg risk 市場では multi-outcome の資本効率が上がるが、実装難易度も上がる。
- 解決は UMA Optimistic Oracle ベースで、争いがあると **4〜6日** 伸びうる。
- 地理制限 API が公開されており、現時点の実行環境 IP は **JP / blocked=false** を返した。

## 必要構成要素
1. 市場発見: Gamma API
2. 気配・約定監視: CLOB WebSocket
3. 注文執行: CLOB REST/SDK
4. 認証: EIP-712 + HMAC
5. 在庫管理: split / merge / redeem
6. リスク管理: price guard / position limit / inventory skew / cancel-all / heartbeat watchdog
7. 収益評価: spread PnL + maker rebate + liquidity rewards + fees + gasless/bridge コスト
8. 監視: fills, stale quote, heartbeat failure, reward scoring, resolution timeline, geoblock

## 戦略候補
- 低難易度: 単一バイナリ市場の保守的 two-sided quoting
- 中難易度: rewards 条件を満たす市場だけを選ぶ reward-aware market making
- 中〜高難易度: event 群を束ねた inventory-aware quoting
- 高難易度: neg risk / multi-outcome を使った資本効率最適化
- 高難易度: 解決直前・解決後を含むイベント駆動戦略

## 実現可能性評価
- 技術実現性: **高い**
- 収益実現性: **中程度**（市場選別と報酬最適化が前提）
- 自律運用性: **中〜高**（監視とフェイルセーフをきちんと作れば可能）
- 初期実装難易度: **中**
- 本番安定運用難易度: **高**

## 主なリスク
- 法規制/利用規約/地理制限違反
- heartbeat 断や WS 不調による quote 消失
- 在庫偏りと片張り損失
- fee 改定で期待収益が崩れる
- rewards は総取りではなく競争配分なので読み違えやすい
- resolution dispute による資金拘束
- placeholder を含む augmented neg risk の誤取引

## 緊急通知候補
なし。
ただし、本番化前に **日本居住者としての法的整理** は必須。

## 前回との差分
初回調査のため差分なし。

## 次に調べるべきこと
1. rewards 対象市場の実データを定期収集し、期待値の高い市場条件を抽出
2. WebSocket / orderbook / fills を使った最小 BOT 設計
3. 収益式に fee 改定（2026-03-30）を反映
4. 日本からの利用に関する法規制・税務・規約の確認
5. resolution 直前の quote 制御ルール設計

## 参照元
- docs.polymarket.com
- clob.polymarket.com
- gamma-api.polymarket.com
- polymarket.com/api/geoblock
