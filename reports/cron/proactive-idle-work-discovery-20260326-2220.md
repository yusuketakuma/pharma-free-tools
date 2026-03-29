# Proactive Idle Work Discovery — Board Review
Date: 2026-03-26 22:20 JST

## 結論
今回は、**pharma-free-tools の最優先候補である「薬歴下書き・要点整理支援」を、1ページ wireframe proposal に落とすこと** を採用した。

理由は、2026-03-24/25 の existing-only refresh でトップ3が維持されており、しかも薬歴系は高頻度・高痛み・既存資産活用のバランスが最も良いから。  
診断のまま増やすより、**現場でそのまま使える出力型** に寄せた方が leverage が大きい。

## 今回見つけた候補（最大3件）
### 1) pharma-free-tools: 薬歴下書き・要点整理支援の wireframe 固定
- 争点: SOAP / 次回確認事項 / 患者説明メモが診断止まりで、実務に直結する下書き出力が弱い
- board 判断: **採用**
- 理由: 高頻度・高痛み・既存 HTML 再利用の三拍子が揃う

### 2) openclaw-core: triage と security audit / boundary-DDS review の分離
- 争点: 2026-03-26 20:50 の cross-agent sync で agenda_candidate 化されたが、routing / reporting / policy を含むため board 裁定が必要
- board 判断: **保留**
- 理由: 重要だが、今日は proposal 化より先に薬歴ワイヤーのような低リスク成果物を優先

### 3) openclaw-core: queue telemetry / dominant-prefix の次回 refresh
- 争点: read-only では有用だが、直近で stale-report・prefix triage の線は既に固まっている
- board 判断: **見送り**
- 理由: 新規性が薄く、今日の探索では重複扱い

## board の採否判断
- **採用**: 1
- **保留**: 2
- **見送り**: 3

### Board の評価
- **Board Visionary**: 1 は既存需要に対して実務出力を増やすので、最もレバレッジが高い
- **Board User Advocate**: 1 は入力項目が現場の言葉に近く、導入負荷が低い
- **Board Operator**: 1 は 1ページ仕様で前進できる。実装より先に迷いを減らせる
- **Board Auditor**: 1 は low-risk。auth / trust boundary / routing root を触らない
- **Board Chair**: 今日は「改善候補の列挙」ではなく「実装に入れる仕様固定」が正解

## 実際に着手したもの（最大1件）
- `projects/pharma-free-tools/docs/pharmacy-medication-history-wireframe-proposal.md` を新規作成
  - 入力: 患者属性、処方差分、確認論点、現場メモ
  - 出力: SOAP 下書き、次回確認事項、患者説明メモ、介入フラグ
  - UI 構成案と non-goals も明記

## 残した成果物 / 差分
- 新規: `projects/pharma-free-tools/docs/pharmacy-medication-history-wireframe-proposal.md`
- 新規: `reports/cron/proactive-idle-work-discovery-20260326-2220.md`

## 見送った理由
- **openclaw-core triage / audit 分離**: 価値は高いが、今日の自律探索では board 裁定待ちに留めるのが妥当
- **queue telemetry refresh**: 直近の prefix triage / stale-report と重複しやすく、新規性が薄い
- **Telegram / auth / trust boundary / routing / approval の根幹変更**: 禁止

## 次アクション
1. `pharmacy-medication-history-efficiency.html` に wireframe を反映する前提を固める
2. 必要なら `medication-history-time-saving-checklist.html` を補助導線として再配置する
3. openclaw-core の triage / audit 分離は別 board 論点として保持する
4. 通常通知は行わず、定期報告へ集約する
