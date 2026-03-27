import { useState, useEffect, useCallback } from 'react';
import { Plus, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DataTable, type Column } from '@/components/DataTable';
import { FormModal } from '@/components/FormModal';
import { StockBadge } from '@/components/StockBadge';
import { productsApi } from '@/api/client';
import { toast } from '@/hooks/use-toast';
import type { Product } from '@/types';

const categories = ['Beverages', 'Snacks', 'Equipment', 'Merchandise', 'Supplies'];
const units = ['pcs', 'kg', 'liters', 'boxes', 'bags'];

const emptyProduct: Partial<Product> = {
  name: '', sku: '', category: 'Beverages', unit: 'pcs',
  costPrice: 0, sellingPrice: 0, stockQty: 0, reorderLevel: 5, status: 'active',
};

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Partial<Product>>(emptyProduct);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await productsApi.list({ search, category: categoryFilter, status: statusFilter, page, pageSize: 10 });
      setProducts(res.data);
      setTotal(res.total);
    } catch { toast({ title: 'Failed to load products', variant: 'destructive' }); }
    setLoading(false);
  }, [search, categoryFilter, statusFilter, page]);

  useEffect(() => { load(); }, [load]);

  const handleSave = async () => {
    if (!editProduct.name || !editProduct.sku) {
      toast({ title: 'Name and SKU are required', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      if (editProduct.id) {
        await productsApi.update(editProduct.id, editProduct);
        toast({ title: 'Product updated' });
      } else {
        await productsApi.create(editProduct);
        toast({ title: 'Product created' });
      }
      setModalOpen(false);
      setEditProduct(emptyProduct);
      load();
    } catch { toast({ title: 'Failed to save', variant: 'destructive' }); }
    setSaving(false);
  };

  const openEdit = (p: Product) => {
    setEditProduct({ ...p });
    setModalOpen(true);
  };

  const columns: Column<Product>[] = [
    { key: 'sku', label: 'SKU', className: 'font-mono text-xs' },
    { key: 'name', label: 'Name', render: (_, r) => <span className="font-medium">{r.name}</span> },
    { key: 'category', label: 'Category', className: 'hidden md:table-cell' },
    {
      key: 'sellingPrice', label: 'Price',
      render: (v) => <span className="tabular-nums">${Number(v).toFixed(2)}</span>,
    },
    {
      key: 'stockQty', label: 'Stock',
      render: (v, r) => (
        <div className="flex items-center gap-2">
          <span className="tabular-nums">{v}</span>
          <StockBadge qty={r.stockQty} reorderLevel={r.reorderLevel} />
        </div>
      ),
    },
    {
      key: 'status', label: 'Status', className: 'hidden lg:table-cell',
      render: (v) => (
        <span className={`text-xs font-medium ${v === 'active' ? 'text-success' : 'text-muted-foreground'}`}>
          {v === 'active' ? 'Active' : 'Inactive'}
        </span>
      ),
    },
  ];

  const field = (label: string, key: keyof Product, type = 'text') => (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input
        type={type}
        value={(editProduct as any)[key] ?? ''}
        onChange={e => setEditProduct(prev => ({
          ...prev,
          [key]: type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value,
        }))}
      />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Products</h1>
          <p className="text-sm text-muted-foreground">{total} products</p>
        </div>
        <Button size="sm" onClick={() => { setEditProduct(emptyProduct); setModalOpen(true); }}>
          <Plus className="w-4 h-4 mr-1" /> Add Product
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <Select value={categoryFilter} onValueChange={v => { setCategoryFilter(v === 'all' ? '' : v); setPage(1); }}>
          <SelectTrigger className="w-36 bg-card">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={v => { setStatusFilter(v === 'all' ? '' : v); setPage(1); }}>
          <SelectTrigger className="w-32 bg-card">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DataTable
        columns={columns}
        data={products}
        total={total}
        page={page}
        onPageChange={setPage}
        loading={loading}
        searchValue={search}
        onSearchChange={v => { setSearch(v); setPage(1); }}
        searchPlaceholder="Search products..."
        onRowClick={openEdit}
        emptyIcon={<Package className="w-12 h-12" />}
        emptyMessage="No products found"
      />

      {/* Add/Edit Modal */}
      <FormModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        title={editProduct.id ? 'Edit Product' : 'Add Product'}
        onSubmit={handleSave}
        loading={saving}
      >
        <div className="grid grid-cols-2 gap-3">
          {field('Name', 'name')}
          {field('SKU', 'sku')}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Category</Label>
            <Select value={editProduct.category || 'Beverages'} onValueChange={v => setEditProduct(p => ({ ...p, category: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Unit</Label>
            <Select value={editProduct.unit || 'pcs'} onValueChange={v => setEditProduct(p => ({ ...p, unit: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {units.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {field('Cost Price', 'costPrice', 'number')}
          {field('Selling Price', 'sellingPrice', 'number')}
        </div>
        <div className="grid grid-cols-2 gap-3">
          {field('Stock Qty', 'stockQty', 'number')}
          {field('Reorder Level', 'reorderLevel', 'number')}
        </div>
      </FormModal>
    </div>
  );
}
