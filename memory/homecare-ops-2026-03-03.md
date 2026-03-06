# homecare 30m internal memo (2026-03-03)

## 17:30 JST run (cron:480c489f-1147-4cff-8e16-f546eb67bd25)

### 1) 最新情報ソース再取得
- **運用状態**: `homecare-30m-assign` は実行中、`homecare-30m-report-to-trainer` は次回17:45実行予定（`openclaw cron list` 再取得）。
- **運用リスク情報**: `openclaw status --all` のGatewayログ要約に `lane task error ... FailoverError: API rate limit reached`（17:30 JST帯）が記録。
- **安全情報（PMDA）**: 回収情報（医薬品）ページ再取得。
  - URL: https://www.pmda.go.jp/safety/info-services/drugs/calling-attention/recall-info/0002.html
  - 2023年度以降の回収情報検索・クラスI/II/III確認導線を確認。
- **医療安全情報（日本医療機能評価機構）**: おしらせ再取得。
  - URL: https://www.med-safe.jp/
  - 最新掲載: 2026.02.16「医療安全情報 No.231 使用期間を超過した胃瘻カテーテルの破損」
  - 薬剤関連で参照価値あり: No.228「粉砕調製された持参薬の過量与薬」（2025.11.17）
- **制度更新（厚労省）**: 令和8年度診療報酬改定ページ導線を再確認。
  - URL: https://www.mhlw.go.jp/stf/newpage_67942.html
  - 併せて検索結果上で「在宅医療の推進」「調剤報酬の適正化・長期処方/リフィル強化」方針記載を確認。

### 2) 次の30分で完了する具体作業（選定）
1. **17:45報告用の安全トピック2点を固定**
   - No.231（胃瘻カテーテル）とNo.228（過量与薬）を、在宅訪問時チェック観点として短文化。
2. **assign→report連携の欠損対策メモ整備**
   - 17:30帯のrate-limit痕跡を内部メモ化し、17:45報告で必要なら`[ALERT]`付与できる判定条件を明確化。

### 3) [ALERT]判定条件（17:45報告ジョブ向け）
- 17:40時点で `homecare-30m-assign` が完了せず `running` 継続 or 実績未生成。
- `openclaw status --all` で同種の `API rate limit reached` が追加発生。
- 上記いずれか成立時は、17:45報告の先頭に **`[ALERT]`** を付与する。

## 18:00 JST run (cron:480c489f-1147-4cff-8e16-f546eb67bd25)

### 1) 最新情報ソース再取得
- **運用状態**: `openclaw cron list` を再取得。`homecare-30m-assign` は18:00帯で `running`、`homecare-30m-report-to-trainer` は約14分後（18:15想定）実行予定。
- **稼働健全性**: `openclaw status --all` で Telegram channel state は `OK`。Gateway/Agent 稼働は継続。
- **ログ再確認**: `gateway.err.log` tailを確認。`API rate limit reached` は08:30-09:00帯の履歴が中心で、18:00直近の新規発生は未検出。
- **安全情報（PMDA）**: 回収情報（医薬品）ページ再取得。
  - URL: https://www.pmda.go.jp/safety/info-services/drugs/calling-attention/recall-info/0002.html
  - クラスI/II/III回収の年度別導線（2023年度以降）を再確認。
- **医療安全情報（med-safe）**: トップお知らせ再取得。
  - URL: https://www.med-safe.jp/
  - 直近トピック継続確認: No.231（胃瘻カテーテル破損）, No.230（患者取り違え）, No.228（粉砕持参薬の過量与薬）。
- **制度更新（厚労省）**: 令和8年度診療報酬改定の公式導線を再確認（PDFリンク含む）。
  - URL: https://www.mhlw.go.jp/stf/newpage_67942.html
  - 検索再取得で、在宅医療推進・調剤報酬適正化関連の資料リンクを確認。

### 2) 次の30分で完了する具体作業（選定）
1. **18:15報告用「在宅安全チェック3点」短文化**
   - No.231/No.228 + PMDA回収確認導線を、訪問前チェックに転記可能な3行テンプレへ整理。
2. **[ALERT]判定の即時監視メモ更新**
   - 18:00-18:15の間に、homecare lane失敗・assign未完了・外部安全ソース取得不能の有無を最終確認し、報告文先頭タグ判定を固定。

