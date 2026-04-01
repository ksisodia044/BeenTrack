import { supabase } from '@/integrations/supabase/client';
import type {
  Product, Supplier, Sale, SaleItem, DashboardSummary,
  ReportSummary, TopProduct, AppUser, BusinessSettings,
  PaginatedResponse,
} from '@/types';

// ── Helpers ───────────────────────────────────────────
function toProduct(row: any, supplierName?: string): Product {
  return {
    id: row.id,
    sku: row.sku,
    name: row.name,
    category: row.category,
    unit: row.unit,
    costPrice: Number(row.cost_price),
    sellingPrice: Number(row.selling_price),
    stockQty: row.stock_qty,
    reorderLevel: row.reorder_level,
    supplierId: row.supplier_id ?? undefined,
    supplierName: supplierName ?? row.suppliers?.name ?? undefined,
    status: row.status as 'active' | 'inactive',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toSupplier(row: any, productsCount?: number): Supplier {
  return {
    id: row.id,
    name: row.name,
    contactPerson: row.contact_person,
    phone: row.phone,
    email: row.email,
    location: row.location,
    notes: row.notes,
    productsCount,
    createdAt: row.created_at,
  };
}

function toSale(row: any, items: SaleItem[]): Sale {
  return {
    id: row.id,
    receiptNo: row.receipt_no,
    createdAt: row.created_at,
    cashierName: row.cashier_name,
    cashierId: row.cashier_id,
    paymentMethod: row.payment_method,
    subtotal: Number(row.subtotal),
    discount: Number(row.discount),
    tax: Number(row.tax),
    total: Number(row.total),
    items,
  };
}

function toSaleItem(row: any): SaleItem {
  return {
    productId: row.product_id,
    name: row.name,
    unitPrice: Number(row.unit_price),
    qty: row.qty,
    lineTotal: Number(row.line_total),
  };
}

// ── Products ──────────────────────────────────────────
export const productsApi = {
  list: async (params?: { search?: string; category?: string; status?: string; page?: number; pageSize?: number }): Promise<PaginatedResponse<Product>> => {
    const page = params?.page || 1;
    const pageSize = params?.pageSize || 10;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase.from('products').select('*, suppliers(name)', { count: 'exact' });

    if (params?.search) {
      query = query.or(`name.ilike.%${params.search}%,sku.ilike.%${params.search}%`);
    }
    if (params?.category) query = query.eq('category', params.category);
    if (params?.status) query = query.eq('status', params.status);

    const { data, count, error } = await query.order('created_at', { ascending: false }).range(from, to);
    if (error) throw error;

    return {
      data: (data || []).map(row => toProduct(row, (row as any).suppliers?.name)),
      total: count || 0,
      page,
      pageSize,
    };
  },

  create: async (data: Partial<Product>): Promise<Product> => {
    const { data: row, error } = await supabase.from('products').insert({
      sku: data.sku!,
      name: data.name!,
      category: data.category || 'General',
      unit: data.unit || 'pcs',
      cost_price: data.costPrice || 0,
      selling_price: data.sellingPrice || 0,
      stock_qty: data.stockQty || 0,
      reorder_level: data.reorderLevel || 5,
      supplier_id: data.supplierId || null,
      status: data.status || 'active',
    }).select().single();
    if (error) throw error;
    return toProduct(row);
  },

  update: async (id: string, data: Partial<Product>): Promise<Product> => {
    const updates: any = {};
    if (data.name !== undefined) updates.name = data.name;
    if (data.sku !== undefined) updates.sku = data.sku;
    if (data.category !== undefined) updates.category = data.category;
    if (data.unit !== undefined) updates.unit = data.unit;
    if (data.costPrice !== undefined) updates.cost_price = data.costPrice;
    if (data.sellingPrice !== undefined) updates.selling_price = data.sellingPrice;
    if (data.stockQty !== undefined) updates.stock_qty = data.stockQty;
    if (data.reorderLevel !== undefined) updates.reorder_level = data.reorderLevel;
    if (data.supplierId !== undefined) updates.supplier_id = data.supplierId || null;
    if (data.status !== undefined) updates.status = data.status;

    const { data: row, error } = await supabase.from('products').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return toProduct(row);
  },

  delete: async (id: string): Promise<void> => {
    const { error } = await supabase.from('products').update({ status: 'inactive' }).eq('id', id);
    if (error) throw error;
  },
};

// ── Suppliers ─────────────────────────────────────────
export const suppliersApi = {
  list: async (params?: { search?: string; page?: number; pageSize?: number }): Promise<PaginatedResponse<Supplier>> => {
    const page = params?.page || 1;
    const pageSize = params?.pageSize || 10;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase.from('suppliers').select('*', { count: 'exact' });
    if (params?.search) {
      query = query.or(`name.ilike.%${params.search}%,contact_person.ilike.%${params.search}%`);
    }

    const { data, count, error } = await query.order('created_at', { ascending: false }).range(from, to);
    if (error) throw error;

    // Get products count per supplier
    const supplierIds = (data || []).map(s => s.id);
    let productsCounts: Record<string, number> = {};
    if (supplierIds.length > 0) {
      const { data: prods } = await supabase
        .from('products')
        .select('supplier_id')
        .in('supplier_id', supplierIds);
      if (prods) {
        prods.forEach(p => {
          if (p.supplier_id) productsCounts[p.supplier_id] = (productsCounts[p.supplier_id] || 0) + 1;
        });
      }
    }

    return {
      data: (data || []).map(row => toSupplier(row, productsCounts[row.id] || 0)),
      total: count || 0,
      page,
      pageSize,
    };
  },

  create: async (data: Partial<Supplier>): Promise<Supplier> => {
    const { data: row, error } = await supabase.from('suppliers').insert({
      name: data.name!,
      contact_person: data.contactPerson || '',
      phone: data.phone || '',
      email: data.email || '',
      location: data.location || '',
      notes: data.notes || '',
    }).select().single();
    if (error) throw error;
    return toSupplier(row, 0);
  },

  update: async (id: string, data: Partial<Supplier>): Promise<Supplier> => {
    const updates: any = {};
    if (data.name !== undefined) updates.name = data.name;
    if (data.contactPerson !== undefined) updates.contact_person = data.contactPerson;
    if (data.phone !== undefined) updates.phone = data.phone;
    if (data.email !== undefined) updates.email = data.email;
    if (data.location !== undefined) updates.location = data.location;
    if (data.notes !== undefined) updates.notes = data.notes;

    const { data: row, error } = await supabase.from('suppliers').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return toSupplier(row);
  },
};

// ── Sales ─────────────────────────────────────────────
export const salesApi = {
  create: async (data: { items: { productId: string; qty: number }[]; paymentMethod: string; discount?: number; cashierName: string; cashierId: string; taxRate?: number }): Promise<Sale> => {
    // Build items with product info
    const { data: products, error: prodErr } = await supabase
      .from('products')
      .select('*')
      .in('id', data.items.map(i => i.productId));
    if (prodErr) throw prodErr;

    const prodMap = new Map((products || []).map(p => [p.id, p]));
    const saleItems = data.items.map(ci => {
      const p = prodMap.get(ci.productId)!;
      return {
        productId: p.id,
        name: p.name,
        unitPrice: Number(p.selling_price),
        qty: ci.qty,
        lineTotal: +(Number(p.selling_price) * ci.qty).toFixed(2),
      };
    });

    const subtotal = +saleItems.reduce((s, it) => s + it.lineTotal, 0).toFixed(2);
    const discount = data.discount || 0;
    const taxRate = data.taxRate ?? 15;
    const tax = +((subtotal - discount) * taxRate / 100).toFixed(2);
    const total = +(subtotal - discount + tax).toFixed(2);

    // Get next receipt number via DB function
    const { data: receiptNo, error: seqErr } = await supabase.rpc('next_receipt_no');
    if (seqErr) throw seqErr;

    // Insert sale
    const { data: saleRow, error: saleErr } = await supabase.from('sales').insert({
      receipt_no: receiptNo as string,
      cashier_id: data.cashierId,
      cashier_name: data.cashierName,
      payment_method: data.paymentMethod,
      subtotal,
      discount,
      tax,
      total,
    }).select().single();
    if (saleErr) throw saleErr;

    // Insert sale items
    const { error: itemsErr } = await supabase.from('sale_items').insert(
      saleItems.map(si => ({
        sale_id: saleRow.id,
        product_id: si.productId,
        name: si.name,
        unit_price: si.unitPrice,
        qty: si.qty,
        line_total: si.lineTotal,
      }))
    );
    if (itemsErr) throw itemsErr;

    return toSale(saleRow, saleItems);
  },

  list: async (params?: { from?: string; to?: string; search?: string; page?: number; pageSize?: number }): Promise<PaginatedResponse<Sale>> => {
    const page = params?.page || 1;
    const pageSize = params?.pageSize || 10;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase.from('sales').select('*', { count: 'exact' });
    if (params?.search) {
      query = query.or(`receipt_no.ilike.%${params.search}%,cashier_name.ilike.%${params.search}%`);
    }
    if (params?.from) query = query.gte('created_at', params.from);
    if (params?.to) query = query.lte('created_at', params.to);

    const { data, count, error } = await query.order('created_at', { ascending: false }).range(from, to);
    if (error) throw error;

    // Get items for all sales
    const saleIds = (data || []).map(s => s.id);
    let itemsMap: Record<string, SaleItem[]> = {};
    if (saleIds.length > 0) {
      const { data: items } = await supabase.from('sale_items').select('*').in('sale_id', saleIds);
      (items || []).forEach(item => {
        const sid = item.sale_id;
        if (!itemsMap[sid]) itemsMap[sid] = [];
        itemsMap[sid].push(toSaleItem(item));
      });
    }

    return {
      data: (data || []).map(row => toSale(row, itemsMap[row.id] || [])),
      total: count || 0,
      page,
      pageSize,
    };
  },

  getById: async (id: string): Promise<Sale> => {
    const { data: row, error } = await supabase.from('sales').select('*').eq('id', id).single();
    if (error) throw error;

    const { data: items } = await supabase.from('sale_items').select('*').eq('sale_id', id);
    return toSale(row, (items || []).map(toSaleItem));
  },
};

// ── Reports ───────────────────────────────────────────
export const reportsApi = {
  summary: async (params?: { from?: string; to?: string }): Promise<ReportSummary> => {
    let query = supabase.from('sales').select('total');
    if (params?.from) query = query.gte('created_at', params.from);
    if (params?.to) query = query.lte('created_at', params.to);

    const { data, error } = await query;
    if (error) throw error;

    const sales = data || [];
    const totalRevenue = sales.reduce((s, r) => s + Number(r.total), 0);
    return {
      totalRevenue: +totalRevenue.toFixed(2),
      transactionCount: sales.length,
      averageSale: sales.length ? +(totalRevenue / sales.length).toFixed(2) : 0,
    };
  },

  topProducts: async (params?: { from?: string; to?: string }): Promise<TopProduct[]> => {
    // Get sale items with date filtering through sales
    let salesQuery = supabase.from('sales').select('id, created_at');
    if (params?.from) salesQuery = salesQuery.gte('created_at', params.from);
    if (params?.to) salesQuery = salesQuery.lte('created_at', params.to);
    
    const { data: salesData } = await salesQuery;
    if (!salesData?.length) return [];

    const saleIds = salesData.map(s => s.id);
    const { data: items } = await supabase.from('sale_items').select('*').in('sale_id', saleIds);

    const productMap: Record<string, { name: string; totalQty: number; totalRevenue: number }> = {};
    (items || []).forEach(item => {
      if (!productMap[item.product_id]) {
        productMap[item.product_id] = { name: item.name, totalQty: 0, totalRevenue: 0 };
      }
      productMap[item.product_id].totalQty += item.qty;
      productMap[item.product_id].totalRevenue += Number(item.line_total);
    });

    return Object.entries(productMap)
      .map(([productId, data]) => ({
        productId,
        name: data.name,
        totalQty: data.totalQty,
        totalRevenue: +data.totalRevenue.toFixed(2),
      }))
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, 10);
  },

  lowStock: async (): Promise<Product[]> => {
    const { data, error } = await supabase
      .from('products')
      .select('*, suppliers(name)')
      .eq('status', 'active')
      .order('stock_qty', { ascending: true });
    if (error) throw error;

    return (data || [])
      .filter(row => row.stock_qty <= row.reorder_level)
      .map(row => toProduct(row, (row as any).suppliers?.name));
  },
};

// ── Dashboard ─────────────────────────────────────────
export const dashboardApi = {
  summary: async (): Promise<DashboardSummary> => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const [salesToday, salesWeek, products, suppliers, lowStockProducts] = await Promise.all([
      supabase.from('sales').select('total').gte('created_at', today.toISOString()),
      supabase.from('sales').select('total, created_at').gte('created_at', weekAgo.toISOString()),
      supabase.from('products').select('id', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('suppliers').select('id', { count: 'exact', head: true }),
      supabase.from('products').select('*, suppliers(name)').eq('status', 'active').order('stock_qty', { ascending: true }).limit(5),
    ]);

    const totalSalesToday = (salesToday.data || []).reduce((s, r) => s + Number(r.total), 0);
    const salesThisWeek = (salesWeek.data || []).reduce((s, r) => s + Number(r.total), 0);

    // Build sales trend (last 7 days)
    const salesTrend = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() - (6 - i));
      const dayStr = d.toLocaleDateString('en-US', { weekday: 'short' });
      const dayStart = new Date(d); dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(d); dayEnd.setHours(23, 59, 59, 999);
      const amount = (salesWeek.data || [])
        .filter(s => {
          const sd = new Date(s.created_at);
          return sd >= dayStart && sd <= dayEnd;
        })
        .reduce((sum, s) => sum + Number(s.total), 0);
      return { date: dayStr, amount: +amount.toFixed(2) };
    });

    const lowStockItems = (lowStockProducts.data || []).filter(p => p.stock_qty <= p.reorder_level);
    const lowStockCount = lowStockItems.length;

    // Get full low stock count
    const { data: allLowStock } = await supabase
      .from('products')
      .select('id, stock_qty, reorder_level')
      .eq('status', 'active');
    const totalLowStock = (allLowStock || []).filter(p => p.stock_qty <= p.reorder_level).length;

    return {
      totalSalesToday: +totalSalesToday.toFixed(2),
      salesThisWeek: +salesThisWeek.toFixed(2),
      lowStockCount: totalLowStock,
      totalProducts: products.count || 0,
      totalSuppliers: suppliers.count || 0,
      salesTrend,
      topLowStock: lowStockItems.map(row => toProduct(row, (row as any).suppliers?.name)),
    };
  },
};

