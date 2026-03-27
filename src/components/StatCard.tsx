import type { LucideIcon } from 'lucide-react';

interface Props {
  label: string;
  value: string | number;
  trend?: number;
  icon: LucideIcon;
}

export function StatCard({ label, value, trend, icon: Icon }: Props) {
  return (
    <div className="bg-card p-5 rounded-2xl shadow-soft">
      <div className="flex justify-between items-start">
        <div className="min-w-0">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider truncate">{label}</p>
          <h3 className="text-2xl font-bold text-foreground mt-1 tabular-nums">{value}</h3>
          {trend !== undefined && (
            <p className={`text-xs mt-1.5 font-medium ${trend >= 0 ? 'text-success' : 'text-destructive'}`}>
              {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%{' '}
              <span className="text-muted-foreground font-normal">vs last week</span>
            </p>
          )}
        </div>
        <div className="p-2.5 bg-primary-50 rounded-xl text-primary-700 shrink-0">
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}
