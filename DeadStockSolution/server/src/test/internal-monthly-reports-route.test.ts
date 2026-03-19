import express from 'express';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  triggerManualMonthlyReport: vi.fn(),
  resolveDefaultTargetMonth: vi.fn(),
  validateYearMonth: vi.fn(),
}));

vi.mock('../services/monthly-report-scheduler', () => ({
  triggerManualMonthlyReport: mocks.triggerManualMonthlyReport,
}));

vi.mock('../services/monthly-report-service', () => ({
  resolveDefaultTargetMonth: mocks.resolveDefaultTargetMonth,
  validateYearMonth: mocks.validateYearMonth,
}));

vi.mock('../services/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

import monthlyReportsRouter from '../routes/internal-monthly-reports';

const ORIGINAL_CRON_SECRET = process.env.CRON_SECRET;
const ORIGINAL_MONTHLY_REPORT_CRON_SECRET = process.env.MONTHLY_REPORT_CRON_SECRET;

function createApp() {
  const app = express();
  app.use('/api/internal/monthly-reports', monthlyReportsRouter);
  return app;
}

describe('internal monthly reports route auth and validation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.CRON_SECRET;
    delete process.env.MONTHLY_REPORT_CRON_SECRET;
    mocks.resolveDefaultTargetMonth.mockReturnValue({ year: 2026, month: 2 });
    mocks.validateYearMonth.mockImplementation(() => undefined);
    mocks.triggerManualMonthlyReport.mockResolvedValue(undefined);
  });

  afterEach(() => {
    if (typeof ORIGINAL_CRON_SECRET === 'string') {
      process.env.CRON_SECRET = ORIGINAL_CRON_SECRET;
    } else {
      delete process.env.CRON_SECRET;
    }
    if (typeof ORIGINAL_MONTHLY_REPORT_CRON_SECRET === 'string') {
      process.env.MONTHLY_REPORT_CRON_SECRET = ORIGINAL_MONTHLY_REPORT_CRON_SECRET;
    } else {
      delete process.env.MONTHLY_REPORT_CRON_SECRET;
    }
  });

  it('returns 401 when authorization header is invalid', async () => {
    process.env.MONTHLY_REPORT_CRON_SECRET = 'monthly-secret';
    const app = createApp();

    const response = await request(app)
      .get('/api/internal/monthly-reports/run')
      .set('Authorization', 'Bearer wrong-secret');

    expect(response.status).toBe(401);
    expect(response.body).toEqual({ error: 'unauthorized' });
    expect(mocks.triggerManualMonthlyReport).not.toHaveBeenCalled();
  });

  it('returns sanitized message when year/month validation fails', async () => {
    process.env.MONTHLY_REPORT_CRON_SECRET = 'monthly-secret';
    mocks.validateYearMonth.mockImplementation(() => {
      throw new Error('月の指定が不正です。1-12の範囲で指定してください');
    });
    const app = createApp();

    const response = await request(app)
      .get('/api/internal/monthly-reports/run?year=2026&month=99')
      .set('Authorization', 'Bearer monthly-secret');

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: '月パラメータが不正です' });
    expect(mocks.triggerManualMonthlyReport).not.toHaveBeenCalled();
  });

  it('runs monthly report when authorized and valid', async () => {
    process.env.MONTHLY_REPORT_CRON_SECRET = 'monthly-secret';
    const app = createApp();

    const response = await request(app)
      .get('/api/internal/monthly-reports/run')
      .set('Authorization', 'Bearer monthly-secret');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ message: 'ok', year: 2026, month: 2 });
    expect(mocks.validateYearMonth).toHaveBeenCalledWith(2026, 2);
    expect(mocks.triggerManualMonthlyReport).toHaveBeenCalledWith(2026, 2);
  });

  it('returns 503 when cron secret is not configured', async () => {
    // Do not set MONTHLY_REPORT_CRON_SECRET
    const app = createApp();

    const response = await request(app)
      .get('/api/internal/monthly-reports/run')
      .set('Authorization', 'Bearer any-secret');

    expect(response.status).toBe(503);
    expect(response.body).toEqual({ error: 'monthly report cron is not configured' });
    expect(mocks.triggerManualMonthlyReport).not.toHaveBeenCalled();
  });

  it('returns 400 when year is below 2020', async () => {
    process.env.MONTHLY_REPORT_CRON_SECRET = 'monthly-secret';
    const app = createApp();

    const response = await request(app)
      .get('/api/internal/monthly-reports/run?year=2019&month=6')
      .set('Authorization', 'Bearer monthly-secret');

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: '年パラメータが不正です' });
    expect(mocks.triggerManualMonthlyReport).not.toHaveBeenCalled();
  });

  it('returns 400 when year is above 2099', async () => {
    process.env.MONTHLY_REPORT_CRON_SECRET = 'monthly-secret';
    const app = createApp();

    const response = await request(app)
      .get('/api/internal/monthly-reports/run?year=2100&month=6')
      .set('Authorization', 'Bearer monthly-secret');

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: '年パラメータが不正です' });
    expect(mocks.triggerManualMonthlyReport).not.toHaveBeenCalled();
  });

  it('accepts year 2020 as valid boundary', async () => {
    process.env.MONTHLY_REPORT_CRON_SECRET = 'monthly-secret';
    const app = createApp();

    const response = await request(app)
      .get('/api/internal/monthly-reports/run?year=2020&month=1')
      .set('Authorization', 'Bearer monthly-secret');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ message: 'ok', year: 2020, month: 1 });
    expect(mocks.validateYearMonth).toHaveBeenCalledWith(2020, 1);
    expect(mocks.triggerManualMonthlyReport).toHaveBeenCalledWith(2020, 1);
  });

  it('accepts year 2099 as valid boundary', async () => {
    process.env.MONTHLY_REPORT_CRON_SECRET = 'monthly-secret';
    const app = createApp();

    const response = await request(app)
      .get('/api/internal/monthly-reports/run?year=2099&month=12')
      .set('Authorization', 'Bearer monthly-secret');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ message: 'ok', year: 2099, month: 12 });
    expect(mocks.validateYearMonth).toHaveBeenCalledWith(2099, 12);
    expect(mocks.triggerManualMonthlyReport).toHaveBeenCalledWith(2099, 12);
  });

  it('returns 400 when month is 0', async () => {
    process.env.MONTHLY_REPORT_CRON_SECRET = 'monthly-secret';
    const app = createApp();

    const response = await request(app)
      .get('/api/internal/monthly-reports/run?year=2026&month=0')
      .set('Authorization', 'Bearer monthly-secret');

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: '月パラメータが不正です' });
    expect(mocks.triggerManualMonthlyReport).not.toHaveBeenCalled();
  });

  it('returns 400 when month is 13', async () => {
    process.env.MONTHLY_REPORT_CRON_SECRET = 'monthly-secret';
    const app = createApp();

    const response = await request(app)
      .get('/api/internal/monthly-reports/run?year=2026&month=13')
      .set('Authorization', 'Bearer monthly-secret');

    expect(response.status).toBe(400);
    expect(response.body).toEqual({ error: '月パラメータが不正です' });
    expect(mocks.triggerManualMonthlyReport).not.toHaveBeenCalled();
  });

  it('accepts month 1 and 12 as valid boundaries', async () => {
    process.env.MONTHLY_REPORT_CRON_SECRET = 'monthly-secret';
    const app = createApp();

    const response = await request(app)
      .get('/api/internal/monthly-reports/run?year=2026&month=1')
      .set('Authorization', 'Bearer monthly-secret');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ message: 'ok', year: 2026, month: 1 });
    expect(mocks.triggerManualMonthlyReport).toHaveBeenCalledWith(2026, 1);
  });

  it('returns 500 when triggerManualMonthlyReport throws unexpected error', async () => {
    process.env.MONTHLY_REPORT_CRON_SECRET = 'monthly-secret';
    mocks.triggerManualMonthlyReport.mockRejectedValue(new Error('Database connection failed'));
    const app = createApp();

    const response = await request(app)
      .get('/api/internal/monthly-reports/run')
      .set('Authorization', 'Bearer monthly-secret');

    expect(response.status).toBe(500);
    expect(response.body).toEqual({ error: 'monthly report run failed' });
  });

  it('uses default year/month from resolveDefaultTargetMonth when not provided', async () => {
    process.env.MONTHLY_REPORT_CRON_SECRET = 'monthly-secret';
    mocks.resolveDefaultTargetMonth.mockReturnValue({ year: 2025, month: 12 });
    const app = createApp();

    const response = await request(app)
      .get('/api/internal/monthly-reports/run')
      .set('Authorization', 'Bearer monthly-secret');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ message: 'ok', year: 2025, month: 12 });
    expect(mocks.validateYearMonth).toHaveBeenCalledWith(2025, 12);
    expect(mocks.triggerManualMonthlyReport).toHaveBeenCalledWith(2025, 12);
  });

  it('accepts explicit year and month parameters overriding defaults', async () => {
    process.env.MONTHLY_REPORT_CRON_SECRET = 'monthly-secret';
    mocks.resolveDefaultTargetMonth.mockReturnValue({ year: 2026, month: 2 });
    const app = createApp();

    const response = await request(app)
      .get('/api/internal/monthly-reports/run?year=2024&month=6')
      .set('Authorization', 'Bearer monthly-secret');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ message: 'ok', year: 2024, month: 6 });
    expect(mocks.validateYearMonth).toHaveBeenCalledWith(2024, 6);
    expect(mocks.triggerManualMonthlyReport).toHaveBeenCalledWith(2024, 6);
  });
});
