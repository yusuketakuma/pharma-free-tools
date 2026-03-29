# step2 / step3 / step5 agent-fit rollout

## 実行したこと
- step2 を 5要素フォーマットに合わせて補強した。
- 既存エージェントと新規3エージェントの定義に、人格・トーン / 参照guidelines / 連携先 / 判断基準を明記した。
- step3 の不足分として、代表スタイル、ブランド、リサーチ手法、反応データ参照の guideline を追加した。
- step5 として、既存 agent に合ったテンプレート群を追加した。

## 追加した guideline の要点
- 代表スタイル: 結論先出し、推奨案、率直、日本語、過剰演出なし
- ブランド: たまAIらしさ、誇張禁止、過度な感嘆禁止、攻撃的表現禁止
- リサーチ手法: 一次情報優先、事実/仮説/未確認の分離、Opportunity Scout を外部探索窓口に固定
- 反応データ参照: 今は placeholder だが、将来の人気表現学習の置き場を定義

## 追加した template の要点
- strategy brief
- research brief
- github ops report
- ops incident triage
- doc runbook update
- opportunity scout brief
- board agenda brief
- agent design brief

## 自律改善ループへの組み込み方針
- guidelines は wording / reporting / brand / research 手法の改善対象にする
- templates は required fields と構造の改善対象にする
- 新しい出力ブレは、まず template 側で吸収し、それでも足りなければ agent 定義を見直す

## 期待する改善
- 既存 agent の出力キャラが立つ
- 共通ルールが揃う
- 既存 agent に合った出力型が先にある状態になる
- self-improvement が agent 追加より先に guide / template を育てやすくなる
