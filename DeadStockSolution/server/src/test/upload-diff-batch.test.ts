import { describe, it, expect } from 'vitest';
import { computeBatchSize } from '../services/upload-diff-utils';

describe('computeBatchSize', () => {
  it('returns minimum 500 for small counts', () => {
    expect(computeBatchSize(0)).toBe(500);
    expect(computeBatchSize(100)).toBe(500);
    expect(computeBatchSize(1000)).toBe(500);
    expect(computeBatchSize(50000)).toBe(500);
  });

  it('returns totalCount/100 for medium counts', () => {
    expect(computeBatchSize(100_000)).toBe(1000);
    expect(computeBatchSize(200_000)).toBe(2000);
    expect(computeBatchSize(300_000)).toBe(3000);
  });

  it('returns maximum 5000 for very large counts', () => {
    expect(computeBatchSize(500_000)).toBe(5000);
    expect(computeBatchSize(1_000_000)).toBe(5000);
    expect(computeBatchSize(10_000_000)).toBe(5000);
  });

  it('handles boundary at exactly 50000 (stays at 500)', () => {
    expect(computeBatchSize(50_000)).toBe(500);
  });

  it('handles boundary just above 50000 (scales up)', () => {
    expect(computeBatchSize(50_001)).toBe(500);
    expect(computeBatchSize(51_000)).toBe(510);
  });

  it('handles boundary at 500000 (max)', () => {
    expect(computeBatchSize(500_000)).toBe(5000);
    expect(computeBatchSize(499_999)).toBe(4999);
  });

  it('uses floor for non-exact divisions', () => {
    expect(computeBatchSize(123_456)).toBe(1234);
    expect(computeBatchSize(99_999)).toBe(999);
  });
});
