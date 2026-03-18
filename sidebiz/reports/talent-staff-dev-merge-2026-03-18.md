# pharmacy-talent-development → pharmacy-staff-development 統合レポート
**作成日時**: 2026-03-18 19:30 JST（自動実行）

---

## 移植した機能（talent-development → staff-development）

### 1. イントロ画面（診断開始前）
- `#introSection` を追加：「この診断ツールでわかること」と「診断の特徴」の2ブロック
- 各ブロックにチェックマーク付きリスト（`.intro-box li:before { content: "✓" }`）
- 「無料」バッジインライン表示（`.badge-inline`）
- 「診断を開始する →」ボタン（`startQuiz()` 関数で quiz セクション表示）

### 2. 領域別スコアの進捗バー表示
- `.category-score-item` + `.category-header-row` + `.category-bar` + `.category-fill` のCSS追加
- `showResult()` 内で各領域のスコアバー（%幅アニメーション）をレンダリング
- `${score}/${max} (${pct}%)` 形式で数値表示

### 3. 領域別詳細改善提案（categoryRecommendations オブジェクト）
- 5領域それぞれに「50%未満」「50-70%」2段階の具体的推奨アクション文を定義
- 例：OJT・実地研修 low → 「OJTプログラムの体系化と指導担当者の明確化が急務です。まずマニュアル作成から始めましょう。」

### 4. 改善ポイント／強み の分離表示
- `#improvementsSection`（赤背景・左ボーダー）：50%・70%未満の領域
- `#strengthsSection`（緑背景・左ボーダー）：70%以上の領域
- 各リスト項目に `→` / `★` アイコン付き

### 5. 関連ツールセクション
- 3ツールカードグリッド（`.related-tools-grid`）
  - 薬局業務ボトルネック診断
  - 薬局AI活用診断
  - 薬局役割明確化診断

---

## 削除した重複箇所

- talent-development の JSON-LD ItemList エントリ（position 45）を両ポータルから削除
- `pharmacy-talent-development.html` ファイル本体は保留（ゆうすけ確認後削除）

---

## 維持した正本（staff-development）の重要要素

| 要素 | 内容 |
|------|------|
| canonical URL | `pharmacy-staff-development.html` |
| OGP URL | 同上 |
| JSON-LD url | 同上 |
| GA4 tracking | `G-XXXXXXXXXX`（TODO: 実ID差替え） |
| スコアアニメーション | setInterval countup |
| 「前へ」ボタン | prevQuestion() |
| ツール一覧へ戻るリンク | `back-link` |
| 問題カテゴリ | OJT・実地研修 / 知識習得・研修 / スキル評価 / コミュニケーション / キャリアパス（5領域20問） |

---

## ポータル修正（talent-development カード削除）

- `index.html`（本体）：JSON-LD ItemList position 45 エントリ削除 → talent-development URL削除
- `sidebiz/free-tool-portal/index.html`（コピー）：同一修正適用
- 波及チェック：ツールカード数 **85件**（変化なし・talent-developmentに可視カードなし）

---

## 統合後の差分サマリー

- **pharmacy-staff-development.html**: 567行 → 約690行（+123行）
  - 追加: イントロセクション、category-bar CSS、categoryRecommendations, improvements/strengths セクション、related-tools セクション
  - 追加: sitemap link（head）
- **pharmacy-talent-development.html**: 変更なし（ポータルカードのみ削除済み）
