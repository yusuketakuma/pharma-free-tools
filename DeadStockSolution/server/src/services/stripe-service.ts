import Stripe from 'stripe';

function getStripeConfig(): { secretKey: string; webhookSecret: string } {
  const isProduction = process.env.VERCEL_ENV === 'production' || process.env.NODE_ENV === 'production';
  
  const secretKey = isProduction
    ? process.env.STRIPE_SECRET_KEY_LIVE
    : process.env.STRIPE_SECRET_KEY_TEST;
  
  const webhookSecret = isProduction
    ? process.env.STRIPE_WEBHOOK_SECRET_LIVE
    : process.env.STRIPE_WEBHOOK_SECRET_TEST;

  if (!secretKey) {
    throw new Error(
      `Missing Stripe secret key for ${isProduction ? 'production' : 'test'} environment. ` +
      `Set ${isProduction ? 'STRIPE_SECRET_KEY_LIVE' : 'STRIPE_SECRET_KEY_TEST'} environment variable.`
    );
  }

  if (!webhookSecret) {
    throw new Error(
      `Missing Stripe webhook secret for ${isProduction ? 'production' : 'test'} environment. ` +
      `Set ${isProduction ? 'STRIPE_WEBHOOK_SECRET_LIVE' : 'STRIPE_WEBHOOK_SECRET_TEST'} environment variable.`
    );
  }

  return { secretKey, webhookSecret };
}

let stripeInstance: Stripe | null = null;
let webhookSecretValue: string | null = null;

export function getStripe(): Stripe {
  if (!stripeInstance) {
    const { secretKey, webhookSecret } = getStripeConfig();
    stripeInstance = new Stripe(secretKey, {
      apiVersion: '2026-02-25.clover',
    });
    webhookSecretValue = webhookSecret;
  }
  return stripeInstance;
}

export function getStripeWebhookSecret(): string {
  if (!webhookSecretValue) {
    const { webhookSecret } = getStripeConfig();
    webhookSecretValue = webhookSecret;
  }
  return webhookSecretValue;
}

export function isStripeConfigured(): boolean {
  const isProduction = process.env.VERCEL_ENV === 'production' || process.env.NODE_ENV === 'production';
  const secretKey = isProduction
    ? process.env.STRIPE_SECRET_KEY_LIVE
    : process.env.STRIPE_SECRET_KEY_TEST;
  return !!secretKey;
}

export type PlanType = 'light' | 'standard' | 'enterprise';

export interface CheckoutSessionOptions {
  pharmacyId: number;
  plan: PlanType;
  successUrl?: string;
  cancelUrl?: string;
  /** トライアル期間（日数）。省略時は環境変数 TRIAL_DAYS またはデフォルト7日 */
  trialDays?: number;
}

export interface CheckoutSessionResult {
  checkoutUrl: string;
  sessionId: string;
}

function getPriceIdForPlan(plan: PlanType): string {
  const isProduction = process.env.VERCEL_ENV === 'production' || process.env.NODE_ENV === 'production';
  
  const priceIds: Record<PlanType, string | undefined> = {
    light: isProduction ? process.env.STRIPE_PRICE_ID_LIGHT_LIVE : process.env.STRIPE_PRICE_ID_LIGHT,
    standard: isProduction ? process.env.STRIPE_PRICE_ID_STANDARD_LIVE : process.env.STRIPE_PRICE_ID_STANDARD,
    enterprise: isProduction ? process.env.STRIPE_PRICE_ID_ENTERPRISE_LIVE : process.env.STRIPE_PRICE_ID_ENTERPRISE,
  };

  const priceId = priceIds[plan];
  if (!priceId) {
    throw new Error(`Stripe price ID not configured for plan: ${plan} (${isProduction ? 'production' : 'test'})`);
  }

  return priceId;
}

/**
 * デフォルトのトライアル期間（日数）
 * 環境変数 TRIAL_DAYS で上書き可能
 */
const DEFAULT_TRIAL_DAYS = 7;

