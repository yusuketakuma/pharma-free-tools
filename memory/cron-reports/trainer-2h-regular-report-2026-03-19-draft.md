# trainer-2h-regular-report 下書き

最終更新: 2026-03-19 09:10 JST

## sidebiz-30m-maintenance 反映分

- status: alert
- [ALERT] Vercel 404エラー14サイクル連続
- [ALERT] 品質事故: vercel.json不在（前回「存在」報告は誤り）
- [ALERT] 品質事故: GA4カバレッジ実測24.7%（18/73）で前回「100%」報告と乖離

### 監視結果
- Vercel: 404
- GitHub Pages: 200
- vercel.json: sidebiz/free-tool-portal 配下に不存在
- ツール数: index 86 / sitemap 87（乖離1件）
- 未コミット: claim-denial-reduction-simulator.html, sitemap.xml

### 影響範囲
- ユーザーアクセス: 低（GitHub Pages代替稼働中）
- SEO: 低
- 開発効率: 中（二重ホスティング負荷）
- データ整合性: 高リスク（報告信頼性の品質事故）

### 暫定回避策
- GitHub Pagesを実質本番として継続利用

### 次アクション
1. 【致命】vercel.json作成・push
2. 【高】GA4カバレッジ実態確認・必要に応じ追加実装
3. 【中】未コミットファイル処理
4. 【低】GitHub Pages一本化判断

### 学習ポイント
- 存在確認は find 検索または絶対パスで実施
- カバレッジ測定コマンドを標準化
- 報告乖離は品質事故として扱い、次サイクル指示へ明示反映済み

### 参照
- memory/cron-reports/sidebiz-30m-maintenance-2026-03-19-0910.json

## sidebiz-30m-assign 16:30 反映分

- status: done
- 収益化ボトルネックを「販売アカウント待ち」から「CTA未設置24ページ残存 + GA4未実ID」に再定義
- `scripts/replace-ga4-id.sh` / `scripts/verify-portal-integrity.sh` / `scripts/add_cta_batch.py` を追加
- CTA未設置24ページを更新し、実測で CTA 40 → 64、未設置 24 → 0 を確認

### 実測結果
- ルートHTML: 73
- CTA設置: 64
- OGP設定: 73
- GA4プレースホルダー残: 72

### 品質事故
- 初回awk版CTAバッチは警告ありでも成功表示
- 原因仮説: macOS awk の multiline 文字列処理不整合
- 再発防止: HTML一括改変は Python 化、完了判定は再スキャン実測へ統一
- 影響範囲: ローカルのみ、公開反映なし

### 保守引き継ぎ観点
- `./scripts/verify-portal-integrity.sh` で CTA数/GA4残数の定点観測が可能
- push前にローカルgit差分精査必須（対象外変更巻き込みリスクあり）
- GA4実Measurement ID判明後は `./scripts/replace-ga4-id.sh <G-...>` で一括置換可能

### 次アクション
1. `sidebiz/kpi-tracker.md` の実測ベース更新（73ツール / CTA64）
2. CTA追加5ページの文脈別文言改善
3. 購入前メール/問い合わせ導線の1ページPoC検討

### 学習ポイント
- HTML一括改変は awk より Python 優先
- 処理ログでなく再スキャン値を正とする
- `git add -A` でなく対象ファイル限定 add に切替

### 参照
- memory/cron-reports/sidebiz-30m-assign-2026-03-19-1630.md

## sidebiz-30m-assign 17:14 反映分

- status: done
- `index.html` にニュースレター事前導線バナーを追加（暫定導線）
- `newsletter_intent` GA4イベント追加
- `sidebiz/kpi-tracker.md` 冒頭に実測サマリーを追加し、検証スクリプトとの整合回復

### 実測結果
- ルートHTML: 73
- CTA設置: 64
- OGP設定: 73
- GA4プレースホルダー残: 72
- KPIトラッカー整合: 回復済み

### 品質/阻害
- メール導線はまだ事前案内のみで、収集開始にはButtondown等の外部アカウントが必要
- GA4実Measurement ID未反映のため、本番計測は未完了
- Vercel 404は継続、GitHub Pagesを実質本番として継続運用

### 学習ポイント
- 外部依存待ちでも、壊れない暫定導線 + 計測追加でPoCを先行できる
- KPI台帳に機械可読サマリーを置くと監視誤検知を下げられる

### 次アクション
1. Buttondown接続を前提にメール登録フォームを本実装化
2. GA4実ID判明後に72ページ一括置換
3. CTA追加済み5ページの文脈別文言改善

### 参照
- memory/cron-reports/sidebiz-30m-assign-2026-03-19-1714.md

## sidebiz-30m-assign 17:35 反映分

- status: done
- CTA判定基準を `cta-section / cta_click` へ統一し、index除く全ツールHTML 72/72 でCTA確認を完了
- `scripts/add_cta_batch_v2.py` を追加し、32ページへCTA補完
- `scripts/verify-portal-integrity.sh` を修正して実測基準を安定化
- 品質事故として、旧形式CTA重複（31ファイル発生）を検知し、`scripts/dedupe_cta_sections.py` で即時是正