### 3) 進捗/阻害/停止リスク（18:15報告ジョブ向け）
- **進捗**: 主要ソース再取得は完了（運用状態・PMDA・med-safe・厚労省導線）。
- **阻害（軽微）**: 厚労省PDF本文は自動抽出で可読性が低く、要点確認は検索スニペット＋公式導線確認ベース。
- **停止リスク（監視中）**: 過去の`API rate limit reached`再発可能性は残存。
- **[ALERT]付与条件（18:15）**:
  - `homecare-30m-assign` が18:12時点で未完了 or failed
  - 18:00以降に `lane=session:agent:homecare` の FailoverError（rate limit含む）が新規発生
  - PMDA/med-safeの再取得が連続失敗（2ソース以上）
- 条件不成立時は通常報告（`[ALERT]`なし）。

## 18:30 JST run (cron:480c489f-1147-4cff-8e16-f546eb67bd25)

### 1) 最新情報ソース再取得
- **運用状態（再取得）**:
  - `openclaw cron list --json` で `homecare-30m-assign` は18:30帯で `running`、`homecare-30m-report-to-trainer` は次回18:45予定を確認。
  - 同時に `homecare-30m-report-to-trainer` の `delivery.mode` は `none`（外部送信なし）を維持。
- **運用品質（再取得）**:
  - `openclaw status --all` で Telegram channel state `OK`、Gateway稼働継続を確認。
  - `openclaw cron runs --id 480c.../3e2c...` で直近実績を確認。
    - assign最新確定: 18:00 run `ok`
    - report最新確定: 18:20 run で `[ALERT]`（進捗データ取得不足 + 報告遅延リスク）
- **ログ監視（再取得）**:
  - `gateway.err.log` tail で、homecare laneの新規FailoverError（18時台）は未検出。
  - ただし過去の `API rate limit reached` 多発履歴は継続監視対象。
- **安全情報（公式）再取得**:
  - **med-safe（医療安全情報）**: 最新 `No.231 使用期間を超過した胃瘻カテーテルの破損`、参照継続 `No.228 粉砕調製された持参薬の過量与薬` を確認。
    - URL: https://www.med-safe.jp/contents/info/
  - **PMDA（安全対策新着）**: 2026-03-03「定期予防接種等の副反応疑い報告の取扱い一部改正」、2026-02-27 クラスI回収（照射赤血球液-LR「日赤」）を確認。
    - URL: https://www.pmda.go.jp/safety/0001.html
    - URL: https://www.pmda.go.jp/safety/info-services/drugs/calling-attention/recall-info/0002.html
  - **厚労省（令和8年度診療報酬改定）**: 基本方針(12/9)→議論整理/諮問(1/14)→答申(2/13)の経緯導線を再確認。
    - URL: https://www.mhlw.go.jp/stf/newpage_67729.html

### 2) 次の30分で完了する具体作業（選定）
1. **18:45報告用「在宅安全チェック3点 v2」作成**
   - 胃瘻カテーテル交換期限確認（No.231/PMDA医療安全情報系）
   - 持参薬粉砕時の二重確認（No.228）
   - PMDAクラスI/II回収の訪問前確認導線
2. **18:45報告ジョブの遅延・欠損監視を固定化**
   - 18:42時点でassign完了有無を確認
   - 18:45報告の開始遅延が10分超なら即`[ALERT]`
   - 新規FailoverErrorまたは安全ソース再取得失敗（2ソース以上）でも`[ALERT]`

### 3) 重要進捗/阻害/停止リスク（18:45向け）
- **進捗**: 公式3系統（PMDA/med-safe/厚労省）+運用系（cron/status/log）を18:30帯で再取得完了。
- **阻害**: reportジョブで「進捗データ取得不足」を起点とした`[ALERT]`が継続（直近18:20 run）。
- **停止リスク**:
  - 過去に多発した `API rate limit reached` が再発すると、assign/report双方が遅延する可能性。
  - 18:45帯で assign未完了・report遅延>10分・再取得失敗が発生した場合は、報告先頭を **`[ALERT]`** 化する。

## 19:00 JST run (cron:480c489f-1147-4cff-8e16-f546eb67bd25)

### 1) 最新情報ソース再取得
- **運用状態**:
  - `openclaw cron list`: homecare-30m-assign は32分前に実行済み、現在 `running`（本セッション）。
  - coding-30m-assign / sidebiz-30m-assign も `running`。
  - trainer-8h-regular-report は3時間前に実行済み、次回5時間後（約24:00）。
  - 全ジョブ GLM-5 (`zai/glm-5`) 稼働中。
- **安全情報（PMDA）**:
  - URL: https://www.pmda.go.jp/safety/info-services/drugs/calling-attention/recall-info/0002.html
  - 2025年度クラスI/II/III回収情報あり。クラスIは「重篤な健康被害または死亡の原因となり得る」。
  - クラスIIは「一時的または治癒可能な健康被害」。
  - PMDAメディナビでタイムリーな配信あり。
