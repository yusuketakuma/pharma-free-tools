# Sidebiz Scout Rubric

最終更新: 2026-03-25 03:00 JST

目的: `sidebiz` の探索タスクを、候補列挙で終わらせず **PoCにつながる比較可能な評価** に揃える。

## 1. 1アイデアごとに必須で残す項目
- pain point
- 想定顧客
- Japan fit
- OpenClaw automation fit
- implementation difficulty
- competition density
- why now
- intentionally deprioritized reason（採用しない場合も必須）
- next action
- owner
- due
- success criteria

## 2. 最低限のKPI
### direct KPI
- 候補から PoC に進んだ件数
- PoC から初回課金 / 初回商談 / 実運用テストに進んだ件数

### proxy KPI
- PoC化率
- 棄却理由の明確さ
- 次実験接続率
- owner付き次アクション率

### missing のままにしない項目
- どの候補を今やるか
- 誰がいつまでにやるか
- 成功と失敗の判定基準

## 3. ステータス判定
### Keep
- 採用 / 非採用の理由が明文化されている
- 次アクションが owner / due / success criteria 付き

### Strengthen
- 候補比較はできたが、PoC への接続が弱い
- 指標はあるが旧KPIと新KPIが混ざっている

### Stop / deprioritize
- 需要はあっても差別化が弱い
- 自動化適合が低い
- 規制 / 導入障壁 / データ取得制約が大きい
- 同じ論点を繰り返している

## 4. レビュー時チェック
- 需要確認だけで終わっていないか
- 「やる理由」だけでなく「やらない理由」も残っているか
- 旧 affiliate / funnel KPI を current scout の成果判定に流用していないか
- 次回は何を検証すれば継続 / 停止判断できるかが明確か

## 5. 推奨テンプレ
```md
## Idea: <name>
- pain point:
- customer:
- Japan fit:
- OpenClaw fit:
- difficulty:
- competition density:
- why now:
- direct KPI:
- proxy KPI:
- deprioritized reason:
- next action:
- owner:
- due:
- success criteria:
```

## 6. Problem separation rule
- 同じ funnel に見えても、入口が違う pain point は別候補として扱う。
- 例: missed-call follow-up / quote follow-up / invoice matching は混ぜない。
- 1 アイデアは 1 entry point に限定し、next action も 1 つに絞る。
- 候補比較では「需要の強さ」だけでなく、「どの入口で PoC するか」を必ず固定する。
