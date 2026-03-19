import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  createCheckoutSession: vi.fn(),
  isStripeConfigured: vi.fn(),
}));

vi.mock('../middleware/auth', () => ({
  requireLogin: (req: { user?: { id: number; email: string; isAdmin: boolean } }, _res: unknown, next: () => void) => {
    req.user = { id: 1, email: 'test@example.com', isAdmin: false };
    next();
  },
}));

vi.mock('../services/stripe-service', () => ({
  createCheckoutSession: mocks.createCheckoutSession,
  isStripeConfigured: mocks.isStripeConfigured,
}));

vi.mock('../services/logger', () => ({
  logger: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

import checkoutRouter from '../routes/api.subscriptions.checkout';

function createApp() {
  const app = express();
  app.use(express.json());
  app.use('/api', checkoutRouter);
  return app;
}

describe('subscriptions-checkout', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.isStripeConfigured.mockReturnValue(true);
  });

  describe('POST /api/subscriptions/checkout', () => {
    it('creates checkout session for light plan', async () => {
      const app = createApp();

      mocks.createCheckoutSession.mockResolvedValue({
        checkoutUrl: 'https://checkout.stripe.com/test',
        sessionId: 'cs_test_123',
      });

      const res = await request(app)
        .post('/api/subscriptions/checkout')
        .send({ plan: 'light' });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        checkout_url: 'https://checkout.stripe.com/test',
        session_id: 'cs_test_123',
      });
      expect(mocks.createCheckoutSession).toHaveBeenCalledWith({
        pharmacyId: 1,
        plan: 'light',
        successUrl: undefined,
        cancelUrl: undefined,
      });
    });

    it('creates checkout session for standard plan', async () => {
      const app = createApp();

      mocks.createCheckoutSession.mockResolvedValue({
        checkoutUrl: 'https://checkout.stripe.com/test',
        sessionId: 'cs_test_456',
      });

      const res = await request(app)
        .post('/api/subscriptions/checkout')
        .send({ plan: 'standard' });

      expect(res.status).toBe(200);
      expect(res.body.session_id).toBe('cs_test_456');
    });

    it('creates checkout session for enterprise plan', async () => {
      const app = createApp();

      mocks.createCheckoutSession.mockResolvedValue({
        checkoutUrl: 'https://checkout.stripe.com/test',
        sessionId: 'cs_test_789',
      });

      const res = await request(app)
        .post('/api/subscriptions/checkout')
        .send({ plan: 'enterprise' });

      expect(res.status).toBe(200);
    });

    it('rejects invalid plan', async () => {
      const app = createApp();

      const res = await request(app)
        .post('/api/subscriptions/checkout')
        .send({ plan: 'invalid_plan' });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Invalid plan');
    });

    it('rejects missing plan', async () => {
      const app = createApp();

      const res = await request(app)
        .post('/api/subscriptions/checkout')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Invalid plan');
    });

    it('returns 503 when Stripe is not configured', async () => {
      const app = createApp();
      mocks.isStripeConfigured.mockReturnValue(false);

      const res = await request(app)
        .post('/api/subscriptions/checkout')
        .send({ plan: 'light' });

      expect(res.status).toBe(503);
      expect(res.body.error).toContain('not configured');
    });

    it('handles Stripe errors gracefully', async () => {
      const app = createApp();

      mocks.createCheckoutSession.mockRejectedValue(new Error('Stripe API error'));

      const res = await request(app)
        .post('/api/subscriptions/checkout')
        .send({ plan: 'light' });

      expect(res.status).toBe(500);
    });

    it('passes custom URLs to checkout session', async () => {
      const app = createApp();

      mocks.createCheckoutSession.mockResolvedValue({
        checkoutUrl: 'https://checkout.stripe.com/test',
        sessionId: 'cs_test_custom',
      });

      const res = await request(app)
        .post('/api/subscriptions/checkout')
        .send({
          plan: 'standard',
          success_url: 'https://example.com/success',
          cancel_url: 'https://example.com/cancel',
        });

      expect(res.status).toBe(200);
      expect(mocks.createCheckoutSession).toHaveBeenCalledWith({
        pharmacyId: 1,
        plan: 'standard',
        successUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel',
        trialDays: undefined,
      });
    });

    // トライアル機能のテスト
    describe('trial_days parameter', () => {
      it('accepts custom trial_days value', async () => {
        const app = createApp();

        mocks.createCheckoutSession.mockResolvedValue({
          checkoutUrl: 'https://checkout.stripe.com/test',
          sessionId: 'cs_test_trial',
        });

        const res = await request(app)
          .post('/api/subscriptions/checkout')
          .send({
            plan: 'light',
            trial_days: 14,
          });

        expect(res.status).toBe(200);
        expect(mocks.createCheckoutSession).toHaveBeenCalledWith({
          pharmacyId: 1,
          plan: 'light',
          successUrl: undefined,
          cancelUrl: undefined,
          trialDays: 14,
        });
      });

      it('accepts trial_days = 0 (no trial)', async () => {
        const app = createApp();

        mocks.createCheckoutSession.mockResolvedValue({
          checkoutUrl: 'https://checkout.stripe.com/test',
          sessionId: 'cs_test_no_trial',
        });

        const res = await request(app)
          .post('/api/subscriptions/checkout')
          .send({
            plan: 'standard',
            trial_days: 0,
          });

        expect(res.status).toBe(200);
        expect(mocks.createCheckoutSession).toHaveBeenCalledWith({
          pharmacyId: 1,
          plan: 'standard',
          successUrl: undefined,
          cancelUrl: undefined,
          trialDays: 0,
        });
      });

      it('rejects negative trial_days', async () => {
        const app = createApp();

        const res = await request(app)
          .post('/api/subscriptions/checkout')
          .send({
            plan: 'light',
            trial_days: -1,
          });

        expect(res.status).toBe(400);
        expect(res.body.error).toContain('trial_days');
      });

      it('rejects trial_days > 365', async () => {
        const app = createApp();

        const res = await request(app)
          .post('/api/subscriptions/checkout')
          .send({
            plan: 'light',
            trial_days: 366,
          });

        expect(res.status).toBe(400);
        expect(res.body.error).toContain('trial_days');
      });

      it('rejects non-numeric trial_days', async () => {
        const app = createApp();

        const res = await request(app)
          .post('/api/subscriptions/checkout')
          .send({
            plan: 'light',
            trial_days: 'seven',
          });

        expect(res.status).toBe(400);
        expect(res.body.error).toContain('trial_days');
      });
    });
  });
});