export async function createCheckoutSession(options: CheckoutSessionOptions): Promise<CheckoutSessionResult> {
  const { pharmacyId, plan, successUrl, cancelUrl, trialDays } = options;
  
  if (!isStripeConfigured()) {
    throw new Error('Stripe is not configured');
  }

  const stripe = getStripe();
  const priceId = getPriceIdForPlan(plan);

  const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
  const finalSuccessUrl = successUrl || `${baseUrl}/subscription/success?session_id={CHECKOUT_SESSION_ID}`;
  const finalCancelUrl = cancelUrl || `${baseUrl}/subscription/cancel`;

  // トライアル期間の決定: 引数 > 環境変数 > デフォルト7日
  const effectiveTrialDays = trialDays ?? 
    (process.env.TRIAL_DAYS ? parseInt(process.env.TRIAL_DAYS, 10) : DEFAULT_TRIAL_DAYS);

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: finalSuccessUrl,
    cancel_url: finalCancelUrl,
    subscription_data: {
      trial_period_days: effectiveTrialDays,
      metadata: {
        pharmacy_id: String(pharmacyId),
        plan,
      },
    },
    metadata: {
      pharmacy_id: String(pharmacyId),
      plan,
      trial_days: String(effectiveTrialDays),
    },
  });

  return {
    checkoutUrl: session.url || '',
    sessionId: session.id,
  };
}

// ============================================================
// Phase 3: Subscription Management Functions
// ============================================================

export interface SubscriptionStatusResult {
  id: string;
  status: Stripe.Subscription.Status;
  plan: PlanType | null;
  currentPeriodStart: number | null;
  currentPeriodEnd: number | null;
  cancelAtPeriodEnd: boolean;
  canceledAt: number | null;
  trialStart: number | null;
  trialEnd: number | null;
}

/**
 * Stripeサブスクリプション状態を取得
 */
export async function getSubscriptionStatus(subscriptionId: string): Promise<SubscriptionStatusResult> {
  if (!isStripeConfigured()) {
    throw new Error('Stripe is not configured');
  }

  const stripe = getStripe();
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);

  // 現在のプランを取得（最初のアイテムから）
  const priceId = subscription.items.data[0]?.price?.id;
  let plan: PlanType | null = null;
  if (priceId) {
    plan = getPlanFromPriceId(priceId);
  }

  return {
    id: subscription.id,
    status: subscription.status,
    plan,
    currentPeriodStart: (subscription as any).current_period_start ?? null,
    currentPeriodEnd: (subscription as any).current_period_end ?? null,
    cancelAtPeriodEnd: subscription.cancel_at_period_end ?? false,
    canceledAt: subscription.canceled_at ?? null,
    trialStart: subscription.trial_start ?? null,
    trialEnd: subscription.trial_end ?? null,
  };
}

/**
 * Price IDからプランタイプを逆引き
 */
function getPlanFromPriceId(priceId: string): PlanType | null {
  const isProduction = process.env.VERCEL_ENV === 'production' || process.env.NODE_ENV === 'production';

  // 環境に応じたPrice IDを取得
  const lightPriceId = isProduction ? process.env.STRIPE_PRICE_ID_LIGHT_LIVE : process.env.STRIPE_PRICE_ID_LIGHT;
  const standardPriceId = isProduction ? process.env.STRIPE_PRICE_ID_STANDARD_LIVE : process.env.STRIPE_PRICE_ID_STANDARD;
  const enterprisePriceId = isProduction ? process.env.STRIPE_PRICE_ID_ENTERPRISE_LIVE : process.env.STRIPE_PRICE_ID_ENTERPRISE;

  // マッピング（undefinedを除外）
  if (lightPriceId && priceId === lightPriceId) return 'light';
  if (standardPriceId && priceId === standardPriceId) return 'standard';
  if (enterprisePriceId && priceId === enterprisePriceId) return 'enterprise';

  return null;
}

export interface UpdatePlanOptions {
  subscriptionId: string;
  newPlan: PlanType;
  prorate?: boolean; // 日割り計算するか（デフォルトtrue）
}

