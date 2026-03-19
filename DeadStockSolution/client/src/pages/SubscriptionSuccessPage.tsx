import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import AppCard from '../components/ui/AppCard';
import AppAlert from '../components/ui/AppAlert';
import AppButton from '../components/ui/AppButton';
import { api } from '../api/client';
import { useAuth } from '../contexts/AuthContext';

interface SubscriptionStatus {
  planName: string;
  status: string;
  currentPeriodEnd: string;
}

/**
 * Stripe Checkout成功後のリダイレクト先ページ
 * セッションIDからサブスクリプション状態を取得し、成功メッセージを表示
 */
export default function SubscriptionSuccessPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const sessionId = searchParams.get('session_id');
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null);

  useEffect(() => {
    if (!sessionId) {
      setError('セッション情報が見つかりません。');
      setLoading(false);
      return;
    }

    const fetchSubscriptionStatus = async () => {
      try {
        const res = await api.get<SubscriptionStatus>(
          `/subscriptions/status?session_id=${encodeURIComponent(sessionId)}`
        );
        setSubscription(res);
        // ユーザー情報を更新してサブスクリプション状態を反映
        await refreshUser();
      } catch (err) {
        console.error('Failed to fetch subscription status:', err);
        setError('サブスクリプション情報の取得に失敗しました。');
      } finally {
        setLoading(false);
      }
    };

    fetchSubscriptionStatus();
  }, [sessionId, refreshUser]);

  if (loading) {
    return (
      <div className="container mt-4" style={{ maxWidth: 600 }}>
        <AppCard>
          <AppCard.Body className="text-center py-5">
            <div className="spinner-border text-primary mb-3" role="status">
              <span className="visually-hidden">読み込み中...</span>
            </div>
            <p className="text-muted mb-0">決済情報を確認しています...</p>
          </AppCard.Body>
        </AppCard>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mt-4" style={{ maxWidth: 600 }}>
        <AppAlert variant="danger">{error}</AppAlert>
        <AppButton variant="primary" onClick={() => navigate('/account')}>
          アカウント設定へ
        </AppButton>
      </div>
    );
  }

  return (
    <div className="container mt-4" style={{ maxWidth: 600 }}>
      <AppCard>
        <AppCard.Header className="bg-success text-white">
          <h4 className="mb-0">
            <i className="bi bi-check-circle me-2" />
            ご登録ありがとうございます
          </h4>
        </AppCard.Header>
        <AppCard.Body>
          <div className="text-center mb-4">
            <div className="display-4 text-success mb-3">✓</div>
            <h5>サブスクリプション登録が完了しました</h5>
          </div>

          {subscription && (
            <div className="bg-light p-3 rounded mb-4">
              <div className="row g-2">
                <div className="col-6">
                  <small className="text-muted">プラン</small>
                  <p className="mb-0 fw-bold">{subscription.planName}</p>
                </div>
                <div className="col-6">
                  <small className="text-muted">ステータス</small>
                  <p className="mb-0">
                    <span className="badge bg-success">
                      {subscription.status === 'active' ? '有効' : subscription.status}
                    </span>
                  </p>
                </div>
                {subscription.currentPeriodEnd && (
                  <div className="col-12">
                    <small className="text-muted">次回更新日</small>
                    <p className="mb-0">
                      {new Date(subscription.currentPeriodEnd).toLocaleDateString('ja-JP')}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="alert alert-info">
            <i className="bi bi-info-circle me-2" />
            確認メールをお送りしました。メールボックスをご確認ください。
          </div>

          <div className="d-flex gap-2">
            <AppButton variant="primary" onClick={() => navigate('/')}>
              ダッシュボードへ
            </AppButton>
            <AppButton variant="outline-secondary" onClick={() => navigate('/account')}>
              アカウント設定
            </AppButton>
          </div>
        </AppCard.Body>
      </AppCard>
    </div>
  );
}
