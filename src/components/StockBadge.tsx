import { Badge } from '@/components/ui/badge';

type StockStatus = 'in-stock' | 'low-stock' | 'out-of-stock';

export function getStockStatus(qty: number, reorderLevel: number): StockStatus {
  if (qty <= 0) return 'out-of-stock';
  if (qty <= reorderLevel) return 'low-stock';
  return 'in-stock';
}

const config: Record<StockStatus, { label: string; className: string }> = {
  'in-stock': { label: 'In Stock', className: 'bg-success/10 text-success hover:bg-success/20 border-success/20' },
  'low-stock': { label: 'Low Stock', className: 'bg-warning/10 text-warning-foreground hover:bg-warning/20 border-warning/20' },
  'out-of-stock': { label: 'Out of Stock', className: 'bg-destructive/10 text-destructive hover:bg-destructive/20 border-destructive/20' },
};

export function StockBadge({ qty, reorderLevel }: { qty: number; reorderLevel: number }) {
  const status = getStockStatus(qty, reorderLevel);
  const { label, className } = config[status];
  return <Badge variant="outline" className={className}>{label}</Badge>;
}
