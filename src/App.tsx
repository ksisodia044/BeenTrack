import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppShell } from "@/components/AppShell";

import LoginPage from "@/pages/LoginPage";
import SignupPage from "@/pages/SignupPage";
import DashboardPage from "@/pages/DashboardPage";
import ProductsPage from "@/pages/ProductsPage";
import SuppliersPage from "@/pages/SuppliersPage";
import SalesPOSPage from "@/pages/SalesPOSPage";
import SalesHistoryPage from "@/pages/SalesHistoryPage";
import SaleDetailPage from "@/pages/SaleDetailPage";
import ReportsPage from "@/pages/ReportsPage";
import LowStockPage from "@/pages/LowStockPage";
import SettingsPage from "@/pages/SettingsPage";
import NotFound from "@/pages/NotFound";
import PreviewLandingPage from "@/pages/PreviewLandingPage";

const queryClient = new QueryClient();

const RoutedAuthProvider = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();

  return <AuthProvider pathname={location.pathname}>{children}</AuthProvider>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <RoutedAuthProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/preview" element={<PreviewLandingPage />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            {/* Protected app routes */}
            <Route element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/products" element={<ProductsPage />} />
              <Route path="/suppliers" element={<ProtectedRoute adminOnly><SuppliersPage /></ProtectedRoute>} />
              <Route path="/sales" element={<SalesPOSPage />} />
              <Route path="/sales/history" element={<SalesHistoryPage />} />
              <Route path="/sales/:id" element={<SaleDetailPage />} />
              <Route path="/reports" element={<ProtectedRoute adminOnly><ReportsPage /></ProtectedRoute>} />
              <Route path="/alerts/low-stock" element={<LowStockPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>

            <Route path="/preview/:role" element={<ProtectedRoute><AppShell /></ProtectedRoute>}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="products" element={<ProductsPage />} />
              <Route path="suppliers" element={<ProtectedRoute adminOnly><SuppliersPage /></ProtectedRoute>} />
              <Route path="sales" element={<SalesPOSPage />} />
              <Route path="sales/history" element={<SalesHistoryPage />} />
              <Route path="sales/:id" element={<SaleDetailPage />} />
              <Route path="reports" element={<ProtectedRoute adminOnly><ReportsPage /></ProtectedRoute>} />
              <Route path="alerts/low-stock" element={<LowStockPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </RoutedAuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
