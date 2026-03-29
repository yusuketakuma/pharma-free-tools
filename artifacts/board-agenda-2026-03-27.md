# 取締役会本会議（2時間ごと）プレ会議ブリーフ

## 運用順
1. agenda seed
2. Claude Code 事前審議
3. premeeting 正本 brief
4. OpenClaw 再レビュー
5. 記録
6. 指示

## 主要論点（最大3件）

### 1) 今サイクルの実行優先順位と詰まりの解消
- 何を今すぐ進めるか
- 何が待ち・保留か
- どこで人手確認が必要か

**配置判断:** OpenClaw 完結

### 2) Claude Code execution plane へ回す対象の裁定
- repo 調査が必要な論点
- 複数ファイル変更が必要な論点
- 実装 / refactor / テストが必要な論点
- 再現確認や重い検証が必要な論点

**配置判断:** 裁定は OpenClaw、実作業は Claude Code execution plane

### 3) 進行記録・指示・次回持ち越しの確定
- 議事録に残す要点
- 次回までの宿題
- 低リスクで自動化できる後続処理

**配置判断:** OpenClaw 完結

## Claude Code execution へ回す論点
- repo-wide 調査を要するもの
- 複数ファイル修正を要するもの
- テスト実行が必要なもの
- 実装 / refactor を伴うもの
- 再現・検証コストが高いもの

## OpenClaw 完結でよい論点
- 論点整理
- 優先順位付け
- 進行管理
- 短報 / lightweight coordination
- 記録 / 指示書の整形

## 実行面の配置判断理由
- OpenClaw は control plane として、論点裁定・配線・レビュー・記録に強い
- Claude Code は execution plane として、調査・編集・検証・実装に強い
- 重い作業を OpenClaw に寄せると、判断と実行が混線して遅くなる
- 先に OpenClaw で裁定し、実作業だけを Claude Code に渡すと、再利用可能な運用になる

## 差分指示要点
- Claude Code 実行へ回す対象を明示する
- OpenClaw 完結項目はここで止める
- 実行後は記録を残し、次回の agenda seed に戻す
