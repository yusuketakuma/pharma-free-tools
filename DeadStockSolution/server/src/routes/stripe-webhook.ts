import { Router, Request, Response } from 'express';
import express from 'express';
import Stripe from 'stripe';
import { getStripe, getStripeWebhookSecret, isStripeConfigured } from '../services/stripe-service';
import { db } from '../config/database';
import { pharmacySubscriptions, subscriptionEvents, subscriptionInvoices } from '../db/schema';
import { eq } from 'drizzle-orm';
import { logger } from '../services/logger';
import { handleRouteError } from '../middleware/error-handler';

// Stripe Invoice with subscription field (not in all API versions)
interface StripeInvoiceWithSubscription extends Stripe.Invoice {
  subscription?: string | Stripe.Subscription | null;
}

// Stripe Subscription with period fields (not in all API versions)
interface StripeSubscriptionWithPeriods extends Stripe.Subscription {
  current_period_start?: number;
  current_period_end?: number;
}

const router = Router();

/**
 * Stripe Webhook エンドポイント
 * POST /api/webhooks/stripe
 * 
 * Handles Stripe events for subscription management:
 * - checkout.session.completed: トライアル/購入完了
 * - customer.subscription.created: サブスクリプション作成
 * - customer.subscription.updated: サブスクリプション更新
 * - customer.subscription.deleted: サブスクリプション削除（解約）
 * - invoice.paid: 請求書支払い完了
 * - invoice.payment_failed: 請求書支払い失敗
 */
router.post('/webhooks/stripe', express.raw({ type: 'application/json' }), async (req: Request, res: Response): Promise<void> => {
  if (!isStripeConfigured()) {
    logger.warn('Stripe webhook received but Stripe is not configured');
    res.status(503).json({ error: 'Stripe integration not configured' });
    return;
  }

  const sig = req.headers['stripe-signature'] as string;
  if (!sig) {
    logger.warn('Stripe webhook received without signature');
    res.status(400).json({ error: 'Missing stripe-signature header' });
    return;
  }

  let event: Stripe.Event;
  try {
    const stripe = getStripe();
    const webhookSecret = getStripeWebhookSecret();
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    logger.error('Stripe webhook signature verification failed', { error: errorMessage });
    res.status(400).json({ error: `Webhook Error: ${errorMessage}` });
    return;
  }

  logger.info('Stripe webhook received', { 
    eventId: event.id, 
    eventType: event.type,
    livemode: event.livemode 
  });

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutSessionCompleted(session);
        break;
      }

      case 'customer.subscription.created': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionCreated(subscription);
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }

      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaid(invoice);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentFailed(invoice);
        break;
      }

      default:
        logger.debug('Unhandled Stripe event type', { eventType: event.type });
    }

    // Record event for audit trail
    await recordStripeEvent(event);

    res.json({ received: true });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    logger.error('Error processing Stripe webhook', { 
      eventId: event.id, 
      eventType: event.type,
      error: errorMessage 
    });
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Maps Stripe subscription status to local subscription status
 */
function mapStripeStatusToLocal(stripeStatus: Stripe.Subscription.Status): 'trialing' | 'active' | 'past_due' | 'canceled' | 'incomplete' {
  const statusMap: Record<string, 'trialing' | 'active' | 'past_due' | 'canceled' | 'incomplete'> = {
    'trialing': 'trialing',
    'active': 'active',
    'past_due': 'past_due',
    'canceled': 'canceled',
    'unpaid': 'past_due',
    'incomplete': 'incomplete',
    'incomplete_expired': 'canceled',
  };
  return statusMap[stripeStatus] ?? 'incomplete';
}

