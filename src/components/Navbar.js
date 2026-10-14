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
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-rose-100 shadow-sm transition-all">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* Left Section: Brand Logo (and mobile-only hamburger toggle) */}
            <div className="flex items-center gap-2.5 sm:gap-4">
              {/* Mobile-Only Sidebar Toggle Button (Hidden on Big Screen) */}
              <button
                type="button"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 rounded-xl border border-slate-200 hover:border-rose-300 bg-slate-50 hover:bg-rose-50 text-slate-700 hover:text-rose-700 transition active:scale-95 flex items-center justify-center"
                aria-label="Toggle Side Menu"
                title="Toggle Menu"
              >
                <Menu className="w-5 h-5 text-slate-700" />
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

            {/* Desktop Navigation Links (Big Screen Only) */}
            <nav className="hidden lg:flex items-center gap-1.5">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
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
                className="flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white text-xs sm:text-sm font-bold shadow-md shadow-rose-600/20 transition active:scale-95"
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

      {/* Mobile Bottom Quick-Access Bar */}
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
