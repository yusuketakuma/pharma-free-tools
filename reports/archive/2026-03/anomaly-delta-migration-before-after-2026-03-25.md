# Anomaly-Delta Migration Before/After

Date: 2026-03-25

## 対象
- `agent-scorecard-review`
- `autonomy-loop-health-review`

---

# 1. agent-scorecard-review

## Before
- score の説明と governance 的判断が混ざる
- routine な変化まで Board 候補になりやすい
- narrative が長くなりがち

## After
- routine score 説明係ではなく anomaly / delta monitor にする
- 平常は signal_event digest のみ
- 異常時だけ agenda_candidate
- artifact 更新だけなら artifact_update

## 入力
- score history
- previous cycle
- backlog / SLA / retry / reopen / override / precedent hit など

## 判定カテゴリ
- hard threshold breach
- significant delta
- persistent degradation
- cross-agent divergence
- precedent gap
- unresolved recurrence

## 出力ルール
- 1 agent あたり candidate は 0〜1 件
- 1 run あたり total 3 件まで
- 超過は root_issue 単位で cluster

## 完了条件
- routine review が Board 候補を量産しない
- 異常だけが agenda に上がる
- 平常 narrative が短くなる

---

# 2. autonomy-loop-health-review

## Before
- health review と Board 的整理が混在する
- 平常値の説明が重くなりがち
- loop 健全性の異常と routine digest が分かれていない

## After
- system-level anomaly / delta monitor にする
- 健全なら digest signal のみ
- system anomaly の時だけ agenda_candidate
- 根幹変更を伴うものだけ mandatory deep

## 監視対象
- heartbeat run 数
- noop 率
- candidate 率
- duplicate suppression 率
- board touch rate
- full board 率
- deep review 率
- decision latency
- execution wait ratio
- unresolved backlog
- reopen 率
- precedent hit rate
- auto disposition 率
- scout backlog

## 異常カテゴリ
- board overload
- discovery flood
- execution starvation
- precedent miss / governance inefficiency
- scout saturation
- loop oscillation

## 出力ルール
- 平常: signal_event digest
- 異常: agenda_candidate
- policy root change を伴う場合のみ mandatory deep

## 完了条件
- routine narrative を減らす
- system anomaly だけが Board に上がる
- Board 希少性が維持される

---

## 推奨実装順
1. anomaly classifier を先に入れる
2. candidate cap / cluster を入れる
3. prompt wording を monitor 化する
4. 2 cycle 観測して threshold を調整する
