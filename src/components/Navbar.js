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
  ChevronDown
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
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'New Bill (POS)', href: '/billing', icon: Receipt },
    { name: 'Stock & Apparel', href: '/inventory', icon: Layers },
    { name: 'Invoices & History', href: '/invoices', icon: FileText },
    { name: 'Sales Reports', href: '/reports', icon: BarChart3 },
    { name: 'Staff Users', href: '/admin/users', icon: Users },
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
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-rose-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-3 sm:px-5 lg:px-8">
          <div className="flex items-center h-16 gap-3">

            {/* ── LEFT: Hamburger + Brand ── */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Mobile hamburger (hidden on lg+) */}
              <button
                type="button"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden w-9 h-9 flex items-center justify-center rounded-xl border border-slate-200 bg-slate-50 hover:bg-rose-50 hover:border-rose-300 text-slate-600 hover:text-rose-700 transition active:scale-95 shrink-0"
                aria-label="Toggle Menu"
              >
                <Menu className="w-5 h-5" />
              </button>

              {/* Brand */}
              <Link
                href={user.role === 'admin' ? '/' : '/billing'}
                className="flex items-center gap-2 group shrink-0"
              >
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl overflow-hidden bg-black border border-amber-400/40 p-0.5 group-hover:scale-105 transition-transform shrink-0 flex items-center justify-center">
                  <img src="/logo.png" alt="VR Fashion Palace" className="w-full h-full object-contain rounded-lg" />
                </div>
                <div className="hidden sm:block leading-tight">
                  <p className="font-heading text-sm lg:text-base font-black tracking-tight bg-gradient-to-r from-purple-950 via-rose-700 to-purple-900 bg-clip-text text-transparent whitespace-nowrap">
                    VR FASHION PALACE
                  </p>
                  <p className="text-[10px] text-rose-700/70 font-semibold hidden xl:block">Women &amp; Kids Wear · Billing POS</p>
                </div>
                <span className="sm:hidden font-heading text-sm font-black bg-gradient-to-r from-purple-950 via-rose-700 to-purple-900 bg-clip-text text-transparent whitespace-nowrap">
                  VR Fashion
                </span>
              </Link>
            </div>

            {/* ── CENTER: Desktop Nav Links ── */}
            <nav className="hidden lg:flex items-center gap-0.5 xl:gap-1 flex-1 justify-center">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    className={`flex items-center gap-1.5 h-9 px-3 xl:px-3.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
                      isActive
                        ? 'bg-rose-600 text-white shadow-sm shadow-rose-600/30'
                        : 'text-slate-600 hover:text-rose-700 hover:bg-rose-50'
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span>{link.name}</span>
                  </Link>
                );
              })}
            </nav>

            {/* ── RIGHT: New Bill + User ── */}
            <div className="flex items-center gap-2 shrink-0 ml-auto lg:ml-0">
              {/* New Bill */}
              <Link
                href="/billing"
                className="flex items-center gap-1.5 h-9 px-3 sm:px-4 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white text-xs sm:text-sm font-bold shadow-sm shadow-rose-600/25 transition active:scale-95 whitespace-nowrap shrink-0"
              >
                <Receipt className="w-4 h-4 shrink-0" />
                <span className="hidden sm:inline">New Bill</span>
                <span className="sm:hidden">POS</span>
              </Link>

              {/* User dropdown */}
              <div className="relative shrink-0">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 h-9 px-2 sm:px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition"
                  aria-label="User Menu"
                >
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-white shrink-0 ${
                    user.role === 'admin'
                      ? 'bg-gradient-to-br from-amber-500 to-rose-600'
                      : 'bg-gradient-to-br from-blue-500 to-indigo-600'
                  }`}>
                    {user.role === 'admin' ? <Shield className="w-4 h-4" /> : <User className="w-4 h-4" />}
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-4 py-2.5 border-b border-slate-100">
                      <p className="text-xs font-bold text-slate-900">{user.displayName || user.username}</p>
                      <p className="text-[11px] text-slate-400 font-mono">@{user.username}</p>
                      <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        user.role === 'admin' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {user.role === 'admin' ? 'Full Admin Access' : 'Cashier Billing Access'}
                      </span>
                    </div>

                    {user.role === 'admin' && (
                      <Link
                        href="/admin/users"
                        onClick={() => setShowUserMenu(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-rose-50 hover:text-rose-700 transition"
                      >
                        <Users className="w-4 h-4 text-slate-400 shrink-0" />
                        <span>Manage Staff Accounts</span>
                      </Link>
                    )}

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-red-600 hover:bg-red-50 transition text-left"
                    >
                      <LogOut className="w-4 h-4 shrink-0" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </header>

      {/* Side Navigation Bar (SMALL SCREEN ONLY: lg:hidden) */}
      {/* Backdrop */}
      <div
        className={`lg:hidden fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 transition-opacity duration-200 ${
          sidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setSidebarOpen(false)}
        aria-hidden="true"
      />

      {/* Simple Mobile Sidebar Drawer */}
      <aside
        className={`lg:hidden fixed top-0 bottom-0 left-0 w-72 max-w-[85vw] bg-white text-slate-800 z-50 shadow-2xl flex flex-col border-r border-slate-200 transition-transform duration-200 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Side Navigation Bar"
      >
        {/* Simple Header with VR Logo */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl overflow-hidden shadow-sm bg-black border border-amber-400/40 p-0.5 shrink-0 flex items-center justify-center">
              <img
                src="/logo.png"
                alt="VR Fashion Palace"
                className="w-full h-full object-contain rounded-lg"
              />
            </div>
            <div>
              <h2 className="font-heading text-sm font-black text-slate-900 leading-tight">
                VR FASHION PALACE
              </h2>
              <p className="text-[10px] font-semibold text-rose-600">
                Women & Kids Wear
              </p>
            </div>
          </div>

          <button
            onClick={() => setSidebarOpen(false)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Clean, Simple Navigation List (FA-style minimal UI) */}
        <div className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition ${
                  isActive
                    ? 'bg-rose-50 text-rose-700 font-bold border-l-4 border-rose-600'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-rose-600' : 'text-slate-500'}`} />
                <span>{link.name}</span>
              </Link>
            );
          })}
        </div>

        {/* Simple User Footer & Sign Out */}
        <div className="p-3 border-t border-slate-100 bg-slate-50">
          <div className="flex items-center justify-between mb-2 px-1">
            <div className="text-xs">
              <p className="font-bold text-slate-900">{user.displayName || user.username}</p>
              <p className="text-[10px] text-slate-500 capitalize">{user.role}</p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold transition"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>


    </>
  );
}
