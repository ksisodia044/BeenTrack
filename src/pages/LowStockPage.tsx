import { useState, useEffect } from 'react';
import { AlertTriangle, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { StockBadge } from '@/components/StockBadge';
import { FormModal } from '@/components/FormModal';
import { Skeleton } from '@/components/ui/skeleton';
import { reportsApi } from '@/api/client';
import { toast } from '@/hooks/use-toast';
import type { Product } from '@/types';

export default function LowStockPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [restockModal, setRestockModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [restockQty, setRestockQty] = useState(0);

  useEffect(() => {
    reportsApi.lowStock().then(data => {
      const sorted = data.sort((a, b) => {
        const aRatio = a.reorderLevel > 0 ? a.stockQty / a.reorderLevel : 1;
        const bRatio = b.reorderLevel > 0 ? b.stockQty / b.reorderLevel : 1;
        return aRatio - bRatio;
      });
      setProducts(sorted);
      setLoading(false);
    });
  }, []);

  const openRestock = (p: Product) => {
    setSelectedProduct(p);
    setRestockQty(p.reorderLevel * 2);
    setRestockModal(true);
  };

  const handleRestock = () => {
    if (selectedProduct && restockQty > 0) {
      toast({ title: `Restock request for ${selectedProduct.name}: ${restockQty} units` });
      setRestockModal(false);
    }
  };

  if (loading) return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-48" />
      {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
    </div>
  );

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
          {products.map(p => {
            const pct = p.reorderLevel > 0 ? Math.round((p.stockQty / p.reorderLevel) * 100) : 0;
            return (
              <div key={p.id} className="bg-card p-4 rounded-xl shadow-soft flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className={`p-2 rounded-lg shrink-0 ${p.stockQty === 0 ? 'bg-destructive/10 text-destructive' : 'bg-warning/10 text-warning-foreground'}`}>
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-medium text-foreground truncate">{p.name}</h3>
                    <p className="text-xs text-muted-foreground">{p.sku} · {p.category}</p>
                    <div className="flex items-center gap-3 mt-1.5">
                      <div className="flex-1 h-1.5 bg-muted rounded-full max-w-[120px]">
                        <div
                          className={`h-full rounded-full ${pct <= 30 ? 'bg-destructive' : 'bg-warning'}`}
                          style={{ width: `${Math.min(100, pct)}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground tabular-nums">{p.stockQty} / {p.reorderLevel}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <StockBadge qty={p.stockQty} reorderLevel={p.reorderLevel} />
                  <Button size="sm" variant="outline" onClick={() => openRestock(p)}>Restock</Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <FormModal
        open={restockModal}
        onOpenChange={setRestockModal}
        title="Request Restock"
        description={selectedProduct ? `Restock ${selectedProduct.name}` : ''}
        onSubmit={handleRestock}
        submitLabel="Submit Request"
      >
        <div className="space-y-1.5">
          <Label>Quantity to order</Label>
          <Input
            type="number"
            value={restockQty}
            onChange={e => setRestockQty(parseInt(e.target.value) || 0)}
            min={1}
          />
        </div>
        {selectedProduct && (
          <p className="text-xs text-muted-foreground">
            Current stock: {selectedProduct.stockQty} · Reorder level: {selectedProduct.reorderLevel}
          </p>
        )}
      </FormModal>
    </div>
  );
}
