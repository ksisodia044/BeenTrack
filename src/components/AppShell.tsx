import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import {
  LayoutDashboard, Package, Users, ShoppingCart, BarChart3,
  AlertTriangle, Settings, History, LogOut, Menu, X,
} from 'lucide-react';
import { useState } from 'react';
import { appPath, isPreviewMode } from '@/lib/preview';
import { BrandMark } from '@/components/BrandMark';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'POS (New Sale)', href: '/sales', icon: ShoppingCart },
  { name: 'Sales History', href: '/sales/history', icon: History },
  { name: 'Products', href: '/products', icon: Package },
  { name: 'Suppliers', href: '/suppliers', icon: Users, adminOnly: true },
  { name: 'Reports', href: '/reports', icon: BarChart3, adminOnly: true },
  { name: 'Low Stock', href: '/alerts/low-stock', icon: AlertTriangle },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function AppShell() {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const previewMode = isPreviewMode();

  const visibleNav = navigation.filter(n => !n.adminOnly || isAdmin);

  const handleLogout = () => {
    logout();
    navigate(previewMode ? '/preview' : '/login');
  };

  const sidebarContent = (
    <>
      <div className="p-5">
        <div className="flex items-center gap-2.5 px-2">
          <BrandMark size="sm" />
          <span className="font-semibold text-foreground tracking-tight text-base">
            BeanTrack{previewMode ? ' Preview' : ''}
          </span>
        </div>
      </div>

      <nav className="flex-1 px-3 space-y-0.5">
        {visibleNav.map((item) => (
          <NavLink
            key={item.name}
            to={appPath(item.href)}
            onClick={() => setMobileOpen(false)}
            end={item.href === '/sales'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
              }`
            }
          >
            <item.icon className="w-4 h-4 shrink-0" />
            {item.name}
          </NavLink>
        ))}
      </nav>

      <div className="p-3 mt-auto">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground w-full transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Log out
        </button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-60 bg-card shadow-soft flex-col z-20 shrink-0">
        {sidebarContent}
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-foreground/20 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-card shadow-elevated flex flex-col animate-slide-in-right">
            <div className="flex justify-end p-2">
              <button onClick={() => setMobileOpen(false)} className="p-2 rounded-lg hover:bg-secondary">
                <X className="w-5 h-5" />
              </button>
            </div>
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden min-w-0">
        <header className="h-14 bg-card/80 backdrop-blur-md shadow-soft flex items-center justify-between px-4 lg:px-8 z-10 shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => setMobileOpen(true)} className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-secondary">
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-sm font-medium text-muted-foreground hidden sm:block">Inventory Management</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-xs font-semibold text-foreground">{user?.name}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{user?.role}</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-primary-50 flex items-center justify-center text-primary-700 text-xs font-bold">
              {user?.name?.charAt(0) || 'U'}
            </div>
          </div>
        </header>

        <section className="flex-1 overflow-y-auto p-4 lg:p-8">
          <div className="max-w-7xl mx-auto animate-fade-in">
            <Outlet />
          </div>
        </section>
      </main>
    </div>
  );
}
