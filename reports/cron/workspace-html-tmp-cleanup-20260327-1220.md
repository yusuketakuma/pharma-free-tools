# Workspace HTML tmp cleanup — 2026-03-27 12:20 JST

## 結論
`workspace` ルートに残っていた `*.html.tmp` 24件を、対応する本体 `.html` の存在と参照なしを確認したうえで削除した。  
これは artifact retention policy に沿う、低リスクで可逆性の高い cleanup です。

## Board review
### Board Visionary
- 生成途中の残骸を減らすと、以後の探索や報告でノイズが減る。
- 1回の cleanup で運用面の見通しが少し良くなる。

### Board User Advocate
- ユーザーが見る成果物ではない tmp を溜めない方が、整理の負担が軽い。
- 0 byte の残骸を残し続ける理由は薄い。

### Board Operator
- 最小実行案は、`*.html.tmp` を一括削除して、必要なら後で再生成すること。
- 既存の `.html` があるので、運用継続性を壊しにくい。

### Board Auditor
- root の tmp だけを対象にし、protected path / auth / routing / Telegram には触れていない。
- `projects/`, `reports/`, `.openclaw/` の参照確認でも対象ファイル名はヒットしなかった。

### Board Chair
- 争点は「消してよいか」だったが、`html` 本体あり・参照なし・0 byte のため、採用でよい。

## 今回見つけた候補
1. **採用**: root 直下 `*.html.tmp` の一括 cleanup
   - 理由: artifact retention policy に合致し、低リスクで即時完了できる

2. **保留**: stale-report detection の再探索
   - 理由: 既存 spec があり、新規性が薄い

3. **保留**: bundle manifest / dry-run sync の追加探索
   - 理由: 価値はあるが、今回は cleanup の方が即効性が高い

## Board の採否判断
- 候補1: **採用**
- 候補2: **保留**
- 候補3: **保留**

## 実際に着手したもの
- root 直下の `*.html.tmp` 24件を削除
- 事前確認として、対応する `.html` の存在を確認し、`projects/` / `reports/` / `.openclaw/` / `docs/` / `memory/` / `artifacts/` 参照を `rg` で確認してヒットなしを確認

## 残した成果物 / 差分
- 新規: `reports/cron/workspace-html-tmp-cleanup-20260327-1220.md`
- 削除: root 直下の `*.html.tmp` 24件

## 見送った理由
- stale-report detection: 既存 spec と既存レポートがあり、今は再探索の価値が薄い
- bundle sync: 低リスクではあるが、今回は cleanup の即効性が上回った

## 次アクション
1. 次回の cleanup では `*.html.tmp` の再発有無だけ確認する
2. 必要なら `reports/cron/workspace-cleanup-review-*.md` にこの cleanup を追記する
3. artifact retention policy を、今後の定期レビューで使う基準として維持する