### 実測結果
- ルートHTML: 73
- CTA設置: 72（index除く全ツール）
- OGP設定: 73
- GA4プレースホルダー残: 72
- KPIトラッカー整合: 回復済み

### 品質事故
- 原因仮説: CTA存在判定が文言ベース、追加基準が class ベースで食い違っていた
- 再発防止: 追加/検証とも `cta-section` 基準へ統一、重複ブロック数チェックを次サイクル標準化
- 影響範囲: ローカルHTML差分のみ、未配信

### 保守引き継ぎ観点
- `./scripts/verify-portal-integrity.sh` で CTA72 / GA4残72 を定点観測可能
- 監視対象は CTA数維持、GA4プレースホルダー残、`newsletter_intent` / `cta_click` の計測可否
- Vercel 404は継続中のため、公開運用はGitHub Pages優先のまま維持

### 次アクション
1. GA4実Measurement ID差し替え手順の1枚化
2. `templates/email-capture-form.html` の埋め込みドライラン
3. GitHub Pages優先導線の明文化案整理

### 学習ポイント
- 一括改変前に「存在判定ルール」と「検証ルール」を同一キーへ揃える
- 旧形式互換を残す場合も重複ブロック検査を必須化する
- 実測一致まで修正して初めて完了扱いにする

### 参照
- memory/cron-reports/sidebiz-30m-assign-2026-03-19-1735.md

## trainer-30m-internet-research 17:22 反映分

- status: alert
- web_search は本サイクルも 5クエリ全失敗（Brave API月次上限）
- 代替として web_fetch で **Atlassian / Zapier / Pharmacy Times / Side Hustle Nation / OpenAI Codex** を当日再取得
- レポート形式を **source / fetchedAt / 採用可否 / 保留 / 次アクション** に改善

### 今日の採用判断（社長・部長向け）
- **採用**: 会議の目的明確化・非同期化・決定/担当/次アクション明文化
- **採用**: sidebizのメールリスト資産化・低摩擦導線
- **採用**: 実測ベース完了判定、ログ/テスト根拠付き報告
- **採用**: OpenClawレポートへの `source / fetchedAt` 明記
- **保留**: MCPの本格展開（要件未固化）
- **保留**: 海外臨床記事の個別知見の日本実務への直接転用

### 部門別 次30分軸修正
1. **homecare**
   - quick card 追加より「入力後の出口条件」明文化を優先
   - `prescriptions_export.csv` 受領後の一手を固定
2. **sidebiz**
   - 外部依存なしで進められる埋め込みドライランを優先
   - 評価軸は分析件数でなく本番反映件数
3. **trainer**
   - 毎回 source / fetchedAt / 新規学習点 を最低1件入れる
   - 内部ログ再掲だけで終えない

### 抽出タスク
- sidebiz副業担当: メール登録フォーム本実装ドライラン、CTA文脈別改善5ページ、GA4置換手順書1枚化
- sidebiz保守担当: verify-portal-integrity.sh拡張、Vercel 404再現条件1枚化、報告根拠テンプレート化
- homecare: MCS抽出後受け皿チェックリスト、fetchedAt管理追記、テリパラチドDay1完了条件1行化

### 学習ポイント
- web_search停止でも web_fetch + fetchedAt 記録で「鮮度限定の継続調査」が可能
- source / fetchedAt / 採用可否 を入れると2h集約時の再編集負荷が下がる
- sidebizは本番反映件数、homecareは入力後出口条件で評価した方が次サイクルが詰まりにくい

### 参照
- memory/cron-reports/trainer-30m-internet-research-2026-03-19-1722.md

## sidebiz-30m-sync-to-trainer 17:47 反映分

- status: alert
- [ALERT] 収益導線の作業場所と本番確認先が分裂（workspace にはニュースレター暫定導線あり、Projects repo / GitHub Pages live には未反映）
- [ALERT] Vercel 404 は継続、GitHub Pages は 200。`vercel.json` は repo に存在するため、根因仮説は Vercel ダッシュボード設定またはデプロイ未反映
- 収益化進捗は「ローカル PoC あり・本番未反映」。GA4実ID未反映、メール配信アカウント未作成のため、本番計測とメール獲得は未開始

### 連携上のボトルネック
- sidebiz開発は workspace 側、保守確認は Projects repo / live 側で走っており、完了判定が二重化
- その結果、17:14 のニュースレター導線実装報告と 17:44 の未反映検知が両立してしまった
- 今後は revenue 関連の完了条件を **Projects repo + GitHub Pages live 実測** に統一する

### 次アクション
1. workspace-only 差分を棚卸しし、Projects repo へ反映する対象だけを確定
2. ニュースレター暫定導線を live へ反映するか、完了扱いを取り消すかを次サイクルで明示
3. Vercel 404 の再現条件と必要なユーザー操作を 1枚化して 2h 集約へ回す

### 学習ポイント
- 収益化タスクの done 条件はローカル実装でなく live 確認まで含める
- source-of-truth が二重化すると報告品質事故になる
- Vercel は repo 設定ファイル有無だけでなく、ダッシュボード側反映まで確認が必要

### 参照
- memory/cron-reports/sidebiz-30m-sync-to-trainer-2026-03-19-1747.md
