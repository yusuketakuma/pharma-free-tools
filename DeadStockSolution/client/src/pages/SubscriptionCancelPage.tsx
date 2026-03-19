import { useSearchParams, useNavigate } from 'react-router-dom';
import AppCard from '../components/ui/AppCard';
import AppAlert from '../components/ui/AppAlert';
import AppButton from '../components/ui/AppButton';

/**
 * Stripe Checkoutキャンセル後のリダイレクト先ページ
 * ユーザーにキャンセルを通知し、再試行またはアカウント設定への導線を提供
 */
export default function SubscriptionCancelPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const sessionId = searchParams.get('session_id');

  return (
    <div className="container mt-4" style={{ maxWidth: 600 }}>
      <AppCard>
        <AppCard.Header className="bg-warning">
          <h4 className="mb-0">
            <i className="bi bi-exclamation-triangle me-2" />
            決済がキャンセルされました
          </h4>
        </AppCard.Header>
        <AppCard.Body>
          <div className="text-center mb-4">
            <div className="display-4 text-warning mb-3">⚠</div>
            <p className="mb-0">
              決済処理が完了しませんでした。
              <br />
              お支払いが行われていないため、サブスクリプションは開始されていません。
            </p>
          </div>

          <AppAlert variant="info">
            <strong>キャンセルの理由：</strong>
            <ul className="mb-0 mt-2">
              <li>お支払い情報の入力を中断された</li>
              <li>ブラウザを閉じられた</li>
              <li>カード情報に問題があった</li>
            </ul>
          </AppAlert>

          <div className="bg-light p-3 rounded mb-4">
            <h6 className="mb-2">もう一度お試しいただけますか？</h6>
            <p className="text-muted small mb-0">
              アカウント設定ページからいつでもプランの登録が可能です。
            </p>
          </div>

          <div className="d-flex gap-2 flex-wrap">
            <AppButton variant="primary" onClick={() => navigate('/account')}>
              <i className="bi bi-arrow-repeat me-1" />
              もう一度試す
            </AppButton>
            <AppButton variant="outline-secondary" onClick={() => navigate('/')}>
              ダッシュボードへ戻る
            </AppButton>
          </div>

          {sessionId && (
            <div className="mt-4 text-center">
              <small className="text-muted">
                お問い合わせ時の参考: セッションID {sessionId.substring(0, 20)}...
              </small>
            </div>
          )}
        </AppCard.Body>
      </AppCard>
    </div>
  );
}
