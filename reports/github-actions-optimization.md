# GitHub Actions 分枯渇対策 — CI最適化案

## 現状

### DeadStockSolution
- 5 job（lint-typecheck, test-server, test-client, integration, verify）
- 各jobが独立して `npm ci` を実行 → 5回のインストール
- 1 runあたり約 20-30 分 × 5 job

### careroute-rx
- 30+ job
- 各jobが独立してsetup → 分消費が膨大
- **3/17以降全CI failure（runner割り当て失敗）**

## 推定原因
GitHub Free plan: **2,000分/月, 500MB storage**
- DeadStockSolution + careroute-rx 合計で容易に超過

## 最適化案

### 1. install job の分離（DeadStockSolution）
```yaml
jobs:
  install:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v6
      - uses: actions/setup-node@v6
        with:
          node-version: 24
          cache: npm
      - run: npm ci
      - uses: actions/cache/save@v4
        with:
          path: node_modules
          key: nm-${{ runner.os }}-${{ hashFiles('package-lock.json') }}

  lint-typecheck:
    needs: install
    steps:
      - uses: actions/checkout@v6
      - uses: actions/cache/restore@v4
        with:
          path: node_modules
          key: nm-${{ runner.os }}-${{ hashFiles('package-lock.json') }}
      - run: npm run lint && npm run typecheck
  # ... 同様にtest系もinstall needsに
```

**効果**: npm ci を1回に → 約4-5分/回削減

### 2. jobの統合
- lint + typecheck を1 jobに
- test-server + test-client を1 jobに（matrix不要なら）
- verify jobの audit:prod はnpm ci不要（npm install --omit=devで十分）

**効果**: 5 job → 3 job → 分消費約40%削減

### 3. careroute-rx: 必須jobのみPR eventで実行
- PR event: lint + typecheck + unit tests + security audit（5-6 job）
- push to main: 全check（30+ job）
- schedule: 大規模テスト

**効果**: PR時の分消費を約80%削減

### 4. 即時対応: gh auth refresh でbilling確認
```bash
gh auth refresh -h github.com -s user
gh api user/settings/billing/actions
```

## 優先順位
1. **Billing確認**（ゆうすけ手作業）
2. **DeadStockSolution CI最適化**（約40%削減、すぐ対応可能）
3. **careroute-rx PR event限定化**（約80%削減、Claude Code推奨）
