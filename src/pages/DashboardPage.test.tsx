import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import DashboardPage from './DashboardPage';

const navigateMock = vi.fn();
const summaryMock = vi.fn();

let authState = {
  isAdmin: false,
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

vi.mock('@/api/client', () => ({
  dashboardApi: {
    summary: () => summaryMock(),
  },
}));

vi.mock('@/hooks/use-toast', () => ({
  toast: vi.fn(),
}));

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  BarChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Bar: () => <div />,
  XAxis: () => <div />,
  YAxis: () => <div />,
  CartesianGrid: () => <div />,
  Tooltip: () => <div />,
}));

const dashboardSummary = {
  totalSalesToday: 120,
  salesThisWeek: 840,
  lowStockCount: 2,
  totalProducts: 10,
  totalSuppliers: 3,
  salesTrend: [{ date: 'Mon', amount: 120 }],
  topLowStock: [],
};

describe('DashboardPage', () => {
  beforeEach(() => {
    navigateMock.mockReset();
    summaryMock.mockReset();
    summaryMock.mockResolvedValue(dashboardSummary);
    authState = { isAdmin: false };
  });

  it('hides the Add Supplier quick action for staff users', async () => {
    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    );

    await screen.findByRole('heading', { name: 'Dashboard' });

    expect(screen.queryByRole('button', { name: 'Add Supplier' })).not.toBeInTheDocument();
  });

  it('shows the Add Supplier quick action for admins', async () => {
    authState = { isAdmin: true };

    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Add Supplier' })).toBeInTheDocument();
    });
  });
});
