'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  FileText,
  Search,
  Printer,
  X,
  Calendar,
  RefreshCw,
  Send,
  Eye,
  CheckCircle2,
  Clock,
  Phone,
  User,
  ShoppingBag,
  MessageSquare,
  Image as ImageIcon,
  Copy,
  Check,
  ExternalLink,
  TrendingUp,
  Receipt,
} from 'lucide-react';

export default function InvoicesPage() {
  // ── Default to TODAY ───────────────────────────────────────────────
  const todayStr = () => new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const [selectedDate, setSelectedDate] = useState(todayStr());
  const [viewMode, setViewMode] = useState('day'); // 'day' | 'all'

  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('All');

  // Selected invoice for reprint / preview
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [printLayout, setPrintLayout] = useState('thermal');

  // Digital delivery & Post-print states
  const [printCompleted, setPrintCompleted] = useState(false);
  const [sharePhone, setSharePhone] = useState('');
  const [generatingImage, setGeneratingImage] = useState(false);
  const [sendingSms, setSendingSms] = useState(false);
  const [smsStatus, setSmsStatus] = useState(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedImage, setCopiedImage] = useState(false);

  useEffect(() => {
    const handleAfterPrint = () => {
      setPrintCompleted(true);
    };
    window.addEventListener('afterprint', handleAfterPrint);
    return () => window.removeEventListener('afterprint', handleAfterPrint);
  }, []);

  const openInvoiceModal = (sale) => {
    setSelectedInvoice(sale);
    setSharePhone(sale?.customer?.phone || '');
    setPrintCompleted(false);
    setSmsStatus(null);
    setCopiedLink(false);
  };

  const loadSales = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('q', search);
      if (paymentFilter !== 'All') params.append('paymentMode', paymentFilter);
      // Date filter — only for day mode
      if (viewMode === 'day') {
        params.append('startDate', selectedDate);
        params.append('endDate', selectedDate);
      }
      const res = await fetch(`/api/sales?${params.toString()}`);
      const json = await res.json();
      if (json.success) setSales(json.sales || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadSales(); }, [paymentFilter, selectedDate, viewMode]);

  // Date navigation helpers
  const shiftDay = (delta) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + delta);
    setSelectedDate(d.toISOString().slice(0, 10));
    setViewMode('day');
  };
  const isToday = selectedDate === todayStr();
  const formattedDate = new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadSales();
  };

  // ── Group sales by date and compute daily totals ──────────────────────────
  const groupedSales = useMemo(() => {
    const today = new Date();
    const todayKey = today.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });

    const map = {};
    sales.forEach((s) => {
      const d = new Date(s.createdAt);
      const key = d.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
      const label = key === todayKey
        ? 'Today'
        : d.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
      if (!map[key]) map[key] = { label, dateKey: key, sales: [], total: 0, count: 0 };
      map[key].sales.push(s);
      map[key].total += s.grandTotal || 0;
      map[key].count += 1;
    });

    // Sort groups newest first
    return Object.values(map).sort((a, b) => {
      const [da, ma, ya] = a.dateKey.split('/').map(Number);
      const [db, mb, yb] = b.dateKey.split('/').map(Number);
      return new Date(yb, mb - 1, db) - new Date(ya, ma - 1, da);
    });
  }, [sales]);

  // Today's totals
  const todayGroup = groupedSales[0]?.label === 'Today' ? groupedSales[0] : null;

  const getCustomerBillUrl = (inv) => {
    if (!inv) return '';
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/bill/${inv.invoiceNumber}`;
    }
    return `http://localhost:3000/bill/${inv.invoiceNumber}`;
  };

  const handlePrint = () => {
    setPrintCompleted(true);
    window.print();
  };

  // Helper to build a complete WhatsApp message with boutique branding, items list, and bill link
  const buildWhatsAppMessage = (sale, billUrl) => {
    const shopName = 'VR FASHION PALACE';
    const customerName = sale.customer?.name || 'Valued Customer';
    const inv = sale.invoiceNumber;
    const total = Number(sale.grandTotal || 0).toLocaleString('en-IN');
    const payment = sale.paymentMode || 'Cash';
    const date = sale.createdAt
      ? new Date(sale.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
      : new Date().toLocaleDateString('en-IN');

    const itemsSummary = (sale.items || [])
      .map((item, idx) => `${idx + 1}. ${item.name} (${item.size || 'Free Size'}) x ${item.quantity} = ₹${Number(item.total || item.quantity * item.rate).toLocaleString('en-IN')}`)
      .join('\n');

    return (
      `👗 *${shopName}* 🛍️\n` +
      `_Women & Kids Wear Boutique_\n\n` +
      `🙏 *Thank you for shopping with us!*\n\n` +
      `🧾 *Bill No:* ${inv}\n` +
      `📅 *Date:* ${date}\n` +
      `👤 *Customer:* ${customerName}\n\n` +
      `*Items Purchased:*\n${itemsSummary}\n\n` +
      `💰 *Grand Total:* ₹${total} (${payment})\n\n` +
      `📱 *View / Download Digital E-Bill:*\n${billUrl}\n\n` +
      `Visit us again for latest Women & Kids fashion collections! ✨`
    );
  };

  // WhatsApp share link generator
  const getWhatsAppShareUrl = (inv) => {
    if (!inv) return '';
    const phone = (sharePhone || inv.customer?.phone || '').replace(/\D/g, '');
    const billUrl = getCustomerBillUrl(inv);
    const text = encodeURIComponent(buildWhatsAppMessage(inv, billUrl));
    return phone && phone.length >= 10
      ? `https://api.whatsapp.com/send?phone=91${phone.slice(-10)}&text=${text}`
      : `https://api.whatsapp.com/send?text=${text}`;
  };

  // Direct click handler for WhatsApp sharing with validation
  const handleShareWhatsAppLink = (inv) => {
    if (!inv) return;
    const phone = (sharePhone || inv.customer?.phone || '').replace(/\D/g, '');
    if (!phone || phone.length < 10) {
      alert('⚠️ Please enter a valid 10-digit customer mobile number in the field above.');
      return;
    }

    const cleanPhone = phone.slice(-10);
    const billUrl = getCustomerBillUrl(inv);
    const text = encodeURIComponent(buildWhatsAppMessage(inv, billUrl));
    const waUrl = `https://api.whatsapp.com/send?phone=91${cleanPhone}&text=${text}`;
    window.open(waUrl, '_blank');
  };

  // Capture receipt image via html2canvas and share/copy to WhatsApp
  const handleShareWhatsAppImage = async () => {
    if (!selectedInvoice) return;
    const invoiceEl = document.getElementById('printable-invoice');
    if (!invoiceEl) return;

    try {
      setGeneratingImage(true);
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(invoiceEl, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
        logging: false,
      });

      const phone = (sharePhone || selectedInvoice.customer?.phone || '').replace(/\D/g, '');
      const fileName = `VR_Fashion_Palace_Bill_${selectedInvoice.invoiceNumber}.png`;

      canvas.toBlob(async (blob) => {
        if (!blob) {
          setGeneratingImage(false);
          return;
        }

        const file = new File([blob], fileName, { type: 'image/png' });

        if (typeof navigator !== 'undefined' && navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              files: [file],
              title: `VR Fashion Palace Bill ${selectedInvoice.invoiceNumber}`,
              text: `Customer Bill: ${selectedInvoice.customer?.name || 'Customer'} - Total ₹${selectedInvoice.grandTotal}`,
            });
            setGeneratingImage(false);
            return;
          } catch (shareErr) {
            if (shareErr.name !== 'AbortError') console.warn('Share error', shareErr);
          }
        }

        let clipboardCopied = false;
        try {
          if (navigator.clipboard && window.ClipboardItem) {
            await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
            clipboardCopied = true;
            setCopiedImage(true);
            setTimeout(() => setCopiedImage(false), 5000);
          }
        } catch (clipErr) {
          console.warn('Clipboard write failed:', clipErr);
        }

        const downloadLink = document.createElement('a');
        downloadLink.href = canvas.toDataURL('image/png');
        downloadLink.download = fileName;
        downloadLink.click();

        const waUrl = phone ? `https://wa.me/91${phone.slice(-10)}` : 'https://wa.me/';
        window.open(waUrl, '_blank');

        if (clipboardCopied) {
          alert(`✅ Bill image copied to clipboard & downloaded!\n\nOpening WhatsApp... Press Ctrl+V to paste the image in chat.`);
        } else {
          alert(`✅ Bill image downloaded (${fileName})!\n\nOpening WhatsApp... You can attach the downloaded file.`);
        }

        setGeneratingImage(false);
      }, 'image/png');
    } catch (err) {
      alert('Could not generate receipt image: ' + err.message);
      setGeneratingImage(false);
    }
  };

  // Dispatch digital e-bill SMS to customer phone
  const handleSendSMS = async () => {
    if (!selectedInvoice) return;
    const phone = (sharePhone || selectedInvoice.customer?.phone || '').replace(/\D/g, '');
    if (!phone || phone.length < 10) {
      alert('Please enter a valid 10-digit customer mobile number.');
      return;
    }

    const billUrl = getCustomerBillUrl(selectedInvoice);
    setSendingSms(true);
    setSmsStatus(null);

    try {
      const res = await fetch('/api/notifications/sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: phone.slice(-10),
          invoiceNumber: selectedInvoice.invoiceNumber,
          customerName: selectedInvoice.customer?.name || 'Customer',
          grandTotal: selectedInvoice.grandTotal,
          billUrl,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSmsStatus({
          success: true,
          message: `SMS link sent to +91 ${phone.slice(-10)}!`,
        });

        if (typeof navigator !== 'undefined' && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
          const bodyText = encodeURIComponent(
            `VR Fashion Palace: Dear ${selectedInvoice.customer?.name || 'Customer'}, your bill of Rs.${selectedInvoice.grandTotal} is ready. View digital e-bill: ${billUrl}`
          );
          window.location.href = `sms:+91${phone.slice(-10)}?body=${bodyText}`;
        }
      } else {
        setSmsStatus({
          success: false,
          message: data.error || 'Failed to dispatch SMS',
        });
      }
    } catch (err) {
      setSmsStatus({ success: false, message: err.message });
    } finally {
      setSendingSms(false);
    }
  };

  const handleCopyBillLink = () => {
    if (!selectedInvoice) return;
    const url = getCustomerBillUrl(selectedInvoice);
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-5 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-rose-100 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl overflow-hidden shadow-md bg-black border border-amber-400/40 p-0.5 shrink-0 flex items-center justify-center">
            <img src="/logo.png" alt="VR Fashion Palace" className="w-full h-full object-contain rounded-lg" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <h1 className="font-heading text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                Customer Invoices
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-200">
                VR Fashion Palace
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium">
              Past bills history, reprint invoices & digital receipts
            </p>
          </div>
        </div>

        <button
          onClick={loadSales}
          disabled={loading}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* ── Date Navigation Bar ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {/* Prev Day */}
          <button
            onClick={() => shiftDay(-1)}
            className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center font-bold text-slate-700 transition"
          >
            ‹
          </button>

          {/* Date Picker */}
          <input
            type="date"
            value={selectedDate}
            max={todayStr()}
            onChange={(e) => { setSelectedDate(e.target.value); setViewMode('day'); }}
            className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 focus:ring-1 focus:ring-rose-500 focus:outline-none"
          />

          {/* Next Day (disabled if today) */}
          <button
            onClick={() => shiftDay(1)}
            disabled={isToday}
            className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center font-bold text-slate-700 transition disabled:opacity-30 disabled:cursor-not-allowed"
          >
            ›
          </button>

          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
            isToday && viewMode === 'day' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600'
          }`}>
            {viewMode === 'all' ? 'All Dates' : (isToday ? '📅 Today' : formattedDate)}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {!isToday && viewMode === 'day' && (
            <button
              onClick={() => { setSelectedDate(todayStr()); setViewMode('day'); }}
              className="px-3 py-1.5 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition"
            >
              Jump to Today
            </button>
          )}
          <button
            onClick={() => setViewMode(viewMode === 'all' ? 'day' : 'all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition border ${
              viewMode === 'all'
                ? 'bg-purple-600 text-white border-purple-600'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {viewMode === 'all' ? '🗓 All Bills' : 'View All Dates'}
          </button>
        </div>
      </div>

      {/* Today's Summary Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-gradient-to-br from-rose-600 to-pink-600 rounded-2xl p-4 text-white shadow-md col-span-2 sm:col-span-2 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-rose-100 uppercase tracking-wider">
              {isToday && viewMode === 'day' ? "Today's Collection" : viewMode === 'all' ? 'All Time Collection' : 'Selected Date Collection'}
            </p>
            <p className="text-2xl sm:text-3xl font-black mt-0.5">
              ₹{sales.reduce((s, x) => s + (x.grandTotal || 0), 0).toLocaleString('en-IN')}
            </p>
            <p className="text-xs text-rose-100 mt-1 font-medium">{sales.length} bills generated</p>
          </div>
          <Receipt className="w-10 h-10 text-white/20" />
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Bills Count</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{sales.length}</p>
          <p className="text-[11px] text-slate-400 mt-1 font-medium">
            {viewMode === 'day' ? (isToday ? 'Today' : formattedDate.split(',')[0]) : 'All time'}
          </p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Items Sold</p>
          <p className="text-xl font-black text-purple-700 mt-1">
            {sales.reduce((s, x) => s + x.items.reduce((a, i) => a + (i.quantity || 1), 0), 0)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1 font-medium">outfits</p>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by invoice number (e.g. INV-0001), customer name, or phone..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm font-medium focus:ring-2 focus:ring-rose-500 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm transition"
          >
            Search
          </button>
        </form>

        {/* Payment mode filter pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
          <span className="text-[11px] font-bold text-slate-400 shrink-0">Payment:</span>
          {['All', 'UPI', 'Cash', 'Card', 'Credit/Due'].map((mode) => (
            <button
              key={mode}
              onClick={() => setPaymentFilter(mode)}
              className={`px-3 py-1 rounded-lg text-xs font-bold shrink-0 transition ${
                paymentFilter === mode
                  ? 'bg-purple-950 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {/* Invoices — Grouped by Date */}
      <div className="space-y-4">
        {loading ? (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center">
            <div className="w-8 h-8 border-4 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-xs sm:text-sm font-semibold text-slate-500">Loading invoices...</p>
          </div>
        ) : groupedSales.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center text-slate-400">
            <ShoppingBag className="w-12 h-12 mx-auto text-slate-300 mb-2" />
            <p className="text-sm font-bold text-slate-700">No invoices found</p>
          </div>
        ) : (
          groupedSales.map((group) => (
            <div key={group.dateKey} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              {/* Date Group Header */}
              <div className={`flex items-center justify-between px-4 py-3 border-b border-slate-100 ${
                group.label === 'Today'
                  ? 'bg-gradient-to-r from-rose-600 to-pink-600 text-white'
                  : 'bg-slate-50 text-slate-700'
              }`}>
                <div className="flex items-center gap-2">
                  <Calendar className={`w-4 h-4 ${group.label === 'Today' ? 'text-rose-200' : 'text-slate-400'}`} />
                  <span className="font-black text-sm">
                    {group.label === 'Today' ? '📅 Today' : group.label}
                  </span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    group.label === 'Today'
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-200 text-slate-600'
                  }`}>
                    {group.count} {group.count === 1 ? 'bill' : 'bills'}
                  </span>
                </div>
                <div className={`text-sm font-black ${
                  group.label === 'Today' ? 'text-white' : 'text-slate-900'
                }`}>
                  ₹{group.total.toLocaleString('en-IN')}
                </div>
              </div>

              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="text-slate-500 text-xs font-bold uppercase tracking-wider border-b border-slate-100">
                    <tr>
                      <th className="py-2.5 px-4">Invoice #</th>
                      <th className="py-2.5 px-4">Time</th>
                      <th className="py-2.5 px-4">Customer</th>
                      <th className="py-2.5 px-3">Outfits</th>
                      <th className="py-2.5 px-3">Payment</th>
                      <th className="py-2.5 px-3">By</th>
                      <th className="py-2.5 px-4">Amount</th>
                      <th className="py-2.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {group.sales.map((sale) => (
                      <tr key={sale._id} className="hover:bg-slate-50/70 transition">
                        <td className="py-3 px-4 font-mono font-bold text-slate-900 text-xs">
                          {sale.invoiceNumber}
                        </td>
                        <td className="py-3 px-4 text-slate-500 text-xs">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>{new Date(sale.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-bold text-slate-800 text-xs">{sale.customer?.name || 'Walk-in'}</p>
                          <p className="text-[10px] text-slate-400">{sale.customer?.phone || '-'}</p>
                        </td>
                        <td className="py-3 px-3">
                          <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-xs font-bold">
                            {sale.items?.length || 1} items
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800">
                            {sale.paymentMode}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-1">
                            <User className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="text-[11px] font-bold text-slate-700 max-w-[70px] truncate">
                              {sale.createdBy?.displayName || 'Admin'}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4 font-black text-slate-900 text-sm">
                          ₹{sale.grandTotal?.toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => openInvoiceModal(sale)}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold transition"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View / Print</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden divide-y divide-slate-100">
                {group.sales.map((sale) => (
                  <div key={sale._id} className="p-4 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-black text-slate-900 text-sm">{sale.invoiceNumber}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                        {sale.paymentMode}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-600">
                      <div>
                        <p className="font-bold text-slate-900">{sale.customer?.name || 'Walk-in'}</p>
                        <p className="text-[11px] text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(sale.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-rose-600 text-base">₹{sale.grandTotal?.toLocaleString('en-IN')}</p>
                        <div className="flex items-center gap-1 justify-end mt-0.5">
                          <User className="w-3 h-3 text-slate-400" />
                          <span className="text-[10px] text-slate-500 font-semibold">{sale.createdBy?.displayName || 'Admin'}</span>
                        </div>
                        <p className="text-[10px] text-slate-400">{sale.items?.length || 1} outfits</p>
                      </div>
                    </div>
                    <div className="pt-2 border-t border-slate-100">
                      <button
                        onClick={() => openInvoiceModal(sale)}
                        className="w-full px-3 py-1.5 rounded-lg bg-rose-50 text-rose-700 text-xs font-bold flex items-center justify-center gap-1"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>View / Print Bill</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Invoice Reprint Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden my-6 animate-in zoom-in-95 duration-150">
            {/* Top Toolbar */}
            <div className="no-print bg-slate-900 text-white px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-rose-400" />
                <span className="font-bold text-sm">Invoice {selectedInvoice.invoiceNumber}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPrintLayout(printLayout === 'thermal' ? 'a4' : 'thermal')}
                  className="px-2.5 py-1 rounded bg-white/10 text-xs font-semibold text-rose-200"
                >
                  Layout: {printLayout === 'thermal' ? 'Thermal 80mm' : 'A4 Full'}
                </button>
                <button
                  onClick={() => setSelectedInvoice(null)}
                  className="text-slate-400 hover:text-white font-bold p-1"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Printable Bill */}
            <div
              id="printable-invoice"
              className={`p-6 bg-white text-slate-900 ${
                printLayout === 'thermal' ? 'max-w-[340px] mx-auto text-xs font-mono' : 'text-sm'
              }`}
            >
              <div className="text-center pb-4 border-b border-dashed border-slate-300">
                <img
                  src="/logo.png"
                  alt="VR Logo"
                  className="w-12 h-12 object-contain mx-auto mb-2"
                />
                <h2 className="font-heading font-black text-xl tracking-tight uppercase">
                  VR FASHION PALACE
                </h2>
                <p className="text-[11px] font-bold text-rose-700 tracking-wide mt-0.5">
                  Women & Kids Wear Boutique
                </p>
                <p className="text-[10px] text-slate-500 mt-1">
                  Shop No. 12-14, Fashion Street, Main City Center
                </p>
                <p className="text-[10px] text-slate-500">Phone: +91 98765 43210</p>
              </div>

              <div className="py-3 border-b border-dashed border-slate-300 flex justify-between text-[11px]">
                <div>
                  <p><span className="font-bold">Bill No:</span> {selectedInvoice.invoiceNumber}</p>
                  <p><span className="font-bold">Customer:</span> {selectedInvoice.customer?.name}</p>
                  {selectedInvoice.customer?.phone && (
                    <p><span className="font-bold">Phone:</span> {selectedInvoice.customer?.phone}</p>
                  )}
                </div>
                <div className="text-right">
                  <p>{new Date(selectedInvoice.createdAt).toLocaleDateString()}</p>
                  <p>{new Date(selectedInvoice.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  <p className="font-bold text-rose-700">{selectedInvoice.paymentMode}</p>
                </div>
              </div>

              <div className="py-3">
                <table className="w-full text-left text-[11px]">
                  <thead className="border-b border-slate-200">
                    <tr>
                      <th className="py-1">Item</th>
                      <th className="py-1 text-center">Size</th>
                      <th className="py-1 text-center">Qty</th>
                      <th className="py-1 text-right">Rate</th>
                      <th className="py-1 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedInvoice.items?.map((it, idx) => (
                      <tr key={idx}>
                        <td className="py-1.5 font-medium">{it.name}</td>
                        <td className="py-1.5 text-center font-bold">{it.size || '-'}</td>
                        <td className="py-1.5 text-center">{it.quantity}</td>
                        <td className="py-1.5 text-right">₹{it.rate}</td>
                        <td className="py-1.5 text-right font-bold">₹{Math.round(it.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="py-2.5 border-t border-dashed border-slate-300 space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>₹{selectedInvoice.subtotal?.toLocaleString('en-IN')}</span>
                </div>
                {selectedInvoice.roundOff !== 0 && (
                  <div className="flex justify-between text-slate-500">
                    <span>Round Off:</span>
                    <span>₹{selectedInvoice.roundOff}</span>
                  </div>
                )}
                <div className="flex justify-between font-black text-sm pt-1 border-t border-slate-300 text-slate-950">
                  <span>Grand Total:</span>
                  <span>₹{selectedInvoice.grandTotal?.toLocaleString('en-IN')}</span>
                </div>
              </div>

              <div className="text-center pt-4 border-t border-dashed border-slate-300 text-[10px] text-slate-500 space-y-0.5">
                <p className="font-bold text-slate-700">Thank you for shopping at VR Fashion Palace!</p>
                <p>Goods once sold can be exchanged within 7 days with bill.</p>
                <p>*** Please Visit Again ***</p>
              </div>
            </div>

            {/* Customer Digital Delivery Panel (Hidden during print) */}
            <div className="no-print p-4 bg-gradient-to-b from-rose-50/50 to-slate-50 border-t border-slate-200 space-y-3">
              {/* Status Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${printCompleted ? 'bg-emerald-500 animate-ping' : 'bg-rose-500'}`} />
                  <span className="text-xs font-black uppercase tracking-wider text-slate-800">
                    {printCompleted ? '✅ Print Done! Send E-Bill to Customer' : '📱 Customer Digital Delivery'}
                  </span>
                </div>
                {printCompleted && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    Receipt Printed
                  </span>
                )}
              </div>

              {/* Customer Phone Row */}
              <div className="bg-white p-2.5 rounded-xl border border-slate-200 flex items-center gap-2 shadow-sm">
                <Phone className="w-4 h-4 text-rose-600 shrink-0" />
                <span className="text-xs font-bold text-slate-500">+91</span>
                <input
                  type="tel"
                  maxLength={10}
                  value={sharePhone}
                  onChange={(e) => setSharePhone(e.target.value.replace(/\D/g, ''))}
                  placeholder="Enter 10-digit customer mobile..."
                  className="w-full text-xs font-bold text-slate-800 focus:outline-none placeholder:text-slate-400 placeholder:font-normal"
                />
              </div>

              {/* SMS Status Message */}
              {smsStatus && (
                <div
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-between ${
                    smsStatus.success
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-red-50 text-red-700 border border-red-200'
                  }`}
                >
                  <span>{smsStatus.message}</span>
                  <button onClick={() => setSmsStatus(null)} className="text-xs font-bold ml-2">✕</button>
                </div>
              )}

              {/* Action Buttons Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {/* 1. Send SMS Link */}
                <button
                  type="button"
                  onClick={handleSendSMS}
                  disabled={sendingSms}
                  className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition active:scale-95 disabled:opacity-50"
                  title="Send digital e-bill link via SMS to customer mobile"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>{sendingSms ? 'Sending...' : 'Send SMS Link'}</span>
                </button>

                {/* 2. Send WhatsApp Link */}
                <button
                  type="button"
                  onClick={() => handleShareWhatsAppLink(selectedInvoice)}
                  className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition active:scale-95 text-center cursor-pointer"
                  title="Send digital e-bill link & itemized receipt directly to customer's WhatsApp"
                >
                  <Send className="w-4 h-4" />
                  <span>WhatsApp Link</span>
                </button>

                {/* 3. Send WhatsApp Image */}
                <button
                  type="button"
                  onClick={handleShareWhatsAppImage}
                  disabled={generatingImage}
                  className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-gradient-to-r from-emerald-700 to-teal-700 hover:from-emerald-800 hover:to-teal-800 text-white font-bold text-xs shadow-sm transition active:scale-95 disabled:opacity-50"
                  title="Generate high-res receipt image and send via WhatsApp"
                >
                  <ImageIcon className="w-4 h-4" />
                  <span>{generatingImage ? 'Capturing...' : copiedImage ? 'Copied Image!' : 'WhatsApp Image'}</span>
                </button>
              </div>

              {/* Auxiliary Quick Links: Copy Link & Open E-Bill */}
              <div className="flex items-center justify-between pt-1 text-xs">
                <button
                  type="button"
                  onClick={handleCopyBillLink}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-600 hover:text-rose-700 transition"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? 'Link Copied!' : 'Copy Bill Link'}</span>
                </button>

                <a
                  href={getCustomerBillUrl(selectedInvoice)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 hover:text-rose-800 underline"
                >
                  <span>Preview Customer View</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            {/* Modal Bottom Actions */}
            <div className="no-print p-4 bg-slate-100 border-t border-slate-200 flex items-center justify-between gap-2">
              <button
                onClick={() => setSelectedInvoice(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-white transition"
              >
                Close
              </button>

              <button
                onClick={handlePrint}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-600/30 transition active:scale-95"
              >
                <Printer className="w-4 h-4" />
                <span>Print Receipt</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
