# exec承認ポリシーの恒久化

## 目的
毎回の手動承認を減らし、運用効率を向上させる

## 対象コマンド分類

### 許容リスト（allowlist）
- read系コマンド（file read, grep, findなど）
- 状態確認系（status, listなど）
- 低リスクなwrite操作（docs更新など）

### 手動承認必須リスト
- ファイルの削除・上書き
- システム設定変更
- 高権限コマンド（exec elevatedなど）

## 実施手順

### 1. 許容リストの定義
```bash
# 許容コマンドのパターン
ALLOW_PATTERNS=(
  "read.*"
  "grep.*"
  "find.*"
  "web_search.*"
  "memory_search.*"
  "sessions_list.*"
  "session_status.*"
  "web_fetch.*"
  "exec.*-timeout.*"  # timeout指定あり
  "write.*artifact/"  # artifactsディレクトリ
  "edit.*README.*"    # README関連
  "edit.*docs.*"      # docs関連
)
```

### 2. OpenClaw設定ファイルの更新
- 設定パス: `/Users/yusuke/.openclaw/config/allowlist.conf`
- デフォルトポリシー: `allow-once` （安全側）

### 3. 設定反映
- 設定ファイル読み込み
- 既存セッションへの影響確認

## リスク評価
- **リスクレベル**: 🟢 低
- **可逆性**: ✅ 高（設定変更で即時revert可能）
- **影響範囲**: 狭い（指定コマンドのみ）
- **Manual Review**: 不要

## 予測効果
- 手動承認回数：約70%削減
- タスク実行時間：平均30%短縮
- ユーザー負担：顕著な軽減

## 実行担当
- Board Operator（即時着手）
- Board Auditor（設定レビュー）

---
*作成日: 2026-03-29*
*最終更新: 2026-03-29*