'use client';

import { useState, useEffect } from 'react';
import {
  BarChart3,
  Calendar,
  TrendingUp,
  Download,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Sparkles,
  ShoppingBag,
  Layers,
  CheckCircle2,
  PieChart
} from 'lucide-react';

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState('weekly'); // 'weekly' or 'monthly'
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchReport = async (view) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reports/sales?view=${view}`);
      const json = await res.json();
      if (json.success) {
        setReportData(json);
      }
    } catch (err) {
      console.error('Failed to load report:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport(activeTab);
  }, [activeTab]);

  // Export to CSV helper
  const handleExportCSV = () => {
    if (!reportData) return;

    let csvContent = 'data:text/csv;charset=utf-8,';

    if (activeTab === 'weekly') {
      csvContent += 'Day,Date,Revenue (INR),Outfits Sold,Invoices,Avg Bill\n';
      reportData.dailyBreakdown?.forEach((d) => {
        csvContent += `${d.day},${d.date},${d.revenue},${d.units},${d.orders},${d.avgOrderValue}\n`;
      });
    } else {
      csvContent += 'Week,Revenue (INR),Outfits Sold,Invoices\n';
      reportData.weeklyBreakdown?.forEach((w) => {
        csvContent += `"${w.week}",${w.revenue},${w.units},${w.orders}\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `VR_Fashion_Palace_${activeTab}_report.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const summary = reportData?.summary || {};
  const daily = reportData?.dailyBreakdown || [];
  const weekly = reportData?.weeklyBreakdown || [];
  const topOutfits = reportData?.topOutfits || [];
  const sectionMap = reportData?.sectionMap || {};
  const payments = reportData?.paymentDistribution || {};

  const maxPeriodRevenue =
    activeTab === 'weekly'
      ? Math.max(...daily.map((d) => d.revenue), 1000)
      : Math.max(...weekly.map((w) => w.revenue), 1000);

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-5 sm:space-y-6">
      {/* Header with Title and Tab Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-rose-100 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
              <h1 className="font-heading text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                Sales Reports
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-200">
                VR Fashion Palace
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Weekly & monthly sales analytics, top outfits, revenue insights
            </p>
          </div>

        <div className="flex items-center gap-2.5">
          {/* Tab Switcher */}
          <div className="flex p-1 bg-slate-100 rounded-xl border border-slate-200">
            <button
              onClick={() => setActiveTab('weekly')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition ${
                activeTab === 'weekly'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Weekly Report
            </button>
            <button
              onClick={() => setActiveTab('monthly')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition ${
                activeTab === 'monthly'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Monthly Report
            </button>
          </div>

          <button
            onClick={handleExportCSV}
            disabled={!reportData}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold transition"
            title="Download CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-16 text-center bg-white rounded-2xl border border-slate-200">
          <div className="w-8 h-8 border-4 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-xs sm:text-sm font-semibold text-slate-500">Calculating report analytics...</p>
        </div>
      ) : (
        <>
          {/* 4 Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-rose-100 shadow-sm">
              <span className="text-[11px] font-bold text-slate-500 uppercase">
                {activeTab === 'weekly' ? 'This Week Revenue' : 'This Month Revenue'}
              </span>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 font-heading mt-1">
                ₹{summary.totalRevenue ? summary.totalRevenue.toLocaleString('en-IN') : '0'}
              </div>
              <div className="flex items-center gap-1.5 mt-2 text-xs font-bold">
                {summary.growthRate >= 0 ? (
                  <span className="text-emerald-600 flex items-center">
                    <ArrowUpRight className="w-4 h-4" />
                    +{summary.growthRate}%
                  </span>
                ) : (
                  <span className="text-red-600 flex items-center">
                    <ArrowDownRight className="w-4 h-4" />
                    {summary.growthRate}%
                  </span>
                )}
                <span className="text-slate-400 font-normal">vs previous {activeTab}</span>
              </div>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-purple-100 shadow-sm">
              <span className="text-[11px] font-bold text-slate-500 uppercase">Total Outfits Sold</span>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 font-heading mt-1">
                {summary.totalUnits || 0} pcs
              </div>
              <p className="text-xs text-purple-700 font-semibold mt-2">
                Across Women & Kids Wear
              </p>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-blue-100 shadow-sm">
              <span className="text-[11px] font-bold text-slate-500 uppercase">Counter Bills</span>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 font-heading mt-1">
                {summary.totalInvoices || 0}
              </div>
              <p className="text-xs text-slate-500 font-semibold mt-2">Invoices generated</p>
            </div>

            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-amber-100 shadow-sm">
              <span className="text-[11px] font-bold text-slate-500 uppercase">Average Bill Value</span>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 font-heading mt-1">
                ₹{summary.averageBill ? summary.averageBill.toLocaleString('en-IN') : '0'}
              </div>
              <p className="text-xs text-amber-700 font-semibold mt-2">Avg customer spend</p>
            </div>
          </div>

          {/* Women vs Kids Section Revenue Cards */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
            <h2 className="font-heading font-black text-base text-slate-900">
              Department Performance Breakdown
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { title: 'Women Wear', key: 'Women', icon: '👗', color: 'rose' },
                { title: 'Kids Girls', key: 'Kids Girls', icon: '🎀', color: 'pink' },
                { title: 'Kids Boys', key: 'Kids Boys', icon: '👦', color: 'purple' },
                { title: 'Infants & Baby', key: 'Infants', icon: '👶', color: 'amber' },
              ].map((item) => {
                const val = sectionMap[item.key] || 0;
                return (
                  <div key={item.key} className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                    <div className="flex items-center gap-1.5">
                      <span className="text-base">{item.icon}</span>
                      <span className="text-xs font-bold text-slate-700">{item.title}</span>
                    </div>
                    <p className="text-base sm:text-lg font-black text-slate-900 mt-1">
                      ₹{val.toLocaleString('en-IN')}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Visual Trend Chart */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-heading font-black text-base text-slate-900">
                {activeTab === 'weekly' ? 'Daily Collection Breakdown' : 'Weekly Sales Breakdown'}
              </h2>
              <span className="text-xs font-semibold text-slate-500">
                Period: {reportData?.period?.start} &ndash; {reportData?.period?.end}
              </span>
            </div>

            {/* Bar Chart */}
            <div className="pt-4">
              <div className="h-44 flex items-end gap-2 sm:gap-4 px-2">
                {(activeTab === 'weekly' ? daily : weekly).map((item, index) => {
                  const label = activeTab === 'weekly' ? item.day : item.week;
                  const rev = item.revenue;
                  const heightPercent =
                    maxPeriodRevenue > 0
                      ? Math.max(12, Math.round((rev / maxPeriodRevenue) * 100))
                      : 15;

                  return (
                    <div key={index} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                      <span className="text-[10px] font-extrabold text-slate-700 opacity-80 group-hover:opacity-100 transition truncate">
                        ₹{Math.round(rev / 1000)}k
                      </span>

                      <div className="w-full max-w-[48px] bg-slate-100 rounded-t-xl overflow-hidden flex flex-col justify-end h-full">
                        <div
                          style={{ height: `${heightPercent}%` }}
                          className="w-full rounded-t-xl bg-gradient-to-t from-rose-600 to-pink-500 shadow-sm transition-all duration-500"
                        ></div>
                      </div>

                      <span className="text-[11px] font-bold text-slate-600 truncate">{label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Top Selling Outfits & Payment Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* Top 5 Best-Selling Fashion Items (Cols 7) */}
            <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
              <h2 className="font-heading font-black text-base text-slate-900">
                Top 5 Best-Selling Outfits
              </h2>

              <div className="space-y-2.5">
                {topOutfits.length === 0 ? (
                  <p className="text-xs text-slate-400 py-6 text-center">No sales data in this period</p>
                ) : (
                  topOutfits.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-slate-50 flex items-center justify-between gap-3 border border-slate-100"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-rose-100 text-rose-800 font-black text-xs flex items-center justify-center shrink-0">
                          #{idx + 1}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 truncate">{item.name}</p>
                          <p className="text-[10px] text-slate-500">
                            {item.section} &bull; Size: {item.size || 'Free'} &bull; {item.units} units sold
                          </p>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <p className="text-xs font-black text-slate-900">
                          ₹{item.revenue?.toLocaleString('en-IN')}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Payment Method Distribution (Cols 5) */}
            <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
              <h2 className="font-heading font-black text-base text-slate-900">
                Payment Modes Received
              </h2>

              <div className="space-y-3">
                {[
                  { mode: 'UPI', label: 'UPI (GPay/PhonePe)', icon: '⚡', color: 'emerald' },
                  { mode: 'Cash', label: 'Cash Payments', icon: '💵', color: 'blue' },
                  { mode: 'Card', label: 'Card Swipes', icon: '💳', color: 'purple' },
                  { mode: 'Credit/Due', label: 'Credit / Khata', icon: '📝', color: 'amber' },
                ].map((item) => {
                  const val = payments[item.mode] || 0;
                  const pct = summary.totalRevenue > 0 ? Math.round((val / summary.totalRevenue) * 100) : 0;
                  return (
                    <div key={item.mode} className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <div className="flex items-center gap-1.5 font-bold text-slate-800">
                          <span>{item.icon}</span>
                          <span>{item.label}</span>
                        </div>
                        <span className="font-black text-slate-900">
                          ₹{val.toLocaleString('en-IN')} ({pct}%)
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${pct}%` }}
                          className="h-full bg-rose-600 rounded-full"
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