- **令和8年度診療報酬改定（在宅医療関連）**:
  - 厚労省公式: https://www.mhlw.go.jp/stf/newpage_67942.html
  - 在宅医療の充実に向けた対応
  - 医療DX推進
  - 在宅医療DX情報活用加算の経過措置期間が **2026年5月31日まで延長**
  - 24時間医療提供体制の評価強化（連携型機能強化型在宅療養支援診療所）
  - 災害時の在宅患者診療体制の確保

### 2) 次の30分で完了する具体作業（選定）
1. **令和8年度改定の在宅医療要点を短文化**
   - DX加算（電子カルテ情報共有サービス、経過措置2026/5/31延長）
   - 24時間体制（連携型機能強化型在宅療養支援診療所の見直し）
   - 災害時対応（在宅療養支援診療所・病院の見直し）
   - 訪問薬剤管理に活かせる3行テンプレート化
2. **PMDAクラスI回収の在宅関連チェック**
   - 2025年度クラスI回収情報を確認
   - 在宅医療で使用可能性のある医薬品の有無を確認
   - 該当あれば内部メモに記録

### 3) [ALERT]判定条件（19:15報告ジョブ向け）
- 19:10時点で `homecare-30m-assign` が未完了 or `failed`
- 19:00以降に `API rate limit reached` または homecare lane FailoverError が新規発生
- PMDA/厚労省の再取得が連続失敗（2ソース以上）
- 上記いずれか成立時は19:15報告の先頭に **`[ALERT]`** を付与

### 4) 進捗/阻害/停止リスク（19:15向け）
- **進捗**: 主要ソース再取得完了（cron状態・PMDA回収・令和8年度改定）。
- **阻害**: なし（現在のところ新規の障害未検出）。
- **停止リスク（監視継続）**:
  - 過去の `API rate limit reached` 再発可能性は残存。
  - 19:15帯での新規エラー発生に注意。

### 5) 実施済みタスク（19:00-19:05）

#### ① PMDAクラスI回収の在宅関連チェック
- **2025年度クラスI回収の主な対象**: 輸血用血液製剤（照射赤血球液-LR「日赤」、新鮮凍結血漿-LR「日赤」240等）
- **在宅医療での使用可能性**: 低い（輸血は通常、医療機関で実施）
- **注意点**: 在宅医療支援診療所・病院との連携時に、血液製剤使用の有無を確認
- **判定**: 在宅訪問薬剤管理への直接的影響は限定的

#### ② 令和8年度診療報酬改定・在宅医療要点（訪問薬剤管理向け3行テンプレ）
```
【在宅医療DX加算】電子カルテ情報共有サービスの経過措置→2026年5月31日延長
【24時間体制】連携型機能強化型在宅療養支援診療所の見直し・評価強化
【災害時対応】在宅療養支援診療所・病院の災害時診療体制確保の見直し
```
- **訪問薬剤管理への示唆**:
  - 電子カルテ情報共有の準備促進（2026年5月末までに整備）
  - 24時間連携体制の確認（かかりつけ薬局としての役割）
  - 災害時の在宅患者フォローアップ体制の整備

---

## 00:00 JST run (cron:480c489f-1147-4cff-8e16-f546eb67bd25)

### 1) 最新情報ソース再取得
- **PMDA回収情報**: 2025年度クラスI/II/III継続監視
  - URL: https://www.pmda.go.jp/safety/info-services/drugs/calling-attention/recall-info/0002.html
- **医療安全情報（med-safe）**: No.231（胃瘻カテーテル）、No.228（過量与薬）継続
  - URL: https://www.med-safe.jp/contents/info/
- **重要情報**: 経過措置医薬品 2026年3月31日期限（307件）
  - 在宅医療で使用される医薬品が含まれる可能性

### 2) 次の30分で完了する具体作業（選定）
1. **経過措置医薬品の在宅関連抽出** - 今月末期限307件の確認
2. **訪問薬剤管理チェックリスト更新** - 経過措置確認項目追加

### 3) 進捗/阻害/停止リスク
- **進捗**: 最新情報再取得完了
- **阻害**: なし
- **停止リスク**: なし

### 4) [ALERT]判定条件（00:15報告ジョブ向け）
- homecare-30m-assignが00:12時点で未完了 or failed
- PMDA/med-safeの再取得が連続失敗
- 経過措置医薬品に在宅頻用薬が含まれ緊急対応が必要
