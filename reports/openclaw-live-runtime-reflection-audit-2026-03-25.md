# OpenClaw live runtime reflection audit

Date: 2026-03-25

## 結論
workspace 側 `.openclaw/` で進めた handoff / adapter 改善を、そのまま **一部ファイルだけ** `~/.openclaw/` へ反映するのは **unsafe**。

理由は、live runtime 側が **旧 contract / 旧 adapter 呼び出し** に依存しており、workspace 側の新 contract 実装と **互換性が切れている** ため。

したがって次の推奨は、

1. **部分同期をしない**
2. **反映単位を bundle として定義**
3. **dry-run 比較 → bundle 単位で反映**

である。

---

## 監査結果

### workspace 側
存在:
- `.openclaw/scripts/handoff_contract.py`
- `.openclaw/scripts/run_claude_acp.py`（新 contract 対応）
- `.openclaw/scripts/run_claude_code.sh`（新 contract 対応）
- `.openclaw/config/project-injection-registry.json`
- `.openclaw/scripts/execute_task.py`（workspace 系）

### live 側
存在:
- `~/.openclaw/scripts/run_claude_acp.py`（旧・軽量版）
- `~/.openclaw/scripts/run_claude_code.sh`（旧・軽量版）
- `~/.openclaw/scripts/execute_task.py`（task_dir 直読み型）

不足:
- `~/.openclaw/scripts/handoff_contract.py` がない
- `~/.openclaw/config/project-injection-registry.json` がない
- `~/.openclaw/scripts/task_runtime.py` がない

---

## 重要差分

### 1. live execute_task.py は旧 request contract
live 側は `execution-request.json` を次の旧形式で作る。

- `requestId`
- `task.summary`
- `task.detail`
- `routing.lane`
- `constraints.timeoutMinutes`

一方、workspace 側の adapter は `task_runtime.py` と schema を前提にした **新 contract** を使う。

つまり adapter だけ差し替えると壊れる可能性が高い。

### 2. live 側に task_runtime.py がない
workspace 側 adapter / execute 系は `task_runtime.py` を土台にしている。

live 側にはこれがないため、
- validation
- path 解決
- auth / schema 補助
- runtime utility

が欠落する。

### 3. handoff pack は workspace 依存 artifact
`handoff_contract.py` と registry が live 側に無いので、
workspace で作った手法を live へ部分持ち込みすると、生成物の前提が揃わない。

---

## 判断

### NG
- `run_claude_acp.py` だけ live に上書き
- `run_claude_code.sh` だけ live に上書き
- `handoff_contract.py` だけ live に追加

### OK 寄り
- contract bundle 単位でまとめて反映
- 反映前に live 側 backup
- dry-run comparison 実施
- 反映対象を manifest 化

---

## 推奨 bundle 単位

### Bundle A: contract runtime core
- `scripts/task_runtime.py`
- `scripts/execute_task.py`
- `scripts/dispatch_task.py`
- `scripts/run_claude_acp.py`
- `scripts/run_claude_code.sh`
- `scripts/handoff_contract.py`
- `config/project-injection-registry.json`
- `schemas/execution-request.schema.json`
- `schemas/execution-result.schema.json`
- `schemas/dispatch-plan.schema.json`
- `schemas/lane-selection.schema.json`
- `schemas/claude-structured-output.schema.json`

### Bundle B: optional supporting runtime
- auth / health / capacity helper 群
- metrics / queue helper 群
- supporting workflow docs

最初は **Bundle A のみ** でよい。

---

## 推奨反映手順

1. live backup を作る
2. bundle manifest に従って差分確認
3. dry-run diff / copy
4. schema / py_compile / bash -n を live 側で確認
5. 最小 smoke check を通した bundle だけ publish 候補にする

## 反映判断メモ
- manual reflection でも bundle manifest / dry-run / smoke の3点が揃わない限り live publish とは呼ばない
- producer map や authority 変更は別 review とし、この runbook では扱わない
5. smoke task を 1件流す
6. 問題なければ Gateway / runtime 再起動または次回実行へ反映

---

## 推奨次アクション

### Priority 1
bundle manifest を作る

### Priority 2
bundle sync script を作る（dry-run 対応）

### Priority 3
live へ Bundle A を最小反映

---

## Recommendation

次は **Bundle A manifest + dry-run sync script** を作るのが最適。
これなら unsafe な部分同期を避けつつ、live 反映へ進める。
