import React, { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import NotificationDropdown from '@/components/NotificationDropdown';
import { Sprout, Menu, Moon, Sun, LayoutDashboard, ShoppingBag, PlusCircle, Users, Truck, Route, LineChart, Package, Heart, Bell } from 'lucide-react';

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');

  const navItems = {
    FARMER: [
      { name: 'Dashboard', href: '/farmer', icon: LayoutDashboard },
      { name: 'My Listings', href: '/farmer/listings', icon: Package },
      { name: 'Add Produce', href: '/farmer/add-listing', icon: PlusCircle },
      { name: 'Orders', href: '/farmer/orders', icon: ShoppingBag },
    ],
    CONSUMER: [
      { name: 'Dashboard', href: '/consumer', icon: LayoutDashboard },
      { name: 'My Orders', href: '/consumer/orders', icon: ShoppingBag },
      { name: 'Saved Products', href: '/consumer/saved', icon: Heart },
    ],
    BULK_BUYER: [
      { name: 'Dashboard', href: '/buyer', icon: LayoutDashboard },
      { name: 'Procurement', href: '/buyer/procurement', icon: Package },
      { name: 'Orders', href: '/buyer/orders', icon: ShoppingBag },
    ],
    FPO: [
      { name: 'Dashboard', href: '/fpo', icon: LayoutDashboard },
      { name: 'Listings', href: '/farmer/listings', icon: Package },
      { name: 'Add Bulk Produce', href: '/farmer/add-listing', icon: PlusCircle },
      { name: 'Orders', href: '/farmer/orders', icon: ShoppingBag },
    ],
    LOGISTICS: [
      { name: 'Dashboard', href: '/logistics', icon: LayoutDashboard },
      { name: 'Route Optimizer', href: '/logistics/route', icon: Route },
    ],
    ADMIN: [
      { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
      { name: 'Users', href: '/admin/users', icon: Users },
      { name: 'Listings', href: '/admin/listings', icon: Package },
      { name: 'Orders', href: '/admin/orders', icon: ShoppingBag },
      { name: 'Impact', href: '/admin/impact', icon: LineChart },
    ]
  };

  const links = user ? navItems[user.role as keyof typeof navItems] || [] : [];

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b bg-background px-6">
        <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setSidebarOpen(!sidebarOpen)}>
          <Menu className="h-5 w-5" />
        </Button>
        <Link to="/" className="flex items-center gap-2 font-semibold">
          <Sprout className="h-6 w-6 text-emerald-600" />
          <span className="font-bold text-lg tracking-tight">KrishiSetu</span>
          <span className="text-xs bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-semibold px-2 py-0.5 rounded-full uppercase ml-1">
            {user?.role?.replace('_', ' ')}
          </span>
        </Link>
        <div className="ml-auto flex items-center gap-3">
          <NotificationDropdown />
          <Button variant="ghost" size="icon" onClick={toggleTheme}>
            {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
          <div className="text-sm font-medium hidden md:block">{user?.name}</div>
          <Button variant="outline" size="sm" onClick={logout}>Logout</Button>
        </div>
      </header>
      <div className="flex flex-1 overflow-hidden">
        <aside className={`${sidebarOpen ? 'block' : 'hidden'} md:block w-64 border-r bg-muted/30 z-30 fixed md:relative h-[calc(100vh-4rem)]`}>
          <div className="h-full flex flex-col gap-2 p-4">
            <div className="space-y-1">
              {links.map((link) => {
                const Icon = link.icon;
                const isActive = location.pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    to={link.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all ${isActive ? 'bg-emerald-600 text-white shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-muted'}`}
                  >
                    <Icon className="h-4 w-4" />
                    {link.name}
                  </Link>
                );
              })}
            </div>
            <div className="mt-auto pt-4 border-t space-y-1">
              <Link
                to="/marketplace"
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
              >
                <ShoppingBag className="h-4 w-4" />
                Marketplace
              </Link>
              <Link
                to="/notifications"
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
              >
                <Bell className="h-4 w-4" />
                All Notifications
              </Link>
            </div>
          </div>
        </aside>
        <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-50/50 dark:bg-zinc-950">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
