import { beforeEach, describe, expect, it, vi, afterEach } from 'vitest';

// Stripe モック - class構文を使用
const mockCheckoutSessionsCreate = vi.fn();

class MockStripe {
  constructor(public secretKey: string) {}
  checkout = {
    sessions: {
      create: mockCheckoutSessionsCreate,
    },
  };
}

vi.mock('stripe', () => ({
  default: MockStripe,
}));

// 環境変数のバックアップ
const originalEnv = { ...process.env };

describe('stripe-service', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    // 環境変数をリセット
    process.env = { ...originalEnv };
    // テスト用環境変数を設定
    process.env.STRIPE_SECRET_KEY_TEST = 'sk_test_123';
    process.env.STRIPE_WEBHOOK_SECRET_TEST = 'whsec_test_123';
    process.env.STRIPE_PRICE_ID_LIGHT = 'price_light_test';
    process.env.STRIPE_PRICE_ID_STANDARD = 'price_standard_test';
    process.env.STRIPE_PRICE_ID_ENTERPRISE = 'price_enterprise_test';
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('isStripeConfigured', () => {
    it('returns true when STRIPE_SECRET_KEY_TEST is set', async () => {
      const { isStripeConfigured } = await import('../services/stripe-service');
      expect(isStripeConfigured()).toBe(true);
    });

    it('returns false when no Stripe key is set', async () => {
      delete process.env.STRIPE_SECRET_KEY_TEST;
      delete process.env.STRIPE_SECRET_KEY_LIVE;

      const { isStripeConfigured } = await import('../services/stripe-service');
      expect(isStripeConfigured()).toBe(false);
    });

    it('uses live key in production environment', async () => {
      process.env.VERCEL_ENV = 'production';
      delete process.env.STRIPE_SECRET_KEY_TEST;
      process.env.STRIPE_SECRET_KEY_LIVE = 'sk_live_123';

      const { isStripeConfigured } = await import('../services/stripe-service');
      expect(isStripeConfigured()).toBe(true);

      delete process.env.VERCEL_ENV;
    });
  });

  describe('getStripe', () => {
    it('creates Stripe instance with test key in development', async () => {
      const { getStripe } = await import('../services/stripe-service');
      const stripe = getStripe();

      expect(stripe).toBeDefined();
      expect(stripe).toBeInstanceOf(MockStripe);
      expect((stripe as unknown as MockStripe).secretKey).toBe('sk_test_123');
    });

    it('throws error when secret key is missing', async () => {
      delete process.env.STRIPE_SECRET_KEY_TEST;

      // モジュールキャッシュをクリアして再インポート
      vi.resetModules();

      const { getStripe } = await import('../services/stripe-service');

      expect(() => getStripe()).toThrow('Missing Stripe secret key');
    });

    it('throws error when webhook secret is missing', async () => {
      delete process.env.STRIPE_WEBHOOK_SECRET_TEST;

      vi.resetModules();

      const { getStripe } = await import('../services/stripe-service');

      expect(() => getStripe()).toThrow('Missing Stripe webhook secret');
    });
  });

  describe('getStripeWebhookSecret', () => {
    it('returns webhook secret from config', async () => {
      const { getStripeWebhookSecret } = await import('../services/stripe-service');
      expect(getStripeWebhookSecret()).toBe('whsec_test_123');
    });
  });

  describe('createCheckoutSession', () => {
    it('creates checkout session with default trial days', async () => {
      mockCheckoutSessionsCreate.mockResolvedValue({
        id: 'cs_test_123',
        url: 'https://checkout.stripe.com/test',
      });

      const { createCheckoutSession } = await import('../services/stripe-service');

      const result = await createCheckoutSession({
        pharmacyId: 1,
        plan: 'light',
      });

      expect(result.checkoutUrl).toBe('https://checkout.stripe.com/test');
      expect(result.sessionId).toBe('cs_test_123');

      // trial_period_days がデフォルト7日であることを確認
      expect(mockCheckoutSessionsCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          subscription_data: expect.objectContaining({
            trial_period_days: 7,
          }),
        })
      );
    });

    it('creates checkout session with custom trial days', async () => {
      mockCheckoutSessionsCreate.mockResolvedValue({
        id: 'cs_test_456',
        url: 'https://checkout.stripe.com/custom',
      });

      const { createCheckoutSession } = await import('../services/stripe-service');

      await createCheckoutSession({
        pharmacyId: 1,
        plan: 'standard',
        trialDays: 14,
      });

      expect(mockCheckoutSessionsCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          subscription_data: expect.objectContaining({
            trial_period_days: 14,
          }),
        })
      );
    });

    it('uses TRIAL_DAYS environment variable when trialDays not specified', async () => {
      process.env.TRIAL_DAYS = '30';

      vi.resetModules();

      mockCheckoutSessionsCreate.mockResolvedValue({
        id: 'cs_test_789',
        url: 'https://checkout.stripe.com/test',
      });

      const { createCheckoutSession } = await import('../services/stripe-service');

      await createCheckoutSession({
        pharmacyId: 1,
        plan: 'light',
      });

      expect(mockCheckoutSessionsCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          subscription_data: expect.objectContaining({
            trial_period_days: 30,
          }),
        })
      );
    });

    it('uses custom success and cancel URLs', async () => {
      mockCheckoutSessionsCreate.mockResolvedValue({
        id: 'cs_test_custom',
        url: 'https://checkout.stripe.com/custom',
      });

      const { createCheckoutSession } = await import('../services/stripe-service');

      await createCheckoutSession({
        pharmacyId: 1,
        plan: 'enterprise',
        successUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel',
      });

      expect(mockCheckoutSessionsCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          success_url: 'https://example.com/success',
          cancel_url: 'https://example.com/cancel',
        })
      );
    });

    it('includes pharmacy_id and plan in metadata', async () => {
      mockCheckoutSessionsCreate.mockResolvedValue({
        id: 'cs_test_meta',
        url: 'https://checkout.stripe.com/test',
      });

      const { createCheckoutSession } = await import('../services/stripe-service');

      await createCheckoutSession({
        pharmacyId: 42,
        plan: 'standard',
      });

      expect(mockCheckoutSessionsCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            pharmacy_id: '42',
            plan: 'standard',
          }),
          subscription_data: expect.objectContaining({
            metadata: expect.objectContaining({
              pharmacy_id: '42',
              plan: 'standard',
            }),
          }),
        })
      );
    });

    it('throws error when Stripe is not configured', async () => {
      delete process.env.STRIPE_SECRET_KEY_TEST;

      vi.resetModules();

      const { createCheckoutSession } = await import('../services/stripe-service');

      await expect(
        createCheckoutSession({
          pharmacyId: 1,
          plan: 'light',
        })
      ).rejects.toThrow('Stripe is not configured');
    });

    it('throws error for invalid plan', async () => {
      const { createCheckoutSession } = await import('../services/stripe-service');

      // TypeScriptの型チェックを回避してテスト
      await expect(
        createCheckoutSession({
          pharmacyId: 1,
          plan: 'invalid' as 'light',
        })
      ).rejects.toThrow('Stripe price ID not configured');
    });

    it('throws error when price ID is not configured for plan', async () => {
      delete process.env.STRIPE_PRICE_ID_LIGHT;

      vi.resetModules();

      const { createCheckoutSession } = await import('../services/stripe-service');

      await expect(
        createCheckoutSession({
          pharmacyId: 1,
          plan: 'light',
        })
      ).rejects.toThrow('Stripe price ID not configured');
    });
  });

  describe('production environment', () => {
    it('uses live keys when VERCEL_ENV is production', async () => {
      process.env.VERCEL_ENV = 'production';
      process.env.STRIPE_SECRET_KEY_LIVE = 'sk_live_123';
      process.env.STRIPE_WEBHOOK_SECRET_LIVE = 'whsec_live_123';
      process.env.STRIPE_PRICE_ID_LIGHT_LIVE = 'price_light_live';

      vi.resetModules();

      mockCheckoutSessionsCreate.mockResolvedValue({
        id: 'cs_live_123',
        url: 'https://checkout.stripe.com/live',
      });

      const { createCheckoutSession, getStripe } = await import('../services/stripe-service');

      // getStripe でライブキーが使われることを確認
      const stripe = getStripe();
      expect((stripe as unknown as MockStripe).secretKey).toBe('sk_live_123');

      // createCheckoutSession もライブ価格を使う
      await createCheckoutSession({
        pharmacyId: 1,
        plan: 'light',
      });

      expect(mockCheckoutSessionsCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          line_items: expect.arrayContaining([
            expect.objectContaining({
              price: 'price_light_live',
            }),
          ]),
        })
      );

      delete process.env.VERCEL_ENV;
    });
  });
});
