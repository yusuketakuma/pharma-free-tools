# 新規ツール追加チェックリスト

## 目的
404リンク・件数不整合の再発防止

## 前提条件
- [ ] 既存ツールと重複していないことを確認
  - `grep -i "ツール名" index.html` で検索
  - 既存URLと重複していないことを確認

## チェックリスト

### 1. HTMLファイル作成
- [ ] `sidebiz/free-tool-portal/` にHTMLファイルを作成
- [ ] ファイル名規則: `kebab-case.html`（例: `pharmacy-cashflow-diagnosis.html`）
- [ ] ファイルが正常に作成されたことを確認

### 2. ポータル（index.html）更新
- [ ] 適切なカテゴリセクションにツールカードを追加
  ```html
  <div class="tool-card">
    <h3>ツール名<span class="badge new">NEW</span></h3>
    <p>ツールの説明文（80-120文字推奨）</p>
    <a href="ファイル名.html" class="tool-link">使ってみる →</a>
  </div>
  ```

### 3. 件数同期更新（必須）
以下の全てを**同時**に更新する：
- [ ] `<title>` タグ（XX選）
- [ ] `<meta property="og:title">` （XX選）
- [ ] `<meta name="twitter:title">` （XX選）
- [ ] `.subtitle` クラス（XX選）
- [ ] `.stat-number` （ツール数）
- [ ] `<footer>` （全XXツール）

### 4. JSON-LD更新
- [ ] `ItemList` 内に新しい `ListItem` を追加
- [ ] `position` 番号を連番で設定（既存の最大値+1）
- [ ] `name` と `url` を正しく設定

### 5. リンク整合性確認
- [ ] `link-checker.sh` を実行して404がないことを確認
  ```bash
  cd /Users/yusuke/.openclaw/workspace/sidebiz/free-tool-portal
  bash link-checker.sh
  ```

### 6. 最終確認
- [ ] ローカルでポータルを開き、新しいツールカードが表示されることを確認
- [ ] ツールカードのリンクをクリックして、ページが正常に表示されることを確認
- [ ] スマートフォン表示でレイアウトが崩れていないことを確認

## よくあるミス
1. **HTMLファイル未作成** → カードだけ追加して404になる
2. **件数更新漏れ** → タイトルとフッターの数字が合わない
3. **JSON-LD更新忘れ** → SEO構造化データが不整合
4. **ファイル名不一致** → カードのhrefと実際のファイル名が異なる

## 自動化予定
- [ ] 件数自動カウントスクリプト作成
- [ ] JSON-LD自動生成スクリプト作成
- [ ] link-checker.shの週次cron実行設定

---
作成日: 2026-03-11
作成者: 副業担当
目的: ポータル品質維持・404再発防止
