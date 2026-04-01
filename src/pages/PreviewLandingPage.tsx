import { Link } from 'react-router-dom';
import { Eye, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PreviewLandingPage() {
  return (
    <div className="min-h-screen bg-background px-4 py-12">
      <div className="mx-auto max-w-3xl space-y-8">
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-xl font-bold text-primary-foreground">
            B
          </div>
          <h1 className="mt-5 text-3xl font-bold text-foreground">Preview BeanTrack without logging in</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            These preview routes use mock users and mock data so you can inspect the interface safely.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl bg-card p-6 shadow-soft">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-secondary p-3 text-foreground">
                <Eye className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">Staff Preview</h2>
                <p className="text-sm text-muted-foreground">See the everyday cashier and inventory screens.</p>
              </div>
            </div>
            <Button asChild className="mt-6 w-full">
              <Link to="/preview/staff/dashboard">Open Staff Preview</Link>
            </Button>
          </div>

          <div className="rounded-2xl bg-card p-6 shadow-soft">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-secondary p-3 text-foreground">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">Admin Preview</h2>
                <p className="text-sm text-muted-foreground">Inspect supplier, reports, and admin settings pages.</p>
              </div>
            </div>
            <Button asChild className="mt-6 w-full">
              <Link to="/preview/admin/dashboard">Open Admin Preview</Link>
            </Button>
          </div>
        </div>

        <div className="rounded-2xl border border-border/60 bg-card p-5 text-sm text-muted-foreground shadow-soft">
          Preview mode is isolated from your live account. You can browse the pages and click through flows, but no
          real login is required.
        </div>
      </div>
    </div>
  );
}
