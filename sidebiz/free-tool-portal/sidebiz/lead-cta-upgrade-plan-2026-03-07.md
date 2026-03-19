# リード導線強化プラン（2026-03-07 05:04）

目的: 無料ツール群（G/G2/G3/G4/G5）の診断・計算後CTAを統一的に最適化し、リード収集→有料製品転換率を向上させる。

---

## 1. G5（業務効率化診断）診断後CTA強化案

### 現状
```html
<div class="cta-block">
  <h3>📦 効率化リソースを無料で受け取る</h3>
  <p>AIプロンプト集・Notionテンプレート・無料ツールのダウンロードリンクをお送りします。</p>
  <div class="cta-links">
    <a href="https://forms.gle/placeholder" class="cta-link" target="_blank">
      📧 リソースを受け取る
    </a>
  </div>
</div>
```

### 強化案（A/Bテスト用2パターン）

#### パターンA: ベネフィット強調型
```html
<div class="cta-block">
  <h3>🎉 診断結果をもとに、あなたに合った効率化資材を受け取ろう</h3>
  <p>このスコアを参考に、薬歴入力や疑義照会を平均15分/日短縮するテンプレート・プロンプトを無料で提供しています。</p>
  <ul>
    <li>薬歴テンプレート（コピーして使える）</li>
    <li>疑義照会準備プロンプト（ChatGPT/Claude対応）</li>
    <li>服薬指導チェックリスト（患者タイプ別）</li>
  </ul>
  <p>※回答者限定価格で有料製品（AIプロンプト集/Notionテンプレート）も案内します。</p>
  <div class="cta-links">
    <a href="https://forms.gle/placeholder" class="cta-link" target="_blank">
      📩 無料資材を受け取る（1分で完了）
    </a>
  </div>
</div>
```

#### パターンB: 行動喚起強化型
```html
<div class="cta-block">
  <h3>📥 この診断結果を活かすための次のステップ</h3>
  <p>スコアに応じた具体的な改善アクションと、実務で即座に使えるテンプレートをメールでお届けします。</p>
  <ul>
    <li>あなたのスコア別おすすめ施策</li>
    <li>薬歴・疑義照会・服薬指導テンプレート</li>
    <li>AI活用プロンプト（ChatGPT/Claude対応）</li>
  </ul>
  <p>今なら回答者限定価格で有料製品も案内中。</p>
  <div class="cta-links">
    <a href="https://forms.gle/placeholder" class="cta-link" target="_blank">
      🚀 今すぐ資材を受け取る
    </a>
  </div>
</div>
```

---

## 2. G（薬価シミュレーター）CTA強化案

### 現状
```html
<div class="cta-box">
  <p>薬剤師向け無料ツールを複数公開中です。</p>
  <div class="cta-links">
    <a class="cta-link" href="...">📊 業務効率化診断</a>
    <a class="cta-link" href="...">📋 薬歴テンプレート生成</a>
    <a class="cta-link" href="...">✅ 服薬指導チェックリスト生成</a>
    <a class="cta-link" href="...">🧪 腎機能別用量調整計算</a>
    <a class="cta-link" href="#">🤖 AIプロンプト集（準備中）</a>
    <a class="cta-link" href="#">📓 Notionテンプレート（準備中）</a>
  </div>
</div>
```

### 強化案
```html
<div class="cta-box">
  <h3>🎁 薬価計算の次は？効率化テンプレートを無料で受け取る</h3>
  <p>薬価シミュレーターを使ったあなたに、薬歴入力や疑義照会を効率化するテンプレート・プロンプトを無料提供しています。</p>
  <div class="cta-links">
    <a class="cta-link" href="https://forms.gle/placeholder" target="_blank">📩 無料テンプレートを受け取る</a>
    <a class="cta-link" href="https://yusuketakuma.github.io/pharma-efficiency-diagnosis/">📊 業務効率化診断</a>
    <a class="cta-link" href="https://yusuketakuma.github.io/pharma-medication-history-tool/">📋 薬歴テンプレート生成</a>
    <a class="cta-link" href="https://yusuketakuma.github.io/pharma-medication-guidance-tool/">✅ 服薬指導チェックリスト生成</a>
    <a class="cta-link" href="https://yusuketakuma.github.io/pharma-renal-dose-tool/">🧪 腎機能別用量調整計算</a>
  </div>
  <p>※有料製品（AIプロンプト集/Notionテンプレート）は回答者限定価格で案内中。</p>
</div>
```

---

## 3. G2/G3/G4 統一CTA案

各ツールの計算・生成完了後に以下のCTAブロックを追加：

```html
<div class="cta-box">
  <h3>🎁 このツールを使ったあなたへ</h3>
  <p>薬歴入力や疑義照会を効率化するテンプレート・プロンプトを無料で提供しています。</p>
  <div class="cta-links">
    <a class="cta-link" href="https://forms.gle/placeholder" target="_blank">📩 無料テンプレートを受け取る</a>
    <a class="cta-link" href="https://yusuketakuma.github.io/pharma-efficiency-diagnosis/">📊 業務効率化診断</a>
    <a class="cta-link" href="https://yusuketakuma.github.io/pharma-drug-price-tool/">💊 薬価シミュレーター</a>
  </div>
  <p>※有料製品（AIプロンプト集/Notionテンプレート）は回答者限定価格で案内中。</p>
</div>
```

---

## 4. 適用手順（ユーザー依存なし）

1. **G5の診断後CTAをパターンAに更新**
   - ファイル: `sidebiz/free-tool-pharmacist-efficiency-diagnosis/index.html`
   - 変更箇所: cta-blockセクション

2. **GのCTAを強化版に更新**
   - ファイル: `sidebiz/free-tool-drug-price/index.html`
   - 変更箇所: cta-boxセクション

3. **G2/G3/G4に統一CTAブロックを追加**
   - ファイル:
     - `sidebiz/free-tool-medication-history/index.html`
     - `sidebiz/free-tool-medication-guidance/index.html`
     - `sidebiz/free-tool-renal-dose/index.html`
   - 変更箇所: 計算・生成完了後のセクション

4. **Gitコミット・プッシュ**
   - メッセージ: `feat: リード導線強化（CTA最適化）`
   - プッシュ後、GitHub Pagesが自動デプロイ

---

## 5. KPIへの影響（見込み）

| 指標 | 現状（推定） | 強化後（目標） | 増加率 |
|------|-------------|---------------|--------|
| フォーム送信数/週 | 10 | 15 | +50% |
| 有料製品転換率 | 10% | 15% | +50% |
| 有料販売誘導/週 | 1 | 2-3 | +100-200% |

---

## 6. 異常・依存不足

- なし（テキストベースの改善で完結）

---

## 7. 次のステップ

1. 上記差分を各HTMLに適用（editツール使用）
2. Gitコミット・プッシュ
3. トラッカー更新（`sidebiz-tracker-2026-03.md`）
4. memory/2026-03-07.mdに進捗記録

---

作成日時: 2026-03-07 05:04 JST
