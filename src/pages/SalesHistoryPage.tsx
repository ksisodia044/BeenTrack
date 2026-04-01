import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { History } from 'lucide-react';
import { DataTable, type Column } from '@/components/DataTable';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { salesApi } from '@/api/client';
import { toast } from '@/hooks/use-toast';
import { appPath } from '@/lib/preview';
import type { Sale } from '@/types';

export default function SalesHistoryPage() {
  const navigate = useNavigate();
  const [sales, setSales] = useState<Sale[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await salesApi.list({ search, from: dateFrom, to: dateTo, page, pageSize: 10 });
      setSales(res.data);
      setTotal(res.total);
    } catch { toast({ title: 'Failed to load', variant: 'destructive' }); }
    setLoading(false);
  }, [search, dateFrom, dateTo, page]);

  useEffect(() => { load(); }, [load]);

  const paymentBadge = (method: string) => {
    const labels: Record<string, string> = { cash: 'Cash', card: 'Card', mobile_money: 'Mobile' };
    return <Badge variant="secondary" className="text-xs">{labels[method] || method}</Badge>;
  };

  const columns: Column<Sale>[] = [
    { key: 'receiptNo', label: 'Receipt #', render: (v) => <span className="font-mono text-xs font-medium">{v}</span> },
    {
      key: 'createdAt', label: 'Date',
      render: (v) => <span className="text-xs">{new Date(v).toLocaleDateString()} {new Date(v).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>,
    },
    { key: 'cashierName', label: 'Cashier', className: 'hidden md:table-cell' },
    { key: 'paymentMethod', label: 'Payment', render: (v) => paymentBadge(v), className: 'hidden sm:table-cell' },
    { key: 'items', label: 'Items', render: (v) => <span className="tabular-nums">{v?.length || 0}</span>, className: 'hidden lg:table-cell' },
    {
      key: 'total', label: 'Total',
      render: (v) => <span className="font-semibold tabular-nums">${Number(v).toFixed(2)}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">Sales History</h1>
        <p className="text-sm text-muted-foreground">{total} transactions</p>
      </div>

      <div className="flex flex-wrap gap-3 items-end">
        <div className="space-y-1">
          <Label className="text-xs">From</Label>
          <Input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(1); }} className="w-36 bg-card" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">To</Label>
          <Input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setPage(1); }} className="w-36 bg-card" />
        </div>
      </div>

      <DataTable
        columns={columns}
        data={sales}
        total={total}
        page={page}
        onPageChange={setPage}
        loading={loading}
        searchValue={search}
        onSearchChange={v => { setSearch(v); setPage(1); }}
        searchPlaceholder="Search by receipt # or cashier..."
        onRowClick={s => navigate(appPath(`/sales/${s.id}`))}
        emptyIcon={<History className="w-12 h-12" />}
        emptyMessage="No sales found"
      />
    </div>
  );
}
