# 取締役会本会議（2時間ごと）: 圧縮アジェンダ

日時: 2026-03-27 16:35 JST
運用順: agenda seed → Claude Code 事前審議 → premeeting 正本 brief → OpenClaw 再レビュー → 記録 → 指示

## 本会議の主要論点（最大3件）

### 1. 直近2時間の重要差分と未決事項の確認
- 目的: 進捗・阻害要因・決裁待ちを短く揃える
- 実行面の配置: **OpenClaw 完結**
- 理由: read_only / short report / lightweight coordination の範囲に収まるため

### 2. 実行が必要な高優先論点の裁定
- 目的: その論点を **OpenClaw 完結** で処理するか、**Claude Code execution plane** に送るかを明示する
- 実行面の配置: **条件付きで Claude Code / OpenClaw を分岐**
- 判断基準:
  - repo 調査・複数ファイル変更・テスト・実装・refactor → **Claude Code execution plane**
  - 仕様整理・方針決定・短報・軽い調整 → **OpenClaw 完結**

### 3. 実行指示の確定と記録
- 目的: 本会議で決めた指示を、誰が・どこで・何をやるかまで落とす
- 実行面の配置: **OpenClaw 完結**（必要に応じて Claude Code へ転送指示を添付）
- 理由: control plane の責務は配分・記録・再現可能な指示化であり、実装自体は execution plane に委ねるため

## Claude Code execution へ回す論点
- repo 調査が必要なもの
- 複数ファイル変更が必要なもの
- テストが必要なもの
- 実装 / refactor が必要なもの
- 影響範囲が広く、OpenClaw 側の短報では閉じないもの

## OpenClaw 完結でよい論点
- 進捗確認
- 方針整理
- 短いレビュー
- 役割分担・キュー調整
- 低リスクの文書化
- 指示の整形と記録

## 実行面の配置判断理由
- **OpenClaw** は control plane として、論点の圧縮・裁定・配分・記録を担う
- **Claude Code** は execution plane として、repo 調査・編集・テスト・実装・refactor を担う
- したがって、本会議では「何を決めるか」と「どこへ流すか」を先に確定し、実作業は必要時のみ Claude Code に切り分けるのが最も安定

## 差分指示要点
- まず 3 論点まで圧縮する
- 各論点に対して「OpenClaw 完結」か「Claude Code execution 行き」かを明示する
- Claude Code 行きの場合は、実行対象（repo 調査 / 実装 / テスト / refactor）を添える
- 記録後に指示へ落とし込む
