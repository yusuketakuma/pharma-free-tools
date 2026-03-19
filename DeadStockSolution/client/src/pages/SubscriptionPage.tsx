import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AppCard from '../components/ui/AppCard';
import AppAlert from '../components/ui/AppAlert';
import AppButton from '../components/ui/AppButton';
import InlineLoader from '../components/ui/InlineLoader';
import ConfirmActionModal from '../components/ConfirmActionModal';
import { api } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import PageShell, { ScrollArea } from '../components/ui/PageShell';

// プラン定義
const PLANS = {
  light: { name: 'Light', price: 9800, maxDrugs: 2000, maxPharmacies: 2 },
  standard: { name: 'Standard', price: 19800, maxDrugs: 10000, maxPharmacies: 5 },
  enterprise: { name: 'Enterprise', price: 49800, maxDrugs: Infinity, maxPharmacies: Infinity },
} as const;

type PlanId = keyof typeof PLANS;

interface Subscription {
  id: number;
  planId: PlanId;
  status: 'trialing' | 'active' | 'past_due' | 'canceled' | 'incomplete';
  trialStartsAt: string | null;
  trialEndsAt: string | null;
  currentPeriodStartsAt: string | null;
  currentPeriodEndsAt: string | null;
  cancelAtPeriodEnd: boolean;
  canceledAt: string | null;
}

interface Invoice {
  id: string;
  amount: number;
  status: string;
  createdAt: string;
  hostedInvoiceUrl?: string;
}

const STATUS_LABELS: Record<string, { label: string; variant: string }> = {
  trialing: { label: 'トライアル中', variant: 'info' },
  active: { label: '有効', variant: 'success' },
  past_due: { label: '支払い遅延', variant: 'warning' },
  canceled: { label: '解約済み', variant: 'secondary' },
  incomplete: { label: '未完了', variant: 'danger' },
};

/**
 * サブスクリプション管理ページ
 * - 現在のプラン表示
 * - プラン変更
 * - 請求履歴
 * - 解約/再開
 */
