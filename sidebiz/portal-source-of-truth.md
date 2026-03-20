# Portal Source of Truth / 保守引き継ぎメモ

最終更新: 2026-03-19 18:12 JST

## 結論
- **正本(repo / 検証対象):** `/Users/yusuke/.openclaw/workspace`
- **混同注意:** `/Users/yusuke/.openclaw/workspace/sidebiz/free-tool-portal` は **別git管理の古い複製**。root と HEAD が乖離しており、ここを見て保守判定すると誤報が出る。

## なぜ重要か
- root `index.html` にはニュースレター暫定導線が存在する
- nested copy の `index.html` には存在しない
- そのため、nested 側を検証すると「未実装」と誤判定になる

## 2026-03-19 時点の実測
- root HEAD: `767f3539`
- nested HEAD: `aefe43d`
- GitHub Pages: `200`
- Vercel: `404`

## 標準検証コマンド
```bash
cd /Users/yusuke/.openclaw/workspace
bash scripts/verify-portal-integrity.sh
```

### 個別確認
```bash
# ニュースレター暫定導線
cd /Users/yusuke/.openclaw/workspace
grep -n "newsletter\|newsletter_intent" index.html

# Vercel / GitHub Pages 生存確認
curl -s -o /dev/null -w "%{http_code}\n" https://yusuketakuma.github.io/pharma-free-tools/
curl -s -o /dev/null -w "%{http_code}\n" https://pharma-free-tools.vercel.app/
```

## 保守ルール
1. **完了判定は root repo 実測のみ**
2. `repo相対パス + grep根拠 + file existence` を報告必須化
3. nested copy は参照してもよいが、**完了/未完了の判定根拠に使わない**

## 継続課題
1. GA4実Measurement ID未反映（placeholder 72ページ）
2. Vercel 404継続（ダッシュボード側確認が必要）
3. Buttondown未作成のため、本メール収集フォームは未接続
