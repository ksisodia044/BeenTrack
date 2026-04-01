import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DollarSign, Package, Users, AlertTriangle, ShoppingCart, Plus, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { StatCard } from '@/components/StatCard';
import { StockBadge } from '@/components/StockBadge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { dashboardApi } from '@/api/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import type { DashboardSummary } from '@/types';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const loadSummary = useCallback(async () => {
    setLoading(true);

    try {
      const summary = await dashboardApi.summary();
      setData(summary);
    } catch {
      setData(null);
      toast({ title: 'Failed to load dashboard', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSummary();
  }, [loadSummary]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-72 rounded-2xl" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-2xl bg-card p-6 shadow-soft">
        <h1 className="text-xl font-bold text-foreground">Dashboard</h1>
        <p className="mt-2 text-sm text-muted-foreground">The dashboard could not be loaded.</p>
        <Button variant="outline" className="mt-4" onClick={() => void loadSummary()}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Overview of your business</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={() => navigate('/sales')}>
            <ShoppingCart className="w-4 h-4 mr-1" /> New Sale
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard label="Sales Today" value={`$${data.totalSalesToday.toFixed(2)}`} trend={12} icon={DollarSign} />
        <StatCard label="This Week" value={`$${data.salesThisWeek.toFixed(2)}`} trend={8} icon={TrendingUp} />
        <StatCard label="Low Stock Items" value={data.lowStockCount} icon={AlertTriangle} />
        <StatCard label="Total Products" value={data.totalProducts} icon={Package} />
        <StatCard label="Total Suppliers" value={data.totalSuppliers} icon={Users} />
      </div>

      {/* Charts + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Trend */}
        <div className="lg:col-span-2 bg-card p-5 rounded-2xl shadow-soft">
          <h3 className="text-sm font-semibold text-foreground mb-4">Sales Trend (Last 7 Days)</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={data.salesTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
              />
              <Bar dataKey="amount" fill="#5D4037" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Quick Actions */}
        <div className="bg-card p-5 rounded-2xl shadow-soft">
          <h3 className="text-sm font-semibold text-foreground mb-4">Quick Actions</h3>
          <div className="space-y-2">
            <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/sales')}>
              <ShoppingCart className="w-4 h-4 mr-2" /> New Sale
            </Button>
            <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/products')}>
              <Plus className="w-4 h-4 mr-2" /> Add Product
            </Button>
            {isAdmin && (
              <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/suppliers')}>
                <Plus className="w-4 h-4 mr-2" /> Add Supplier
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Low Stock Preview */}
      <div className="bg-card p-5 rounded-2xl shadow-soft">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-foreground">Low Stock Items</h3>
          <Button variant="ghost" size="sm" onClick={() => navigate('/alerts/low-stock')}>
            View all
          </Button>
        </div>
        {data.topLowStock.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            <AlertTriangle className="w-10 h-10 mx-auto mb-2 opacity-10" />
            <p className="text-sm">No low stock items</p>
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {data.topLowStock.map(p => (
              <div key={p.id} className="flex items-center justify-between py-2.5">
                <div>
                  <p className="text-sm font-medium text-foreground">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{p.sku} - {p.category}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm tabular-nums text-foreground">{p.stockQty} / {p.reorderLevel}</span>
                  <StockBadge qty={p.stockQty} reorderLevel={p.reorderLevel} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
