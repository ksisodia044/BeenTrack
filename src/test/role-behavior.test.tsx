import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AppShell } from "@/components/AppShell";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import DashboardPage from "@/pages/DashboardPage";
import SettingsPage from "@/pages/SettingsPage";

const logoutMock = vi.fn();
const updateProfileMock = vi.fn();
const usersListMock = vi.fn();
const settingsGetMock = vi.fn();

const defaultUser = {
  id: "user-1",
  email: "user@example.com",
  name: "Test User",
  role: "STAFF" as const,
  isActive: true,
  createdAt: "2026-01-01T00:00:00Z",
};

let authState = {
  user: defaultUser,
  role: "STAFF" as const,
  isAdmin: false,
  isAuthenticated: true,
  loading: false,
  login: vi.fn(),
  signup: vi.fn(),
  logout: logoutMock,
  updateProfile: updateProfileMock,
};

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => authState,
}));

vi.mock("@/api/client", () => ({
  dashboardApi: {
    summary: () =>
      Promise.resolve({
        totalSalesToday: 120,
        salesThisWeek: 840,
        lowStockCount: 2,
        totalProducts: 10,
        totalSuppliers: 3,
        salesTrend: [{ date: "Mon", amount: 120 }],
        topLowStock: [],
      }),
  },
  usersApi: {
    list: () => usersListMock(),
    updateRole: vi.fn(),
    updateStatus: vi.fn(),
  },
  settingsApi: {
    getBusinessSettings: () => settingsGetMock(),
    updateBusinessSettings: vi.fn(),
  },
}));

vi.mock("@/hooks/use-toast", () => ({
  toast: vi.fn(),
}));

vi.mock("@/components/ConfirmDialog", () => ({
  ConfirmDialog: () => null,
}));

vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  BarChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Bar: () => <div />,
  XAxis: () => <div />,
  YAxis: () => <div />,
  CartesianGrid: () => <div />,
  Tooltip: () => <div />,
}));

describe("role behavior", () => {
  beforeEach(() => {
    logoutMock.mockReset();
    updateProfileMock.mockReset();
    usersListMock.mockReset();
    settingsGetMock.mockReset();
    usersListMock.mockResolvedValue([
      { ...defaultUser, role: "STAFF" as const },
    ]);
    settingsGetMock.mockResolvedValue({
      businessName: "BeanTrack",
      receiptFooter: "Thanks",
      defaultTaxRate: 15,
    });
    authState = {
      user: defaultUser,
      role: "STAFF",
      isAdmin: false,
      isAuthenticated: true,
      loading: false,
      login: vi.fn(),
      signup: vi.fn(),
      logout: logoutMock,
      updateProfile: updateProfileMock,
    };
  });

  it("redirects unauthenticated users to login", async () => {
    authState = { ...authState, isAuthenticated: false, user: null, role: null };

    render(
      <MemoryRouter initialEntries={["/admin"]}>
        <Routes>
          <Route path="/login" element={<div>Login page</div>} />
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <div>Admin page</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText("Login page")).toBeInTheDocument();
  });

  it("redirects staff users away from admin-only routes", async () => {
    render(
      <MemoryRouter initialEntries={["/reports"]}>
        <Routes>
          <Route path="/dashboard" element={<div>Dashboard page</div>} />
          <Route
            path="/reports"
            element={
              <ProtectedRoute adminOnly>
                <div>Reports page</div>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText("Dashboard page")).toBeInTheDocument();
  });

  it("shows admin navigation links only for admins", async () => {
    const { rerender } = render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <Routes>
          <Route element={<AppShell />}>
            <Route path="/dashboard" element={<div>Dashboard content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(screen.queryByRole("link", { name: "Suppliers" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Reports" })).not.toBeInTheDocument();

    authState = {
      ...authState,
      user: { ...defaultUser, role: "ADMIN" },
      role: "ADMIN",
      isAdmin: true,
    };

    rerender(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <Routes>
          <Route element={<AppShell />}>
            <Route path="/dashboard" element={<div>Dashboard content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByRole("link", { name: "Suppliers" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Reports" })).toBeInTheDocument();
  });

  it("hides the Add Supplier dashboard action for staff and shows it for admins", async () => {
    const { rerender } = render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    );

    await screen.findByRole("heading", { name: "Dashboard" });
    expect(screen.queryByRole("button", { name: "Add Supplier" })).not.toBeInTheDocument();

    authState = {
      ...authState,
      user: { ...defaultUser, role: "ADMIN" },
      role: "ADMIN",
      isAdmin: true,
    };

    rerender(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Add Supplier" })).toBeInTheDocument();
    });
  });

  it("shows only the profile settings tab for staff", async () => {
    render(
      <MemoryRouter>
        <SettingsPage />
      </MemoryRouter>
    );

    expect(await screen.findByRole("heading", { name: "Settings" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Profile" })).toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: "Users" })).not.toBeInTheDocument();
    expect(screen.queryByRole("tab", { name: "Business" })).not.toBeInTheDocument();
    expect(usersListMock).not.toHaveBeenCalled();
    expect(settingsGetMock).not.toHaveBeenCalled();
  });

  it("shows admin settings tabs and loads admin data", async () => {
    authState = {
      ...authState,
      user: { ...defaultUser, role: "ADMIN" },
      role: "ADMIN",
      isAdmin: true,
    };

    render(
      <MemoryRouter>
        <SettingsPage />
      </MemoryRouter>
    );

    expect(await screen.findByRole("heading", { name: "Settings" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Users" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Business" })).toBeInTheDocument();

    await waitFor(() => {
      expect(usersListMock).toHaveBeenCalled();
      expect(settingsGetMock).toHaveBeenCalled();
    });
  });
});
