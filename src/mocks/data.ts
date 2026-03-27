import type {
  Product, Supplier, Sale, DashboardSummary,
  ReportSummary, TopProduct, AppUser, BusinessSettings,
  PaginatedResponse,
} from '@/types';

// ── Products ──────────────────────────────────────────
const categories = ['Beverages', 'Snacks', 'Equipment', 'Merchandise', 'Supplies'];
const units = ['pcs', 'kg', 'liters', 'boxes', 'bags'];

const productNames: Record<string, string[]> = {
  Beverages: ['Dark Roast Beans 1kg', 'Medium Roast Beans 500g', 'Espresso Blend 250g', 'Cold Brew Concentrate', 'Matcha Powder 200g', 'Chai Spice Mix'],
  Snacks: ['Chocolate Croissant', 'Almond Biscotti', 'Granola Bar', 'Banana Bread Slice'],
  Equipment: ['Pour Over Dripper', 'French Press 350ml', 'Milk Frother', 'Digital Scale'],
  Merchandise: ['Ceramic Mug 12oz', 'Travel Tumbler 16oz', 'Canvas Tote Bag', 'Logo Sticker Pack'],
  Supplies: ['Paper Cups 100pk', 'Lids 100pk', 'Napkins 500pk', 'Sugar Packets 200pk', 'Stirrers 1000pk'],
};

