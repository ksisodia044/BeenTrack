import { useState, useEffect } from 'react';
import { DollarSign, ShoppingCart, TrendingUp, Download } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { StatCard } from '@/components/StatCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { reportsApi } from '@/api/client';
import type { ReportSummary, TopProduct, Product } from '@/types';

const COLORS = ['#3E2723', '#5D4037', '#6D4C41', '#795548', '#8D6E63', '#A1887F', '#BCAAA4', '#D7CCC8', '#EFEBE9', '#4E342E'];

export default function ReportsPage() {
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [lowStock, setLowStock] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  useEffect(() => {
    Promise.all([
      reportsApi.summary({ from: dateFrom, to: dateTo }),
      reportsApi.topProducts({ from: dateFrom, to: dateTo }),
      reportsApi.lowStock(),
    ]).then(([s, tp, ls]) => {
      setSummary(s); setTopProducts(tp); setLowStock(ls); setLoading(false);
    });
  }, [dateFrom, dateTo]);

  const exportCSV = (data: any[], filename: string) => {
    if (!data.length) return;
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(r => Object.values(r).join(',')).join('\n');
    const blob = new Blob([`${headers}\n${rows}`], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${filename}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-48" />
      <div className="grid grid-cols-3 gap-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}</div>
      <Skeleton className="h-72 rounded-2xl" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-foreground">Reports</h1>
          <p className="text-sm text-muted-foreground">Business analytics and insights</p>
        </div>
        <div className="flex gap-3 items-end">
          <div className="space-y-1">
            <Label className="text-xs">From</Label>
            <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="w-36 bg-card" />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">To</Label>
            <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="w-36 bg-card" />
          </div>
        </div>
      </div>

      {/* Summary */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard label="Total Revenue" value={`$${summary.totalRevenue.toFixed(2)}`} icon={DollarSign} />
          <StatCard label="Transactions" value={summary.transactionCount} icon={ShoppingCart} />
          <StatCard label="Average Sale" value={`$${summary.averageSale.toFixed(2)}`} icon={TrendingUp} />
        </div>
      )}

      {/* Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card p-5 rounded-2xl shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-foreground">Top Selling Products (by Revenue)</h3>
            <Button variant="ghost" size="sm" onClick={() => exportCSV(topProducts, 'top-products')}>
              <Download className="w-3 h-3 mr-1" /> CSV
            </Button>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={topProducts.slice(0, 8)} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis type="number" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis
                type="category" dataKey="name" width={100}
                tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
              />
              <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} />
              <Bar dataKey="totalRevenue" fill="#5D4037" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card p-5 rounded-2xl shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-foreground">Top Products (by Quantity)</h3>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={topProducts.slice(0, 6)} dataKey="totalQty" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, percent }) => `${name.slice(0, 12)} ${(percent * 100).toFixed(0)}%`} labelLine={false} style={{ fontSize: 10 }}>
                {topProducts.slice(0, 6).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Low Stock Report */}
      <div className="bg-card p-5 rounded-2xl shadow-soft">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-foreground">Low Stock Report ({lowStock.length} items)</h3>
          <Button variant="ghost" size="sm" onClick={() => exportCSV(lowStock.map(p => ({ name: p.name, sku: p.sku, stock: p.stockQty, reorderLevel: p.reorderLevel })), 'low-stock')}>
            <Download className="w-3 h-3 mr-1" /> CSV
          </Button>
        </div>
        {lowStock.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">All products are well-stocked!</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-[11px] text-muted-foreground uppercase tracking-wider">
                  <th className="py-2 px-3">Product</th>
                  <th className="py-2 px-3">SKU</th>
                  <th className="py-2 px-3">Stock</th>
                  <th className="py-2 px-3">Reorder Level</th>
                  <th className="py-2 px-3">Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {lowStock.map(p => (
                  <tr key={p.id} className="hover:bg-muted/30">
                    <td className="py-2.5 px-3 font-medium">{p.name}</td>
                    <td className="py-2.5 px-3 font-mono text-xs">{p.sku}</td>
                    <td className="py-2.5 px-3 tabular-nums">{p.stockQty}</td>
                    <td className="py-2.5 px-3 tabular-nums">{p.reorderLevel}</td>
                    <td className="py-2.5 px-3 tabular-nums">${(p.stockQty * p.costPrice).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
