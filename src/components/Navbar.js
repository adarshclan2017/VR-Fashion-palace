'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import {
  LayoutDashboard,
  Receipt,
  Layers,
  BarChart3,
  FileText,
  LogOut,
  Shield,
  User,
  Users,
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  Sparkles
} from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const { user, logout, canAccess } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Close sidebar on route change or ESC key
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setSidebarOpen(false);
        setShowUserMenu(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Prevent background scroll when sidebar is open on mobile
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [sidebarOpen]);

  // Don't render navbar on login page or if not logged in
  if (!user || pathname === '/login') return null;

  const allNavLinks = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard, badge: 'Overview' },
    { name: 'New Bill (POS)', href: '/billing', icon: Receipt, badge: 'Fast POS' },
    { name: 'Stock & Apparel', href: '/inventory', icon: Layers, badge: 'Inventory' },
    { name: 'Invoices & History', href: '/invoices', icon: FileText, badge: 'Receipts' },
    { name: 'Sales Reports', href: '/reports', icon: BarChart3, badge: 'Analytics' },
    { name: 'Staff Users', href: '/admin/users', icon: Users, badge: 'Admin Only' },
  ];

  // Filter links based on user role
  const navLinks = allNavLinks.filter((link) => canAccess(link.href));

  const handleLogout = async () => {
    setShowUserMenu(false);
    setSidebarOpen(false);
    await logout();
  };

  return (
    <>
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-rose-100 shadow-sm transition-all">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* Left Section: Sidebar Toggle & Brand Logo */}
            <div className="flex items-center gap-2.5 sm:gap-4">
              {/* Sidebar Toggle Button */}
              <button
                type="button"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 sm:p-2.5 rounded-xl border border-slate-200 hover:border-rose-300 bg-slate-50 hover:bg-rose-50/70 text-slate-700 hover:text-rose-700 transition active:scale-95 flex items-center gap-2"
                aria-label="Toggle Side Navigation Bar"
                title="Toggle Side Menu"
              >
                <Menu className="w-5 h-5 sm:w-5 sm:h-5 text-slate-700 hover:text-rose-600" />
                <span className="hidden md:inline-block text-xs font-black tracking-wide text-slate-700 uppercase">
                  Menu
                </span>
              </button>

              {/* Logo & Brand */}
              <Link
                href={user.role === 'admin' ? '/' : '/billing'}
                className="flex items-center gap-2.5 sm:gap-3 group shrink-0"
              >
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl overflow-hidden shadow-md shadow-amber-950/20 bg-black border border-amber-400/40 p-0.5 group-hover:scale-105 transition-transform flex items-center justify-center">
                  <img
                    src="/logo.png"
                    alt="VR Fashion Palace Logo"
                    className="w-full h-full object-contain rounded-[14px]"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <span className="font-heading text-base sm:text-2xl font-black tracking-tight bg-gradient-to-r from-purple-950 via-rose-700 to-purple-900 bg-clip-text text-transparent">
                      VR FASHION PALACE
                    </span>
                    <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-200">
                      Boutique
                    </span>
                  </div>
                  <p className="text-[10px] sm:text-xs text-rose-800/80 font-semibold tracking-wide flex items-center gap-1">
                    <span>Women & Kids Wear</span>
                    <span className="text-rose-400">&bull;</span>
                    <span className="text-slate-500 font-medium">Billing POS</span>
                  </p>
                </div>
              </Link>
            </div>

            {/* Desktop Navigation Links */}
            <nav className="hidden xl:flex items-center gap-1.5">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                      isActive
                        ? 'bg-rose-600 text-white shadow-md shadow-rose-600/25'
                        : 'text-slate-600 hover:text-rose-700 hover:bg-rose-50/60'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-rose-500'}`} />
                    <span>{link.name}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Right Section Actions */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Quick POS New Bill Button */}
              <Link
                href="/billing"
                className="flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white text-xs sm:text-sm font-bold shadow-md shadow-rose-600/20 transition active:scale-95"
              >
                <Receipt className="w-4 h-4" />
                <span className="hidden sm:inline">New Bill</span>
                <span className="sm:hidden">POS</span>
              </Link>

              {/* User Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition"
                  aria-label="User Menu"
                >
                  <div
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold ${
                      user.role === 'admin'
                        ? 'bg-gradient-to-br from-amber-500 to-rose-600 shadow-sm shadow-amber-500/20'
                        : 'bg-gradient-to-br from-blue-500 to-indigo-600 shadow-sm shadow-blue-500/20'
                    }`}
                  >
                    {user.role === 'admin' ? <Shield className="w-4 h-4" /> : <User className="w-4 h-4" />}
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-xs font-bold text-slate-800 leading-none">{user.displayName || user.username}</p>
                    <p className="text-[10px] font-semibold text-rose-600 capitalize leading-tight mt-0.5">
                      {user.role === 'admin' ? 'Store Admin' : 'Cashier Staff'}
                    </p>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-4 py-2.5 border-b border-slate-100">
                      <p className="text-xs font-bold text-slate-900">{user.displayName || user.username}</p>
                      <p className="text-[11px] text-slate-400 font-mono">@{user.username}</p>
                      <span
                        className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          user.role === 'admin' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {user.role === 'admin' ? 'Full Admin Access' : 'Cashier Billing Access'}
                      </span>
                    </div>

                    {user.role === 'admin' && (
                      <Link
                        href="/admin/users"
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-rose-50 hover:text-rose-700 transition"
                      >
                        <Users className="w-4 h-4 text-slate-400" />
                        <span>Manage Staff Accounts</span>
                      </Link>
                    )}

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 transition text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Side Navigation Bar (Toggleable Drawer) */}
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 transition-opacity duration-300 ${
          sidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setSidebarOpen(false)}
        aria-hidden="true"
      />

      {/* Sidebar Drawer Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 w-72 sm:w-80 bg-gradient-to-b from-slate-950 via-purple-950 to-slate-950 text-white z-50 shadow-2xl flex flex-col border-r border-rose-900/30 transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Side Navigation Bar"
      >
        {/* Sidebar Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between bg-black/30">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl overflow-hidden shadow-lg bg-black border border-amber-400/40 p-1 shrink-0 flex items-center justify-center">
              <img
                src="/logo.png"
                alt="VR Fashion Palace"
                className="w-full h-full object-contain rounded-xl"
              />
            </div>
            <div>
              <h2 className="font-heading text-lg font-black tracking-tight text-white leading-tight">
                VR FASHION
              </h2>
              <p className="text-[11px] font-semibold text-amber-300 tracking-wider uppercase">
                Palace Boutique
              </p>
            </div>
          </div>

          <button
            onClick={() => setSidebarOpen(false)}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sidebar Quick Action */}
        <div className="p-4 border-b border-white/10 bg-white/5">
          <Link
            href="/billing"
            onClick={() => setSidebarOpen(false)}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-rose-600 via-pink-600 to-amber-500 hover:from-rose-500 hover:to-amber-400 text-white text-xs font-black shadow-lg shadow-rose-900/40 transition active:scale-95"
          >
            <Receipt className="w-4 h-4" />
            <span>+ Open Billing Counter</span>
          </Link>
        </div>

        {/* Sidebar Navigation Links */}
        <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          <div className="px-3 pb-2 text-[10px] font-black uppercase tracking-wider text-rose-300/70">
            Navigation Menu
          </div>

          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition-all group ${
                  isActive
                    ? 'bg-rose-600 text-white shadow-lg shadow-rose-900/40 font-black'
                    : 'text-slate-300 hover:bg-white/10 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`p-1.5 rounded-lg ${
                      isActive ? 'bg-white/20 text-white' : 'bg-white/5 text-rose-300 group-hover:text-white'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <span>{link.name}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {link.badge && (
                    <span
                      className={`text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider ${
                        isActive
                          ? 'bg-white text-rose-700'
                          : 'bg-white/10 text-slate-300'
                      }`}
                    >
                      {link.badge}
                    </span>
                  )}
                  <ChevronRight
                    className={`w-3.5 h-3.5 transition-transform ${
                      isActive ? 'text-white translate-x-0.5' : 'text-slate-500 group-hover:text-slate-300'
                    }`}
                  />
                </div>
              </Link>
            );
          })}
        </div>

        {/* User Card & Sign Out at Bottom of Sidebar */}
        <div className="p-4 border-t border-white/10 bg-black/40">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold ${
                  user.role === 'admin'
                    ? 'bg-gradient-to-br from-amber-500 to-rose-600 shadow-sm'
                    : 'bg-gradient-to-br from-blue-500 to-indigo-600 shadow-sm'
                }`}
              >
                {user.role === 'admin' ? <Shield className="w-4 h-4" /> : <User className="w-4 h-4" />}
              </div>
              <div>
                <p className="text-xs font-bold text-white leading-tight">
                  {user.displayName || user.username}
                </p>
                <span
                  className={`inline-block mt-0.5 px-1.5 py-0.2 rounded text-[9px] font-black uppercase tracking-wider ${
                    user.role === 'admin'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                  }`}
                >
                  {user.role === 'admin' ? 'Store Admin' : 'Staff Cashier'}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-red-500/15 hover:bg-red-500/25 text-red-300 hover:text-red-200 border border-red-500/30 text-xs font-bold transition"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out Account</span>
          </button>
        </div>
      </aside>

      {/* Mobile Bottom Quick-Access Bar (for quick POS billing on touch devices) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200 px-3 py-2 shadow-2xl flex items-center justify-around">
        <button
          onClick={() => setSidebarOpen(true)}
          className="flex flex-col items-center gap-0.5 text-[10px] font-bold text-slate-600 hover:text-rose-600 transition"
        >
          <Menu className="w-4 h-4 text-slate-700" />
          <span>Menu</span>
        </button>

        <Link
          href="/"
          className={`flex flex-col items-center gap-0.5 text-[10px] font-bold transition ${
            pathname === '/' ? 'text-rose-600 font-extrabold' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>Home</span>
        </Link>

        <Link
          href="/billing"
          className="flex flex-col items-center gap-0.5 -mt-4 bg-gradient-to-tr from-purple-900 via-rose-600 to-pink-500 text-white px-4 py-2 rounded-2xl shadow-lg shadow-rose-600/30 text-[10px] font-black active:scale-95 transition"
        >
          <Receipt className="w-5 h-5" />
          <span>New Bill</span>
        </Link>

        <Link
          href="/inventory"
          className={`flex flex-col items-center gap-0.5 text-[10px] font-bold transition ${
            pathname === '/inventory' ? 'text-rose-600 font-extrabold' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Stock</span>
        </Link>

        <Link
          href="/invoices"
          className={`flex flex-col items-center gap-0.5 text-[10px] font-bold transition ${
            pathname === '/invoices' ? 'text-rose-600 font-extrabold' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Invoices</span>
        </Link>
      </div>
    </>
  );
}
