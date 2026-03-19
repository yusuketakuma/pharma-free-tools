import { Container, Row, Col, Button, Card, Badge } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/**
 * ランディングページ（LP）
 * 未ログインユーザー向けのサービス紹介ページ
 */
export default function LandingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // ログイン済みユーザーはダッシュボードへリダイレクト
  if (user) {
    navigate('/dashboard', { replace: true });
    return null;
  }

  return (
    <div className="landing-page">
      {/* ヒーローセクション */}
      <section className="hero-section bg-primary text-white py-5">
        <Container>
          <Row className="align-items-center min-vh-50">
            <Col lg={6}>
              <h1 className="display-4 fw-bold mb-4">
                薬局の在庫管理を<br />スマートに
              </h1>
              <p className="lead mb-4">
                デッドストック（滞留在庫）の可視化・期限管理・薬局間マッチングを一元管理。
                訪問薬剤管理の効率化を実現します。
              </p>
              <div className="d-flex gap-3">
                <Button 
                  variant="light" 
                  size="lg" 
                  onClick={() => navigate('/register')}
                >
                  無料トライアルを開始
                </Button>
                <Button 
                  variant="outline-light" 
                  size="lg"
                  onClick={() => navigate('/login')}
                >
                  ログイン
                </Button>
              </div>
            </Col>
            <Col lg={6} className="text-center">
              <div className="hero-illustration p-4">
                <div className="bg-white bg-opacity-10 rounded-4 p-5">
                  <i className="bi bi-box-seam display-1"></i>
                  <div className="mt-3">
                    <Badge bg="success" className="me-2">在庫管理</Badge>
                    <Badge bg="warning" className="me-2">期限アラート</Badge>
                    <Badge bg="info">マッチング</Badge>
                  </div>
                </div>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* 機能紹介セクション */}
      <section className="features-section py-5">
        <Container>
          <h2 className="text-center mb-5">主な機能</h2>
          <Row>
            <Col md={4} className="mb-4">
              <Card className="h-100 border-0 shadow-sm">
                <Card.Body className="text-center p-4">
                  <div className="feature-icon bg-primary bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{ width: 80, height: 80 }}>
                    <i className="bi bi-graph-up text-primary fs-2"></i>
                  </div>
                  <Card.Title>在庫可視化</Card.Title>
                  <Card.Text className="text-muted">
                    Excelアップロードで簡単に在庫データを取り込み。デッドストックを自動識別。
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4} className="mb-4">
              <Card className="h-100 border-0 shadow-sm">
                <Card.Body className="text-center p-4">
                  <div className="feature-icon bg-warning bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{ width: 80, height: 80 }}>
                    <i className="bi bi-clock text-warning fs-2"></i>
                  </div>
                  <Card.Title>期限アラート</Card.Title>
                  <Card.Text className="text-muted">
                    薬品の有効期限を自動監視。期限切れリスクを事前に通知。
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4} className="mb-4">
              <Card className="h-100 border-0 shadow-sm">
                <Card.Body className="text-center p-4">
                  <div className="feature-icon bg-info bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{ width: 80, height: 80 }}>
                    <i className="bi bi-arrow-left-right text-info fs-2"></i>
                  </div>
                  <Card.Title>薬局間マッチング</Card.Title>
                  <Card.Text className="text-muted">
                    他薬局との在庫交換を自動提案。余剰在庫を有効活用。
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
          </Row>
          <Row>
            <Col md={4} className="mb-4">
              <Card className="h-100 border-0 shadow-sm">
                <Card.Body className="text-center p-4">
                  <div className="feature-icon bg-success bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{ width: 80, height: 80 }}>
                    <i className="bi bi-file-earmark-text text-success fs-2"></i>
                  </div>
                  <Card.Title>レポート機能</Card.Title>
                  <Card.Text className="text-muted">
                    在庫状況、期限リスク、交換履歴をレポート化。経営判断を支援。
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4} className="mb-4">
              <Card className="h-100 border-0 shadow-sm">
                <Card.Body className="text-center p-4">
                  <div className="feature-icon bg-danger bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{ width: 80, height: 80 }}>
                    <i className="bi bi-capsule text-danger fs-2"></i>
                  </div>
                  <Card.Title>医薬品マスター連携</Card.Title>
                  <Card.Text className="text-muted">
                    厚生労働省の薬価基準データと自動連携。薬品情報を自動補完。
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4} className="mb-4">
              <Card className="h-100 border-0 shadow-sm">
                <Card.Body className="text-center p-4">
                  <div className="feature-icon bg-secondary bg-opacity-10 rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{ width: 80, height: 80 }}>
                    <i className="bi bi-house text-secondary fs-2"></i>
                  </div>
                  <Card.Title>訪問薬剤管理対応</Card.Title>
                  <Card.Text className="text-muted">
                    在宅医療領域の訪問薬剤管理に特化した機能を提供。
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </section>

      {/* 料金プランセクション */}
      <section className="pricing-section bg-light py-5">
        <Container>
          <h2 className="text-center mb-2">料金プラン</h2>
          <p className="text-center text-muted mb-5">
            薬局の規模に合わせて選べる3つのプラン
          </p>
          <Row>
            <Col lg={4} className="mb-4">
              <Card className="h-100 border-0 shadow-sm">
                <Card.Header className="bg-white border-0 pt-4">
                  <Badge bg="secondary" className="mb-2">Light</Badge>
                  <h3 className="mb-0">¥9,800<span className="text-muted fs-6">/月</span></h3>
                  <small className="text-muted">小規模薬局（1-2店舗）向け</small>
                </Card.Header>
                <Card.Body>
                  <ul className="list-unstyled">
                    <li className="mb-2">
                      <i className="bi bi-check-circle-fill text-success me-2"></i>
                      在庫管理（最大2,000品目）
                    </li>
                    <li className="mb-2">
                      <i className="bi bi-check-circle-fill text-success me-2"></i>
                      期限アラート
                    </li>
                    <li className="mb-2">
                      <i className="bi bi-check-circle-fill text-success me-2"></i>
                      基本レポート
                    </li>
                    <li className="mb-2">
                      <i className="bi bi-check-circle-fill text-success me-2"></i>
                      メールサポート
                    </li>
                  </ul>
                </Card.Body>
                <Card.Footer className="bg-white border-0 pb-4">
                  <Button 
                    variant="outline-primary" 
                    className="w-100"
                    onClick={() => navigate('/register?plan=light')}
                  >
                    トライアル開始
                  </Button>
                </Card.Footer>
              </Card>
            </Col>
            <Col lg={4} className="mb-4">
              <Card className="h-100 border-primary shadow">
                <Card.Header className="bg-primary text-white border-0 pt-4">
                  <Badge bg="light" text="dark" className="mb-2">人気</Badge>
                  <h3 className="mb-0">¥19,800<span className="fs-6 opacity-75">/月</span></h3>
                  <small className="opacity-75">中規模薬局（3-5店舗）向け</small>
                </Card.Header>
                <Card.Body>
                  <ul className="list-unstyled">
                    <li className="mb-2">
                      <i className="bi bi-check-circle-fill text-success me-2"></i>
                      在庫管理（最大10,000品目）
                    </li>
                    <li className="mb-2">
                      <i className="bi bi-check-circle-fill text-success me-2"></i>
                      全レポート機能
                    </li>
                    <li className="mb-2">
                      <i className="bi bi-check-circle-fill text-success me-2"></i>
                      API連携
                    </li>
                    <li className="mb-2">
                      <i className="bi bi-check-circle-fill text-success me-2"></i>
                      優先サポート
                    </li>
                    <li className="mb-2">
                      <i className="bi bi-check-circle-fill text-success me-2"></i>
                      ユーザー無制限
                    </li>
                  </ul>
                </Card.Body>
                <Card.Footer className="bg-white border-0 pb-4">
                  <Button 
                    variant="primary" 
                    className="w-100"
                    onClick={() => navigate('/register?plan=standard')}
                  >
                    トライアル開始
                  </Button>
                </Card.Footer>
              </Card>
            </Col>
            <Col lg={4} className="mb-4">
              <Card className="h-100 border-0 shadow-sm">
                <Card.Header className="bg-white border-0 pt-4">
                  <Badge bg="dark" className="mb-2">Enterprise</Badge>
                  <h3 className="mb-0">¥49,800〜<span className="text-muted fs-6">/月</span></h3>
                  <small className="text-muted">大規模薬局（6店舗〜）向け</small>
                </Card.Header>
                <Card.Body>
                  <ul className="list-unstyled">
                    <li className="mb-2">
                      <i className="bi bi-check-circle-fill text-success me-2"></i>
                      在庫管理（無制限）
                    </li>
                    <li className="mb-2">
                      <i className="bi bi-check-circle-fill text-success me-2"></i>
                      カスタムレポート
                    </li>
                    <li className="mb-2">
                      <i className="bi bi-check-circle-fill text-success me-2"></i>
                      専任サポート
                    </li>
                    <li className="mb-2">
                      <i className="bi bi-check-circle-fill text-success me-2"></i>
                      データ移行支援
                    </li>
                    <li className="mb-2">
                      <i className="bi bi-check-circle-fill text-success me-2"></i>
                      SSO連携
                    </li>
                  </ul>
                </Card.Body>
                <Card.Footer className="bg-white border-0 pb-4">
                  <Button 
                    variant="outline-dark" 
                    className="w-100"
                    onClick={() => navigate('/register?plan=enterprise')}
                  >
                    お問い合わせ
                  </Button>
                </Card.Footer>
              </Card>
            </Col>
          </Row>
        </Container>
      </section>

      {/* CTAセクション */}
      <section className="cta-section bg-primary text-white py-5">
        <Container className="text-center">
          <h2 className="mb-3">今すぐ無料トライアルを開始</h2>
          <p className="lead mb-4">
            クレジットカード不要。14日間無料でお試しいただけます。
          </p>
          <Button 
            variant="light" 
            size="lg"
            onClick={() => navigate('/register')}
          >
            無料で始める
          </Button>
        </Container>
      </section>

      {/* フッター */}
      <footer className="bg-dark text-white py-4">
        <Container>
          <Row>
            <Col md={6}>
              <h5>DeadStockSolution</h5>
              <p className="text-muted mb-0">
                薬局向けデッドストック管理システム
              </p>
            </Col>
            <Col md={6} className="text-md-end">
              <small className="text-muted">
                © 2026 DeadStockSolution. All rights reserved.
              </small>
            </Col>
          </Row>
        </Container>
      </footer>
    </div>
  );
}
