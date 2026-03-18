# homecare-joint-visit-checklist.html 修正パッチ案

**作成日**: 2026-03-18 23:16 JST
**担当**: 薬剤師エージェント
**ステータス**: 修正案準備完了（HTML適用は朝以降dispatch判断）

---

## 修正概要

Part2レビュー（22:45）で検出した「患者の同意確認チェック項目なし」「算定頻度6月に1回の記載なし」を修正するパッチ案。

---

## 修正箇所一覧

### 修正1【中優先】: 患者（家族）の同意確認チェック項目追加

**ファイル**: `homecare-joint-visit-checklist.html`
**挿入位置**: L357の直後（カテゴリ1「訪問前準備」の4番目のitem4の直前、item3のdivの後）
**カテゴリ見出し更新**: L336「1. 訪問前準備（4項目）」→「1. 訪問前準備（5項目）」

**追加するHTML**:
```html
                <div class="checklist-item">
                    <input type="checkbox" id="item3b" name="item3b">
                    <label for="item3b">患者（家族含む）から医師との同時訪問・同時指導について同意を取得済み</label>
                </div>
```

**根拠**:
- 2026年改定の訪問診療薬剤師同時指導料（300点）の算定要件として「患者の同意取得」が明示されている
- 現在のチェックリストには同意確認の項目がない
- 同意なしの算定は返戻リスクあり

**注意**: チェック項目数が15→16に増加。以下のJS定数を変更すること:
- L476: `const totalItems = 15;` → `const totalItems = 16;`
- L329: `<div class="progress-text" id="progressText">0 / 15 項目完了</div>` → `0 / 16 項目完了`
- L439: `0<span style="font-size:24px">/15</span>` → `/16`

---

### 修正2【中優先】: 算定頻度「6月に1回」の明記

**ファイル**: `homecare-joint-visit-checklist.html`
**挿入位置**: L321の直後（info-box 内の p タグの後）

**追加するHTML**:
```html
            <p style="margin-top: 8px; color: #c53030; font-weight: bold; font-size: 13px;">
              ⚠️ 算定頻度: 6月に1回（過誤請求にご注意ください）
            </p>
```

**根拠**:
- 訪問診療薬剤師同時指導料は「6月に1回」の算定制限がある
- 現在のinfo-box・請求要件確認セクションのいずれにも記載なし
- 月1回や高頻度での算定による過誤請求リスクを防止

---

### 修正3【低優先】: 請求要件確認セクションの具体化

**ファイル**: `homecare-joint-visit-checklist.html`
**行**: L422（item13のlabel）

**修正前**:
```html
<label for="item13">同時指導料の算定要件を満たしているか確認</label>
```

**修正後**:
```html
<label for="item13">同時指導料の算定要件を確認（在宅時医学総合管理料算定医師との同時訪問・患者同意・6月に1回）</label>
```

**根拠**: 汎用的な記載を具体化し、チェック時に何を確認すべきか明確にする

---

## free-tool-portal版（コピー先）

**注意**: `workspace/sidebiz/free-tool-portal/homecare-joint-visit-checklist.html` にも同一ファイルが存在。HTML適用時は両方を同時に修正すること。

---

## 適用手順（朝以降）

1. info-box に算定頻度注記を追加（修正2）
2. カテゴリ1に同意確認チェック項目を挿入（修正1）
3. カテゴリ見出しの項目数を更新（4→5）
4. JS定数 totalItems を16に変更
5. HTML内の初期表示テキスト（/15）を/16に変更
6. item13のlabelを具体化（修正3）
7. `sidebiz/free-tool-portal/homecare-joint-visit-checklist.html` にも同一修正を適用
8. ブラウザで動作確認（チェック動作・プログレスバー・スコア表示）

---

## localStorage互換性

- 新規item `item3b` は既存のlocalStorageデータにキーが存在しないため、未チェック状態で表示される（破壊的変更なし）
- totalItems変更により、既存ユーザーのプログレス表示が「X/16」に変わるが、機能上問題なし

---

**参照**:
- `outputs/html-tools-2026-reform-check-part2-2026-03-18.md`（Part2レビュー）
- `2026-chouzai-houshu-kaisei-zaitaku-summary.md`（改定サマリー）
