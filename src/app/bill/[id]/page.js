'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import {
  CheckCircle2,
  Printer,
  ShoppingBag,
  Phone,
  Calendar,
  Share2,
  Clock,
  Sparkles,
  ArrowDownToLine,
  Receipt
} from 'lucide-react';

export default function PublicBillPage() {
  const params = useParams();
  const id = params?.id;
  const [sale, setSale] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [savingImage, setSavingImage] = useState(false);

  useEffect(() => {
    if (!id) return;
    const fetchBill = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/bill/${id}`);
        const data = await res.json();
        if (data.success && data.sale) {
          setSale(data.sale);
        } else {
          setError(data.error || 'Invoice not found');
        }
      } catch (err) {
        setError('Failed to load bill: ' + err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchBill();
  }, [id]);

  const handleDownloadImage = async () => {
    const el = document.getElementById('printable-invoice');
    if (!el || !sale) return;

    try {
      setSavingImage(true);
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(el, {
        scale: 2,
        backgroundColor: '#ffffff',
        useCORS: true,
      });

      const a = document.createElement('a');
      a.href = canvas.toDataURL('image/png');
      a.download = `VR_Fashion_Palace_Bill_${sale.invoiceNumber}.png`;
      a.click();
    } catch (err) {
      alert('Could not save image: ' + err.message);
    } finally {
      setSavingImage(false);
    }
  };

  const handleShareWhatsApp = () => {
    if (!sale) return;
    const billUrl = typeof window !== 'undefined' ? window.location.href : '';
    const text = encodeURIComponent(
      `👗 *V.R. FASHION PALACE* 🛍️\n` +
      `Here is my shopping bill from V.R. Fashion Palace!\n` +
      `Bill #${sale.invoiceNumber} • Total: ₹${sale.grandTotal}\n\n` +
      `View digital e-bill: ${billUrl}`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm font-semibold text-slate-600">Loading your digital bill...</p>
        </div>
      </div>
    );
  }

  if (error || !sale) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-6 rounded-3xl max-w-sm w-full text-center shadow-xl border border-slate-200 space-y-3">
          <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <h2 className="font-heading text-lg font-black text-slate-900">Bill Not Found</h2>
          <p className="text-xs text-slate-500">
            {error || 'This digital bill link may be expired or invalid.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50/60 via-slate-50 to-slate-100 py-6 px-3 sm:px-6">
      <div className="max-w-md mx-auto space-y-4">
        {/* Top Digital Receipt Card */}
        <div
          id="printable-invoice"
          className="bg-white rounded-3xl shadow-xl border border-rose-100/80 overflow-hidden"
        >
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-purple-950 via-rose-950 to-slate-900 text-white p-6 text-center relative">
            <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-lg mx-auto mb-2.5 border border-amber-400/40 bg-black p-1 flex items-center justify-center">
              <img src="/logo.png" alt="VR Fashion Palace" className="w-full h-full object-contain rounded-xl" />
            </div>
            <h1 className="font-heading text-xl sm:text-2xl font-black tracking-tight uppercase">
              V.R. FASHION PALACE
            </h1>
            <p className="text-xs text-rose-200/90 font-semibold mt-0.5">
              Women & Kids Wear
            </p>
            <p className="text-[11px] text-slate-200 mt-1">
              Near check post, Kozhivilai
            </p>
            <p className="text-[11px] text-slate-200">
              Kaliyakkavilai (p.o), Pin: 629153
            </p>
            <p className="text-[11px] font-bold text-amber-300 mt-0.5">Phone: 8903940644</p>

            {/* Verified Digital E-Bill Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-black uppercase tracking-wider mt-3">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Verified Customer Digital E-Bill</span>
            </div>
          </div>

          {/* Bill Meta */}
          <div className="p-5 border-b border-dashed border-slate-200 bg-slate-50/50 flex items-center justify-between text-xs">
            <div>
              <p className="text-slate-500 text-[10px] uppercase font-bold">Invoice Number</p>
              <p className="font-mono font-black text-slate-900 text-sm">{sale.invoiceNumber}</p>
              <p className="text-slate-600 text-xs mt-1 font-semibold">{sale.customer?.name}</p>
              {sale.customer?.phone && (
                <p className="text-[11px] text-slate-400">{sale.customer?.phone}</p>
              )}
            </div>

            <div className="text-right">
              <p className="text-slate-500 text-[10px] uppercase font-bold">Date & Time</p>
              <p className="font-semibold text-slate-800">
                {new Date(sale.createdAt).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </p>
              <p className="text-[11px] text-slate-400">
                {new Date(sale.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
              <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-black bg-rose-100 text-rose-800">
                Paid via {sale.paymentMode}
              </span>
            </div>
          </div>

          {/* Items Table */}
          <div className="p-5 space-y-3">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Purchased Outfits ({sale.items?.length} items)
            </p>

            <div className="divide-y divide-slate-100">
              {sale.items?.map((it, idx) => (
                <div key={idx} className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">{it.name}</p>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                      {it.section && (
                        <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.2 rounded">
                          {it.section}
                        </span>
                      )}
                      <span>Size: {it.size || 'Free'}</span>
                      <span>&bull;</span>
                      <span>Qty: {it.quantity}</span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-xs font-black text-slate-900">
                      ₹{Math.round(it.total).toLocaleString('en-IN')}
                    </p>
                    <p className="text-[10px] text-slate-400">@ ₹{it.rate}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Bill Summary */}
            <div className="pt-3 border-t border-dashed border-slate-200 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span className="font-semibold">₹{sale.subtotal?.toLocaleString('en-IN')}</span>
              </div>

              {sale.totalDiscount > 0 && (
                <div className="flex justify-between text-rose-600 font-semibold">
                  <span>Discount:</span>
                  <span>-₹{sale.totalDiscount?.toLocaleString('en-IN')}</span>
                </div>
              )}

              <div className="flex justify-between items-center pt-2 border-t border-slate-200 text-slate-900">
                <span className="font-black text-sm uppercase">Total Amount Paid:</span>
                <span className="font-black text-xl text-rose-600">
                  ₹{sale.grandTotal?.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* Footer Note */}
            <div className="pt-4 border-t border-dashed border-slate-200 text-center text-[11px] text-slate-500 space-y-1">
              <p className="font-bold text-slate-800">
                Thank you for shopping at V.R. Fashion Palace!
              </p>
              <p className="text-[10px] text-slate-400">
                For exchange or queries, please bring this digital e-bill within 7 days.
              </p>
              <p className="text-[10px] font-semibold text-rose-700">*** Visit Again ***</p>
            </div>
          </div>
        </div>

        {/* Customer Actions Bar (Hidden during print) */}
        <div className="no-print flex flex-wrap items-center justify-center gap-2.5 pt-2">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md shadow-rose-600/20 transition active:scale-95"
          >
            <Printer className="w-4 h-4" />
            <span>Print / PDF</span>
          </button>

          <button
            onClick={handleDownloadImage}
            disabled={savingImage}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs shadow-md shadow-slate-900/20 transition active:scale-95 disabled:opacity-50"
          >
            <ArrowDownToLine className="w-4 h-4" />
            <span>{savingImage ? 'Saving...' : 'Save Image (.png)'}</span>
          </button>

          <button
            onClick={handleShareWhatsApp}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition active:scale-95"
          >
            <Share2 className="w-4 h-4" />
            <span>Share on WhatsApp</span>
          </button>
        </div>
      </div>
    </div>
  );
}
