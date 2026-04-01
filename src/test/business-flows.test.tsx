import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import LowStockPage from "@/pages/LowStockPage";
import ProductsPage from "@/pages/ProductsPage";
import ReportsPage from "@/pages/ReportsPage";
import SaleDetailPage from "@/pages/SaleDetailPage";
import SalesHistoryPage from "@/pages/SalesHistoryPage";
import SalesPOSPage from "@/pages/SalesPOSPage";
import SettingsPage from "@/pages/SettingsPage";
import SuppliersPage from "@/pages/SuppliersPage";

const toastMock = vi.fn();
const updateProfileMock = vi.fn();
const productsListMock = vi.fn();
const productsCreateMock = vi.fn();
const productsUpdateMock = vi.fn();
const suppliersListMock = vi.fn();
const suppliersCreateMock = vi.fn();
const suppliersUpdateMock = vi.fn();
const salesCreateMock = vi.fn();
const salesListMock = vi.fn();
const salesGetByIdMock = vi.fn();
const reportsSummaryMock = vi.fn();
const reportsTopProductsMock = vi.fn();
const reportsLowStockMock = vi.fn();
const usersListMock = vi.fn();
const settingsGetMock = vi.fn();
const settingsUpdateMock = vi.fn();

const defaultUser = {
  id: "admin-1",
  email: "admin@example.com",
  name: "Admin User",
  role: "ADMIN" as const,
  isActive: true,
  createdAt: "2026-01-01T00:00:00Z",
};

const sampleProduct = {
  id: "product-1",
  sku: "SKU-001",
  name: "Dark Roast Beans",
  category: "Beverages",
  unit: "pcs",
  costPrice: 10,
  sellingPrice: 15,
  stockQty: 5,
  reorderLevel: 2,
  status: "active" as const,
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
};

const lowStockProduct = {
  ...sampleProduct,
  id: "product-2",
  sku: "SKU-LOW",
  name: "Paper Cups",
  stockQty: 2,
  reorderLevel: 8,
};

const sampleSupplier = {
  id: "supplier-1",
  name: "Bean Wholesale",
  contactPerson: "Alex",
  phone: "555-0100",
  email: "beans@example.com",
  location: "Nairobi",
  notes: "",
  productsCount: 1,
  createdAt: "2026-01-01T00:00:00Z",
};

const sampleSale = {
  id: "sale-1",
  receiptNo: "RCPT-1001",
  createdAt: "2026-01-01T10:00:00Z",
  cashierName: "Admin User",
  cashierId: "admin-1",
  paymentMethod: "cash" as const,
  subtotal: 15,
  discount: 0,
  tax: 2.25,
  total: 17.25,
  items: [
    {
      productId: "product-1",
      name: "Dark Roast Beans",
      unitPrice: 15,
      qty: 1,
      lineTotal: 15,
    },
  ],
};

let authState = {
  user: defaultUser,
  role: "ADMIN" as const,
  isAdmin: true,
  isAuthenticated: true,
  loading: false,
  login: vi.fn(),
  signup: vi.fn(),
  logout: vi.fn(),
  updateProfile: updateProfileMock,
};

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => authState,
}));

vi.mock("@/api/client", () => ({
  dashboardApi: {
    summary: vi.fn(),
  },
  productsApi: {
    list: (...args: unknown[]) => productsListMock(...args),
    create: (...args: unknown[]) => productsCreateMock(...args),
    update: (...args: unknown[]) => productsUpdateMock(...args),
    delete: vi.fn(),
  },
  suppliersApi: {
    list: (...args: unknown[]) => suppliersListMock(...args),
    create: (...args: unknown[]) => suppliersCreateMock(...args),
    update: (...args: unknown[]) => suppliersUpdateMock(...args),
  },
  salesApi: {
    create: (...args: unknown[]) => salesCreateMock(...args),
    list: (...args: unknown[]) => salesListMock(...args),
    getById: (...args: unknown[]) => salesGetByIdMock(...args),
  },
  reportsApi: {
    summary: (...args: unknown[]) => reportsSummaryMock(...args),
    topProducts: (...args: unknown[]) => reportsTopProductsMock(...args),
    lowStock: (...args: unknown[]) => reportsLowStockMock(...args),
  },
  usersApi: {
    list: (...args: unknown[]) => usersListMock(...args),
    updateRole: vi.fn(),
    updateStatus: vi.fn(),
  },
  settingsApi: {
    getBusinessSettings: (...args: unknown[]) => settingsGetMock(...args),
    updateBusinessSettings: (...args: unknown[]) => settingsUpdateMock(...args),
  },
}));

