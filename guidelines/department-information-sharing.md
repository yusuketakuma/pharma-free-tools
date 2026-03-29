# department-information-sharing

## 目的
部署内の自律動作を安定させるため、本部長と担当が同じ shared context を見る状態を作る。

## 本部内で共有すべきもの
- current_priority
- active_tasks
- blocked_items
- waiting_on
- next_actions
- linked_evidence
- human_confirmation_needed

## 避けること
- 個別ログをそのまま全員に流す
- done / started / waiting / blocked を曖昧にする
- 取締役会向けの言葉と、担当向けの言葉を混ぜる

## 実務ルール
- 本部長は shared context を短く更新する
- 担当は自分の進行を本部の状態語彙に合わせて返す
- long log より、priority / blocked / next action を揃える
- 秘書本部は、チャット文面から汲み取った要望・制約・緊急度を短い要約にして、取締役会経由で全エージェント共有に回す
- 全体共有時は、生ログではなく「要望 / 制約 / 優先度 / 次アクション / 人手確認要否」の形で渡す
