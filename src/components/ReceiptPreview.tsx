import type { Sale } from '@/types';

interface Props {
  sale: Sale;
  businessName?: string;
  footer?: string;
}

export function ReceiptPreview({ sale, businessName = 'BeanTrack Coffee', footer = 'Thank you for your purchase!' }: Props) {
  return (
    <div className="receipt-printable bg-card p-6 rounded-2xl shadow-soft max-w-sm mx-auto font-mono text-xs">
      <div className="text-center mb-4">
        <h2 className="text-base font-bold text-foreground">{businessName}</h2>
        <p className="text-muted-foreground mt-1">Receipt #{sale.receiptNo}</p>
        <p className="text-muted-foreground">{new Date(sale.createdAt).toLocaleString()}</p>
      </div>

      <div className="border-t border-dashed border-border py-3 space-y-1.5">
        {sale.items.map((item, i) => (
          <div key={i} className="flex justify-between">
            <span className="text-foreground">
              {item.qty}x {item.name}
            </span>
            <span className="text-foreground tabular-nums">${item.lineTotal.toFixed(2)}</span>
          </div>
        ))}
      </div>

      <div className="border-t border-dashed border-border py-3 space-y-1">
        <div className="flex justify-between text-muted-foreground">
          <span>Subtotal</span>
          <span className="tabular-nums">${sale.subtotal.toFixed(2)}</span>
        </div>
        {sale.discount > 0 && (
          <div className="flex justify-between text-success">
            <span>Discount</span>
            <span className="tabular-nums">-${sale.discount.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between text-muted-foreground">
          <span>Tax</span>
          <span className="tabular-nums">${sale.tax.toFixed(2)}</span>
        </div>
        <div className="flex justify-between font-bold text-foreground text-sm pt-1 border-t border-dashed border-border">
          <span>TOTAL</span>
          <span className="tabular-nums">${sale.total.toFixed(2)}</span>
        </div>
      </div>

      <div className="border-t border-dashed border-border pt-3 text-center">
        <p className="text-muted-foreground">Payment: {sale.paymentMethod.replace('_', ' ')}</p>
        <p className="text-muted-foreground">Cashier: {sale.cashierName}</p>
        <p className="text-muted-foreground mt-2 italic">{footer}</p>
      </div>
    </div>
  );
}
