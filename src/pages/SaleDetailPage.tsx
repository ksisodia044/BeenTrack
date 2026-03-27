import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ReceiptPreview } from '@/components/ReceiptPreview';
import { Skeleton } from '@/components/ui/skeleton';
import { salesApi } from '@/api/client';
import type { Sale } from '@/types';

export default function SaleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [sale, setSale] = useState<Sale | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    salesApi.getById(id).then(s => { setSale(s); setLoading(false); }).catch(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="max-w-md mx-auto space-y-4 py-8"><Skeleton className="h-96 rounded-2xl" /></div>;
  if (!sale) return (
    <div className="text-center py-16">
      <p className="text-muted-foreground">Sale not found</p>
      <Button variant="ghost" onClick={() => navigate('/sales/history')} className="mt-4">Go back</Button>
    </div>
  );

  return (
    <div className="max-w-md mx-auto space-y-6 py-4">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => navigate('/sales/history')}>
          <ArrowLeft className="w-4 h-4 mr-1" /> Back
        </Button>
        <Button variant="outline" size="sm" onClick={() => window.print()}>
          <Printer className="w-4 h-4 mr-1" /> Print
        </Button>
      </div>
      <ReceiptPreview sale={sale} />
    </div>
  );
}
