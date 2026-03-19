import { Router, Response } from 'express';
import { requireLogin } from '../middleware/auth';
import { AuthRequest } from '../types';
import { createCheckoutSession, isStripeConfigured, PlanType } from '../services/stripe-service';
import { logger } from '../services/logger';
import { handleRouteError } from '../middleware/error-handler';

const router = Router();

/**
 * Checkout Session作成API
 * POST /api/subscriptions/checkout
 * 
 * Request body:
 * {
 *   "plan": "light" | "standard" | "enterprise",
 *   "success_url"?: string,
 *   "cancel_url"?: string,
 *   "trial_days"?: number  // トライアル期間（日数）。省略時はデフォルト7日
 * }
 * 
 * Response:
 * {
 *   "checkout_url": string,
 *   "session_id": string
 * }
 */
router.post('/subscriptions/checkout', requireLogin, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!isStripeConfigured()) {
      logger.warn('Checkout session requested but Stripe is not configured');
      res.status(503).json({ error: 'Stripe integration not configured' });
      return;
    }

    const { plan, success_url, cancel_url, trial_days } = req.body;

    // Validate plan
    const validPlans: PlanType[] = ['light', 'standard', 'enterprise'];
    if (!plan || !validPlans.includes(plan)) {
      res.status(400).json({ 
        error: 'Invalid plan. Must be one of: light, standard, enterprise' 
      });
      return;
    }

    // Validate trial_days if provided
    if (trial_days !== undefined) {
      if (typeof trial_days !== 'number' || trial_days < 0 || trial_days > 365) {
        res.status(400).json({ 
          error: 'trial_days must be a number between 0 and 365' 
        });
        return;
      }
    }

    const pharmacyId = req.user?.id;
    if (!pharmacyId) {
      res.status(401).json({ error: 'User ID not found in session' });
      return;
    }

    const result = await createCheckoutSession({
      pharmacyId,
      plan,
      successUrl: success_url,
      cancelUrl: cancel_url,
      trialDays: trial_days,
    });

    logger.info('Checkout session created', {
      pharmacyId,
      plan,
      sessionId: result.sessionId,
      trialDays: trial_days,
    });

    res.json({
      checkout_url: result.checkoutUrl,
      session_id: result.sessionId,
    });
  } catch (error) {
    handleRouteError(error, 'Failed to create checkout session', 'Failed to create checkout session', res);
  }
});

export default router;