// ── Users (admin) ─────────────────────────────────────
export const usersApi = {
  list: async (): Promise<AppUser[]> => {
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, name, phone, is_active, created_at, email');
    if (error) throw error;

    const { data: roles } = await supabase.from('user_roles').select('*');
    const roleMap: Record<string, string> = {};
    (roles || []).forEach(r => { roleMap[r.user_id] = r.role; });

    return (profiles || []).map(p => ({
      id: p.id,
      email: p.email || '',
      name: p.name || '',
      phone: p.phone || undefined,
      role: (roleMap[p.id] as 'ADMIN' | 'STAFF') || 'STAFF',
      isActive: p.is_active,
      createdAt: p.created_at,
    }));
  },

  updateRole: async (userId: string, role: 'ADMIN' | 'STAFF'): Promise<void> => {
    // The UI assumes one role row per user, so replace all existing role rows first.
    const { error: deleteError } = await supabase.from('user_roles')
      .delete()
      .eq('user_id', userId);
    if (deleteError) throw deleteError;

    const { error: insertError } = await supabase.from('user_roles')
      .insert({ user_id: userId, role });
    if (insertError) throw insertError;
  },

  updateStatus: async (userId: string, isActive: boolean): Promise<void> => {
    const { error } = await supabase.from('profiles')
      .update({ is_active: isActive })
      .eq('id', userId);
    if (error) throw error;
  },
};

