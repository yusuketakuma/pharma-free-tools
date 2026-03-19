import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import subscriptionsRoutes from '../routes/api.subscriptions';
import * as stripeService from '../services/stripe-service';
import { db } from '../config/database';
import { pharmacySubscriptions } from '../db/schema';
import { eq } from 'drizzle-orm';

// Mock stripe-service
vi.mock('../services/stripe-service', () => ({
  isStripeConfigured: vi.fn(() => true),
  getSubscriptionStatus: vi.fn(),
  updateSubscriptionPlan: vi.fn(),
  cancelSubscription: vi.fn(),
  listInvoices: vi.fn(),
  reactivateSubscription: vi.fn(),
}));

// Mock database
vi.mock('../config/database', () => ({
  db: {
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          limit: vi.fn(),
        })),
      })),
    })),
  },
}));

// Mock auth middleware
const mockUser = { id: 1, email: 'test@example.com' };
vi.mock('../middleware/auth', () => ({
  requireLogin: (req: any, res: any, next: any) => {
    req.user = mockUser;
    next();
  },
}));

describe('Subscriptions API', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api', subscriptionsRoutes);
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('GET /api/subscriptions', () => {
    it('should return null when no subscription exists', async () => {
      const mockSelect = vi.fn(() => ({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            limit: vi.fn().mockResolvedValue([]),
          })),
        })),
      }));
      (db.select as any).mockReturnValue(mockSelect());

      const response = await request(app).get('/api/subscriptions');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ subscription: null });
    });

    it('should return subscription when exists', async () => {
      const mockSubscription = {
        id: 1,
        pharmacyId: 1,
        planId: 1,
        status: 'active',
        stripeCustomerId: 'cus_test123',
        stripeSubscriptionId: 'sub_test123',
        trialStartsAt: null,
        trialEndsAt: null,
        currentPeriodStartsAt: '2026-03-01',
        currentPeriodEndsAt: '2026-04-01',
        cancelAtPeriodEnd: false,
        canceledAt: null,
      };

      const mockSelect = vi.fn(() => ({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            limit: vi.fn().mockResolvedValue([mockSubscription]),
          })),
        })),
      }));
      (db.select as any).mockReturnValue(mockSelect());

      (stripeService.getSubscriptionStatus as any).mockResolvedValue({
        id: 'sub_test123',
        status: 'active',
        plan: 'standard',
        currentPeriodStart: 1738368000,
        currentPeriodEnd: 1741046400,
        cancelAtPeriodEnd: false,
        canceledAt: null,
        trialStart: null,
        trialEnd: null,
      });

      const response = await request(app).get('/api/subscriptions');

      expect(response.status).toBe(200);
      expect(response.body.subscription.id).toBe(1);
      expect(response.body.subscription.status).toBe('active');
      expect(response.body.subscription.stripeStatus.plan).toBe('standard');
    });
  });

  describe('POST /api/subscriptions/change-plan', () => {
    it('should reject invalid plan', async () => {
      const response = await request(app)
        .post('/api/subscriptions/change-plan')
        .send({ plan: 'invalid_plan' });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Invalid plan');
    });

    it('should change plan successfully', async () => {
      const mockSubscription = {
        id: 1,
        pharmacyId: 1,
        planId: 1,
        status: 'active',
        stripeCustomerId: 'cus_test123',
        stripeSubscriptionId: 'sub_test123',
        cancelAtPeriodEnd: false,
      };

      const mockSelect = vi.fn(() => ({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            limit: vi.fn().mockResolvedValue([mockSubscription]),
          })),
        })),
      }));
      (db.select as any).mockReturnValue(mockSelect());

      (stripeService.updateSubscriptionPlan as any).mockResolvedValue({
        subscriptionId: 'sub_test123',
        newPlan: 'enterprise',
        status: 'active',
        effectiveAt: 1738368000,
      });

      const response = await request(app)
        .post('/api/subscriptions/change-plan')
        .send({ plan: 'enterprise' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.subscription.newPlan).toBe('enterprise');
      expect(stripeService.updateSubscriptionPlan).toHaveBeenCalledWith({
        subscriptionId: 'sub_test123',
        newPlan: 'enterprise',
        prorate: true,
      });
    });
  });

  describe('POST /api/subscriptions/cancel', () => {
    it('should cancel at period end by default', async () => {
      const mockSubscription = {
        id: 1,
        pharmacyId: 1,
        stripeSubscriptionId: 'sub_test123',
        cancelAtPeriodEnd: false,
      };

      const mockSelect = vi.fn(() => ({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            limit: vi.fn().mockResolvedValue([mockSubscription]),
          })),
        })),
      }));
      (db.select as any).mockReturnValue(mockSelect());

      (stripeService.cancelSubscription as any).mockResolvedValue({
        subscriptionId: 'sub_test123',
        status: 'active',
        canceledAt: null,
        cancelAtPeriodEnd: true,
      });

      const response = await request(app)
        .post('/api/subscriptions/cancel')
        .send({});

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.subscription.cancelAtPeriodEnd).toBe(true);
      expect(stripeService.cancelSubscription).toHaveBeenCalledWith({
        subscriptionId: 'sub_test123',
        immediately: false,
      });
    });

    it('should cancel immediately when specified', async () => {
      const mockSubscription = {
        id: 1,
        pharmacyId: 1,
        stripeSubscriptionId: 'sub_test123',
        cancelAtPeriodEnd: false,
      };

      const mockSelect = vi.fn(() => ({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            limit: vi.fn().mockResolvedValue([mockSubscription]),
          })),
        })),
      }));
      (db.select as any).mockReturnValue(mockSelect());

      (stripeService.cancelSubscription as any).mockResolvedValue({
        subscriptionId: 'sub_test123',
        status: 'canceled',
        canceledAt: 1738368000,
        cancelAtPeriodEnd: false,
      });

      const response = await request(app)
        .post('/api/subscriptions/cancel')
        .send({ immediately: true });

      expect(response.status).toBe(200);
      expect(stripeService.cancelSubscription).toHaveBeenCalledWith({
        subscriptionId: 'sub_test123',
        immediately: true,
      });
    });
  });

  describe('POST /api/subscriptions/reactivate', () => {
    it('should reject if not scheduled for cancellation', async () => {
      const mockSubscription = {
        id: 1,
        pharmacyId: 1,
        stripeSubscriptionId: 'sub_test123',
        cancelAtPeriodEnd: false,
      };

      const mockSelect = vi.fn(() => ({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            limit: vi.fn().mockResolvedValue([mockSubscription]),
          })),
        })),
      }));
      (db.select as any).mockReturnValue(mockSelect());

      const response = await request(app)
        .post('/api/subscriptions/reactivate')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('not scheduled for cancellation');
    });

    it('should reactivate scheduled cancellation', async () => {
      const mockSubscription = {
        id: 1,
        pharmacyId: 1,
        stripeSubscriptionId: 'sub_test123',
        cancelAtPeriodEnd: true,
      };

      const mockSelect = vi.fn(() => ({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            limit: vi.fn().mockResolvedValue([mockSubscription]),
          })),
        })),
      }));
      (db.select as any).mockReturnValue(mockSelect());

      (stripeService.reactivateSubscription as any).mockResolvedValue({
        id: 'sub_test123',
        status: 'active',
        plan: 'standard',
        currentPeriodStart: 1738368000,
        currentPeriodEnd: 1741046400,
        cancelAtPeriodEnd: false,
        canceledAt: null,
        trialStart: null,
        trialEnd: null,
      });

      const response = await request(app)
        .post('/api/subscriptions/reactivate')
        .send({});

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.subscription.cancelAtPeriodEnd).toBe(false);
    });
  });

  describe('GET /api/subscriptions/invoices', () => {
    it('should return empty array when no subscription', async () => {
      const mockSelect = vi.fn(() => ({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            limit: vi.fn().mockResolvedValue([]),
          })),
        })),
      }));
      (db.select as any).mockReturnValue(mockSelect());

      const response = await request(app).get('/api/subscriptions/invoices');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ invoices: [], hasMore: false });
    });

    it('should return invoices when subscription exists', async () => {
      const mockSubscription = {
        id: 1,
        pharmacyId: 1,
        stripeCustomerId: 'cus_test123',
      };

      const mockSelect = vi.fn(() => ({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            limit: vi.fn().mockResolvedValue([mockSubscription]),
          })),
        })),
      }));
      (db.select as any).mockReturnValue(mockSelect());

      (stripeService.listInvoices as any).mockResolvedValue({
        invoices: [
          {
            id: 'inv_123',
            amount: 19800,
            currency: 'jpy',
            status: 'paid',
            createdAt: 1738368000,
            dueAt: null,
            paidAt: 1738368000,
            invoicePdf: 'https://pdf.url',
            hostedUrl: 'https://invoice.url',
          },
        ],
        hasMore: false,
      });

      const response = await request(app).get('/api/subscriptions/invoices');

      expect(response.status).toBe(200);
      expect(response.body.invoices).toHaveLength(1);
      expect(response.body.invoices[0].amount).toBe(19800);
    });
  });
});