async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session): Promise<void> {
  const customerId = session.customer as string;
  const subscriptionId = session.subscription as string;
  const pharmacyId = session.metadata?.pharmacy_id;
  const plan = session.metadata?.plan as string | undefined;

  if (!pharmacyId) {
    logger.warn('Checkout session completed without pharmacy_id metadata', { 
      sessionId: session.id,
      customerId 
    });
    return;
  }

  logger.info('Checkout session completed', {
    sessionId: session.id,
    customerId,
    subscriptionId,
    pharmacyId,
    plan
  });

  // Get plan ID from plan name
  const [planRecord] = await db
    .select({ id: pharmacySubscriptions.id })
    .from(pharmacySubscriptions)
    .where(eq(pharmacySubscriptions.pharmacyId, parseInt(pharmacyId, 10)))
    .limit(1);

  // Determine plan ID from plan name
  const planNameMap: Record<string, number> = {
    'light': 1,
    'standard': 2,
    'enterprise': 3,
  };
  const planId = plan ? planNameMap[plan] ?? 1 : 1;

  if (planRecord) {
    // Update existing subscription
    await db
      .update(pharmacySubscriptions)
      .set({
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscriptionId,
        status: 'active',
        planId,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(pharmacySubscriptions.id, planRecord.id));
    
    logger.info('Updated existing pharmacy_subscription', { 
      subscriptionId: planRecord.id,
      stripeSubscriptionId: subscriptionId 
    });
  } else {
    // Create new subscription
    const [newSub] = await db
      .insert(pharmacySubscriptions)
      .values({
        pharmacyId: parseInt(pharmacyId, 10),
        planId,
        status: 'active',
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscriptionId,
        currentPeriodStartsAt: new Date().toISOString(),
      })
      .returning({ id: pharmacySubscriptions.id });
    
    logger.info('Created new pharmacy_subscription', { 
      subscriptionId: newSub?.id,
      pharmacyId,
      stripeSubscriptionId: subscriptionId 
    });
  }
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription): Promise<void> {
  const subWithPeriods = subscription as StripeSubscriptionWithPeriods;
  logger.info('Stripe subscription created', {
    subscriptionId: subscription.id,
    customerId: subscription.customer,
    status: subscription.status
  });

  const stripeSubscriptionId = subscription.id;
  const stripeCustomerId = typeof subscription.customer === 'string' 
    ? subscription.customer 
    : subscription.customer?.id;

  // Find subscription by customer ID and update
  const result = await db
    .update(pharmacySubscriptions)
    .set({
      stripeSubscriptionId,
      status: mapStripeStatusToLocal(subscription.status),
      currentPeriodStartsAt: subWithPeriods.current_period_start 
        ? new Date(subWithPeriods.current_period_start * 1000).toISOString() 
        : undefined,
      currentPeriodEndsAt: subWithPeriods.current_period_end 
        ? new Date(subWithPeriods.current_period_end * 1000).toISOString() 
        : undefined,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(pharmacySubscriptions.stripeCustomerId, stripeCustomerId ?? ''))
    .returning({ id: pharmacySubscriptions.id });

  if (result.length > 0) {
    logger.info('Updated pharmacy_subscription on subscription created', { 
      subscriptionId: result[0]?.id,
      stripeSubscriptionId 
    });
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription): Promise<void> {
  const subWithPeriods = subscription as StripeSubscriptionWithPeriods;
  logger.info('Stripe subscription updated', {
    subscriptionId: subscription.id,
    customerId: subscription.customer,
    status: subscription.status
  });

  const stripeSubscriptionId = subscription.id;

  const result = await db
    .update(pharmacySubscriptions)
    .set({
      status: mapStripeStatusToLocal(subscription.status),
      currentPeriodStartsAt: subWithPeriods.current_period_start 
        ? new Date(subWithPeriods.current_period_start * 1000).toISOString() 
        : undefined,
      currentPeriodEndsAt: subWithPeriods.current_period_end 
        ? new Date(subWithPeriods.current_period_end * 1000).toISOString() 
        : undefined,
      cancelAtPeriodEnd: subWithPeriods.cancel_at_period_end ?? false,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(pharmacySubscriptions.stripeSubscriptionId, stripeSubscriptionId))
    .returning({ id: pharmacySubscriptions.id });

  if (result.length > 0) {
    logger.info('Updated pharmacy_subscription on subscription updated', { 
      subscriptionId: result[0]?.id,
      stripeSubscriptionId,
      status: subscription.status 
    });
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
  logger.info('Stripe subscription deleted (canceled)', {
    subscriptionId: subscription.id,
    customerId: subscription.customer
  });

  const stripeSubscriptionId = subscription.id;

  const result = await db
    .update(pharmacySubscriptions)
    .set({
      status: 'canceled',
      canceledAt: new Date().toISOString(),
      cancelAtPeriodEnd: false,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(pharmacySubscriptions.stripeSubscriptionId, stripeSubscriptionId))
    .returning({ id: pharmacySubscriptions.id });

  if (result.length > 0) {
    logger.info('Marked pharmacy_subscription as canceled', { 
      subscriptionId: result[0]?.id,
      stripeSubscriptionId 
    });
  }
}

async function handleInvoicePaid(invoice: StripeInvoiceWithSubscription): Promise<void> {
  const subscriptionId = typeof invoice.subscription === 'string' 
    ? invoice.subscription 
    : invoice.subscription?.id;
  const invoiceId = invoice.id;
  const amountYen = invoice.amount_paid ? Math.round(invoice.amount_paid / 100) : 0;
    
  logger.info('Stripe invoice paid', {
    invoiceId: invoice.id,
    customerId: invoice.customer,
    subscriptionId,
    amountYen
  });

  if (!subscriptionId) {
    logger.debug('Invoice paid without subscription ID, skipping invoice record', { invoiceId });
    return;
  }

  // Find subscription by Stripe subscription ID
  const [sub] = await db
    .select({ id: pharmacySubscriptions.id })
    .from(pharmacySubscriptions)
    .where(eq(pharmacySubscriptions.stripeSubscriptionId, subscriptionId))
    .limit(1);

  if (!sub) {
    logger.debug('No matching pharmacy_subscription for invoice', { 
      invoiceId, 
      stripeSubscriptionId: subscriptionId 
    });
    return;
  }

  // Check if invoice already exists
  const [existingInvoice] = await db
    .select({ id: subscriptionInvoices.id })
    .from(subscriptionInvoices)
    .where(eq(subscriptionInvoices.stripeInvoiceId, invoiceId))
    .limit(1);

  if (existingInvoice) {
    // Update existing invoice
    await db
      .update(subscriptionInvoices)
      .set({
        status: 'paid',
        paidAt: new Date().toISOString(),
      })
      .where(eq(subscriptionInvoices.id, existingInvoice.id));
    
    logger.info('Updated subscription_invoice as paid', { invoiceId });
  } else {
    // Create new invoice record
    await db.insert(subscriptionInvoices).values({
      subscriptionId: sub.id,
      stripeInvoiceId: invoiceId,
      amountYen,
      currency: invoice.currency ?? 'jpy',
      status: 'paid',
      invoicePdfUrl: invoice.invoice_pdf ?? undefined,
      hostedInvoiceUrl: invoice.hosted_invoice_url ?? undefined,
      paidAt: new Date().toISOString(),
    });
    
    logger.info('Created subscription_invoice record', { invoiceId, subscriptionId: sub.id });
  }

  // Update subscription status to active if it was past_due
  await db
    .update(pharmacySubscriptions)
    .set({
      status: 'active',
      updatedAt: new Date().toISOString(),
    })
    .where(eq(pharmacySubscriptions.id, sub.id));
}

async function handleInvoicePaymentFailed(invoice: StripeInvoiceWithSubscription): Promise<void> {
  const subscriptionId = typeof invoice.subscription === 'string' 
    ? invoice.subscription 
    : invoice.subscription?.id;
  const invoiceId = invoice.id;
  const amountYen = invoice.amount_due ? Math.round(invoice.amount_due / 100) : 0;
    
  logger.warn('Stripe invoice payment failed', {
    invoiceId: invoice.id,
    customerId: invoice.customer,
    subscriptionId,
    attemptCount: invoice.attempt_count
  });

  if (!subscriptionId) {
    logger.debug('Invoice payment failed without subscription ID', { invoiceId });
    return;
  }

  // Find subscription by Stripe subscription ID
  const [sub] = await db
    .select({ id: pharmacySubscriptions.id })
    .from(pharmacySubscriptions)
    .where(eq(pharmacySubscriptions.stripeSubscriptionId, subscriptionId))
    .limit(1);

  if (!sub) {
    logger.debug('No matching pharmacy_subscription for failed invoice', { 
      invoiceId, 
      stripeSubscriptionId: subscriptionId 
    });
    return;
  }

  // Update subscription status to past_due
  await db
    .update(pharmacySubscriptions)
    .set({
      status: 'past_due',
      updatedAt: new Date().toISOString(),
    })
    .where(eq(pharmacySubscriptions.id, sub.id));

  logger.info('Marked pharmacy_subscription as past_due', { 
    subscriptionId: sub.id,
    invoiceId 
  });

  // Check if invoice already exists
  const [existingInvoice] = await db
    .select({ id: subscriptionInvoices.id })
    .from(subscriptionInvoices)
    .where(eq(subscriptionInvoices.stripeInvoiceId, invoiceId))
    .limit(1);

  if (existingInvoice) {
    // Update existing invoice
    await db
      .update(subscriptionInvoices)
      .set({
        status: 'payment_failed',
      })
      .where(eq(subscriptionInvoices.id, existingInvoice.id));
  } else {
    // Create new invoice record with failed status
    await db.insert(subscriptionInvoices).values({
      subscriptionId: sub.id,
      stripeInvoiceId: invoiceId,
      amountYen,
      currency: invoice.currency ?? 'jpy',
      status: 'payment_failed',
      dueAt: invoice.due_date ? new Date(invoice.due_date * 1000).toISOString() : undefined,
    });
  }
}

async function recordStripeEvent(event: Stripe.Event): Promise<void> {
  // Find related subscription by Stripe subscription ID if available
  const subscriptionObject = event.data.object as { subscription?: string | Stripe.Subscription; id?: string };
  const stripeSubscriptionId = typeof subscriptionObject.subscription === 'string'
    ? subscriptionObject.subscription
    : subscriptionObject.subscription?.id || subscriptionObject.id;
  
  if (!stripeSubscriptionId || typeof stripeSubscriptionId !== 'string') {
    logger.debug('Stripe event without subscription ID, skipping event record', { 
      eventId: event.id, 
      eventType: event.type 
    });
    return;
  }

  const [sub] = await db
    .select({ id: pharmacySubscriptions.id })
    .from(pharmacySubscriptions)
    .where(eq(pharmacySubscriptions.stripeSubscriptionId, stripeSubscriptionId))
    .limit(1);
  
  if (!sub) {
    logger.debug('No matching pharmacy_subscription found for Stripe event', { 
      eventId: event.id, 
      eventType: event.type,
      stripeSubscriptionId 
    });
    return;
  }

  // Insert event record
  await db.insert(subscriptionEvents).values({
    subscriptionId: sub.id,
    eventType: event.type,
    stripeEventId: event.id,
    payloadJson: JSON.stringify(event.data.object),
  });
}

export default router;
