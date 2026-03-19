import { Router, Response } from 'express';
import { requireLogin } from '../middleware/auth';
import { AuthRequest } from '../types';
import {
  isStripeConfigured,
  PlanType,
  getSubscriptionStatus,
  updateSubscriptionPlan,
  cancelSubscription,
  listInvoices,
  reactivateSubscription,
} from '../services/stripe-service';
import { db } from '../config/database';
import { pharmacySubscriptions } from '../db/schema';
import { eq } from 'drizzle-orm';
import { logger } from '../services/logger';
import { handleRouteError } from '../middleware/error-handler';

const router = Router();

/**
 * 現在のサブスクリプション状態を取得
 * GET /api/subscriptions
 *
 * Response:
 * {
 *   "subscription": {
 *     "id": number,
 *     "plan": "light" | "standard" | "enterprise",
 *     "status": "trialing" | "active" | "past_due" | "canceled" | "incomplete",
 *     "stripeCustomerId": string | null,
 *     "stripeSubscriptionId": string | null,
 *     "trialEndsAt": string | null,
 *     "currentPeriodEndsAt": string | null,
 *     "cancelAtPeriodEnd": boolean,
 *     "canceledAt": string | null
 *   } | null
 * }
 */
router.get('/subscriptions', requireLogin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const pharmacyId = req.user?.id;
    if (!pharmacyId) {
      res.status(401).json({ error: 'User ID not found in session' });
      return;
    }

    // DBからサブスクリプション情報を取得
    const [subscription] = await db
      .select()
      .from(pharmacySubscriptions)
      .where(eq(pharmacySubscriptions.pharmacyId, pharmacyId))
      .limit(1);

    if (!subscription) {
      res.json({ subscription: null });
      return;
    }

    // Stripe設定がある場合、最新状態を取得
    let stripeStatus = null;
    if (subscription.stripeSubscriptionId && isStripeConfigured()) {
      try {
        stripeStatus = await getSubscriptionStatus(subscription.stripeSubscriptionId);
      } catch (err) {
        logger.warn('Failed to fetch Stripe subscription status', {
          subscriptionId: subscription.stripeSubscriptionId,
          error: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    }

    res.json({
      subscription: {
        id: subscription.id,
        planId: subscription.planId,
        status: subscription.status,
        stripeCustomerId: subscription.stripeCustomerId,
        stripeSubscriptionId: subscription.stripeSubscriptionId,
        trialStartsAt: subscription.trialStartsAt,
        trialEndsAt: subscription.trialEndsAt,
        currentPeriodStartsAt: subscription.currentPeriodStartsAt,
        currentPeriodEndsAt: subscription.currentPeriodEndsAt,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
        canceledAt: subscription.canceledAt,
        // Stripeからの最新情報
        stripeStatus,
      },
    });
  } catch (error) {
    handleRouteError(error, 'Failed to fetch subscription', 'Failed to fetch subscription', res);
  }
});

/**
 * プラン変更
 * POST /api/subscriptions/change-plan
 *
 * Request body:
 * {
 *   "plan": "light" | "standard" | "enterprise"
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "subscription": { ... }
 * }
 */
router.post('/subscriptions/change-plan', requireLogin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!isStripeConfigured()) {
      res.status(503).json({ error: 'Stripe integration not configured' });
      return;
    }

    const { plan } = req.body;
    const pharmacyId = req.user?.id;

    if (!pharmacyId) {
      res.status(401).json({ error: 'User ID not found in session' });
      return;
    }

    // Validate plan
    const validPlans: PlanType[] = ['light', 'standard', 'enterprise'];
    if (!plan || !validPlans.includes(plan)) {
      res.status(400).json({
        error: 'Invalid plan. Must be one of: light, standard, enterprise',
      });
      return;
    }

    // DBから現在のサブスクリプションを取得
    const [subscription] = await db
      .select()
      .from(pharmacySubscriptions)
      .where(eq(pharmacySubscriptions.pharmacyId, pharmacyId))
      .limit(1);

    if (!subscription) {
      res.status(404).json({ error: 'No subscription found for this pharmacy' });
      return;
    }

    if (!subscription.stripeSubscriptionId) {
      res.status(400).json({ error: 'No active Stripe subscription. Please complete checkout first.' });
      return;
    }

    // Stripeでプラン変更
    const result = await updateSubscriptionPlan({
      subscriptionId: subscription.stripeSubscriptionId,
      newPlan: plan,
      prorate: true,
    });

    logger.info('Subscription plan changed', {
      pharmacyId,
      subscriptionId: subscription.stripeSubscriptionId,
      newPlan: plan,
      status: result.status,
    });

    res.json({
      success: true,
      subscription: {
        id: subscription.id,
        newPlan: plan,
        status: result.status,
        effectiveAt: result.effectiveAt,
      },
    });
  } catch (error) {
    handleRouteError(error, 'Failed to change plan', 'Failed to change plan', res);
  }
});