export interface UpdatePlanResult {
  subscriptionId: string;
  newPlan: PlanType;
  status: Stripe.Subscription.Status;
  effectiveAt: number | null;
}

/**
 * サブスクリプションのプランを変更
 */
export async function updateSubscriptionPlan(options: UpdatePlanOptions): Promise<UpdatePlanResult> {
  const { subscriptionId, newPlan, prorate = true } = options;

  if (!isStripeConfigured()) {
    throw new Error('Stripe is not configured');
  }

  const stripe = getStripe();
  const newPriceId = getPriceIdForPlan(newPlan);

  // 現在のサブスクリプションを取得してアイテムIDを特定
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const itemId = subscription.items.data[0]?.id;

  if (!itemId) {
    throw new Error('No subscription item found');
  }

  // プランを更新
  const updated = await stripe.subscriptions.update(subscriptionId, {
    items: [
      {
        id: itemId,
        price: newPriceId,
      },
    ],
    proration_behavior: prorate ? 'create_prorations' : 'none',
    metadata: {
      ...subscription.metadata,
      plan: newPlan,
      updated_at: new Date().toISOString(),
    },
  });

  return {
    subscriptionId: updated.id,
    newPlan,
    status: updated.status,
    effectiveAt: (updated as any).current_period_start ?? null,
  };
}

export interface CancelSubscriptionOptions {
  subscriptionId: string;
  immediately?: boolean; // 即時解約か、期間末解約か（デフォルトfalse = 期間末）
}

export interface CancelSubscriptionResult {
  subscriptionId: string;
  status: Stripe.Subscription.Status;
  canceledAt: number | null;
  cancelAtPeriodEnd: boolean;
}

/**
 * サブスクリプションを解約
 */
export async function cancelSubscription(options: CancelSubscriptionOptions): Promise<CancelSubscriptionResult> {
  const { subscriptionId, immediately = false } = options;

  if (!isStripeConfigured()) {
    throw new Error('Stripe is not configured');
  }

  const stripe = getStripe();

  let subscription: Stripe.Subscription;

  if (immediately) {
    // 即時解約
    subscription = await stripe.subscriptions.cancel(subscriptionId);
  } else {
    // 期間末での解約をスケジュール
    subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });
  }

  return {
    subscriptionId: subscription.id,
    status: subscription.status,
    canceledAt: subscription.canceled_at ?? null,
    cancelAtPeriodEnd: subscription.cancel_at_period_end ?? false,
  };
}

export interface InvoiceItem {
  id: string;
  amount: number;
  currency: string;
  status: string;
  createdAt: number;
  dueAt: number | null;
  paidAt: number | null;
  invoicePdf: string | null;
  hostedUrl: string | null;
}

export interface ListInvoicesResult {
  invoices: InvoiceItem[];
  hasMore: boolean;
}

/**
 * 顧客の請求履歴を取得
 */
export async function listInvoices(customerId: string, limit: number = 10): Promise<ListInvoicesResult> {
  if (!isStripeConfigured()) {
    throw new Error('Stripe is not configured');
  }

  const stripe = getStripe();

  const invoices = await stripe.invoices.list({
    customer: customerId,
    limit,
  });

  return {
    invoices: invoices.data.map((inv) => ({
      id: inv.id,
      amount: inv.amount_paid ?? inv.amount_due ?? 0,
      currency: inv.currency,
      status: inv.status ?? 'unknown',
      createdAt: inv.created,
      dueAt: inv.due_date ?? null,
      paidAt: inv.status_transitions?.paid_at ?? null,
      invoicePdf: inv.invoice_pdf ?? null,
      hostedUrl: inv.hosted_invoice_url ?? null,
    })),
    hasMore: invoices.has_more,
  };
}

/**
 * 解約を取り消し（期間末解約予定の場合のみ）
 */
export async function reactivateSubscription(subscriptionId: string): Promise<SubscriptionStatusResult> {
  if (!isStripeConfigured()) {
    throw new Error('Stripe is not configured');
  }

  const stripe = getStripe();

  const subscription = await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: false,
  });

  return getSubscriptionStatus(subscriptionId);
}
