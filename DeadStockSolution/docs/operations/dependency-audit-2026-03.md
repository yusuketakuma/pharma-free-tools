# 依存関係監査レポート (2026-03)

## セキュリティ脆弱性

### Moderate (4件)

| パッケージ | 影響バージョン | 脆弱性 | 依存経路 |
|-----------|---------------|--------|----------|
| esbuild | ≤0.24.2 | GHSA-67mh-4wv8-2f99 | drizzle-kit → @esbuild-kit/esm-loader → @esbuild-kit/core-utils → esbuild |

**影響範囲**: 開発サーバーのみ（本番環境への影響なし）

**対応方針**:
- `npm audit fix --force` は breaking change を伴うため、計画的な検証が必要
- drizzle-kit のアップデートで解消見込み

---

## 古いパッケージ (2026-03-06時点)

### メジャーアップデート（要検証）

| パッケージ | 現在 | 最新 | 影響 |
|-----------|------|------|------|
| react | 18.3.1 | 19.2.4 | 大（Breaking changes多数） |
| react-dom | 18.3.1 | 19.2.4 | 大 |
| @types/react | 18.3.28 | 19.2.14 | 大 |
| @types/react-dom | 18.3.7 | 19.2.3 | 大 |
| react-router-dom | 6.30.3 | 7.13.1 | 中（API変更あり） |
| eslint | 9.39.3 | 10.0.2 | 中 |
| @eslint/js | 9.39.3 | 10.0.1 | 中 |
| read-excel-file | 6.0.3 | 7.0.1 | 中 |

### マイナーアップデート（低リスク）

| パッケージ | 現在 | 最新 | 影響 |
|-----------|------|------|------|
| express-rate-limit | 8.2.1 | 8.3.0 | 小 |
| fast-xml-parser | 5.4.1 | 5.4.2 | 小 |
| @types/node | 25.3.0 | 25.3.5 | 小 |
| @types/supertest | 6.0.3 | 7.2.0 | 小 |

---

## 推奨アクション

### 即時対応（マイナー更新）
```bash
npm update express-rate-limit fast-xml-parser @types/node
```

### 計画対応（メジャー更新）
1. React 19 移行ガイド確認
2. 専用ブランチで検証
3. E2Eテスト全通過確認後、マージ

---

## 次回監査予定

- 2026-04-01（月次）