/**
 * サブスクリプション解約
 * POST /api/subscriptions/cancel
 *
 * Request body:
 * {
 *   "immediately"?: boolean  // true: 即時解約, false: 期間末解約（デフォルト）
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "subscription": { ... }
 * }
 */
router.post('/subscriptions/cancel', requireLogin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!isStripeConfigured()) {
      res.status(503).json({ error: 'Stripe integration not configured' });
      return;
    }

    const { immediately = false } = req.body;
    const pharmacyId = req.user?.id;

    if (!pharmacyId) {
      res.status(401).json({ error: 'User ID not found in session' });
      return;
    }

    // DBから現在のサブスクリプションを取得
    const [subscription] = await db
      .select()
      .from(pharmacySubscriptions)
      .where(eq(pharmacySubscriptions.pharmacyId, pharmacyId))
      .limit(1);

    if (!subscription) {
      res.status(404).json({ error: 'No subscription found for this pharmacy' });
      return;
    }

    if (!subscription.stripeSubscriptionId) {
      res.status(400).json({ error: 'No active Stripe subscription' });
      return;
    }

    // Stripeで解約処理
    const result = await cancelSubscription({
      subscriptionId: subscription.stripeSubscriptionId,
      immediately,
    });

    logger.info('Subscription canceled', {
      pharmacyId,
      subscriptionId: subscription.stripeSubscriptionId,
      immediately,
      status: result.status,
      cancelAtPeriodEnd: result.cancelAtPeriodEnd,
    });

    res.json({
      success: true,
      subscription: {
        id: subscription.id,
        status: result.status,
        canceledAt: result.canceledAt,
        cancelAtPeriodEnd: result.cancelAtPeriodEnd,
      },
    });
  } catch (error) {
    handleRouteError(error, 'Failed to cancel subscription', 'Failed to cancel subscription', res);
  }
});

/**
 * 解約取り消し（期間末解約予定の場合のみ）
 * POST /api/subscriptions/reactivate
 *
 * Response:
 * {
 *   "success": true,
 *   "subscription": { ... }
 * }
 */
router.post('/subscriptions/reactivate', requireLogin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!isStripeConfigured()) {
      res.status(503).json({ error: 'Stripe integration not configured' });
      return;
    }

    const pharmacyId = req.user?.id;

    if (!pharmacyId) {
      res.status(401).json({ error: 'User ID not found in session' });
      return;
    }

    // DBから現在のサブスクリプションを取得
    const [subscription] = await db
      .select()
      .from(pharmacySubscriptions)
      .where(eq(pharmacySubscriptions.pharmacyId, pharmacyId))
      .limit(1);

    if (!subscription) {
      res.status(404).json({ error: 'No subscription found for this pharmacy' });
      return;
    }

    if (!subscription.stripeSubscriptionId) {
      res.status(400).json({ error: 'No active Stripe subscription' });
      return;
    }

    if (!subscription.cancelAtPeriodEnd) {
      res.status(400).json({ error: 'Subscription is not scheduled for cancellation' });
      return;
    }

    // Stripeで解約取り消し
    const result = await reactivateSubscription(subscription.stripeSubscriptionId);

    logger.info('Subscription reactivated', {
      pharmacyId,
      subscriptionId: subscription.stripeSubscriptionId,
      status: result.status,
    });

    res.json({
      success: true,
      subscription: {
        id: subscription.id,
        status: result.status,
        cancelAtPeriodEnd: false,
      },
    });
  } catch (error) {
    handleRouteError(error, 'Failed to reactivate subscription', 'Failed to reactivate subscription', res);
  }
});

/**
 * 請求履歴取得
 * GET /api/subscriptions/invoices
 *
 * Query params:
 * - limit: number (default 10, max 100)
 *
 * Response:
 * {
 *   "invoices": [ ... ],
 *   "hasMore": boolean
 * }
 */
router.get('/subscriptions/invoices', requireLogin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!isStripeConfigured()) {
      res.status(503).json({ error: 'Stripe integration not configured' });
      return;
    }

    const pharmacyId = req.user?.id;
    if (!pharmacyId) {
      res.status(401).json({ error: 'User ID not found in session' });
      return;
    }

    const limit = Math.min(Math.max(1, parseInt(req.query.limit as string) || 10), 100);

    // DBから現在のサブスクリプションを取得
    const [subscription] = await db
      .select()
      .from(pharmacySubscriptions)
      .where(eq(pharmacySubscriptions.pharmacyId, pharmacyId))
      .limit(1);

    if (!subscription || !subscription.stripeCustomerId) {
      res.json({ invoices: [], hasMore: false });
      return;
    }

    // Stripeから請求履歴を取得
    const result = await listInvoices(subscription.stripeCustomerId, limit);

    res.json(result);
  } catch (error) {
    handleRouteError(error, 'Failed to fetch invoices', 'Failed to fetch invoices', res);
  }
});

export default router;
