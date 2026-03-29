# Loop Report 統一テンプレート

全loopのlatest reportは以下のフォーマットに統一する。

## 必須フィールド（YAMLフラット形式）

```
status: active|done|blocked|stalled|idle|suspended
updated_at: YYYY-MM-DDTHH:MM:SS+09:00
summary: 1行で現在の状態と主な成果を記載
executed:
  - 実行した作業1
  - 実行した作業2
blocked: 阻害要因（なければ「なし」）
next: 次サイクルで実施する1つのアクション
```

## オプション（詳細セクション）

必要に応じて `---` の後に詳細を追記してよい。

```
---

## 詳細タイトル
説明文...
```

## 採用理由

1. **パース容易**: `grep "^status:"` 等で一貫して取得可能
2. **最小構造**: 6フィールドで状態管理に十分
3. **後方互換**: Pattern Aを採用している既存5件は変更不要
4. **統一効果**: Pattern B（8件）の `- ` プレフィックスを削除するだけで移行完了
