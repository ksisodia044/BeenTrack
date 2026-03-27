import { useState, useEffect, useMemo } from 'react';
import { Search, Plus, Minus, Trash2, CreditCard, Banknote, Smartphone, ShoppingCart, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { productsApi, salesApi } from '@/api/client';
import { ReceiptPreview } from '@/components/ReceiptPreview';
import { StockBadge } from '@/components/StockBadge';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import type { Product, CartItem, Sale } from '@/types';

export default function SalesPOSPage() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'card' | 'mobile_money'>('cash');
  const [processing, setProcessing] = useState(false);
  const [completedSale, setCompletedSale] = useState<Sale | null>(null);

  useEffect(() => {
    productsApi.list({ pageSize: 999 }).then(res => setProducts(res.data.filter(p => p.status === 'active')));
  }, []);

  const filtered = useMemo(() => {
    if (!search) return products;
    const s = search.toLowerCase();
    return products.filter(p => p.name.toLowerCase().includes(s) || p.sku.toLowerCase().includes(s));
  }, [products, search]);

  const addToCart = (p: Product) => {
    setCart(prev => {
      const existing = prev.find(ci => ci.productId === p.id);
      if (existing) {
        if (existing.qty >= p.stockQty) {
          toast({ title: 'Not enough stock', variant: 'destructive' });
          return prev;
        }
        return prev.map(ci =>
          ci.productId === p.id
            ? { ...ci, qty: ci.qty + 1, lineTotal: +((ci.qty + 1) * ci.unitPrice).toFixed(2) }
            : ci
        );
      }
      if (p.stockQty <= 0) {
        toast({ title: 'Out of stock', variant: 'destructive' });
        return prev;
      }
      return [...prev, {
        productId: p.id, name: p.name, sku: p.sku,
        unitPrice: p.sellingPrice, qty: 1,
        lineTotal: p.sellingPrice, maxStock: p.stockQty,
      }];
    });
  };

  const updateQty = (productId: string, delta: number) => {
    setCart(prev => prev.map(ci => {
      if (ci.productId !== productId) return ci;
      const newQty = Math.max(1, Math.min(ci.maxStock, ci.qty + delta));
      return { ...ci, qty: newQty, lineTotal: +(newQty * ci.unitPrice).toFixed(2) };
    }));
  };

  const removeItem = (productId: string) => {
    setCart(prev => prev.filter(ci => ci.productId !== productId));
  };

  const subtotal = +cart.reduce((s, ci) => s + ci.lineTotal, 0).toFixed(2);
  const tax = +((subtotal) * 0.15).toFixed(2);
  const total = +(subtotal + tax).toFixed(2);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setProcessing(true);
    try {
      const sale = await salesApi.create({
        items: cart.map(ci => ({ productId: ci.productId, qty: ci.qty })),
        paymentMethod,
        cashierName: user?.name || 'Unknown',
        cashierId: user?.id || '',
      });
      setCompletedSale(sale);
      setCart([]);
      toast({ title: 'Sale completed!' });
    } catch {
      toast({ title: 'Checkout failed', variant: 'destructive' });
    }
    setProcessing(false);
  };

  if (completedSale) {
    return (
      <div className="max-w-md mx-auto space-y-6 py-8">
        <div className="text-center">
          <div className="w-14 h-14 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-7 h-7 text-success" />
          </div>
          <h1 className="text-xl font-bold text-foreground">Sale Complete!</h1>
          <p className="text-sm text-muted-foreground mt-1">Receipt #{completedSale.receiptNo}</p>
        </div>
        <ReceiptPreview sale={completedSale} />
        <div className="flex gap-3 justify-center">
          <Button variant="outline" onClick={() => window.print()}>Print Receipt</Button>
          <Button onClick={() => setCompletedSale(null)}>New Sale</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-foreground">Point of Sale</h1>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-[calc(100vh-12rem)]">
        {/* Product Selection */}
        <div className="lg:col-span-8 flex flex-col gap-4 min-h-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-card shadow-soft rounded-xl text-sm outline-none focus:ring-2 focus:ring-ring transition-all placeholder:text-muted-foreground"
              placeholder="Search by product name or SKU..."
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 overflow-y-auto pr-1 flex-1">
            {filtered.map(p => (
              <button
                key={p.id}
                onClick={() => addToCart(p)}
                disabled={p.stockQty <= 0}
                className="bg-card p-4 rounded-xl shadow-soft hover:shadow-card transition-all text-left group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="text-[10px] font-bold text-accent uppercase tracking-widest">{p.category}</span>
                <h3 className="font-medium text-foreground mt-1 text-sm leading-snug">{p.name}</h3>
                <div className="flex justify-between items-end mt-3">
                  <span className="text-base font-semibold text-primary">${p.sellingPrice.toFixed(2)}</span>
                  <span className="text-[10px] text-muted-foreground">{p.stockQty} in stock</span>
                </div>
              </button>
            ))}
            {filtered.length === 0 && (
              <div className="col-span-full py-16 text-center text-muted-foreground">
                <ShoppingCart className="w-10 h-10 mx-auto mb-2 opacity-10" />
                <p className="text-sm">No products found</p>
              </div>
            )}
          </div>
        </div>

        {/* Cart */}
        <div className="lg:col-span-4 bg-card rounded-2xl shadow-card flex flex-col overflow-hidden min-h-[400px] lg:min-h-0">
          <div className="p-5 border-b border-border/50">
            <h2 className="font-semibold text-foreground">Current Order</h2>
            <p className="text-xs text-muted-foreground">{cart.length} items</p>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground min-h-[120px]">
                <ShoppingCart className="w-10 h-10 mb-2 opacity-10" />
                <p className="text-sm">Cart is empty</p>
              </div>
            ) : (
              cart.map(item => (
                <div key={item.productId} className="flex justify-between items-center gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate">{item.name}</p>
                    <p className="text-xs text-muted-foreground">${item.unitPrice.toFixed(2)} × {item.qty}</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button onClick={() => updateQty(item.productId, -1)} className="p-1 rounded bg-secondary hover:bg-muted">
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-sm font-medium w-6 text-center tabular-nums">{item.qty}</span>
                    <button onClick={() => updateQty(item.productId, 1)} className="p-1 rounded bg-secondary hover:bg-muted">
                      <Plus className="w-3 h-3" />
                    </button>
                    <button onClick={() => removeItem(item.productId)} className="p-1 rounded hover:bg-destructive/10 text-destructive ml-1">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                  <span className="text-sm font-medium tabular-nums w-16 text-right">${item.lineTotal.toFixed(2)}</span>
                </div>
              ))
            )}
          </div>

          <div className="p-5 bg-muted/30 space-y-2.5 border-t border-border/50">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Subtotal</span><span className="tabular-nums">${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Tax (15%)</span><span className="tabular-nums">${tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold text-foreground pt-2 border-t border-border/50">
              <span>Total</span><span className="tabular-nums">${total.toFixed(2)}</span>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-3">
              {[
                { value: 'cash' as const, icon: Banknote, label: 'Cash' },
                { value: 'card' as const, icon: CreditCard, label: 'Card' },
                { value: 'mobile_money' as const, icon: Smartphone, label: 'Mobile' },
              ].map(pm => (
                <button
                  key={pm.value}
                  onClick={() => setPaymentMethod(pm.value)}
                  className={`flex flex-col items-center gap-1 py-2.5 rounded-lg text-xs font-medium transition-all ${
                    paymentMethod === pm.value
                      ? 'bg-primary text-primary-foreground shadow-soft'
                      : 'bg-card border border-border hover:bg-secondary'
                  }`}
                >
                  <pm.icon className="w-4 h-4" />
                  {pm.label}
                </button>
              ))}
            </div>

            <Button
              className="w-full mt-2"
              disabled={cart.length === 0 || processing}
              onClick={handleCheckout}
            >
              {processing ? 'Processing...' : `Checkout $${total.toFixed(2)}`}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