// ── Settings ──────────────────────────────────────────
export const settingsApi = {
  getBusinessSettings: async (): Promise<BusinessSettings> => {
    const { data, error } = await supabase.from('business_settings').select('*').limit(1).single();
    if (error) throw error;
    return {
      businessName: data.business_name,
      receiptFooter: data.receipt_footer,
      defaultTaxRate: Number(data.default_tax_rate),
    };
  },

  updateBusinessSettings: async (settings: Partial<BusinessSettings>): Promise<BusinessSettings> => {
    const updates: any = {};
    if (settings.businessName !== undefined) updates.business_name = settings.businessName;
    if (settings.receiptFooter !== undefined) updates.receipt_footer = settings.receiptFooter;
    if (settings.defaultTaxRate !== undefined) updates.default_tax_rate = settings.defaultTaxRate;

    // Get the single settings row id first
    const { data: existing } = await supabase.from('business_settings').select('id').limit(1).single();
    if (!existing) throw new Error('No business settings found');

    const { data, error } = await supabase.from('business_settings')
      .update(updates)
      .eq('id', existing.id)
      .select()
      .single();
    if (error) throw error;

    return {
      businessName: data.business_name,
      receiptFooter: data.receipt_footer,
      defaultTaxRate: Number(data.default_tax_rate),
    };
  },
};
