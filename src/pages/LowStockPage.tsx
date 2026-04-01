import { useEffect, useState } from 'react';
import { AlertTriangle, Package } from 'lucide-react';
import { StockBadge } from '@/components/StockBadge';
import { Skeleton } from '@/components/ui/skeleton';
import { reportsApi } from '@/api/client';
import { toast } from '@/hooks/use-toast';
import type { Product } from '@/types';

export default function LowStockPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    reportsApi.lowStock()
      .then(data => {
        const sortedProducts = data.sort((left, right) => {
          const leftRatio = left.reorderLevel > 0 ? left.stockQty / left.reorderLevel : 1;
          const rightRatio = right.reorderLevel > 0 ? right.stockQty / right.reorderLevel : 1;
          return leftRatio - rightRatio;
        });
        setProducts(sortedProducts);
      })
      .catch(() => {
        toast({ title: 'Failed to load low stock alerts', variant: 'destructive' });
        setProducts([]);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        {Array.from({ length: 5 }).map((_, index) => <Skeleton key={index} className="h-16 rounded-xl" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">Low Stock Alerts</h1>
        <p className="text-sm text-muted-foreground">{products.length} items below reorder level</p>
      </div>

      {products.length === 0 ? (
        <div className="bg-card rounded-2xl shadow-soft py-16 text-center">
          <Package className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-10" />
          <h3 className="font-medium text-foreground">No low stock items</h3>
          <p className="text-sm text-muted-foreground mt-1">All products are well-stocked!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {products.map(product => {
            const percentageToReorder = product.reorderLevel > 0
              ? Math.round((product.stockQty / product.reorderLevel) * 100)
              : 0;

            return (
              <div key={product.id} className="bg-card p-4 rounded-xl shadow-soft flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className={`p-2 rounded-lg shrink-0 ${product.stockQty === 0 ? 'bg-destructive/10 text-destructive' : 'bg-warning/10 text-warning-foreground'}`}>
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-medium text-foreground truncate">{product.name}</h3>
                    <p className="text-xs text-muted-foreground">{product.sku} x {product.category}</p>
                    <div className="flex items-center gap-3 mt-1.5">
                      <div className="flex-1 h-1.5 bg-muted rounded-full max-w-[120px]">
                        <div
                          className={`h-full rounded-full ${percentageToReorder <= 30 ? 'bg-destructive' : 'bg-warning'}`}
                          style={{ width: `${Math.min(100, percentageToReorder)}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground tabular-nums">{product.stockQty} / {product.reorderLevel}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <StockBadge qty={product.stockQty} reorderLevel={product.reorderLevel} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
