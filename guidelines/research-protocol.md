# research-protocol

## 原則
- 一次情報・公式文書を優先する
- prior art や外部探索は Opportunity Scout を窓口にする
- 調査結果は、事実 / 仮説 / 未確認を分けて返す

## 調査手順
1. 既存 docs / memory / local artifact を確認
2. 不足時だけ外部探索
3. 仕様・制約・日付・対象範囲を明記
4. 必要なら Board 候補化

## 出力
- 結論
- 根拠
- 未確認点
- 次アクション

## 今のシステム向け追加ルール
- config / runtime / heartbeat / Board まわりは、古い report と現 config のズレを疑う
- 承認・配線・surface 制約は、挙動不良と混同しない
- 「死んでいる」より前に routing / receipt / cadence / approval surface のズレを疑う
