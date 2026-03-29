# Cross-Agent Knowledge Sync Cronジョブ仕様

## 概要

Cronジョブ: `cross-agent knowledge sync`  
ジョブID: `cron:8528dd97-87dc-470b-8758-c7005f03ce76`  
Board Chair の下で各取締役および各実行エージェントの最近の実行結果・学び・差分・成果物を横断する。**このジョブ自体は Board の裁定文を作らない**。

## 新しい責務

### 平常同期と問題特定の分離
- **平常同期**: `signal_event` として扱う
- **問題特定**: `conflict / contradiction / new pattern / precedent gap` だけを `agenda_candidate` として扱う
- **Board 向けの結論**: ここでは作らない
- **出力形式**: 生整理ではなく、`root_issue` と `desired_change` を明確にする
- **最終形態**: 概念説明で終わらず、signal / candidate を runtime へ書く前提で動く

## 必須実行内容

### Runtime 出力形式
- **signal_event 出力**: `board_runtime.py emit-signal` 相当の形式で runtime に残すこと
- **agenda_candidate 出力**: `board_runtime.py emit-candidate` 相当の形式で runtime に残すこと
- **候補ゼース報告**: Board に上げる候補が0件でも、signal 側の件数を明記すること

## signal_event に落とすもの

### 平常共有項目
- success / failure / lesson / next_change のうち平常共有で十分なもの
- 重要だが policy 化不要の調査結果
- 再利用できるテンプレや検証手順

## agenda_candidate に上げる条件

### Board 議論が必要な項目
- **knowledge conflict / contradiction**: 知識体系の矛盾・対立
- **new pattern**: 新しい知見体系やパターンの発見
- **precedent gap**: 既存事例の不足・空白
- **複数エージェント影響**: 複数エージェントに波及する改善の必要性
- **policy / routing / staffing / prompt guardrail / reporting quality**: 全体方針や運用に影響する項目

## 最低限の candidate 出力要件

### 構造化情報
```yaml
title: "件名"
summary: "概要"
root_issue: "根本問題"
desired_change: "望ましい変化"
requested_action: "求められるアクション"
change_scope: "変更範囲"
boundary_impact: "境界への影響"
reversibility: "可逆性評価"
blast_radius: "波及範囲"
novelty: "新規性評価"
evidence: "証拠"
recommendation:
  proposed_lane: "推奨レーン"
```

## 報告形式

### 必須項目
- **結論**: 実行結果の要約
- **signal_event 件数**: runtime に書いた signal_event の件数
- **agenda_candidate 件数**: runtime に書いた agenda_candidate の件数
- **conflict / contradiction**: 発見された矛盾
- **new pattern**: 発見された新パターン
- **precedent gap**: 発見された事例空白
- **Board 候補**: 取締役会に上げる候補一覧
- **次アクション**: 直近の進め方

## 動作原則

### 重要制約
- **Board 裁定の作成はしない**: あくまで cross-agent knowledge sync に徹する
- **形式を遵守**: signal と candidate で明確に分け、標準出力形式に従う
- **ゼース対応**: 候補がゼースの場合でも signal の件数を報告する
- **root_issue 明確化**: 問題の核心を特定する記述を行う

### 出力優先順位
1. runtime への正しい出力形式
2. 信号と候補の明確な分離
3. 内容の精度と具体性
4. Board での活用可能性

---

*仕様制定日: 2026-03-28*  
*適用対象: Cross-Agent Knowledge Sync Cronジョブ*