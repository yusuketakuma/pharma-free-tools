import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import LandingPage from '../pages/LandingPage';

// useAuth モック
const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

const mockUseAuth = vi.mocked(await import('../contexts/AuthContext')).useAuth;

function renderLandingPage() {
  return render(
    <MemoryRouter>
      <LandingPage />
    </MemoryRouter>
  );
}

describe('LandingPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseAuth.mockReturnValue({
      user: null,
      loading: false,
      login: async () => ({
        id: 1,
        email: 'test@example.com',
        name: 'テスト薬局',
        prefecture: '東京都',
        isAdmin: false,
      }),
      logout: async () => {},
      register: async () => {},
      refreshUser: async () => {},
    });
  });

  describe('when user is not logged in', () => {
    it('renders hero section with title', () => {
      renderLandingPage();

      expect(screen.getByText(/薬局の在庫管理を/)).toBeInTheDocument();
      expect(screen.getByText(/スマートに/)).toBeInTheDocument();
    });

    it('renders landing page structure', () => {
      renderLandingPage();

      // ランディングページの主要セクションが存在することを確認
      expect(screen.getByText('主な機能')).toBeInTheDocument();
    });

    it('renders free trial button', () => {
      renderLandingPage();

      expect(screen.getByText('無料トライアルを開始')).toBeInTheDocument();
    });

    it('renders login button', () => {
      renderLandingPage();

      expect(screen.getByText('ログイン')).toBeInTheDocument();
    });

    it('renders feature section', () => {
      renderLandingPage();

      expect(screen.getByText('主な機能')).toBeInTheDocument();
    });

    it('renders inventory visualization feature', () => {
      renderLandingPage();

      expect(screen.getByText('在庫可視化')).toBeInTheDocument();
      expect(screen.getByText(/Excelアップロード/)).toBeInTheDocument();
    });

    it('navigates to register page when free trial button is clicked', async () => {
      const user = userEvent.setup();
      renderLandingPage();

      await user.click(screen.getByText('無料トライアルを開始'));

      expect(mockNavigate).toHaveBeenCalledWith('/register');
    });

    it('navigates to login page when login button is clicked', async () => {
      const user = userEvent.setup();
      renderLandingPage();

      await user.click(screen.getByText('ログイン'));

      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });

  describe('when user is logged in', () => {
    beforeEach(() => {
      mockUseAuth.mockReturnValue({
        user: {
          id: 1,
          email: 'test@example.com',
          name: 'テスト薬局',
          prefecture: '東京都',
          isAdmin: false,
        },
        loading: false,
        login: async () => ({
          id: 1,
          email: 'test@example.com',
          name: 'テスト薬局',
          prefecture: '東京都',
          isAdmin: false,
        }),
        logout: async () => {},
        register: async () => {},
        refreshUser: async () => {},
      });
    });

    it('redirects to dashboard', () => {
      renderLandingPage();

      expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true });
    });
  });
});
