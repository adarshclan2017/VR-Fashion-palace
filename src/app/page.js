'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/AuthProvider';
import {
  Crown,
  Receipt,
  TrendingUp,
  AlertTriangle,
  Package,
  Calendar,
  ArrowUpRight,
  Clock,
  ChevronRight,
  Layers,
  BarChart3,
  Sparkles,
  ShoppingBag,
  Eye,
  CheckCircle2,
  DollarSign
} from 'lucide-react';

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/reports/dashboard');
      const json = await res.json();
      if (json.success) {
        setData(json);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchStats();
  }, [user]);

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-slate-500 font-semibold text-sm">Loading VR Fashion Palace Overview...</p>
      </div>
    );
  }

  const stats = data?.stats || {};
  const last7Days = data?.last7Days || [];
  const recentSales = data?.recentSales || [];
  const maxDayRevenue = Math.max(...last7Days.map((d) => d.revenue), 1000);

  // Women vs Kids share percentage
  const totalCategoryRev = (stats.womenRevenue || 0) + (stats.kidsRevenue || 0);
  const womenPercent = totalCategoryRev > 0 ? Math.round(((stats.womenRevenue || 0) / totalCategoryRev) * 100) : 60;
  const kidsPercent = 100 - womenPercent;

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-5 sm:space-y-6">
      {/* Top Boutique Banner & Fast Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-950 via-purple-950 to-rose-950 rounded-3xl p-5 sm:p-7 text-white shadow-2xl relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute -right-12 -top-12 w-48 h-48 bg-rose-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-0.5 rounded-full text-xs font-black bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1.5">
              <Crown className="w-3.5 h-3.5 text-amber-400" />
              <span>VR FASHION PALACE</span>
            </span>
            <span className="text-xs text-rose-200/70 hidden sm:inline">&bull; Women & Kids Wear Boutique</span>
          </div>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight font-heading">
            Store Performance & Billing Hub
          </h1>
          <p className="text-rose-100/80 text-xs sm:text-sm mt-1 max-w-xl">
            Live overview of Women & Kids fashion sales, counter billing, stock levels, and revenue trends.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 relative z-10">
          <Link
            href="/billing"
            className="flex items-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 rounded-2xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-black text-xs sm:text-sm shadow-xl shadow-rose-600/30 transition active:scale-95"
          >
            <Receipt className="w-4 h-4" />
            <span>Generate New Bill</span>
          </Link>

          <Link
            href="/inventory"
            className="flex items-center gap-2 px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs sm:text-sm backdrop-blur border border-white/10 transition"
          >
            <Layers className="w-4 h-4" />
            <span>Stock & Apparel</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards — 2 on top row, 3 on second row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-5">
        {/* Today's Revenue */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-rose-100 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Today&apos;s Revenue</span>
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 font-heading">
            ₹{stats.todayRevenue ? stats.todayRevenue.toLocaleString('en-IN') : '0'}
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500 mt-2 font-medium">
            <span>{stats.todayOrders || 0} bills generated</span>
            <span className="text-rose-600 font-bold">{stats.todayUnits || 0} outfits sold</span>
          </div>
        </div>

        {/* Today's Profit */}
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-4 sm:p-5 border border-emerald-200 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Today&apos;s Profit</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-700 font-heading">
            ₹{stats.todayProfit != null ? stats.todayProfit.toLocaleString('en-IN') : '0'}
          </div>
          <div className="text-xs text-emerald-600 mt-2 font-semibold">
            Net profit after cost deduction
          </div>
        </div>
      </div>

      {/* Second row — 3 cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-5">
        {/* This Week */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-purple-100 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">This Week Sales</span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 font-heading">
            ₹{stats.weekRevenue ? stats.weekRevenue.toLocaleString('en-IN') : '0'}
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500 mt-2 font-medium">
            <span>{stats.weekOrders || 0} orders</span>
            <span className="text-purple-600 font-bold">{stats.weekUnits || 0} pieces</span>
          </div>
        </div>

        {/* Monthly Profit */}
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-4 sm:p-5 border border-amber-200 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">Month Profit</span>
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center font-bold">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-700 font-heading">
            ₹{stats.monthProfit != null ? stats.monthProfit.toLocaleString('en-IN') : '0'}
          </div>
          <div className="text-xs text-amber-600 mt-2 font-semibold">
            {stats.monthOrders || 0} bills · {stats.monthUnits || 0} pieces sold
          </div>
        </div>

        {/* Stock Value */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-amber-100 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Shop Stock Value</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 font-heading">
            ₹{stats.inventoryRetailValue ? stats.inventoryRetailValue.toLocaleString('en-IN') : '0'}
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500 mt-2 font-medium">
            <span>{stats.totalStockUnits || 0} outfits</span>
            {stats.lowStockCount > 0 ? (
              <span className="text-red-600 font-bold">{stats.lowStockCount} low stock!</span>
            ) : (
              <span className="text-emerald-600 font-bold">Stock healthy</span>
            )}
          </div>
        </div>
      </div>

      {/* Women vs Kids Sales Share & Weekly Visual Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Women vs Kids Share (Cols 4) */}
        <div className="lg:col-span-4 bg-white rounded-2xl p-5 border border-rose-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-heading font-black text-base text-slate-900">
              Women vs Kids Share
            </h2>
            <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider bg-rose-50 px-2 py-0.5 rounded-full">
              Category Split
            </span>
          </div>

          <p className="text-xs text-slate-500">
            Monthly revenue contribution breakdown between Women apparel and Kids/Baby wear:
          </p>

          {/* Visual Dual Progress Bar */}
          <div className="space-y-2">
            <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden flex">
              <div
                style={{ width: `${womenPercent}%` }}
                className="bg-gradient-to-r from-rose-500 to-pink-500 h-full transition-all duration-500"
                title={`Women Wear: ${womenPercent}%`}
              ></div>
              <div
                style={{ width: `${kidsPercent}%` }}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 h-full transition-all duration-500"
                title={`Kids Wear: ${kidsPercent}%`}
              ></div>
            </div>

            <div className="flex justify-between text-xs font-bold pt-1">
              <div className="flex items-center gap-1.5 text-rose-700">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                <span>Women Wear: {womenPercent}%</span>
              </div>
              <div className="flex items-center gap-1.5 text-purple-700">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-600"></span>
                <span>Kids Wear: {kidsPercent}%</span>
              </div>
            </div>
          </div>

          {/* Detailed Figures */}
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
            <div className="p-3 rounded-xl bg-rose-50/60 border border-rose-100">
              <p className="text-[10px] font-bold text-rose-800 uppercase">Women Revenue</p>
              <p className="text-base font-black text-rose-900 mt-0.5">
                ₹{(stats.womenRevenue || 0).toLocaleString('en-IN')}
              </p>
              <p className="text-[10px] text-rose-600 mt-0.5">Kurtis, Sarees, Lehengas</p>
            </div>

            <div className="p-3 rounded-xl bg-purple-50/60 border border-purple-100">
              <p className="text-[10px] font-bold text-purple-800 uppercase">Kids Revenue</p>
              <p className="text-base font-black text-purple-900 mt-0.5">
                ₹{(stats.kidsRevenue || 0).toLocaleString('en-IN')}
              </p>
              <p className="text-[10px] text-purple-600 mt-0.5">Frocks, Suits, Infants</p>
            </div>
          </div>
        </div>

        {/* Weekly Revenue Trend Bar Graph (Cols 8) */}
        <div className="lg:col-span-8 bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-heading font-black text-base text-slate-900">
                Weekly Revenue Trend
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">Daily collection at VR Fashion Palace (Last 7 Days)</p>
            </div>
            <Link
              href="/reports"
              className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1"
            >
              <span>Detailed Reports</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Bar Chart Container */}
          <div className="pt-4">
            <div className="h-44 flex items-end gap-2 sm:gap-4 px-2">
              {last7Days.map((d, index) => {
                const heightPercent = maxDayRevenue > 0 ? Math.max(12, Math.round((d.revenue / maxDayRevenue) * 100)) : 15;
                const isPeak = d.revenue === maxDayRevenue;

                return (
                  <div key={index} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                    {/* Hover Value Tooltip */}
                    <span className="text-[10px] font-extrabold text-slate-700 opacity-80 group-hover:opacity-100 transition truncate">
                      ₹{Math.round(d.revenue / 1000)}k
                    </span>

                    {/* Bar */}
                    <div className="w-full max-w-[42px] bg-slate-100 rounded-t-xl overflow-hidden flex flex-col justify-end h-full">
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className={`w-full rounded-t-xl transition-all duration-500 ${
                          isPeak
                            ? 'bg-gradient-to-t from-rose-600 to-pink-500 shadow-md shadow-rose-500/30'
                            : 'bg-gradient-to-t from-purple-900/80 to-purple-700/80 group-hover:from-rose-500 group-hover:to-pink-500'
                        }`}
                      ></div>
                    </div>

                    {/* Day label */}
                    <span className="text-[11px] font-bold text-slate-600 truncate">{d.date.split(',')[0]}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Low Stock Alerts & Recent Counter Bills */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Low Stock Alerts (Cols 4) */}
        <div className="lg:col-span-4 bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <h2 className="font-heading font-black text-sm text-slate-900">
                Low Stock Apparel Alerts
              </h2>
            </div>
            <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
              {stats.lowStockCount || 0} Outfits
            </span>
          </div>

          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {(!stats.lowStockItems || stats.lowStockItems.length === 0) ? (
              <div className="py-8 text-center text-slate-400">
                <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-400 mb-1.5" />
                <p className="text-xs font-semibold text-slate-600">All apparel stock levels are healthy</p>
              </div>
            ) : (
              stats.lowStockItems.map((item) => (
                <div key={item._id} className="p-2.5 rounded-xl bg-slate-50 flex items-center justify-between gap-2 border border-slate-100">
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">{item.name}</p>
                    <p className="text-[10px] text-slate-500">
                      {item.section} &bull; Size: {item.size} &bull; ₹{item.sellingPrice}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-red-100 text-red-700">
                      Only {item.currentStock} left
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          <Link
            href="/inventory"
            className="block w-full text-center py-2 text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50/60 rounded-xl transition"
          >
            Manage All Stock & Restock &rarr;
          </Link>
        </div>

        {/* Recent Counter Bills (Cols 8) */}
        <div className="lg:col-span-8 bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <h2 className="font-heading font-black text-base text-slate-900">
                Recent Counter Invoices
              </h2>
              <p className="text-xs text-slate-500">Latest sales billed at VR Fashion Palace</p>
            </div>
            <Link
              href="/invoices"
              className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1"
            >
              <span>View All</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Bills List / Responsive Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-100">
                <tr>
                  <th className="py-2.5 px-3">Invoice</th>
                  <th className="py-2.5 px-3">Customer</th>
                  <th className="py-2.5 px-3">Outfits</th>
                  <th className="py-2.5 px-3">Payment</th>
                  <th className="py-2.5 px-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {recentSales.map((sale) => (
                  <tr key={sale._id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-3 font-mono font-bold text-slate-900">
                      {sale.invoiceNumber}
                    </td>
                    <td className="py-3 px-3">
                      <p className="font-bold text-slate-800">{sale.customer?.name || 'Walk-in'}</p>
                      <p className="text-[10px] text-slate-400">{sale.customer?.phone || '-'}</p>
                    </td>
                    <td className="py-3 px-3 text-slate-600">
                      {sale.items?.length || 1} items
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                        {sale.paymentMode}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-black text-slate-900">
                      ₹{sale.grandTotal?.toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
