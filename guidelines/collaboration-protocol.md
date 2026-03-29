# collaboration-protocol

## 基本原則
- 1 task = 1 lead を基本とする
- advisory は観点補助にとどめる
- cross-functional が必要な時だけ active subrole を付ける

## handoff preflight
handoff 前に最低限これを明示する。
- exact target
- owner
- due
- success criteria

## 状態レーンの分離
次を同じ完了扱いにしない。
- review_status
- apply_status
- live_receipt_status
- artifact_status
- effect_confirmed

## exec 側の扱い
- safe temporary file 配信成功は `sent`
- live receipt 未観測なら `done` にしない
- Board 側完了と Exec 側未受理を混ぜない
