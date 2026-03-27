import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export interface Column<T> {
  key: string;
  label: string;
  render?: (value: any, row: T) => React.ReactNode;
  className?: string;
}

interface Props<T> {
  columns: Column<T>[];
  data: T[];
  total?: number;
  page?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
  loading?: boolean;
  searchValue?: string;
  onSearchChange?: (v: string) => void;
  searchPlaceholder?: string;
  emptyIcon?: React.ReactNode;
  emptyMessage?: string;
  headerActions?: React.ReactNode;
  onRowClick?: (row: T) => void;
}

export function DataTable<T extends Record<string, any>>({
  columns, data, total = 0, page = 1, pageSize = 10,
  onPageChange, loading, searchValue, onSearchChange,
  searchPlaceholder = 'Search...', emptyIcon, emptyMessage = 'No data found',
  headerActions, onRowClick,
}: Props<T>) {
  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="bg-card rounded-2xl shadow-soft overflow-hidden">
      {(onSearchChange || headerActions) && (
        <div className="p-4 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
          {onSearchChange && (
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                value={searchValue}
                onChange={e => onSearchChange(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-secondary rounded-lg text-sm outline-none focus:ring-2 focus:ring-ring transition-all placeholder:text-muted-foreground"
                placeholder={searchPlaceholder}
              />
            </div>
          )}
          {headerActions && <div className="flex gap-2 shrink-0">{headerActions}</div>}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-muted/50">
              {columns.map(col => (
                <th key={col.key} className={`px-4 lg:px-6 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wider ${col.className || ''}`}>
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/50">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {columns.map(col => (
                    <td key={col.key} className="px-4 lg:px-6 py-4">
                      <Skeleton className="h-4 w-24" />
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-16 text-center">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    {emptyIcon && <div className="opacity-10">{emptyIcon}</div>}
                    <p className="text-sm">{emptyMessage}</p>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((row, i) => (
                <tr
                  key={row.id || i}
                  onClick={() => onRowClick?.(row)}
                  className={`hover:bg-muted/30 transition-colors ${onRowClick ? 'cursor-pointer' : ''}`}
                >
                  {columns.map(col => (
                    <td key={col.key} className={`px-4 lg:px-6 py-3.5 text-sm text-foreground ${col.className || ''}`}>
                      {col.render ? col.render(row[col.key], row) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="px-4 lg:px-6 py-3 flex items-center justify-between text-sm text-muted-foreground border-t border-border/50">
          <span>Page {page} of {totalPages} ({total} items)</span>
          <div className="flex gap-1">
            <button
              disabled={page <= 1}
              onClick={() => onPageChange?.(page - 1)}
              className="p-1.5 rounded-md hover:bg-secondary disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => onPageChange?.(page + 1)}
              className="p-1.5 rounded-md hover:bg-secondary disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
