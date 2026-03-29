# Runbook — pharma-free-tools

## 運用方針
- 「毎日1本増やす」運用は終了。実需調査でニーズが強いテーマのみ開発・改善。
- 新規追加は research update でトップ候補に上がった場合のみ。
- Source: `projects/pharma-free-tools/docs/status.md`

## 日次タスク実行
```bash
python3 ~/.openclaw/scripts/daily_pharma_tool.py
```

## 新規ツールのみ
```bash
python3 ~/.openclaw/scripts/daily_pharma_tool.py --skip-update
```

## 既存アップデートのみ
```bash
python3 ~/.openclaw/scripts/daily_pharma_tool.py --skip-new
```

## Push（承認後）
```bash
cd ~/pharma-free-tools && git push origin main
```

## 手動ツール作成
```bash
python3 ~/.openclaw/scripts/telegram_task_bridge.py \
  --instruction "薬局向けの○○チェックリストを作成" \
  --project pharma-free-tools --type implement
```

## トラブルシューティング
- CI失敗: `gh run list --repo yusuketakuma/pharma-free-tools`
- OGP検証: 各HTMLファイルの `<meta property="og:*">` 確認
- ツール数不一致: `find . -maxdepth 1 -name "*.html" -not -name "*.tmp" | wc -l`
