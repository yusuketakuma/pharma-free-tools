import express from 'express';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import adminLogCenterRouter from '../routes/admin-log-center';
import * as logCenterService from '../services/log-center-service';

// Mock the service
vi.mock('../services/log-center-service', () => ({
  queryLogs: vi.fn(),
  getLogSummary: vi.fn(),
  LOG_SOURCES: ['app', 'system', 'access'],
  LOG_LEVELS: ['error', 'warn', 'info', 'debug'],
  isLogLevel: (v: string) => ['error', 'warn', 'info', 'debug'].includes(v),
}));

// Mock auth middleware to always allow
vi.mock('../middleware/auth', () => ({
  requireLogin: (_req: express.Request, _res: express.Response, next: express.NextFunction) => next(),
  requireAdmin: (_req: express.Request, _res: express.Response, next: express.NextFunction) => next(),
}));

function createApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/admin/log-center', adminLogCenterRouter);
  return app;
}

describe('admin-log-center route', () => {
  let app: express.Express;

  beforeEach(() => {
    app = createApp();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('GET /', () => {
    it('returns paginated logs with default options', async () => {
      const mockResult = {
        entries: [
          { id: 1, source: 'activity_logs' as const, level: 'error' as const, category: 'auth', errorCode: null, message: 'test', detail: null, pharmacyId: null, timestamp: '2026-01-01T00:00:00Z' },
        ],
        page: 1,
        limit: 50,
        total: 1,
      };
      vi.mocked(logCenterService.queryLogs).mockResolvedValue(mockResult);

      const res = await request(app).get('/api/admin/log-center');

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual(mockResult.entries);
      expect(res.body.pagination.total).toBe(1);
    });

    it('filters by source', async () => {
      vi.mocked(logCenterService.queryLogs).mockResolvedValue({ entries: [], page: 1, limit: 50, total: 0 });

      await request(app).get('/api/admin/log-center?source=app,system');

      expect(logCenterService.queryLogs).toHaveBeenCalledWith(
        expect.objectContaining({ sources: ['app', 'system'] })
      );
    });

    it('filters by level', async () => {
      vi.mocked(logCenterService.queryLogs).mockResolvedValue({ entries: [], page: 1, limit: 50, total: 0 });

      await request(app).get('/api/admin/log-center?level=error');

      expect(logCenterService.queryLogs).toHaveBeenCalledWith(
        expect.objectContaining({ level: 'error' })
      );
    });

    it('filters by search term', async () => {
      vi.mocked(logCenterService.queryLogs).mockResolvedValue({ entries: [], page: 1, limit: 50, total: 0 });

      await request(app).get('/api/admin/log-center?search=test');

      expect(logCenterService.queryLogs).toHaveBeenCalledWith(
        expect.objectContaining({ search: 'test' })
      );
    });

    it('filters by pharmacyId', async () => {
      vi.mocked(logCenterService.queryLogs).mockResolvedValue({ entries: [], page: 1, limit: 50, total: 0 });

      await request(app).get('/api/admin/log-center?pharmacyId=123');

      expect(logCenterService.queryLogs).toHaveBeenCalledWith(
        expect.objectContaining({ pharmacyId: 123 })
      );
    });

    it('filters by date range', async () => {
      vi.mocked(logCenterService.queryLogs).mockResolvedValue({ entries: [], page: 1, limit: 50, total: 0 });

      await request(app).get('/api/admin/log-center?from=2026-01-01T00:00:00Z&to=2026-01-31T23:59:59Z');

      expect(logCenterService.queryLogs).toHaveBeenCalledWith(
        expect.objectContaining({
          from: '2026-01-01T00:00:00.000Z',
          to: '2026-01-31T23:59:59.000Z',
        })
      );
    });

    it('returns 400 for invalid level', async () => {
      const res = await request(app).get('/api/admin/log-center?level=invalid');

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('level パラメータは');
    });

    it('returns 400 for invalid from date', async () => {
      const res = await request(app).get('/api/admin/log-center?from=invalid-date');

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('from パラメータが不正な日時形式です');
    });

    it('returns 400 for invalid to date', async () => {
      const res = await request(app).get('/api/admin/log-center?to=invalid-date');

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('to パラメータが不正な日時形式です');
    });

    it('returns 400 when from > to', async () => {
      const res = await request(app).get('/api/admin/log-center?from=2026-12-31T00:00:00Z&to=2026-01-01T00:00:00Z');

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('from は to 以前の日時を指定してください');
    });

    it('returns 400 when date span exceeds 90 days', async () => {
      const res = await request(app).get('/api/admin/log-center?from=2025-01-01T00:00:00Z&to=2025-05-01T00:00:00Z');

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('指定できる期間は最大90日です');
    });

    it('returns 500 on service error', async () => {
      vi.mocked(logCenterService.queryLogs).mockRejectedValue(new Error('DB error'));

      const res = await request(app).get('/api/admin/log-center');

      expect(res.status).toBe(500);
      expect(res.body.error).toBe('ログ一覧の取得に失敗しました');
    });

    it('ignores invalid sources', async () => {
      vi.mocked(logCenterService.queryLogs).mockResolvedValue({ entries: [], page: 1, limit: 50, total: 0 });

      await request(app).get('/api/admin/log-center?source=invalid,unknown');

      // sources should not be set since all are invalid
      expect(logCenterService.queryLogs).toHaveBeenCalledWith(
        expect.not.objectContaining({ sources: expect.anything() })
      );
    });

    it('deduplicates sources', async () => {
      vi.mocked(logCenterService.queryLogs).mockResolvedValue({ entries: [], page: 1, limit: 50, total: 0 });

      await request(app).get('/api/admin/log-center?source=app,app,system');

      expect(logCenterService.queryLogs).toHaveBeenCalledWith(
        expect.objectContaining({ sources: ['app', 'system'] })
      );
    });
  });

  describe('GET /summary', () => {
    it('returns log summary', async () => {
      const mockSummary = { total: 100, errors: 10, warnings: 20, today: 5, bySeverity: { error: 10, warning: 20, info: 50, critical: 5 }, bySource: { activity_logs: 40, system_events: 60 } };
      vi.mocked(logCenterService.getLogSummary).mockResolvedValue(mockSummary as any);

      const res = await request(app).get('/api/admin/log-center/summary');

      expect(res.status).toBe(200);
      expect(res.body).toEqual(mockSummary);
    });

    it('returns 500 on service error', async () => {
      vi.mocked(logCenterService.getLogSummary).mockRejectedValue(new Error('DB error'));

      const res = await request(app).get('/api/admin/log-center/summary');

      expect(res.status).toBe(500);
      expect(res.body.error).toBe('ログサマリーの取得に失敗しました');
    });
  });
});
