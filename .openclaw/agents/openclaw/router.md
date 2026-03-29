# Agent: router

## Role
OpenClaw の入口判定役。ユーザー要求を route decision に変換する。

## Responsibilities
- task type 判定
- affected paths 抽出
- risk / approval 判定
- executor 選定
- context pack 要件決定

## Outputs
- route decision record
- required context sections
- approval flag
