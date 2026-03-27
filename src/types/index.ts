export type UserRole = 'ADMIN' | 'STAFF';

export interface AppUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone?: string;
  isActive: boolean;
  createdAt: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  unit: string;
  costPrice: number;
  sellingPrice: number;
  stockQty: number;
  reorderLevel: number;
  supplierId?: string;
  supplierName?: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  location: string;
  notes: string;
  productsCount?: number;
  createdAt: string;
}

export interface CartItem {
  productId: string;
  name: string;
  sku: string;
  unitPrice: number;
  qty: number;
  lineTotal: number;
  maxStock: number;
}

export interface SaleItem {
  productId: string;
  name: string;
  unitPrice: number;
  qty: number;
  lineTotal: number;
}

export interface Sale {
  id: string;
  receiptNo: string;
  createdAt: string;
  cashierName: string;
  cashierId: string;
  paymentMethod: 'cash' | 'card' | 'mobile_money';
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  items: SaleItem[];
}

export interface DashboardSummary {
  totalSalesToday: number;
  salesThisWeek: number;
  lowStockCount: number;
  totalProducts: number;
  totalSuppliers: number;
  salesTrend: { date: string; amount: number }[];
  topLowStock: Product[];
}

export interface ReportSummary {
  totalRevenue: number;
  transactionCount: number;
  averageSale: number;
}

export interface TopProduct {
  productId: string;
  name: string;
  totalQty: number;
  totalRevenue: number;
}

export interface BusinessSettings {
  businessName: string;
  receiptFooter: string;
  defaultTaxRate: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}
