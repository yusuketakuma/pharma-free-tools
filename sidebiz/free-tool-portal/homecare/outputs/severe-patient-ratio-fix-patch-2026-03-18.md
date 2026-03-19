# severe-patient-ratio-checksheet.html 修正パッチ案

**作成日**: 2026-03-18 23:15 JST
**担当**: 薬剤師エージェント
**ステータス**: 修正案準備完了（HTML適用は朝以降dispatch判断）

---

## 修正概要

Part2レビュー（22:45）で検出した重症患者定義の誤りと訪問看護条件の曖昧さを修正するパッチ案。

---

## 修正箇所一覧

### 修正1【中優先】: 要介護度の基準修正

**ファイル**: `severe-patient-ratio-checksheet.html`
**行**: L433（criteria-info セクション内 ul > li 4番目）

**修正前**:
```html
<li>要介護度4-5の患者</li>
```

**修正後**:
```html
<li>要介護3以上の患者（別表第8の3）</li>
```

**根拠**:
- 2026年改定の重症患者定義（別表第8の3）では「要介護3以上」が対象
- 現状の「要介護度4-5」では要介護3の患者が重症患者にカウントされず、割合が過少評価される
- 過誤請求防止（要件を満たしているのに算定しない＝機会損失）に直結

---

### 修正2【低優先】: 訪問看護連携条件の明確化

**ファイル**: `severe-patient-ratio-checksheet.html`
**行**: L431（criteria-info セクション内 ul > li 2番目）

**修正前**:
```html
<li>訪問看護ステーションと連携している患者</li>
```

**修正後**:
```html
<li>訪問看護ステーションから月4回以上訪問を受けている患者（別表第8の3）</li>
```

**根拠**:
- 別表第8の3では「月4回以上の訪問看護を受けている者」が条件
- 月1〜3回の訪問看護患者を誤って重症にカウントするリスクを排除

---

### 修正3【任意】: 加算との関連注記の追加

**ファイル**: `severe-patient-ratio-checksheet.html`
**行**: L436付近（criteria-info ul の閉じタグ後）

**追加**:
```html
<p style="margin-top: 10px; font-size: 0.85rem; color: #555;">
  ※ 重症患者割合20%以上は在宅薬学総合体制加算2（ルートA: 100点／ルートB: 50点）の算定要件の一つです。
</p>
```

**根拠**: ツールの目的をユーザーが正しく理解できるよう、加算との関連を明示

---

## free-tool-portal版（コピー先）

**注意**: `workspace/sidebiz/free-tool-portal/severe-patient-ratio-checksheet.html` にも同一ファイルが存在。HTML適用時は両方を同時に修正すること。

---

## 適用手順（朝以降）

1. `severe-patient-ratio-checksheet.html` のL431、L433を上記の通り修正
2. L436付近に注記pタグを追加（任意）
3. `sidebiz/free-tool-portal/severe-patient-ratio-checksheet.html` にも同一修正を適用
4. ブラウザで動作確認（表示のみ。JS計算ロジックには影響なし）

---

**参照**:
- `outputs/html-tools-2026-reform-check-part2-2026-03-18.md`（Part2レビュー）
- `2026-chouzai-houshu-kaisei-zaitaku-summary.md`（改定サマリー）
