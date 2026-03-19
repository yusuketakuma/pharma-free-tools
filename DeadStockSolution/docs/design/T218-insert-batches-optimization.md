# T218: insertInBatches バッチサイズ最適化

## 現状

```typescript
const INSERT_BATCH_SIZE = 500;

async function insertInBatches(
  totalCount: number,
  insertBatch: (start: number, end: number) => Promise<unknown>,
): Promise<void> {
  for (let i = 0; i < totalCount; i += INSERT_BATCH_SIZE) {
    await insertBatch(i, i + INSERT_BATCH_SIZE);
  }
}
```

**問題点**: 固定500件バッチは大規模アップロード(10万件+)でトランザクション数が増大

## 提案: 動的バッチサイズ

### 方式A: 段階的スケーリング

```typescript
function computeBatchSize(totalCount: number): number {
  if (totalCount <= 10_000) return 500;
  if (totalCount <= 50_000) return 1_000;
  if (totalCount <= 100_000) return 2_000;
  return 5_000;
}
```

### 方式B: 線形スケーリング (推奨)

```typescript
function computeBatchSize(totalCount: number): number {
  // 最小500、最大5000、totalCount/100を基準
  return Math.min(5_000, Math.max(500, Math.floor(totalCount / 100)));
}
```

**例**:
| 総件数 | バッチサイズ | バッチ数 |
|--------|-------------|---------|
| 5,000 | 500 | 10 |
| 50,000 | 500 | 100 |
| 100,000 | 1,000 | 100 |
| 200,000 | 2,000 | 100 |
| 500,000 | 5,000 | 100 |

### 実装変更

```typescript
function computeBatchSize(totalCount: number): number {
  return Math.min(5_000, Math.max(500, Math.floor(totalCount / 100)));
}

async function insertInBatches(
  totalCount: number,
  insertBatch: (start: number, end: number) => Promise<unknown>,
): Promise<void> {
  const batchSize = computeBatchSize(totalCount);
  for (let i = 0; i < totalCount; i += batchSize) {
    await insertBatch(i, Math.min(i + batchSize, totalCount));
  }
}
```

## テストケース

1. **小規模**: 1000件 → バッチサイズ500、2バッチ
2. **中規模**: 50000件 → バッチサイズ500、100バッチ
3. **大規模**: 100000件 → バッチサイズ1000、100バッチ
4. **超大规模**: 500000件 → バッチサイズ5000、100バッチ
5. **境界値**: 50000件ちょうど → バッチサイズ500
6. **境界値**: 50001件 → バッチサイズ501

## リスク評価

- **低リスク**: バッチサイズ変更は挿入順序に影響しない
- **注意点**: メモリ使用量は増加するが、5000件程度なら問題なし
- **ロールバック**: 定数に戻すだけで復旧可能

## 次のステップ

1. `computeBatchSize` 関数を追加
2. `insertInBatches` を修正
3. ユニットテスト追加
4. 統合テストで検証

---

作成日: 2026-03-08 04:05 JST
ステータス: 設計完了、実装待ち
