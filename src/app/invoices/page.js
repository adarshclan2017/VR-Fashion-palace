'use client';

import { useState, useEffect } from 'react';
import {
  FileText,
  Search,
  Printer,
  X,
  Calendar,
  RefreshCw,
  Send,
  Crown,
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
} from 'lucide-react';

export default function InvoicesPage() {
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
      let url = '/api/sales';
      const params = new URLSearchParams();
      if (search) params.append('q', search);
      if (paymentFilter !== 'All') params.append('paymentMode', paymentFilter);
      if (params.toString()) url += `?${params.toString()}`;

      const res = await fetch(url);
      const json = await res.json();
      if (json.success) {
        setSales(json.sales || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSales();
  }, [paymentFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadSales();
  };

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

  // WhatsApp share link generator with direct customer e-bill link
  const getWhatsAppShareUrl = (inv) => {
    if (!inv) return '';
    const shopName = 'VR FASHION PALACE (Women & Kids Wear)';
    const phone = (sharePhone || inv.customer?.phone || '').replace(/\D/g, '');
    const billUrl = getCustomerBillUrl(inv);
    const text = encodeURIComponent(
      `👗 *${shopName}* 🛍️\n` +
      `Thank you for shopping with us!\n\n` +
      `*Bill No:* ${inv.invoiceNumber}\n` +
      `*Customer:* ${inv.customer?.name || 'Customer'}\n` +
      `*Items:* ${inv.items?.length} items\n` +
      `*Amount Paid:* ₹${inv.grandTotal?.toLocaleString('en-IN')} (${inv.paymentMode})\n\n` +
      `📱 *View / Download Your Digital E-Bill:* \n${billUrl}\n\n` +
      `Visit us again for latest Women & Kids fashion collections!`
    );
    return phone ? `https://wa.me/91${phone.slice(-10)}?text=${text}` : `https://wa.me/?text=${text}`;
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-rose-100 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1">
              <Crown className="w-3 h-3 text-amber-500" />
              <span>VR FASHION PALACE</span>
            </span>
            <span className="text-xs text-slate-400">&bull; Invoice Records</span>
          </div>
          <h1 className="font-heading text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Customer Invoices & Billing History
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Search past customer sales, reprint thermal bills, or share digital receipts on WhatsApp.
          </p>
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

      {/* Invoices List (Mobile Cards + Desktop Table) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-4 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-xs sm:text-sm font-semibold text-slate-500">Loading invoices...</p>
          </div>
        ) : sales.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <ShoppingBag className="w-12 h-12 mx-auto text-slate-300 mb-2" />
            <p className="text-sm font-bold text-slate-700">No invoices found</p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50 text-slate-600 text-xs font-bold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3.5 px-4">Invoice #</th>
                    <th className="py-3.5 px-4">Date & Time</th>
                    <th className="py-3.5 px-4">Customer Details</th>
                    <th className="py-3.5 px-3">Outfits</th>
                    <th className="py-3.5 px-3">Payment</th>
                    <th className="py-3.5 px-4">Grand Total</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {sales.map((sale) => (
                    <tr key={sale._id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                        {sale.invoiceNumber}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 text-xs">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{new Date(sale.createdAt).toLocaleDateString()}</span>
                        </div>
                        <span className="text-[10px] text-slate-400">
                          {new Date(sale.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <p className="font-bold text-slate-800">{sale.customer?.name || 'Walk-in'}</p>
                        <p className="text-[11px] text-slate-400">{sale.customer?.phone || '-'}</p>
                      </td>
                      <td className="py-3.5 px-3 text-slate-600">
                        <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-xs font-bold">
                          {sale.items?.length || 1} items
                        </span>
                      </td>
                      <td className="py-3.5 px-3">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800">
                          {sale.paymentMode}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-black text-slate-900 text-sm">
                        ₹{sale.grandTotal?.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openInvoiceModal(sale)}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold transition"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View / Print</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View */}
            <div className="md:hidden divide-y divide-slate-100">
              {sales.map((sale) => (
                <div key={sale._id} className="p-4 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-black text-slate-900 text-sm">
                      {sale.invoiceNumber}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                      {sale.paymentMode}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-600">
                    <div>
                      <p className="font-bold text-slate-900">{sale.customer?.name || 'Walk-in'}</p>
                      <p className="text-[11px] text-slate-400">{sale.customer?.phone || '-'}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-rose-600 text-base">
                        ₹{sale.grandTotal?.toLocaleString('en-IN')}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {new Date(sale.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] text-slate-500 font-medium">
                      {sale.items?.length || 1} outfits billed
                    </span>
                    <button
                      onClick={() => openInvoiceModal(sale)}
                      className="px-3 py-1.5 rounded-lg bg-rose-50 text-rose-700 text-xs font-bold flex items-center gap-1"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Print Bill</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
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
                <a
                  href={getWhatsAppShareUrl(selectedInvoice)}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition active:scale-95 text-center"
                  title="Open WhatsApp chat with bill summary and digital e-bill link"
                >
                  <Send className="w-4 h-4" />
                  <span>WhatsApp Link</span>
                </a>

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
