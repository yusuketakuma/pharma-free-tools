import express from 'express';
import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import adminErrorCodesRouter from '../routes/admin-error-codes';
import * as errorCodeService from '../services/error-code-service';

// Mock the service
vi.mock('../services/error-code-service', () => ({
  listErrorCodes: vi.fn(),
  createErrorCode: vi.fn(),
  updateErrorCode: vi.fn(),
}));

// Mock auth middleware to always allow
vi.mock('../middleware/auth', () => ({
  requireLogin: (_req: express.Request, _res: express.Response, next: express.NextFunction) => next(),
  requireAdmin: (_req: express.Request, _res: express.Response, next: express.NextFunction) => next(),
}));

function createApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/admin/error-codes', adminErrorCodesRouter);
  return app;
}

describe('admin-error-codes route', () => {
  let app: express.Express;

  beforeEach(() => {
    app = createApp();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('GET /', () => {
    it('returns list of error codes with default options', async () => {
      const mockResult = {
        items: [
          { id: 1, code: 'TEST_CODE', category: 'system' as const, severity: 'error' as const, titleJa: 'テスト', descriptionJa: '説明', resolutionJa: null, isActive: true, createdAt: '2026-01-01', updatedAt: '2026-01-01' },
        ],
        total: 1,
      };
      vi.mocked(errorCodeService.listErrorCodes).mockResolvedValue(mockResult);

      const res = await request(app).get('/api/admin/error-codes');

      expect(res.status).toBe(200);
      expect(res.body).toEqual(mockResult);
      expect(errorCodeService.listErrorCodes).toHaveBeenCalledWith({ activeOnly: true });
    });

    it('filters by category', async () => {
      vi.mocked(errorCodeService.listErrorCodes).mockResolvedValue({ items: [], total: 0 });

      await request(app).get('/api/admin/error-codes?category=upload');

      expect(errorCodeService.listErrorCodes).toHaveBeenCalledWith(
        expect.objectContaining({ category: 'upload', activeOnly: true })
      );
    });

    it('filters by severity', async () => {
      vi.mocked(errorCodeService.listErrorCodes).mockResolvedValue({ items: [], total: 0 });

      await request(app).get('/api/admin/error-codes?severity=critical');

      expect(errorCodeService.listErrorCodes).toHaveBeenCalledWith(
        expect.objectContaining({ severity: 'critical', activeOnly: true })
      );
    });

    it('filters by search term', async () => {
      vi.mocked(errorCodeService.listErrorCodes).mockResolvedValue({ items: [], total: 0 });

      await request(app).get('/api/admin/error-codes?search=UPLOAD');

      expect(errorCodeService.listErrorCodes).toHaveBeenCalledWith(
        expect.objectContaining({ search: 'UPLOAD', activeOnly: true })
      );
    });

    it('does not set activeOnly when explicitly set to false', async () => {
      vi.mocked(errorCodeService.listErrorCodes).mockResolvedValue({ items: [], total: 0 });

      await request(app).get('/api/admin/error-codes?activeOnly=false');

      // When activeOnly=false, the property is not set (not activeOnly: false)
      expect(errorCodeService.listErrorCodes).toHaveBeenCalledWith({});
    });

    it('ignores invalid category', async () => {
      vi.mocked(errorCodeService.listErrorCodes).mockResolvedValue({ items: [], total: 0 });

      await request(app).get('/api/admin/error-codes?category=invalid_category');

      expect(errorCodeService.listErrorCodes).toHaveBeenCalledWith({ activeOnly: true });
    });

    it('ignores invalid severity', async () => {
      vi.mocked(errorCodeService.listErrorCodes).mockResolvedValue({ items: [], total: 0 });

      await request(app).get('/api/admin/error-codes?severity=invalid_severity');

      expect(errorCodeService.listErrorCodes).toHaveBeenCalledWith({ activeOnly: true });
    });

    it('returns 500 on service error', async () => {
      vi.mocked(errorCodeService.listErrorCodes).mockRejectedValue(new Error('DB error'));

      const res = await request(app).get('/api/admin/error-codes');

      expect(res.status).toBe(500);
      expect(res.body).toEqual({ error: 'エラーコード一覧の取得に失敗しました' });
    });
  });

  describe('POST /', () => {
    it('creates a new error code', async () => {
      const newCode = { id: 1, code: 'NEW_CODE', category: 'system' as const, severity: 'error' as const, titleJa: '新規', descriptionJa: '説明', resolutionJa: null, isActive: true, createdAt: '2026-01-01', updatedAt: '2026-01-01' };
      vi.mocked(errorCodeService.createErrorCode).mockResolvedValue(newCode);

      const res = await request(app)
        .post('/api/admin/error-codes')
        .send({ code: 'NEW_CODE', category: 'system', severity: 'error', titleJa: '新規', descriptionJa: '説明' });

      expect(res.status).toBe(201);
      expect(res.body).toEqual(newCode);
    });

    it('returns 400 when missing required fields', async () => {
      const res = await request(app)
        .post('/api/admin/error-codes')
        .send({ code: 'NEW_CODE' }); // missing category, severity, titleJa

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ error: '必須項目が不足しています' });
    });

    it('returns 500 when create fails', async () => {
      vi.mocked(errorCodeService.createErrorCode).mockResolvedValue(null);

      const res = await request(app)
        .post('/api/admin/error-codes')
        .send({ code: 'NEW_CODE', category: 'system', severity: 'error', titleJa: '新規' });

      expect(res.status).toBe(500);
      expect(res.body).toEqual({ error: 'エラーコードの作成に失敗しました' });
    });

    it('returns 500 on service exception', async () => {
      vi.mocked(errorCodeService.createErrorCode).mockRejectedValue(new Error('DB error'));

      const res = await request(app)
        .post('/api/admin/error-codes')
        .send({ code: 'NEW_CODE', category: 'system', severity: 'error', titleJa: '新規' });

      expect(res.status).toBe(500);
      expect(res.body).toEqual({ error: 'エラーコードの作成に失敗しました' });
    });
  });

  describe('PUT /:id', () => {
    it('updates an existing error code', async () => {
      const updated = { id: 1, code: 'EXISTING', category: 'system' as const, severity: 'warning' as const, titleJa: '更新済み', descriptionJa: '説明', resolutionJa: null, isActive: true, createdAt: '2026-01-01', updatedAt: '2026-01-02' };
      vi.mocked(errorCodeService.updateErrorCode).mockResolvedValue(updated);

      const res = await request(app)
        .put('/api/admin/error-codes/1')
        .send({ titleJa: '更新済み' });

      expect(res.status).toBe(200);
      expect(res.body).toEqual(updated);
      expect(errorCodeService.updateErrorCode).toHaveBeenCalledWith(1, { titleJa: '更新済み' });
    });

    it('returns 400 for invalid id', async () => {
      const res = await request(app)
        .put('/api/admin/error-codes/invalid')
        .send({ titleJa: '更新' });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ error: '不正なIDです' });
    });

    it('returns 404 when not found', async () => {
      vi.mocked(errorCodeService.updateErrorCode).mockResolvedValue(null);

      const res = await request(app)
        .put('/api/admin/error-codes/999')
        .send({ titleJa: '更新' });

      expect(res.status).toBe(404);
      expect(res.body).toEqual({ error: 'エラーコードが見つかりません' });
    });

    it('returns 500 on service exception', async () => {
      vi.mocked(errorCodeService.updateErrorCode).mockRejectedValue(new Error('DB error'));

      const res = await request(app)
        .put('/api/admin/error-codes/1')
        .send({ titleJa: '更新' });

      expect(res.status).toBe(500);
      expect(res.body).toEqual({ error: 'エラーコードの更新に失敗しました' });
    });
  });
});
