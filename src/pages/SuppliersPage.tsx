import { useState, useEffect, useCallback } from 'react';
import { Plus, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DataTable, type Column } from '@/components/DataTable';
import { FormModal } from '@/components/FormModal';
import { suppliersApi } from '@/api/client';
import { toast } from '@/hooks/use-toast';
import type { Supplier } from '@/types';

const emptySupplier: Partial<Supplier> = {
  name: '', contactPerson: '', phone: '', email: '', location: '', notes: '',
};

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editSupplier, setEditSupplier] = useState<Partial<Supplier>>(emptySupplier);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await suppliersApi.list({ search, page, pageSize: 10 });
      setSuppliers(res.data);
      setTotal(res.total);
    } catch { toast({ title: 'Failed to load', variant: 'destructive' }); }
    setLoading(false);
  }, [search, page]);

  useEffect(() => { load(); }, [load]);

  const handleSave = async () => {
    if (!editSupplier.name || !editSupplier.email) {
      toast({ title: 'Name and email are required', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      if (editSupplier.id) {
        await suppliersApi.update(editSupplier.id, editSupplier);
        toast({ title: 'Supplier updated' });
      } else {
        await suppliersApi.create(editSupplier);
        toast({ title: 'Supplier created' });
      }
      setModalOpen(false);
      setEditSupplier(emptySupplier);
      load();
    } catch { toast({ title: 'Save failed', variant: 'destructive' }); }
    setSaving(false);
  };

  const columns: Column<Supplier>[] = [
    { key: 'name', label: 'Name', render: (_, r) => <span className="font-medium">{r.name}</span> },
    { key: 'contactPerson', label: 'Contact', className: 'hidden sm:table-cell' },
    { key: 'email', label: 'Email', className: 'hidden md:table-cell' },
    { key: 'location', label: 'Location', className: 'hidden lg:table-cell' },
    {
      key: 'productsCount', label: 'Products',
      render: (v) => <span className="tabular-nums">{v ?? 0}</span>,
    },
  ];

  const field = (label: string, key: keyof Supplier) => (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input
        value={(editSupplier as any)[key] ?? ''}
        onChange={e => setEditSupplier(p => ({ ...p, [key]: e.target.value }))}
      />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Suppliers</h1>
          <p className="text-sm text-muted-foreground">{total} suppliers</p>
        </div>
        <Button size="sm" onClick={() => { setEditSupplier(emptySupplier); setModalOpen(true); }}>
          <Plus className="w-4 h-4 mr-1" /> Add Supplier
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={suppliers}
        total={total}
        page={page}
        onPageChange={setPage}
        loading={loading}
        searchValue={search}
        onSearchChange={v => { setSearch(v); setPage(1); }}
        searchPlaceholder="Search suppliers..."
        onRowClick={s => { setEditSupplier({ ...s }); setModalOpen(true); }}
        emptyIcon={<Users className="w-12 h-12" />}
        emptyMessage="No suppliers found"
      />

      <FormModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        title={editSupplier.id ? 'Edit Supplier' : 'Add Supplier'}
        onSubmit={handleSave}
        loading={saving}
      >
        {field('Company Name', 'name')}
        <div className="grid grid-cols-2 gap-3">
          {field('Contact Person', 'contactPerson')}
          {field('Phone', 'phone')}
        </div>
        {field('Email', 'email')}
        {field('Location', 'location')}
        <div className="space-y-1.5">
          <Label>Notes</Label>
          <textarea
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-[60px]"
            value={editSupplier.notes ?? ''}
            onChange={e => setEditSupplier(p => ({ ...p, notes: e.target.value }))}
          />
        </div>
      </FormModal>
    </div>
  );
}
