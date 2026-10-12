'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
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
  Crown,
  ChevronDown
} from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const { user, logout, canAccess } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Don't render navbar on login page or if not logged in
  if (!user || pathname === '/login') return null;

  const allNavLinks = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'New Bill (POS)', href: '/billing', icon: Receipt },
    { name: 'Stock & Apparel', href: '/inventory', icon: Layers },
    { name: 'Sales Reports', href: '/reports', icon: BarChart3 },
    { name: 'Invoices', href: '/invoices', icon: FileText },
    { name: 'Staff Users', href: '/admin/users', icon: Users },
  ];

  // Filter links based on user role
  const navLinks = allNavLinks.filter((link) => canAccess(link.href));


  const handleLogout = async () => {
    setShowUserMenu(false);
    setMobileMenuOpen(false);
    await logout();
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-rose-100 shadow-sm transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* Logo & Brand */}
            <Link
              href={user.role === 'admin' ? '/' : '/billing'}
              className="flex items-center gap-3 group shrink-0"
              onClick={() => setMobileMenuOpen(false)}
            >
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-tr from-purple-900 via-rose-600 to-amber-400 p-0.5 shadow-md shadow-rose-500/20 group-hover:scale-105 transition-transform">
                <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center text-amber-300">
                  <Crown className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-heading text-lg sm:text-2xl font-black tracking-tight bg-gradient-to-r from-purple-950 via-rose-700 to-purple-900 bg-clip-text text-transparent">
                    VR FASHION PALACE
                  </span>
                  <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-200">
                    Boutique
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-rose-800/80 font-semibold tracking-wide flex items-center gap-1">
                  <span>Women & Kids Wear</span>
                  <span className="text-rose-400">&bull;</span>
                  <span className="text-slate-500 font-medium">Billing POS</span>
                </p>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
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
                        ? 'bg-rose-500 text-white shadow-md shadow-rose-500/25'
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

              {/* Mobile Menu Toggle Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-rose-600 hover:bg-rose-50 transition"
                aria-label="Toggle navigation menu"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Dropdown Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-rose-100 bg-white/98 backdrop-blur-lg px-4 pt-3 pb-6 space-y-2 shadow-xl animate-in slide-in-from-top-2 duration-200">
            <div className="pb-2 border-b border-slate-100 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Navigation Menu</span>
              <span className="text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full">
                VR Fashion Palace
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold transition ${
                      isActive
                        ? 'bg-rose-600 text-white shadow-sm'
                        : 'bg-slate-50 text-slate-700 hover:bg-rose-50 hover:text-rose-700'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                    <span>{link.name}</span>
                  </Link>
                );
              })}
            </div>



            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <div className="text-xs">
                <p className="font-bold text-slate-800">{user.displayName || user.username}</p>
                <p className="text-[10px] text-slate-500 capitalize">{user.role} role</p>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 text-red-700 text-xs font-bold"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Mobile Bottom Quick-Access Bar (for quick POS billing on touch devices) */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200 px-3 py-2 shadow-2xl flex items-center justify-around">
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
