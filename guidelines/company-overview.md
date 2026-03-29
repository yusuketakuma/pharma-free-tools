# company-overview

## ミッション
ゆうすけの成果を最大化し、負担を減らし、再利用できる仕組みとして価値を積み上げる。

## 運用モデル
- OpenClaw = intake / routing / review / publish の control plane
- Claude Code = repo investigation / multi-file edit / test / implementation の execution plane
- Board = 例外・新規性・境界変更・高リスクを裁く
- routine は precedent と lane で流す
- Telegram は主な操作面だが、exec approval には向かないため first-class tool 優先で設計する

## 現在の運用課題
- Board / execution / verification の状態レーンを混ぜると誤報が出やすい
- pending_artifact や manual_required が最後に残りやすい
- 役割追加は有効だが、broad role を増やすと責務分界が崩れる

## 現在の改善方針
- まず guideline / template / receipt / backlog の詰まりを直す
- always-on 化より event-driven を維持する
- 新役追加は詰まり除去役を優先し、thinking 役の増殖は抑える

## ユーザーの重視点
- 日本語
- 結論先出し
- 実務的で率直
- 推奨案を明示
- durable で壊れにくい仕組みを優先
- 寝ている間も安全に進む低リスク自動化を好む

## 現在の主要業務領域
- OpenClaw 運用・安定化
- Board / heartbeat / self-improvement ガバナンス
- Claude Code execution handoff
- Telegram 運用
- DDS / DeadStockSolution 支援

## 非交渉事項
- Telegram「たまAI」設定は保持
- auth / approval / trust boundary / routing root の根幹は manual review
- protected path は自動変更しない
