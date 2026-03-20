import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  selectDistinct: vi.fn(),
  select: vi.fn(),
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock('../config/database', () => ({
  db: {
    selectDistinct: mocks.selectDistinct,
    select: mocks.select,
  },
}));

vi.mock('../middleware/auth', () => ({
  requireLogin: (_req: unknown, _res: unknown, next: () => void) => next(),
}));

vi.mock('../services/logger', () => ({ logger: mocks.logger }));

import searchRouter from '../routes/search';

function createQueryBuilder(result: unknown, method: 'limit' | 'groupBy' = 'limit') {
  const terminal = vi.fn().mockResolvedValue(result);
  const whereObj = method === 'groupBy' ? { groupBy: terminal } : { limit: terminal };
  return {
    from: vi.fn(() => ({
      where: vi.fn(() => whereObj),
    })),
  };
}

function createApp() {
  const app = express();
  app.use('/api/search', searchRouter);
  return app;
}

describe('search routes coverage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('GET /drugs returns empty array when query is blank after sanitization', async () => {
    const app = createApp();
    const res = await request(app).get('/api/search/drugs?q=%20%20%20');

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
    expect(mocks.selectDistinct).not.toHaveBeenCalled();
  });

  it('GET /drugs returns drug suggestions', async () => {
    mocks.selectDistinct.mockReturnValue(createQueryBuilder([
      { drugName: 'アスピリン' },
      { drugName: 'ロキソニン' },
    ]));

    const app = createApp();
    const res = await request(app).get('/api/search/drugs?q=%00アスピリン%20');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(['アスピリン', 'ロキソニン']);
  });

  it('GET /drug-master supports code search and returns rows', async () => {
    mocks.select.mockReturnValue(createQueryBuilder([
      { yjCode: '12345', drugName: 'アスピリン', yakkaPrice: 10, unit: '錠', specification: '100mg' },
    ]));

    const app = createApp();
    const res = await request(app).get('/api/search/drug-master?q=YJ123');

    expect(res.status).toBe(200);
    expect(res.body).toEqual([
      { yjCode: '12345', drugName: 'アスピリン', yakkaPrice: 10, unit: '錠', specification: '100mg' },
    ]);
  });

  it('GET /drug-master returns 500 on db error', async () => {
    mocks.select.mockReturnValue({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          limit: vi.fn().mockRejectedValue(new Error('db error')),
        })),
      })),
    });

    const app = createApp();
    const res = await request(app).get('/api/search/drug-master?q=abc');

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: '検索に失敗しました' });
    expect(mocks.logger.error).toHaveBeenCalledWith('Drug master search error', { error: 'db error' });
  });

  it('GET /pharmacies returns pharmacy suggestions', async () => {
    mocks.selectDistinct.mockReturnValue(createQueryBuilder([
      { name: 'テスト薬局A' },
      { name: 'テスト薬局B' },
    ]));

    const app = createApp();
    const res = await request(app).get('/api/search/pharmacies?q=テスト');

    expect(res.status).toBe(200);
    expect(res.body).toEqual(['テスト薬局A', 'テスト薬局B']);
  });

  it('GET /pharmacies returns 500 on db error', async () => {
    mocks.selectDistinct.mockReturnValue({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          limit: vi.fn().mockRejectedValue(new Error('select failed')),
        })),
      })),
    });

    const app = createApp();
    const res = await request(app).get('/api/search/pharmacies?q=ABC');

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: '検索に失敗しました' });
  });
});
