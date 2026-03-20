import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  select: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
  buildOpenClawLogContext: vi.fn(),
  handoffToOpenClaw: vi.fn(),
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
    insert: mocks.insert,
    update: mocks.update,
  },
}));

vi.mock('../middleware/auth', () => ({
  requireLogin: (_req: unknown, _res: unknown, next: () => void) => next(),
}));

vi.mock('../services/openclaw-log-context-service', () => ({
  buildOpenClawLogContext: mocks.buildOpenClawLogContext,
}));

vi.mock('../services/openclaw-service', () => ({
  handoffToOpenClaw: mocks.handoffToOpenClaw,
}));

vi.mock('../services/logger', () => ({ logger: mocks.logger }));

import requestsRouter from '../routes/requests';

function createSelectResult(rows: unknown[]) {
  return {
    from: vi.fn(() => ({
      where: vi.fn(() => ({
        orderBy: vi.fn(() => ({
          limit: vi.fn().mockResolvedValue(rows),
        })),
      })),
    })),
  };
}

function createInsertReturning(rows: unknown[]) {
  return {
    values: vi.fn(() => ({
      returning: vi.fn().mockResolvedValue(rows),
    })),
  };
}

function createUpdateResult() {
  return {
    set: vi.fn(() => ({
      where: vi.fn().mockResolvedValue(undefined),
    })),
  };
}

function createApp(user: { id: number } | null = { id: 10 }) {
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    if (user) {
      (req as express.Request & { user?: { id: number } }).user = user;
    }
    next();
  });
  app.use('/api/requests', requestsRouter);
  return app;
}

describe('requests route coverage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.buildOpenClawLogContext.mockResolvedValue([{ type: 'log' }]);
    mocks.handoffToOpenClaw.mockResolvedValue({
      accepted: true,
      connectorConfigured: true,
      implementationBranch: 'feature/x',
      status: 'in_dialogue',
      threadId: 'thread-1',
      summary: 'accepted',
      note: 'next step',
    });
    mocks.update.mockReturnValue(createUpdateResult());
  });

  it('GET /me returns 401 when req.user.id is missing', async () => {
    const app = createApp(null);
    const res = await request(app).get('/api/requests/me');

    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: 'ログインが必要です' });
  });

  it('GET /me returns rows with capped pagination limit', async () => {
    mocks.select.mockReturnValue(createSelectResult([
      { id: 1, requestText: 'A', openclawStatus: 'done' },
    ]));

    const app = createApp();
    const res = await request(app).get('/api/requests/me?limit=999');

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.pagination.limit).toBe(100);
  });

  it('GET /me returns 500 on db error', async () => {
    mocks.select.mockReturnValue({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          orderBy: vi.fn(() => ({
            limit: vi.fn().mockRejectedValue(new Error('db fail')),
          })),
        })),
      })),
    });

    const app = createApp();
    const res = await request(app).get('/api/requests/me');

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: '要望一覧の取得に失敗しました' });
  });

  it('POST / creates request, collects context, and updates handoff status when accepted', async () => {
    mocks.insert.mockReturnValue(createInsertReturning([
      { id: 55, openclawStatus: 'pending_handoff', createdAt: '2026-03-01T00:00:00.000Z' },
    ]));

    const app = createApp({ id: 9 });
    const res = await request(app).post('/api/requests').send({ message: '  実装を相談したい  ' });

    expect(res.status).toBe(201);
    expect(res.body.request.id).toBe(55);
    expect(res.body.request.openclawStatus).toBe('in_dialogue');
    expect(mocks.buildOpenClawLogContext).toHaveBeenCalledWith(9);
    expect(mocks.handoffToOpenClaw).toHaveBeenCalledWith({
      requestId: 55,
      pharmacyId: 9,
      requestText: '実装を相談したい',
      context: { operationLogs: [{ type: 'log' }] },
    });
    expect(mocks.update).toHaveBeenCalled();
  });

  it('POST / continues when context collection fails and skips update when handoff not accepted', async () => {
    mocks.insert.mockReturnValue(createInsertReturning([
      { id: 77, openclawStatus: 'pending_handoff', createdAt: '2026-03-01T00:00:00.000Z' },
    ]));
    mocks.buildOpenClawLogContext.mockRejectedValue(new Error('context failed'));
    mocks.handoffToOpenClaw.mockResolvedValue({
      accepted: false,
      connectorConfigured: false,
      implementationBranch: null,
      status: 'pending_handoff',
      threadId: null,
      summary: null,
      note: 'manual follow-up',
    });

    const app = createApp({ id: 12 });
    const res = await request(app).post('/api/requests').send({ message: '確認お願いします' });

    expect(res.status).toBe(201);
    expect(res.body.request.openclawStatus).toBe('pending_handoff');
    expect(mocks.logger.warn).toHaveBeenCalled();
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it('POST / returns 500 when insert fails', async () => {
    mocks.insert.mockReturnValue({
      values: vi.fn(() => ({
        returning: vi.fn().mockRejectedValue(new Error('insert failed')),
      })),
    });

    const app = createApp();
    const res = await request(app).post('/api/requests').send({ message: 'hello' });

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: '要望の送信に失敗しました' });
  });
});