vi.mock("@/hooks/use-toast", () => ({
  toast: (...args: unknown[]) => toastMock(...args),
}));

vi.mock("@/components/ConfirmDialog", () => ({
  ConfirmDialog: () => null,
}));

vi.mock("@/components/ui/tabs", () => ({
  Tabs: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  TabsList: ({ children }: { children: React.ReactNode }) => <div role="tablist">{children}</div>,
  TabsTrigger: ({ children }: { children: React.ReactNode }) => <button role="tab">{children}</button>,
  TabsContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  BarChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Bar: () => <div />,
  XAxis: () => <div />,
  YAxis: () => <div />,
  CartesianGrid: () => <div />,
  Tooltip: () => <div />,
  PieChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Pie: () => <div />,
  Cell: () => <div />,
}));

describe("business flows and failure paths", () => {
  beforeEach(() => {
    toastMock.mockReset();
    updateProfileMock.mockReset();
    productsListMock.mockReset();
    productsCreateMock.mockReset();
    productsUpdateMock.mockReset();
    suppliersListMock.mockReset();
    suppliersCreateMock.mockReset();
    suppliersUpdateMock.mockReset();
    salesCreateMock.mockReset();
    salesListMock.mockReset();
    salesGetByIdMock.mockReset();
    reportsSummaryMock.mockReset();
    reportsTopProductsMock.mockReset();
    reportsLowStockMock.mockReset();
    usersListMock.mockReset();
    settingsGetMock.mockReset();
    settingsUpdateMock.mockReset();

    authState = {
      user: defaultUser,
      role: "ADMIN",
      isAdmin: true,
      isAuthenticated: true,
      loading: false,
      login: vi.fn(),
      signup: vi.fn(),
      logout: vi.fn(),
      updateProfile: updateProfileMock,
    };

    productsListMock.mockResolvedValue({ data: [], total: 0, page: 1, pageSize: 10 });
    suppliersListMock.mockResolvedValue({ data: [], total: 0, page: 1, pageSize: 10 });
    salesListMock.mockResolvedValue({ data: [], total: 0, page: 1, pageSize: 10 });
    salesGetByIdMock.mockRejectedValue(new Error("not found"));
    reportsSummaryMock.mockResolvedValue({ totalRevenue: 0, transactionCount: 0, averageSale: 0 });
    reportsTopProductsMock.mockResolvedValue([]);
    reportsLowStockMock.mockResolvedValue([]);
    usersListMock.mockResolvedValue([]);
    settingsGetMock.mockResolvedValue({
      businessName: "BeanTrack",
      receiptFooter: "Thanks",
      defaultTaxRate: 15,
    });
    settingsUpdateMock.mockResolvedValue({
      businessName: "BeanTrack",
      receiptFooter: "Thanks",
      defaultTaxRate: 15,
    });
  });

  it("covers product empty state, validation, create, update, and load errors", async () => {
    render(
      <MemoryRouter>
        <ProductsPage />
      </MemoryRouter>
    );

    expect(await screen.findByRole("heading", { name: "Products" })).toBeInTheDocument();
    expect(screen.getByText("No products found")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /add product/i }));
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(toastMock).toHaveBeenCalledWith(expect.objectContaining({
      title: "Name and SKU are required",
      variant: "destructive",
    }));

    const createDialog = await screen.findByRole("dialog");
    const createInputs = createDialog.querySelectorAll("input");
    fireEvent.change(createInputs[0], { target: { value: "Cold Brew" } });
    fireEvent.change(createInputs[1], { target: { value: "CB-001" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => {
      expect(productsCreateMock).toHaveBeenCalledWith(expect.objectContaining({
        name: "Cold Brew",
        sku: "CB-001",
      }));
    });
    expect(toastMock).toHaveBeenCalledWith(expect.objectContaining({ title: "Product created" }));

    cleanup();
    productsListMock.mockResolvedValue({ data: [sampleProduct], total: 1, page: 1, pageSize: 10 });
    productsUpdateMock.mockResolvedValue({ ...sampleProduct, name: "Updated Beans" });

    render(
      <MemoryRouter>
        <ProductsPage />
      </MemoryRouter>
    );

    await screen.findByText("Dark Roast Beans");
    fireEvent.click(screen.getByText("Dark Roast Beans"));

    const editDialog = await screen.findByRole("dialog");
    const editInputs = editDialog.querySelectorAll("input");
    fireEvent.change(editInputs[0], { target: { value: "Updated Beans" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => {
      expect(productsUpdateMock).toHaveBeenCalledWith("product-1", expect.objectContaining({
        name: "Updated Beans",
      }));
    });
    expect(toastMock).toHaveBeenCalledWith(expect.objectContaining({ title: "Product updated" }));

    cleanup();
    productsListMock.mockRejectedValueOnce(new Error("load failed"));
    render(
      <MemoryRouter>
        <ProductsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(toastMock).toHaveBeenCalledWith(expect.objectContaining({
        title: "Failed to load products",
        variant: "destructive",
      }));
    });
  });

  it("covers supplier empty state, validation, create, update, and save failures", async () => {
    render(
      <MemoryRouter>
        <SuppliersPage />
      </MemoryRouter>
    );

    expect(await screen.findByRole("heading", { name: "Suppliers" })).toBeInTheDocument();
    expect(screen.getByText("No suppliers found")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /add supplier/i }));
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(toastMock).toHaveBeenCalledWith(expect.objectContaining({
      title: "Name and email are required",
      variant: "destructive",
    }));

    const createDialog = await screen.findByRole("dialog");
    const createInputs = createDialog.querySelectorAll("input");
    fireEvent.change(createInputs[0], { target: { value: "Cup Supplier" } });
    fireEvent.change(createInputs[3], { target: { value: "cups@example.com" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => {
      expect(suppliersCreateMock).toHaveBeenCalledWith(expect.objectContaining({
        name: "Cup Supplier",
        email: "cups@example.com",
      }));
    });
    expect(toastMock).toHaveBeenCalledWith(expect.objectContaining({ title: "Supplier created" }));

    cleanup();
    suppliersListMock.mockResolvedValue({ data: [sampleSupplier], total: 1, page: 1, pageSize: 10 });
    suppliersUpdateMock.mockResolvedValue({ ...sampleSupplier, location: "Mombasa" });

    render(
      <MemoryRouter>
        <SuppliersPage />
      </MemoryRouter>
    );

    await screen.findByText("Bean Wholesale");
    fireEvent.click(screen.getByText("Bean Wholesale"));

    const editDialog = await screen.findByRole("dialog");
    const editInputs = editDialog.querySelectorAll("input");
    fireEvent.change(editInputs[4], { target: { value: "Mombasa" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => {
      expect(suppliersUpdateMock).toHaveBeenCalledWith("supplier-1", expect.objectContaining({
        location: "Mombasa",
      }));
    });
    expect(toastMock).toHaveBeenCalledWith(expect.objectContaining({ title: "Supplier updated" }));

    cleanup();
    suppliersCreateMock.mockRejectedValueOnce(new Error("save failed"));
    render(
      <MemoryRouter>
        <SuppliersPage />
      </MemoryRouter>
    );

    fireEvent.click(await screen.findByRole("button", { name: /add supplier/i }));
    const failingDialog = await screen.findByRole("dialog");
    const failingInputs = failingDialog.querySelectorAll("input");
    fireEvent.change(failingInputs[0], { target: { value: "Failed Supplier" } });
    fireEvent.change(failingInputs[3], { target: { value: "fail@example.com" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => {
      expect(toastMock).toHaveBeenCalledWith(expect.objectContaining({
        title: "Save failed",
        variant: "destructive",
      }));
    });
  });

  it("covers point of sale empty states, insufficient stock, checkout success, and checkout failure", async () => {
    render(
      <MemoryRouter>
        <SalesPOSPage />
      </MemoryRouter>
    );

    expect(await screen.findByRole("heading", { name: "Point of Sale" })).toBeInTheDocument();
    expect(screen.getByText("No products found")).toBeInTheDocument();
    expect(screen.getByText("Cart is empty")).toBeInTheDocument();

    cleanup();
    productsListMock.mockResolvedValue({
      data: [{ ...sampleProduct, stockQty: 1 }],
      total: 1,
      page: 1,
      pageSize: 999,
    });
    salesCreateMock.mockResolvedValue(sampleSale);

    render(
      <MemoryRouter>
        <SalesPOSPage />
      </MemoryRouter>
    );

    await screen.findByText("Dark Roast Beans");
    fireEvent.click(screen.getByRole("button", { name: /Dark Roast Beans/i }));
    fireEvent.click(screen.getByRole("button", { name: /Dark Roast Beans/i }));
    expect(toastMock).toHaveBeenCalledWith(expect.objectContaining({
      title: "Not enough stock",
      variant: "destructive",
    }));

    fireEvent.click(screen.getByRole("button", { name: /Checkout/i }));
    await screen.findByRole("heading", { name: "Sale Complete!" });
    expect(screen.getAllByText(/Receipt #RCPT-1001/i).length).toBeGreaterThan(0);

    cleanup();
    productsListMock.mockResolvedValue({
      data: [sampleProduct],
      total: 1,
      page: 1,
      pageSize: 999,
    });
    salesCreateMock.mockRejectedValueOnce(new Error("checkout failed"));

    render(
      <MemoryRouter>
        <SalesPOSPage />
      </MemoryRouter>
    );

    await screen.findAllByText("Dark Roast Beans");
    fireEvent.click(screen.getAllByRole("button", { name: /Dark Roast Beans/i })[0]);
    fireEvent.click(screen.getByRole("button", { name: /Checkout/i }));

    await waitFor(() => {
      expect(toastMock).toHaveBeenCalledWith(expect.objectContaining({
        title: "Checkout failed",
        variant: "destructive",
      }));
    });
  });

  it("covers sales history empty state and row navigation", async () => {
    render(
      <MemoryRouter initialEntries={["/sales/history"]}>
        <Routes>
          <Route path="/sales/history" element={<SalesHistoryPage />} />
          <Route path="/sales/:id" element={<div>Sale detail route</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByRole("heading", { name: "Sales History" })).toBeInTheDocument();
    expect(screen.getByText("No sales found")).toBeInTheDocument();

    cleanup();
    salesListMock.mockResolvedValue({ data: [sampleSale], total: 1, page: 1, pageSize: 10 });

    render(
      <MemoryRouter initialEntries={["/sales/history"]}>
        <Routes>
          <Route path="/sales/history" element={<SalesHistoryPage />} />
          <Route path="/sales/:id" element={<div>Sale detail route</div>} />
        </Routes>
      </MemoryRouter>
    );

    await screen.findByText("RCPT-1001");
    fireEvent.click(screen.getByText("RCPT-1001"));
    expect(await screen.findByText("Sale detail route")).toBeInTheDocument();
  });

  it("shows sale not found when a detail lookup fails", async () => {
    render(
      <MemoryRouter initialEntries={["/sales/missing-sale"]}>
        <Routes>
          <Route path="/sales/:id" element={<SaleDetailPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByText("Sale not found")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Go back" })).toBeInTheDocument();
  });

  it("covers low stock empty state and restock requests", async () => {
    render(
      <MemoryRouter>
        <LowStockPage />
      </MemoryRouter>
    );

    expect(await screen.findByRole("heading", { name: "Low Stock Alerts" })).toBeInTheDocument();
    expect(screen.getByText("No low stock items")).toBeInTheDocument();

    cleanup();
    reportsLowStockMock.mockResolvedValueOnce([lowStockProduct]);
    render(
      <MemoryRouter>
        <LowStockPage />
      </MemoryRouter>
    );

    await screen.findByText("Paper Cups");
    fireEvent.click(screen.getByRole("button", { name: "Restock" }));
    fireEvent.click(screen.getByRole("button", { name: "Submit Request" }));

    await waitFor(() => {
      expect(toastMock).toHaveBeenCalledWith(expect.objectContaining({
        title: "Restock request for Paper Cups: 16 units",
      }));
    });
  });

  it("shows the empty reports view and saves business settings", async () => {
    render(
      <MemoryRouter>
        <ReportsPage />
      </MemoryRouter>
    );

    expect(await screen.findByRole("heading", { name: "Reports" })).toBeInTheDocument();
    expect(screen.getByText("All products are well-stocked!")).toBeInTheDocument();

    cleanup();
    settingsUpdateMock.mockResolvedValueOnce({
      businessName: "BeanTrack Labs",
      receiptFooter: "Thanks",
      defaultTaxRate: 18,
    });

    render(
      <MemoryRouter>
        <SettingsPage />
      </MemoryRouter>
    );

    expect(await screen.findByRole("heading", { name: "Settings" })).toBeInTheDocument();
    const businessNameInput = await screen.findByDisplayValue("BeanTrack");
    fireEvent.change(businessNameInput, { target: { value: "BeanTrack Labs" } });
    fireEvent.click(screen.getByRole("button", { name: "Save Settings" }));

    await waitFor(() => {
      expect(settingsUpdateMock).toHaveBeenCalledWith(expect.objectContaining({
        businessName: "BeanTrack Labs",
      }));
    });
    expect(toastMock).toHaveBeenCalledWith(expect.objectContaining({ title: "Settings saved" }));
  });
});
