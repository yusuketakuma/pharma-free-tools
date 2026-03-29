# department-autonomy-protocol

## 原則
- 取締役会は各本部に目的・優先度・制約を渡す
- 各本部長は部署内の担当へ仕事を分解して流す
- 部署内では routine を自律処理し、例外・高リスク・境界変更だけ取締役会へ戻す

## 本部長の責務
- 部署の backlog を持つ
- 部署内 handoff を exact target / owner / due / success criteria で流す
- routine を Board に毎回上げない
- 部署内 report を短くまとめて取締役会へ返す
- 部署内の shared context を維持する（priority / blocked / waiting_on / next_action / evidence）
- 部署内で閉じる案件と、取締役会へ戻す案件を仕分ける
- 指示をそのまま投げず、部署内の担当別タスクへ翻訳する

## 部署内情報共有の最低項目
- current_priority
- active_tasks
- blocked_items
- waiting_on
- next_actions
- linked_evidence
- human_confirmation_needed

## 部署内自律の条件
- 既存 precedent がある
- protected path / trust boundary に触れない
- manual review 必須事項を含まない
- effect-confirmed までの証跡レーンが追える

## 取締役会へ戻す条件
- precedent 不足
- 高リスク
- 部署横断依存
- contradiction / stale / blocked が長引く
- KPI や方針に影響する

## report ルール
- 本部報告は内容要点を先に書く
- file 名列挙を主報告にしない
- done / applied / confirmed を混ぜない
- 取締役会への報告は「今の本部状況」「詰まり」「取締役会に求める判断」を分ける

## 指示伝播ルール
- 取締役会の判断は、本部長がそのまま転送しない
- 本部長は部署内の担当別に翻訳し、exact target / owner / due / success criteria へ落とす
- 部署内で routine 化できるものは backlog に積み、例外だけを優先指示にする
- 指示の受領・着手・詰まり・完了を同じ言葉で追うため、template を固定する
