import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import SignupPage from './SignupPage';

const navigateMock = vi.fn();
const signupMock = vi.fn();

let authState = {
  signup: signupMock,
  isAuthenticated: false,
};

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => authState,
}));

vi.mock('@/hooks/use-toast', () => ({
  toast: vi.fn(),
}));

describe('SignupPage', () => {
  beforeEach(() => {
    navigateMock.mockReset();
    signupMock.mockReset();
    authState = {
      signup: signupMock,
      isAuthenticated: false,
    };
  });

  it('waits for auth state before navigating to the dashboard', async () => {
    signupMock.mockResolvedValue(undefined);

    const view = render(
      <MemoryRouter>
        <SignupPage />
      </MemoryRouter>
    );

    fireEvent.change(screen.getByLabelText('Full name'), { target: { value: 'Test User' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'Smoke123!' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create account' }));

    await waitFor(() => {
      expect(signupMock).toHaveBeenCalledWith('test@example.com', 'Smoke123!', 'Test User');
    });
    expect(navigateMock).not.toHaveBeenCalled();

    authState = {
      signup: signupMock,
      isAuthenticated: true,
    };
    view.rerender(
      <MemoryRouter>
        <SignupPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith('/dashboard', { replace: true });
    });
  });
});
