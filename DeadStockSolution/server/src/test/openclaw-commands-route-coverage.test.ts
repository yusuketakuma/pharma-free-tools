import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  isOpenClawWebhookConfigured: vi.fn(),
  verifyOpenClawWebhookSignature: vi.fn(),
  isOpenClawWebhookReplay: vi.fn(),
  consumeOpenClawWebhookReplay: vi.fn(),
  releaseOpenClawWebhookReplay: vi.fn(),
  executeCommand: vi.fn(),
  listCommandHistory: vi.fn(),
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock('../middleware/auth', () => ({
  requireLogin: (req: express.Request & { user?: { id: number; isAdmin: boolean } }, _res: unknown, next: () => void) => {
    req.user = { id: 1, isAdmin: true };
    next();
  },
  requireAdmin: (_req: unknown, _res: unknown, next: () => void) => next(),
}));

vi.mock('../services/openclaw-service', () => ({
  isOpenClawWebhookConfigured: mocks.isOpenClawWebhookConfigured,
  verifyOpenClawWebhookSignature: mocks.verifyOpenClawWebhookSignature,
  isOpenClawWebhookReplay: mocks.isOpenClawWebhookReplay,
  consumeOpenClawWebhookReplay: mocks.consumeOpenClawWebhookReplay,
  releaseOpenClawWebhookReplay: mocks.releaseOpenClawWebhookReplay,
}));

vi.mock('../services/openclaw-command-service', () => ({
  executeCommand: mocks.executeCommand,
  listCommandHistory: mocks.listCommandHistory,
}));

vi.mock('../services/logger', () => ({ logger: mocks.logger }));

import openclawCommandsRouter from '../routes/openclaw-commands';

const originalFlag = process.env.OPENCLAW_COMMANDS_ENABLED;

function createApp() {
  const app = express();
  app.use(express.json({ verify: (req, _res, buf) => { (req as express.Request & { rawBody?: string }).rawBody = buf.toString('utf8'); } }));
  app.use('/api/openclaw/commands', openclawCommandsRouter);
  return app;
}

describe('openclaw commands route coverage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.OPENCLAW_COMMANDS_ENABLED = 'true';
    mocks.isOpenClawWebhookConfigured.mockReturnValue(true);
    mocks.verifyOpenClawWebhookSignature.mockReturnValue(true);
    mocks.isOpenClawWebhookReplay.mockReturnValue(false);
    mocks.consumeOpenClawWebhookReplay.mockReturnValue(true);
    mocks.executeCommand.mockResolvedValue({ status: 'completed', command: 'system.status' });
    mocks.listCommandHistory.mockResolvedValue([{ id: 1 }]);
  });

  it('returns 503 when commands are disabled', async () => {
    process.env.OPENCLAW_COMMANDS_ENABLED = 'false';
    const app = createApp();
    const res = await request(app).post('/api/openclaw/commands').send({ command: 'system.status' });

    expect(res.status).toBe(503);
    expect(res.body).toEqual({ error: 'コマンド受信が無効です' });
  });

  it('returns 503 when webhook is not configured', async () => {
    mocks.isOpenClawWebhookConfigured.mockReturnValue(false);
    const app = createApp();
    const res = await request(app).post('/api/openclaw/commands').send({ command: 'system.status' });

    expect(res.status).toBe(503);
    expect(res.body).toEqual({ error: 'OpenClaw webhook が未設定です' });
  });

  it('returns 401 when signature verification fails', async () => {
    mocks.verifyOpenClawWebhookSignature.mockReturnValue(false);
    const app = createApp();
    const res = await request(app)
      .post('/api/openclaw/commands')
      .set('x-openclaw-signature', 'sig')
      .set('x-openclaw-timestamp', 'ts')
      .send({ command: 'system.status' });

    expect(res.status).toBe(401);
  });

  it('returns 401 on replay detection', async () => {
    mocks.isOpenClawWebhookReplay.mockReturnValue(true);
    const app = createApp();
    const res = await request(app)
      .post('/api/openclaw/commands')
      .set('x-openclaw-signature', 'sig')
      .set('x-openclaw-timestamp', 'ts')
      .send({ command: 'system.status' });

    expect(res.status).toBe(401);
  });

  it('returns 401 when replay token cannot be consumed', async () => {
    mocks.consumeOpenClawWebhookReplay.mockReturnValue(false);
    const app = createApp();
    const res = await request(app)
      .post('/api/openclaw/commands')
      .set('x-openclaw-signature', 'sig')
      .set('x-openclaw-timestamp', 'ts')
      .send({ command: 'system.status' });

    expect(res.status).toBe(401);
  });

  it('releases replay key and returns 400 when command is missing', async () => {
    const app = createApp();
    const res = await request(app)
      .post('/api/openclaw/commands')
      .set('x-openclaw-signature', 'sig')
      .set('x-openclaw-timestamp', 'ts')
      .send({});

    expect(res.status).toBe(400);
    expect(mocks.releaseOpenClawWebhookReplay).toHaveBeenCalled();
  });

  it('maps rejected and failed command results to proper status codes', async () => {
    const app = createApp();

    mocks.executeCommand.mockResolvedValueOnce({ status: 'rejected', reason: 'nope' });
    const rejected = await request(app)
      .post('/api/openclaw/commands')
      .set('x-openclaw-signature', 'sig')
      .set('x-openclaw-timestamp', 'ts')
      .send({ command: 'dangerous' });

    mocks.executeCommand.mockResolvedValueOnce({ status: 'failed', reason: 'boom' });
    const failed = await request(app)
      .post('/api/openclaw/commands')
      .set('x-openclaw-signature', 'sig')
      .set('x-openclaw-timestamp', 'ts')
      .send({ command: 'broken' });

    expect(rejected.status).toBe(403);
    expect(failed.status).toBe(500);
  });

  it('releases replay key and returns 500 when executeCommand throws', async () => {
    mocks.executeCommand.mockRejectedValue(new Error('execute failed'));
    const app = createApp();
    const res = await request(app)
      .post('/api/openclaw/commands')
      .set('x-openclaw-signature', 'sig')
      .set('x-openclaw-timestamp', 'ts')
      .send({ command: 'system.status' });

    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'コマンド処理に失敗しました' });
    expect(mocks.releaseOpenClawWebhookReplay).toHaveBeenCalled();
  });

  it('GET /history returns paginated command history', async () => {
    const app = createApp();
    const res = await request(app).get('/api/openclaw/commands/history?page=2&limit=5');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ commands: [{ id: 1 }], limit: 5, offset: 5 });
    expect(mocks.listCommandHistory).toHaveBeenCalledWith(5, 5);
  });
});