export default function SubscriptionPage() {
  const navigate = useNavigate();
  const { refreshUser } = useAuth();

  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [error, setError] = useState<string | null>(null);

  // モーダル状態
  const [showChangePlanModal, setShowChangePlanModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PlanId | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [subRes, invRes] = await Promise.all([
        api.get<{ subscription: Subscription | null }>('/subscriptions'),
        api.get<{ invoices: Invoice[] }>('/subscriptions/invoices'),
      ]);
      setSubscription(subRes.subscription);
      setInvoices(invRes.invoices || []);
    } catch (err) {
      console.error('Failed to fetch subscription data:', err);
      setError('サブスクリプション情報の取得に失敗しました。');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleChangePlan = async () => {
    if (!selectedPlan) return;
    setActionLoading(true);
    try {
      await api.post('/subscriptions/change-plan', { planId: selectedPlan });
      await fetchData();
      await refreshUser();
      setShowChangePlanModal(false);
    } catch (err) {
      console.error('Failed to change plan:', err);
      setError('プラン変更に失敗しました。');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    setActionLoading(true);
    try {
      await api.post('/subscriptions/cancel', { immediately: false });
      await fetchData();
      await refreshUser();
      setShowCancelModal(false);
    } catch (err) {
      console.error('Failed to cancel subscription:', err);
      setError('解約に失敗しました。');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReactivate = async () => {
    setActionLoading(true);
    try {
      await api.post('/subscriptions/reactivate');
      await fetchData();
      await refreshUser();
    } catch (err) {
      console.error('Failed to reactivate subscription:', err);
      setError('再開に失敗しました。');
    } finally {
      setActionLoading(false);
    }
  };

  const formatPrice = (price: number) => `¥${price.toLocaleString()}/月`;
  const formatDate = (date: string | null) =>
    date ? new Date(date).toLocaleDateString('ja-JP') : '-';

  const currentPlan = subscription ? PLANS[subscription.planId] : null;
  const statusInfo = subscription ? STATUS_LABELS[subscription.status] : null;

  if (loading) {
    return (
      <PageShell>
        <ScrollArea>
          <div className="text-center py-5">
            <InlineLoader />
          </div>
        </ScrollArea>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <ScrollArea>
        <div className="container py-4" style={{ maxWidth: 800 }}>
          <div className="mb-4">
            <h2 className="h4 mb-1">サブスクリプション管理</h2>
            <p className="text-muted mb-0">プラン変更・解約・請求履歴を確認できます。</p>
          </div>
          {error && <AppAlert variant="danger">{error}</AppAlert>}

          {/* 現在のプラン */}
          <AppCard className="mb-4">
            <AppCard.Header>
              <h5 className="mb-0">
                <i className="bi bi-credit-card me-2" />
                現在のプラン
              </h5>
            </AppCard.Header>
            <AppCard.Body>
              {!subscription ? (
                <div className="text-center py-4">
                  <p className="text-muted mb-3">サブスクリプションがありません</p>
                  <AppButton variant="primary" onClick={() => navigate('/dashboard')}>
                    ダッシュボードへ
                  </AppButton>
                </div>
              ) : (
                <>
                  <div className="row g-3 mb-4">
                    <div className="col-md-6">
                      <div className="bg-light p-3 rounded">
                        <small className="text-muted">プラン</small>
                        <h4 className="mb-0">{currentPlan?.name}</h4>
                        <p className="text-muted mb-0">{formatPrice(currentPlan?.price || 0)}</p>
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="bg-light p-3 rounded">
                        <small className="text-muted">ステータス</small>
                        <p className="mb-0">
                          <span className={`badge bg-${statusInfo?.variant || 'secondary'}`}>
                            {statusInfo?.label || subscription.status}
                          </span>
                        </p>
                        {subscription.cancelAtPeriodEnd && (
                          <small className="text-danger">
                            {subscription.currentPeriodEndsAt
                              ? `${formatDate(subscription.currentPeriodEndsAt)}に解約予定`
                              : '期間末で解約予定'}
                          </small>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* トライアル情報 */}
                  {subscription.status === 'trialing' && subscription.trialEndsAt && (
                    <AppAlert variant="info" className="mb-4">
                      <i className="bi bi-clock me-2" />
                      トライアル期間: {formatDate(subscription.trialEndsAt)}まで
                    </AppAlert>
                  )}

                  {/* 次回更新日 */}
                  {subscription.currentPeriodEndsAt && subscription.status !== 'canceled' && (
                    <p className="text-muted mb-4">
                      <i className="bi bi-calendar me-1" />
                      次回更新日: {formatDate(subscription.currentPeriodEndsAt)}
                    </p>
                  )}

                  {/* アクションボタン */}
                  <div className="d-flex flex-wrap gap-2">
                    {subscription.status !== 'canceled' && !subscription.cancelAtPeriodEnd && (
                      <>
                        <AppButton
                          variant="outline-primary"
                          onClick={() => setShowChangePlanModal(true)}
                        >
                          <i className="bi bi-arrow-repeat me-1" />
                          プラン変更
                        </AppButton>
                        <AppButton
                          variant="outline-danger"
                          onClick={() => setShowCancelModal(true)}
                        >
                          <i className="bi bi-x-circle me-1" />
                          解約する
                        </AppButton>
                      </>
                    )}
                    {subscription.cancelAtPeriodEnd && (
                      <AppButton variant="success" onClick={handleReactivate} disabled={actionLoading}>
                        <i className="bi bi-arrow-counterclockwise me-1" />
                        解約を取り消し
                      </AppButton>
                    )}
                    {subscription.status === 'canceled' && (
                      <AppButton variant="primary" onClick={() => navigate('/dashboard')}>
                        <i className="bi bi-arrow-repeat me-1" />
                        ダッシュボードへ
                      </AppButton>
                    )}
                  </div>
                </>
              )}
            </AppCard.Body>
          </AppCard>

          {/* プラン比較 */}
          <AppCard className="mb-4">
            <AppCard.Header>
              <h5 className="mb-0">プラン比較</h5>
            </AppCard.Header>
            <AppCard.Body>
              <div className="table-responsive">
                <table className="table table-bordered">
                  <thead className="table-light">
                    <tr>
                      <th>プラン</th>
                      <th>月額</th>
                      <th>最大品目数</th>
                      <th>最大店舗数</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(PLANS).map(([id, plan]) => (
                      <tr
                        key={id}
                        className={subscription?.planId === id ? 'table-primary' : ''}
                      >
                        <td>
                          {plan.name}
                          {subscription?.planId === id && (
                            <span className="badge bg-primary ms-2">現在</span>
                          )}
                        </td>
                        <td>{formatPrice(plan.price)}</td>
                        <td>{plan.maxDrugs === Infinity ? '無制限' : plan.maxDrugs.toLocaleString()}</td>
                        <td>{plan.maxPharmacies === Infinity ? '無制限' : plan.maxPharmacies}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </AppCard.Body>
          </AppCard>

          {/* 請求履歴 */}
          {invoices.length > 0 && (
            <AppCard>
              <AppCard.Header>
                <h5 className="mb-0">請求履歴</h5>
              </AppCard.Header>
              <AppCard.Body>
                <div className="table-responsive">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>日付</th>
                        <th>金額</th>
                        <th>ステータス</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoices.map((inv) => (
                        <tr key={inv.id}>
                          <td>{formatDate(inv.createdAt)}</td>
                          <td>¥{inv.amount.toLocaleString()}</td>
                          <td>
                            <span
                              className={`badge bg-${
                                inv.status === 'paid'
                                  ? 'success'
                                  : inv.status === 'open'
                                    ? 'warning'
                                    : 'secondary'
                              }`}
                            >
                              {inv.status === 'paid'
                                ? '支払済'
                                : inv.status === 'open'
                                  ? '未払い'
                                  : inv.status}
                            </span>
                          </td>
                          <td>
                            {inv.hostedInvoiceUrl && (
                              <a
                                href={inv.hostedInvoiceUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn btn-sm btn-outline-secondary"
                              >
                                明細
                              </a>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </AppCard.Body>
            </AppCard>
          )}

          {/* プラン変更モーダル */}
          <ConfirmActionModal
            show={showChangePlanModal}
            title="プラン変更"
            body={
              <div>
                <p className="mb-3">新しいプランを選択してください:</p>
                <div className="d-flex flex-column gap-2">
                  {Object.entries(PLANS)
                    .filter(([id]) => id !== subscription?.planId)
                    .map(([id, plan]) => (
                      <button
                        key={id}
                        type="button"
                        className={`btn ${selectedPlan === id ? 'btn-primary' : 'btn-outline-secondary'} text-start`}
                        onClick={() => setSelectedPlan(id as PlanId)}
                      >
                        <strong>{plan.name}</strong> - {formatPrice(plan.price)}
                        <br />
                        <small className="text-muted">
                          品目: {plan.maxDrugs === Infinity ? '無制限' : plan.maxDrugs.toLocaleString()} /
                          店舗: {plan.maxPharmacies === Infinity ? '無制限' : plan.maxPharmacies}
                        </small>
                      </button>
                    ))}
                </div>
              </div>
            }
            confirmLabel="変更する"
            confirmVariant="primary"
            onConfirm={handleChangePlan}
            onCancel={() => {
              setShowChangePlanModal(false);
              setSelectedPlan(null);
            }}
            pending={actionLoading}
            confirmDisabled={!selectedPlan}
          />

          {/* 解約モーダル */}
          <ConfirmActionModal
            show={showCancelModal}
            title="サブスクリプション解約"
            body={
              <div>
                <p>サブスクリプションを解約しますか？</p>
                <p className="text-muted mb-0">
                  期間末までサービスをご利用いただけます。
                  解約はいつでも取り消せます。
                </p>
              </div>
            }
            confirmLabel="解約する"
            confirmVariant="danger"
            onConfirm={handleCancel}
            onCancel={() => setShowCancelModal(false)}
            pending={actionLoading}
          />
        </div>
      </ScrollArea>
    </PageShell>
  );
}
