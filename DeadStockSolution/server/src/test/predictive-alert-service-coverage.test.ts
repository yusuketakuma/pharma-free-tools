import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  select: vi.fn(),
  transaction: vi.fn(),
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock('../config/database', () => ({
  db: {
    select: mocks.select,
    transaction: mocks.transaction,
  },
}));

vi.mock('../services/logger', () => ({ logger: mocks.logger }));

import { runPredictiveAlertsJob } from '../services/predictive-alert-service';

function createSelectSequenceMixed(results: unknown[]) {
  let index = 0;
  mocks.select.mockImplementation(() => ({
    from: vi.fn(() => ({
      where: vi.fn(() => {
        const currentIndex = index;
        const value = results[index++];
        if (currentIndex === 1) {
          return {
            groupBy: vi.fn().mockResolvedValue(value),
          };
        }
        return Promise.resolve(value);
      }),
    })),
  }));
}

describe('predictive-alert-service coverage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.PREDICTIVE_ALERT_NEAR_EXPIRY_DAYS;
    delete process.env.PREDICTIVE_ALERT_EXCESS_STOCK_MONTHS;
    delete process.env.PREDICTIVE_ALERT_BATCH_SIZE;
    delete process.env.PREDICTIVE_ALERT_PERSIST_CONCURRENCY;
  });

  it('returns zero counters when there are no active pharmacies', async () => {
    createSelectSequenceMixed([[]]);

    const result = await runPredictiveAlertsJob({ now: new Date('2026-03-01T00:00:00.000Z') });

    expect(result).toMatchObject({
      processedPharmacies: 0,
      generatedAlerts: 0,
      nearExpiryAlerts: 0,
      excessStockAlerts: 0,
      duplicateAlerts: 0,
      failedAlerts: 0,
    });
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it('generates near-expiry and excess-stock alerts and tracks created/duplicate/failed outcomes', async () => {
    createSelectSequenceMixed([
      [{ id: 1 }, { id: 2 }],
      [
        { pharmacyId: 1, itemCount: 2, totalValue: 1234.56, nearestExpiryDate: '2026-03-10' },
        { pharmacyId: 2, itemCount: 1, totalValue: 222.22, nearestExpiryDate: '2026-03-15' },
      ],
      [
        { pharmacyId: 1, drugName: '薬A', drugMasterId: 10, drugMasterPackageId: null, quantity: 100, yakkaUnitPrice: 2 },
        { pharmacyId: 2, drugName: '薬B', drugMasterId: null, drugMasterPackageId: null, quantity: 0, yakkaUnitPrice: 10 },
      ],
      [
        { pharmacyId: 1, drugName: '薬A', drugMasterId: 10, drugMasterPackageId: null, monthlyUsage: 10 },
        { pharmacyId: 2, drugName: ' ', drugMasterId: null, drugMasterPackageId: null, monthlyUsage: 5 },
      ],
    ]);

    mocks.transaction
      .mockResolvedValueOnce('created')
      .mockResolvedValueOnce('duplicate')
      .mockRejectedValueOnce(new Error('persist failed'));

    process.env.PREDICTIVE_ALERT_PERSIST_CONCURRENCY = '1';

    const result = await runPredictiveAlertsJob({
      nearExpiryDays: 30,
      excessStockMonths: 3,
      now: new Date('2026-03-01T00:00:00.000Z'),
    });

    expect(result.processedPharmacies).toBe(2);
    expect(result.generatedAlerts).toBe(1);
    expect(result.nearExpiryAlerts).toBe(1);
    expect(result.excessStockAlerts).toBe(0);
    expect(result.duplicateAlerts).toBe(1);
    expect(result.failedAlerts).toBe(1);
    expect(mocks.logger.error).toHaveBeenCalledWith(
      'Failed to persist predictive alert signal',
      expect.objectContaining({ error: 'persist failed' }),
    );
  });

  it('uses bounded env defaults when invalid options are provided', async () => {
    createSelectSequenceMixed([
      [{ id: 10 }],
      [],
      [],
      [],
    ]);

    process.env.PREDICTIVE_ALERT_NEAR_EXPIRY_DAYS = '45';
    process.env.PREDICTIVE_ALERT_EXCESS_STOCK_MONTHS = '4';
    process.env.PREDICTIVE_ALERT_BATCH_SIZE = '9999';
    process.env.PREDICTIVE_ALERT_PERSIST_CONCURRENCY = '999';

    const result = await runPredictiveAlertsJob({
      nearExpiryDays: 0,
      excessStockMonths: 99,
      now: new Date('2026-03-05T00:00:00.000Z'),
    });

    expect(result).toMatchObject({
      processedPharmacies: 1,
      generatedAlerts: 0,
      duplicateAlerts: 0,
      failedAlerts: 0,
    });
  });
});