let productId = 0;
export const mockProducts: Product[] = Object.entries(productNames).flatMap(([cat, names]) =>
  names.map((name) => {
    productId++;
    const cost = +(Math.random() * 30 + 2).toFixed(2);
    const stock = Math.floor(Math.random() * 150);
    const reorder = Math.floor(Math.random() * 20 + 5);
    return {
      id: `prod-${productId}`,
      sku: `SKU-${String(productId).padStart(4, '0')}`,
      name,
      category: cat,
      unit: units[Math.floor(Math.random() * units.length)],
      costPrice: cost,
      sellingPrice: +(cost * (1.4 + Math.random() * 0.6)).toFixed(2),
      stockQty: stock,
      reorderLevel: reorder,
      supplierId: `sup-${(productId % 5) + 1}`,
      supplierName: `Supplier ${(productId % 5) + 1}`,
      status: Math.random() > 0.1 ? 'active' : 'inactive',
      createdAt: new Date(Date.now() - Math.random() * 90 * 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
    };
  })
);

// ── Suppliers ─────────────────────────────────────────
export const mockSuppliers: Supplier[] = [
  { id: 'sup-1', name: 'Bean Origin Co.', contactPerson: 'Maria Santos', phone: '+1-555-0101', email: 'maria@beanorigin.co', location: 'São Paulo, Brazil', notes: 'Premium single-origin supplier', productsCount: 6, createdAt: '2024-01-15T10:00:00Z' },
  { id: 'sup-2', name: 'Pacific Roasters', contactPerson: 'James Lee', phone: '+1-555-0102', email: 'james@pacificroasters.com', location: 'Portland, OR', notes: 'Specialty blends', productsCount: 4, createdAt: '2024-02-01T10:00:00Z' },
  { id: 'sup-3', name: 'EcoPack Supplies', contactPerson: 'Sarah Chen', phone: '+1-555-0103', email: 'sarah@ecopack.io', location: 'Seattle, WA', notes: 'Eco-friendly packaging', productsCount: 5, createdAt: '2024-03-10T10:00:00Z' },
  { id: 'sup-4', name: 'Artisan Bakehouse', contactPerson: 'Tom Müller', phone: '+1-555-0104', email: 'tom@artisanbake.com', location: 'Austin, TX', notes: 'Fresh baked goods daily', productsCount: 4, createdAt: '2024-04-05T10:00:00Z' },
  { id: 'sup-5', name: 'MerchWorks', contactPerson: 'Aisha Patel', phone: '+1-555-0105', email: 'aisha@merchworks.co', location: 'Denver, CO', notes: 'Custom branded merchandise', productsCount: 4, createdAt: '2024-05-20T10:00:00Z' },
];

// ── Sales ─────────────────────────────────────────────
const paymentMethods: Sale['paymentMethod'][] = ['cash', 'card', 'mobile_money'];

export const mockSales: Sale[] = Array.from({ length: 30 }, (_, i) => {
  const itemCount = Math.floor(Math.random() * 4) + 1;
  const items = Array.from({ length: itemCount }, () => {
    const p = mockProducts[Math.floor(Math.random() * mockProducts.length)];
    const qty = Math.floor(Math.random() * 3) + 1;
    return { productId: p.id, name: p.name, unitPrice: p.sellingPrice, qty, lineTotal: +(p.sellingPrice * qty).toFixed(2) };
  });
  const subtotal = +items.reduce((s, it) => s + it.lineTotal, 0).toFixed(2);
  const discount = Math.random() > 0.7 ? +(subtotal * 0.1).toFixed(2) : 0;
  const tax = +((subtotal - discount) * 0.15).toFixed(2);
  const total = +(subtotal - discount + tax).toFixed(2);
  return {
    id: `sale-${i + 1}`,
    receiptNo: `RCP-${String(1000 + i)}`,
    createdAt: new Date(Date.now() - (29 - i) * 86400000 - Math.random() * 86400000).toISOString(),
    cashierName: i % 2 === 0 ? 'Admin User' : 'Staff User',
    cashierId: i % 2 === 0 ? 'user-1' : 'user-2',
    paymentMethod: paymentMethods[i % 3],
    subtotal, discount, tax, total, items,
  };
});

// ── Dashboard ─────────────────────────────────────────
const today = new Date();
export const mockDashboardSummary: DashboardSummary = {
  totalSalesToday: mockSales.filter(s => new Date(s.createdAt).toDateString() === today.toDateString()).reduce((s, sl) => s + sl.total, 0) || 342.5,
  salesThisWeek: mockSales.slice(-7).reduce((s, sl) => s + sl.total, 0),
  lowStockCount: mockProducts.filter(p => p.stockQty <= p.reorderLevel).length,
  totalProducts: mockProducts.length,
  totalSuppliers: mockSuppliers.length,
  salesTrend: Array.from({ length: 7 }, (_, i) => ({
    date: new Date(Date.now() - (6 - i) * 86400000).toLocaleDateString('en-US', { weekday: 'short' }),
    amount: +(Math.random() * 500 + 100).toFixed(2),
  })),
  topLowStock: mockProducts.filter(p => p.stockQty <= p.reorderLevel).slice(0, 5),
};

// ── Reports ───────────────────────────────────────────
export const mockReportSummary: ReportSummary = {
  totalRevenue: mockSales.reduce((s, sl) => s + sl.total, 0),
  transactionCount: mockSales.length,
  averageSale: +(mockSales.reduce((s, sl) => s + sl.total, 0) / mockSales.length).toFixed(2),
};

export const mockTopProducts: TopProduct[] = mockProducts.slice(0, 10).map(p => ({
  productId: p.id, name: p.name,
  totalQty: Math.floor(Math.random() * 100 + 10),
  totalRevenue: +(Math.random() * 2000 + 200).toFixed(2),
}));

// ── Users ─────────────────────────────────────────────
export const mockUsers: AppUser[] = [
  { id: 'user-1', email: 'admin@beantrack.com', name: 'Admin User', role: 'ADMIN', isActive: true, createdAt: '2024-01-01T10:00:00Z' },
  { id: 'user-2', email: 'staff@beantrack.com', name: 'Staff User', role: 'STAFF', isActive: true, createdAt: '2024-02-01T10:00:00Z' },
  { id: 'user-3', email: 'jane@beantrack.com', name: 'Jane Cooper', role: 'STAFF', phone: '+1-555-0201', isActive: true, createdAt: '2024-03-15T10:00:00Z' },
  { id: 'user-4', email: 'alex@beantrack.com', name: 'Alex Rivera', role: 'STAFF', isActive: false, createdAt: '2024-04-01T10:00:00Z' },
];

// ── Business Settings ─────────────────────────────────
export const mockBusinessSettings: BusinessSettings = {
  businessName: 'BeanTrack Coffee',
  receiptFooter: 'Thank you for your purchase!',
  defaultTaxRate: 15,
};
