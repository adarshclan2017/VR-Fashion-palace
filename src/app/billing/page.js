'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/components/AuthProvider';
import {
  Search,
  Plus,
  Minus,
  Trash2,
  Printer,
  QrCode,
  CheckCircle2,
  AlertCircle,
  X,
  RefreshCw,
  User,
  Phone,
  CreditCard,
  Banknote,
  Percent,
  ShoppingBag,
  Send,
  SlidersHorizontal,
  ChevronRight,
  ArrowRight,
  MessageSquare,
  Image as ImageIcon,
  Copy,
  Check,
  ExternalLink,
  Download,
  Share2,
  ChevronLeft,
  Layers,
  Sparkles,
  Filter,
  Tag,
} from 'lucide-react';


export default function BillingPage() {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedSection, setSelectedSection] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Cart / Bill items
  const [billItems, setBillItems] = useState([]);

  // Customer details
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [paymentMode, setPaymentMode] = useState('UPI'); // Most modern shops use UPI by default
  const [notes, setNotes] = useState('');

  // Overall Discount
  const [billDiscountPercent, setBillDiscountPercent] = useState('0');

  // Checkout submission state
  const [submitting, setSubmitting] = useState(false);
  const [lastSale, setLastSale] = useState(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [printLayout, setPrintLayout] = useState('thermal'); // 'thermal' or 'a4'

  // Post-print & Digital delivery states
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

  // Mobile navigation tab: 'catalog' | 'cart'
  const [mobileTab, setMobileTab] = useState('catalog');


  // Fetch available products
  const fetchProducts = async () => {
    try {
      setLoadingProducts(true);
      const res = await fetch('/api/products?limit=100');
      const data = await res.json();
      if (data.success) {
        setProducts(data.products || []);
      }
    } catch (err) {
      console.error('Failed to fetch products', err);
    } finally {
      setLoadingProducts(false);
    }
  };

  useEffect(() => {
    if (user) fetchProducts();
  }, [user]);

  // Dynamic sections derived from products + user-saved sections
  const sections = useMemo(() => {
    const list = new Set();
    if (typeof window !== 'undefined') {
      try {
        const saved = JSON.parse(localStorage.getItem('vr_palace_sections'));
        if (Array.isArray(saved)) saved.forEach((s) => list.add(s));
      } catch {}
    }
    products.forEach((p) => {
      if (p.section) list.add(p.section);
    });
    return ['All', ...Array.from(list)];
  }, [products]);

  // Categories list derived from products (and stored categories), filtered by section
  const categories = useMemo(() => {
    const list = new Set();
    // From saved categoriesMap in localStorage
    if (typeof window !== 'undefined') {
      try {
        const savedCats = JSON.parse(localStorage.getItem('vr_palace_categories'));
        if (savedCats && typeof savedCats === 'object') {
          if (selectedSection === 'All') {
            Object.values(savedCats).forEach((cats) => {
              if (Array.isArray(cats)) cats.forEach((c) => list.add(c));
            });
          } else if (savedCats[selectedSection]) {
            savedCats[selectedSection].forEach((c) => list.add(c));
          }
        }
      } catch {}
    }
    // From products
    products.forEach((p) => {
      if (p.category) {
        if (selectedSection === 'All' || p.section === selectedSection) {
          list.add(p.category);
        }
      }
    });
    return ['All', ...Array.from(list)];
  }, [products, selectedSection]);

  // Size & price filter states for billing catalog
  const [filterSize, setFilterSize] = useState('');
  const [filterMinPrice, setFilterMinPrice] = useState('');
  const [filterMaxPrice, setFilterMaxPrice] = useState('');

  // Derive all unique sizes from products
  const allSizes = useMemo(() => {
    const sizeSet = new Set();
    products.forEach((p) => { if (p.size) sizeSet.add(p.size); });
    return Array.from(sizeSet).sort();
  }, [products]);

  // Filtered products list based on search, section, category, size, and price
  const filteredProducts = useMemo(() => {
    const q = search.trim().toLowerCase();
    const queryWords = q ? q.split(/\s+/).filter(Boolean) : [];

    return products.filter((p) => {
      // Build full searchable text across all product attributes
      const searchableText = `${p.name} ${p.code} ${p.section || ''} ${p.category || ''} ${p.size || ''} ${p.color || ''} ${p.fabric || ''} ${p.brand || ''} ${p.barcode || ''}`.toLowerCase();
      const matchSearch =
        queryWords.length === 0 || queryWords.every((word) => searchableText.includes(word));

      // If user typed a search query, show all matching items across all sections dynamically
      if (q) {
        // Still apply size and price filters even during search
        const matchSize = !filterSize || p.size === filterSize;
        const price = p.sellingPrice || 0;
        const minP = parseFloat(filterMinPrice);
        const maxP = parseFloat(filterMaxPrice);
        const matchMinPrice = isNaN(minP) || price >= minP;
        const matchMaxPrice = isNaN(maxP) || price <= maxP;
        return matchSearch && matchSize && matchMinPrice && matchMaxPrice;
      }

      // When no search query, filter by selected section and category
      const matchSection = selectedSection === 'All' || p.section === selectedSection;
      const matchCategory = selectedCategory === 'All' || p.category === selectedCategory;

      // Size filter
      const matchSize = !filterSize || p.size === filterSize;

      // Price filter
      const price = p.sellingPrice || 0;
      const minP = parseFloat(filterMinPrice);
      const maxP = parseFloat(filterMaxPrice);
      const matchMinPrice = isNaN(minP) || price >= minP;
      const matchMaxPrice = isNaN(maxP) || price <= maxP;

      return matchSection && matchCategory && matchSize && matchMinPrice && matchMaxPrice;
    });
  }, [products, selectedSection, selectedCategory, search, filterSize, filterMinPrice, filterMaxPrice]);

  // Pressing Enter in search bar with 1 match adds directly to bill
  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredProducts.length === 1) {
        addToCart(filteredProducts[0]);
      }
    }
  };

  // Add product to cart
  const addToCart = (product) => {
    setBillItems((prev) => {
      const existingIndex = prev.findIndex((item) => item.product === product._id);
      if (existingIndex > -1) {
        // Increase quantity
        const updated = [...prev];
        const item = updated[existingIndex];
        const newQty = item.quantity + 1;
        const discAmt = (item.rate * newQty * item.discountPercent) / 100;
        const total = item.rate * newQty - discAmt;

        updated[existingIndex] = {
          ...item,
          quantity: newQty,
          discountAmount: discAmt,
          taxableAmount: total,
          cgst: 0,
          sgst: 0,
          total,
        };
        return updated;
      } else {
        // Add new
        const qty = 1;
        const rate = product.sellingPrice;
        const discPct = 0;
        const discAmt = 0;
        const total = rate * qty;

        return [
          ...prev,
          {
            product: product._id,
            name: product.name,
            code: product.code,
            section: product.section || 'Women',
            category: product.category || 'Apparel',
            size: product.size || 'Free Size',
            color: product.color || '',
            mrp: product.mrp || 0,
            quantity: qty,
            unit: product.unit || 'piece',
            rate,
            discountPercent: discPct,
            discountAmount: discAmt,
            taxableAmount: total,
            gstRate: 0,
            cgst: 0,
            sgst: 0,
            igst: 0,
            total,
          },
        ];
      }
    });
  };

  // Update item quantity
  const updateQuantity = (index, delta) => {
    setBillItems((prev) => {
      const updated = [...prev];
      const item = updated[index];
      const newQty = Math.max(1, item.quantity + delta);
      const discAmt = (item.rate * newQty * item.discountPercent) / 100;
      const total = item.rate * newQty - discAmt;

      updated[index] = {
        ...item,
        quantity: newQty,
        discountAmount: discAmt,
        taxableAmount: total,
        cgst: 0,
        sgst: 0,
        total,
      };
      return updated;
    });
  };

  // Remove item from cart
  const removeFromCart = (index) => {
    setBillItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Calculate bill totals (GST removed)
  const billSummary = useMemo(() => {
    const rawSubtotal = billItems.reduce((sum, item) => sum + item.total, 0);
    const rawMrpTotal = billItems.reduce((sum, item) => sum + (item.mrp || item.rate) * item.quantity, 0);

    const overallDiscPct = parseFloat(billDiscountPercent) || 0;
    const overallDiscAmt = (rawSubtotal * overallDiscPct) / 100;

    const grandTotal = Math.round(rawSubtotal - overallDiscAmt);
    const totalSavings = Math.max(0, rawMrpTotal - grandTotal);

    return {
      subtotal: Math.round(rawSubtotal * 100) / 100,
      totalTax: 0,
      roundOff: 0,
      grandTotal,
      rawMrpTotal,
      totalSavings,
      itemCount: billItems.reduce((sum, i) => sum + i.quantity, 0),
    };
  }, [billItems, billDiscountPercent]);

  // Complete checkout & create invoice
  const handleCheckout = async () => {
    if (billItems.length === 0) {
      alert('Please add at least one fashion item to the bill.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        customer: {
          name: customerName.trim() || 'Walk-in Customer',
          phone: customerPhone.trim(),
          address: customerAddress.trim(),
          gstin: '',
        },
        items: billItems,
        subtotal: billSummary.subtotal,
        totalDiscount: Math.round(billSummary.subtotal - billSummary.grandTotal), // ✅ actual discount
        totalTax: billSummary.totalTax,
        roundOff: billSummary.roundOff,
        grandTotal: billSummary.grandTotal,
        paymentMode,
        paymentStatus: 'Paid',
        notes: notes.trim() || 'Thank you for shopping at V.R. Fashion Palace!',
      };

      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        setLastSale(data.sale);
        setSharePhone(customerPhone.trim() || data.sale?.customer?.phone || '');
        setPrintCompleted(false);
        setSmsStatus(null);
        setShowInvoiceModal(true);
        setMobileTab('catalog');

        // Reset cart
        setBillItems([]);
        setCustomerName('');
        setCustomerPhone('');
        setCustomerAddress('');
        setNotes('');
        setBillDiscountPercent('0');

        // Refresh inventory counts
        fetchProducts();
      } else {
        alert('Failed to generate bill: ' + data.error);
      }
    } catch (err) {
      alert('Checkout error: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Helper to compute public customer digital e-bill link
  const getCustomerBillUrl = (sale) => {
    if (!sale) return '';
    const inv = sale.invoiceNumber;
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/bill/${inv}`;
    }
    return `http://localhost:3000/bill/${inv}`;
  };

  // Trigger print and mark completed for post-print actions
  const handlePrint = () => {
    setPrintCompleted(true);
    window.print();
  };

  // Helper to build a complete WhatsApp message with boutique branding, items list, and bill link
  const buildWhatsAppMessage = (sale, billUrl) => {
    const shopName = 'V.R. FASHION PALACE';
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
      `_Women & Kids Wear_\n` +
      `📍 Near check post, Kozhivilai, Kaliyakkavilai (P.O), Pin: 629153\n` +
      `📞 Phone: 8903940644\n\n` +
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
  const getWhatsAppShareUrl = () => {
    if (!lastSale) return '';
    const phone = (sharePhone || lastSale.customer?.phone || '').replace(/\D/g, '');
    const billUrl = getCustomerBillUrl(lastSale);
    const text = encodeURIComponent(buildWhatsAppMessage(lastSale, billUrl));
    return phone && phone.length >= 10
      ? `https://api.whatsapp.com/send?phone=91${phone.slice(-10)}&text=${text}`
      : `https://api.whatsapp.com/send?text=${text}`;
  };

  // Direct click handler for WhatsApp sharing with validation
  const handleShareWhatsAppLink = () => {
    if (!lastSale) return;
    const phone = (sharePhone || lastSale.customer?.phone || '').replace(/\D/g, '');
    if (!phone || phone.length < 10) {
      alert('⚠️ Please enter a valid 10-digit customer mobile number in the field above.');
      return;
    }

    const cleanPhone = phone.slice(-10);
    const billUrl = getCustomerBillUrl(lastSale);
    const text = encodeURIComponent(buildWhatsAppMessage(lastSale, billUrl));
    const waUrl = `https://api.whatsapp.com/send?phone=91${cleanPhone}&text=${text}`;
    window.open(waUrl, '_blank');
  };

  // Capture receipt image via html2canvas and share/copy to WhatsApp
  const handleShareWhatsAppImage = async () => {
    if (!lastSale) return;
    const invoiceEl = document.getElementById('printable-invoice');
    if (!invoiceEl) {
      alert('Invoice receipt element not found');
      return;
    }

    try {
      setGeneratingImage(true);
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(invoiceEl, {
        scale: 2, // High resolution for crystal clear text
        backgroundColor: '#ffffff',
        useCORS: true,
        logging: false,
      });

      const phone = (sharePhone || lastSale.customer?.phone || '').replace(/\D/g, '');
      const fileName = `VR_Fashion_Palace_Bill_${lastSale.invoiceNumber}.png`;

      canvas.toBlob(async (blob) => {
        if (!blob) {
          alert('Failed to generate receipt image');
          setGeneratingImage(false);
          return;
        }

        const file = new File([blob], fileName, { type: 'image/png' });

        // 1. Mobile / Tablet Web Share API Level 2 (files sharing directly to WhatsApp)
        if (typeof navigator !== 'undefined' && navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              files: [file],
              title: `VR Fashion Palace Bill ${lastSale.invoiceNumber}`,
              text: `Customer Bill: ${lastSale.customer?.name || 'Customer'} - Total ₹${lastSale.grandTotal}`,
            });
            setGeneratingImage(false);
            return;
          } catch (shareErr) {
            if (shareErr.name !== 'AbortError') {
              console.warn('Web Share failed, proceeding with fallback', shareErr);
            }
          }
        }

        // 2. Desktop clipboard copy for instant Ctrl+V into WhatsApp Web / Desktop
        let clipboardCopied = false;
        try {
          if (navigator.clipboard && window.ClipboardItem) {
            await navigator.clipboard.write([
              new ClipboardItem({ 'image/png': blob }),
            ]);
            clipboardCopied = true;
            setCopiedImage(true);
            setTimeout(() => setCopiedImage(false), 5000);
          }
        } catch (clipErr) {
          console.warn('Clipboard image write failed:', clipErr);
        }

        // 3. Download the PNG receipt file
        const downloadLink = document.createElement('a');
        downloadLink.href = canvas.toDataURL('image/png');
        downloadLink.download = fileName;
        downloadLink.click();

        // 4. Open WhatsApp chat with the customer
        const waUrl = phone
          ? `https://wa.me/91${phone.slice(-10)}`
          : 'https://wa.me/';
        window.open(waUrl, '_blank');

        if (clipboardCopied) {
          alert(`✅ Bill image copied to clipboard & downloaded (${fileName})!\n\nOpening WhatsApp... Just press Ctrl+V in the chat to paste and send the bill image!`);
        } else {
          alert(`✅ Bill image downloaded (${fileName})!\n\nOpening WhatsApp... You can attach the downloaded image file.`);
        }

        setGeneratingImage(false);
      }, 'image/png');
    } catch (err) {
      console.error('Error capturing receipt image:', err);
      alert('Could not generate receipt image: ' + err.message);
      setGeneratingImage(false);
    }
  };

  // Dispatch digital e-bill SMS to customer phone
  const handleSendSMS = async () => {
    if (!lastSale) return;
    const phone = (sharePhone || lastSale.customer?.phone || '').replace(/\D/g, '');
    if (!phone || phone.length < 10) {
      alert('Please enter a valid 10-digit customer mobile number.');
      return;
    }

    const billUrl = getCustomerBillUrl(lastSale);
    setSendingSms(true);
    setSmsStatus(null);

    try {
      const res = await fetch('/api/notifications/sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: phone.slice(-10),
          invoiceNumber: lastSale.invoiceNumber,
          customerName: lastSale.customer?.name || 'Customer',
          grandTotal: lastSale.grandTotal,
          billUrl,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSmsStatus({
          success: true,
          message: `SMS link sent to +91 ${phone.slice(-10)}!`,
        });

        // Trigger native mobile SMS app if on smartphone
        if (typeof navigator !== 'undefined' && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
          const bodyText = encodeURIComponent(
            `VR Fashion Palace: Dear ${lastSale.customer?.name || 'Customer'}, your bill of Rs.${lastSale.grandTotal} is ready. View digital e-bill: ${billUrl}`
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

  // Copy customer digital e-bill link to clipboard
  const handleCopyBillLink = () => {
    if (!lastSale) return;
    const url = getCustomerBillUrl(lastSale);
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6">
      {/* Clean Top Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-200/70">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 font-heading tracking-tight">
            POS Billing Counter
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg">
            {products.length} Items
          </span>
          <button
            onClick={fetchProducts}
            disabled={loadingProducts}
            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition"
            title="Refresh Products"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingProducts ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Mobile Segmented Navigation Tabs (Catalog vs Current Bill Cart) */}
      <div className="lg:hidden grid grid-cols-2 gap-2 bg-slate-200/80 p-1 rounded-2xl border border-slate-200 shadow-sm">
        <button
          type="button"
          onClick={() => setMobileTab('catalog')}
          className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-bold text-xs transition active:scale-95 ${
            mobileTab === 'catalog'
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Layers className="w-4 h-4 text-rose-600" />
          <span>Outfits ({products.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setMobileTab('cart')}
          className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-bold text-xs transition active:scale-95 ${
            mobileTab === 'cart'
              ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Current Cart ({billSummary.itemCount})</span>
          {billSummary.grandTotal > 0 && (
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${
                mobileTab === 'cart' ? 'bg-white/20 text-white' : 'bg-rose-100 text-rose-700'
              }`}
            >
              ₹{billSummary.grandTotal.toLocaleString('en-IN')}
            </span>
          )}
        </button>
      </div>

      {/* Main Grid: Left Catalog + Right Cart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side: Product Catalog (Cols 7 on Desktop) */}
        <div className={`${mobileTab === 'catalog' ? 'block' : 'hidden'} lg:block lg:col-span-7 space-y-4 pb-24 lg:pb-0`}>
          {/* Search & Quick Filter Controls */}
          <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-rose-100 shadow-sm space-y-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder="Search outfit (e.g. Saree, Frock, Kurti, Pink, M, or scan barcode)..."
                className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition placeholder:text-slate-400"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Dynamic Search Results Status Banner */}
            {search.trim() && (
              <div className="flex items-center justify-between px-3.5 py-2 rounded-xl bg-rose-50/80 border border-rose-200 text-xs text-rose-900 animate-in fade-in duration-150">
                <div className="flex items-center gap-1.5 font-bold">
                  <Sparkles className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                  <span>
                    Showing {filteredProducts.length} {filteredProducts.length === 1 ? 'item' : 'items'} matching &ldquo;{search}&rdquo; across all collections
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="text-[11px] font-bold text-rose-700 hover:text-rose-900 underline ml-2 shrink-0"
                >
                  Clear Search
                </button>
              </div>
            )}


            {/* Section Filter Pills (Horizontal Scrollable) - Active when search is empty */}
            {!search.trim() && (
              <>
                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none pt-1 border-t border-slate-100">
                  {sections.map((sec) => (
                    <button
                      key={sec}
                      type="button"
                      onClick={() => {
                        setSelectedSection(sec);
                        setSelectedCategory('All');
                      }}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold shrink-0 transition active:scale-95 ${
                        selectedSection === sec
                          ? 'bg-rose-600 text-white shadow-md shadow-rose-600/20'
                          : 'bg-slate-100 text-slate-600 hover:bg-rose-50 hover:text-rose-700'
                      }`}
                    >
                      {sec === 'All'
                        ? '🌟 All Collections'
                        : sec === 'Women'
                        ? '👗 Women Wear'
                        : sec === 'Kids Girls'
                        ? '🎀 Kids Girls'
                        : sec === 'Kids Boys'
                        ? '👦 Kids Boys'
                        : sec === 'Infants'
                        ? '👶 Infant & Baby'
                        : sec}
                    </button>
                  ))}
                </div>

                {/* Category Grid Tiles — shown when a specific section is selected */}
                {selectedSection !== 'All' && categories.length > 1 && (
                  <div className="pt-2 border-t border-slate-100">
                    <div className="flex items-center gap-1.5 mb-2">
                      <Tag className="w-3.5 h-3.5 text-purple-500" />
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        Categories in {selectedSection}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
                      {categories.map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setSelectedCategory(cat)}
                          className={`px-2.5 py-2 rounded-xl text-[11px] font-bold transition text-center truncate border ${
                            selectedCategory === cat
                              ? 'bg-purple-600 text-white border-purple-600 shadow-sm ring-1 ring-purple-300'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-purple-50 hover:border-purple-300 hover:text-purple-700'
                          }`}
                        >
                          {cat === 'All' ? '🌟 All' : cat}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Size & Price Filters */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
              <div className="flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-[10px] font-bold text-slate-500 uppercase">Filter:</span>
              </div>
              {/* Size filter */}
              <select
                value={filterSize}
                onChange={(e) => setFilterSize(e.target.value)}
                className="px-2 py-1.5 rounded-lg border border-slate-200 text-[11px] font-bold text-slate-700 focus:ring-1 focus:ring-rose-500 bg-slate-50"
              >
                <option value="">All Sizes</option>
                {allSizes.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              {/* Min price */}
              <div className="flex items-center gap-1">
                <span className="text-[10px] font-bold text-slate-400">₹ Min</span>
                <input
                  type="number"
                  value={filterMinPrice}
                  onChange={(e) => setFilterMinPrice(e.target.value)}
                  placeholder="0"
                  className="w-16 px-2 py-1.5 rounded-lg border border-slate-200 text-[11px] font-bold text-slate-700 focus:ring-1 focus:ring-rose-500 bg-slate-50"
                />
              </div>
              {/* Max price */}
              <div className="flex items-center gap-1">
                <span className="text-[10px] font-bold text-slate-400">₹ Max</span>
                <input
                  type="number"
                  value={filterMaxPrice}
                  onChange={(e) => setFilterMaxPrice(e.target.value)}
                  placeholder="Any"
                  className="w-16 px-2 py-1.5 rounded-lg border border-slate-200 text-[11px] font-bold text-slate-700 focus:ring-1 focus:ring-rose-500 bg-slate-50"
                />
              </div>
              {/* Clear filters */}
              {(filterSize || filterMinPrice || filterMaxPrice) && (
                <button
                  onClick={() => { setFilterSize(''); setFilterMinPrice(''); setFilterMaxPrice(''); }}
                  className="px-2 py-1 rounded-lg bg-red-50 text-red-600 text-[10px] font-bold hover:bg-red-100 transition"
                >
                  ✕ Clear
                </button>
              )}
            </div>
          </div>

          {/* Product Cards Grid */}
          {loadingProducts ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-rose-100 shadow-sm">
              <div className="w-8 h-8 border-4 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-sm font-semibold text-slate-500">Loading VR Fashion Palace collection...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-rose-100 shadow-sm">
              <ShoppingBag className="w-12 h-12 mx-auto text-slate-300 mb-2" />
              <p className="text-sm font-bold text-slate-700">No matching apparel found</p>
              <p className="text-xs text-slate-400 mt-1">Try clearing your search query or section filter</p>
              <button
                onClick={() => {
                  setSearch('');
                  setSelectedSection('All');
                  setSelectedCategory('All');
                }}
                className="mt-3 px-3.5 py-1.5 rounded-lg bg-rose-50 text-rose-700 font-bold text-xs hover:bg-rose-100 transition"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-3 gap-2.5 sm:gap-4">
              {filteredProducts.map((p) => {
                const discountPct = p.mrp > p.sellingPrice ? Math.round(((p.mrp - p.sellingPrice) / p.mrp) * 100) : 0;
                const isKids = p.section?.includes('Kids') || p.section === 'Infants';
                const isOutOfStock = p.currentStock <= 0;
                const inCart = billItems.find((item) => (item.product || item._id) === p._id);

                return (
                  <div
                    key={p._id}
                    className="bg-white rounded-xl sm:rounded-2xl border border-slate-200/80 hover:border-rose-300 p-2.5 sm:p-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group relative overflow-hidden"
                  >
                    {/* Top Tag & Stock */}
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1.5">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] font-black uppercase tracking-wider truncate max-w-[90px] sm:max-w-none ${
                            p.section === 'Women'
                              ? 'bg-rose-100 text-rose-800'
                              : isKids
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {p.section}
                        </span>

                        <span
                          className={`text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${
                            isOutOfStock
                              ? 'bg-red-100 text-red-700'
                              : p.currentStock <= (p.minStockAlert || 5)
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {isOutOfStock ? 'Sold Out' : `${p.currentStock}`}
                        </span>
                      </div>

                      {/* Product Name */}
                      <h3 className="font-bold text-slate-900 text-xs sm:text-sm leading-snug line-clamp-2 group-hover:text-rose-600 transition">
                        {p.name}
                      </h3>

                      {/* Meta badges: Size & Color */}
                      <div className="flex flex-wrap items-center gap-1 mt-1.5 text-[10px] sm:text-[11px] text-slate-600 font-medium">
                        <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-800 font-bold">
                          {p.size || 'Free Size'}
                        </span>
                        {p.color && (
                          <span className="px-1.5 py-0.5 rounded bg-slate-50 text-slate-600 border border-slate-200/60 truncate max-w-[65px] sm:max-w-none">
                            {p.color}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Bottom Pricing & Add to Bill Button */}
                    <div className="mt-2.5 pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5">
                      <div>
                        <div className="flex items-baseline gap-1">
                          <span className="text-sm sm:text-base font-black text-slate-900">
                            ₹{p.sellingPrice.toLocaleString('en-IN')}
                          </span>
                          {p.mrp > p.sellingPrice && (
                            <span className="text-[10px] sm:text-xs text-slate-400 line-through">
                              ₹{p.mrp.toLocaleString('en-IN')}
                            </span>
                          )}
                        </div>
                        {discountPct > 0 && (
                          <span className="text-[9px] sm:text-[10px] font-bold text-emerald-600 block">
                            {discountPct}% OFF
                          </span>
                        )}
                      </div>

                      <button
                        onClick={() => addToCart(p)}
                        disabled={isOutOfStock}
                        className={`w-full sm:w-auto flex items-center justify-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-lg sm:rounded-xl font-bold text-xs shadow-sm active:scale-95 transition disabled:opacity-40 disabled:cursor-not-allowed ${
                          inCart
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                            : 'bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white'
                        }`}
                      >
                        {inCart ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>{inCart.quantity} in cart</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Side: Current Bill / Checkout Cart (Cols 5 on Desktop, Full Width on Mobile Cart Tab) */}
        <div className={`${mobileTab === 'cart' ? 'block' : 'hidden'} lg:block lg:col-span-5 sticky top-20 space-y-4`}>
          <div className="bg-white rounded-2xl border border-rose-200/80 shadow-xl overflow-hidden flex flex-col">
            {/* Cart Header */}
            <div className="p-3.5 sm:p-4 bg-gradient-to-r from-purple-950 via-rose-900 to-purple-950 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-rose-400" />
                <h2 className="font-heading font-black text-sm sm:text-base">Current Bill Cart</h2>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-white/20 text-rose-100">
                  {billSummary.itemCount} items
                </span>
                {billItems.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm('Clear all outfits from the current bill?')) {
                        setBillItems([]);
                      }
                    }}
                    className="text-[11px] font-bold text-rose-300 hover:text-white px-2 py-0.5 rounded hover:bg-white/10 transition"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Mobile Back Banner (shown only on mobile when on Cart tab) */}
            <div className="lg:hidden px-3.5 py-2.5 bg-rose-50/80 border-b border-rose-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setMobileTab('catalog')}
                className="flex items-center gap-1 text-xs font-bold text-rose-700 hover:text-rose-900 active:scale-95 transition"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>← Back to Browse Outfits</span>
              </button>
              <span className="text-[11px] font-semibold text-slate-500">
                {billItems.length} outfit {billItems.length === 1 ? 'variety' : 'varieties'}
              </span>
            </div>

            {/* Cart Items List */}
            <div className="p-3.5 sm:p-4 max-h-[360px] lg:max-h-[380px] overflow-y-auto divide-y divide-slate-100 space-y-3">
              {billItems.length === 0 ? (
                <div className="py-10 text-center text-slate-400">
                  <ShoppingBag className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                  <p className="text-sm font-bold text-slate-700">Your bill cart is empty</p>
                  <p className="text-xs text-slate-400 mt-1 max-w-[240px] mx-auto">
                    Click &ldquo;Add&rdquo; on any dress or kids outfit from the catalog.
                  </p>
                  <button
                    type="button"
                    onClick={() => setMobileTab('catalog')}
                    className="lg:hidden mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Browse Outfits</span>
                  </button>
                </div>
              ) : (
                billItems.map((item, idx) => (
                  <div key={item.product + idx} className="pt-3 first:pt-0 flex items-center justify-between gap-2 sm:gap-3">
                    <div className="flex-1 min-w-0 pr-1">
                      <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">{item.name}</p>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5">
                        <span className="font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">{item.size || 'Free'}</span>
                        <span>&bull;</span>
                        <span>₹{item.rate} each</span>
                      </div>
                    </div>

                    {/* Touch-Friendly Quantity controls */}
                    <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => updateQuantity(idx, -1)}
                        className="w-7 h-7 sm:w-6 sm:h-6 flex items-center justify-center rounded-lg bg-white shadow-sm hover:bg-slate-200 text-slate-700 text-sm sm:text-xs font-black transition active:scale-90"
                        aria-label="Decrease quantity"
                      >
                        -
                      </button>
                      <span className="w-6 sm:w-5 text-center text-xs font-black text-slate-800">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(idx, 1)}
                        className="w-7 h-7 sm:w-6 sm:h-6 flex items-center justify-center rounded-lg bg-white shadow-sm hover:bg-slate-200 text-slate-700 text-sm sm:text-xs font-black transition active:scale-90"
                        aria-label="Increase quantity"
                      >
                        +
                      </button>
                    </div>

                    {/* Price and remove */}
                    <div className="text-right shrink-0 min-w-[65px]">
                      <p className="text-xs sm:text-sm font-black text-slate-900">
                        ₹{Math.round(item.total).toLocaleString('en-IN')}
                      </p>
                      <button
                        type="button"
                        onClick={() => removeFromCart(idx)}
                        className="text-[11px] text-red-500 hover:text-red-700 mt-0.5 font-bold"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Customer Details Form */}
            <div className="p-3.5 sm:p-4 bg-slate-50/70 border-t border-slate-200 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                    Customer Name
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="e.g. Pooja, Walk-in"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm sm:text-xs font-medium focus:ring-1 focus:ring-rose-500 focus:outline-none bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                    Phone (WhatsApp Bill)
                  </label>
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="10-digit mobile"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm sm:text-xs font-medium focus:ring-1 focus:ring-rose-500 focus:outline-none bg-white"
                  />
                </div>
              </div>

              {/* Payment Mode Selection */}
              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                  Payment Mode
                </label>
                <div className="grid grid-cols-4 gap-1.5 text-center">
                  {[
                    { id: 'UPI', label: 'UPI GPay', icon: '⚡' },
                    { id: 'Cash', label: 'Cash', icon: '💵' },
                    { id: 'Card', label: 'Card', icon: '💳' },
                    { id: 'Credit/Due', label: 'Credit', icon: '📝' },
                  ].map((mode) => (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => setPaymentMode(mode.id)}
                      className={`p-2 sm:p-1.5 rounded-xl text-[11px] font-bold transition flex flex-col items-center gap-0.5 active:scale-95 ${
                        paymentMode === mode.id
                          ? 'bg-rose-600 text-white shadow-md ring-2 ring-rose-600/30'
                          : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <span className="text-xs sm:text-sm">{mode.icon}</span>
                      <span className="truncate w-full">{mode.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Discount Section with Quick Buttons */}
              <div className="pt-1 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700">Bill Discount:</span>
                  <div className="flex items-center gap-1.5 w-28">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={billDiscountPercent}
                      onChange={(e) => setBillDiscountPercent(e.target.value)}
                      className="w-full px-2 py-1 rounded-lg border border-slate-300 text-xs text-right font-bold bg-white"
                    />
                    <span className="text-xs font-bold text-slate-500">%</span>
                  </div>
                </div>
                {/* Quick % chips */}
                <div className="flex items-center gap-1.5 justify-end">
                  {['0', '5', '10', '15', '20'].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => setBillDiscountPercent(pct)}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold transition ${
                        billDiscountPercent === pct
                          ? 'bg-rose-600 text-white'
                          : 'bg-slate-200/80 text-slate-600 hover:bg-slate-300'
                      }`}
                    >
                      {pct}%
                    </button>
                  ))}
                </div>
              </div>

              {/* Summary Breakdown */}
              <div className="space-y-1.5 pt-2 border-t border-slate-200 text-xs">
                <div className="flex justify-between text-slate-600 font-medium">
                  <span>Subtotal ({billSummary.itemCount} items):</span>
                  <span className="font-semibold text-slate-800">₹{billSummary.subtotal.toLocaleString('en-IN')}</span>
                </div>
                {parseFloat(billDiscountPercent) > 0 && (
                  <div className="flex justify-between text-rose-600 font-bold">
                    <span>Discount ({billDiscountPercent}%):</span>
                    <span>-₹{Math.round((billSummary.subtotal * parseFloat(billDiscountPercent)) / 100).toLocaleString('en-IN')}</span>
                  </div>
                )}
                {billSummary.totalSavings > 0 && (
                  <div className="flex justify-between text-emerald-700 font-bold">
                    <span>Customer Saved:</span>
                    <span>₹{billSummary.totalSavings.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="flex justify-between items-baseline text-base font-black text-slate-900 pt-1.5 border-t border-slate-300">
                  <span>Grand Total:</span>
                  <span className="text-rose-600 text-xl font-heading">
                    ₹{billSummary.grandTotal.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Checkout Button */}
              <button
                onClick={handleCheckout}
                disabled={submitting || billItems.length === 0}
                className="w-full py-3.5 sm:py-3 rounded-xl bg-gradient-to-r from-purple-900 via-rose-600 to-pink-600 hover:from-purple-800 hover:to-pink-500 text-white font-extrabold text-sm sm:text-xs shadow-lg shadow-rose-600/30 transition active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <>
                    <Printer className="w-4 h-4" />
                    <span>Complete & Print Bill (₹{billSummary.grandTotal.toLocaleString('en-IN')})</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Floating Cart Trigger Bar (Sticky Bottom on Phones when browsing Outfits) */}
      {mobileTab === 'catalog' && billItems.length > 0 && (
        <div className="lg:hidden fixed bottom-4 left-3 right-3 z-30 animate-in slide-in-from-bottom duration-200">
          <button
            type="button"
            onClick={() => {
              setMobileTab('cart');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="w-full bg-gradient-to-r from-purple-950 via-rose-700 to-purple-950 text-white p-3.5 rounded-2xl shadow-2xl flex items-center justify-between border border-rose-500/30 active:scale-98 transition"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-rose-500 flex items-center justify-center font-black text-xs shadow-md">
                {billSummary.itemCount}
              </div>
              <div className="text-left">
                <p className="text-xs font-bold leading-tight">Current Bill Cart ({billSummary.itemCount} items)</p>
                <p className="text-[10px] text-rose-200">{billItems.length} outfit varieties added</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm font-black text-amber-300">
                ₹{billSummary.grandTotal.toLocaleString('en-IN')}
              </span>
              <div className="flex items-center text-xs font-bold bg-white/20 hover:bg-white/30 px-2.5 py-1 rounded-xl">
                <span>View Cart</span>
                <ChevronRight className="w-4 h-4 ml-0.5" />
              </div>
            </div>
          </button>
        </div>
      )}

      {/* Invoice Modal for Printing & WhatsApp Sharing */}
      {showInvoiceModal && lastSale && (
        <div className="fixed inset-0 !m-0 !p-0 w-screen h-screen min-h-[100dvh] z-[70] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden my-6 animate-in zoom-in-95 duration-150">
            {/* Modal Controls Bar (Hidden during print) */}
            <div className="no-print bg-slate-900 text-white px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span className="font-bold text-sm">Bill Generated Successfully!</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPrintLayout(printLayout === 'thermal' ? 'a4' : 'thermal')}
                  className="px-2.5 py-1 rounded bg-white/10 hover:bg-white/20 text-xs font-semibold text-rose-200"
                >
                  Layout: {printLayout === 'thermal' ? 'Thermal 80mm' : 'A4 Full'}
                </button>
                <button
                  onClick={() => setShowInvoiceModal(false)}
                  className="text-slate-400 hover:text-white font-bold text-sm p-1"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Printable Bill Area */}
            <div
              id="printable-invoice"
              className={`p-6 bg-white text-slate-900 ${
                printLayout === 'thermal' ? 'max-w-[340px] mx-auto text-xs font-mono' : 'text-sm'
              }`}
            >
              {/* Store Branding Header */}
              <div className="text-center pb-4 border-b border-dashed border-slate-300">
                <img
                  src="/logo.png"
                  alt="VR Logo"
                  className="w-12 h-12 object-contain mx-auto mb-2"
                />
                <h2 className="font-heading font-black text-xl tracking-tight text-slate-950 uppercase">
                  V.R. FASHION PALACE
                </h2>
                <p className="text-[11px] font-bold text-rose-700 tracking-wide mt-0.5">
                  Women & Kids Wear
                </p>
                <p className="text-[10px] text-slate-600 mt-1 font-medium">
                  Near check post, Kozhivilai
                </p>
                <p className="text-[10px] text-slate-600 font-medium">
                  Kaliyakkavilai (p.o), Pin: 629153
                </p>
                <p className="text-[10px] font-bold text-slate-800 mt-0.5">Phone: 8903940644</p>
              </div>

              {/* Invoice Meta */}
              <div className="py-3 border-b border-dashed border-slate-300 flex justify-between text-[11px]">
                <div>
                  <p>
                    <span className="font-bold">Bill No:</span> {lastSale.invoiceNumber}
                  </p>
                  <p>
                    <span className="font-bold">Customer:</span> {lastSale.customer?.name}
                  </p>
                  {lastSale.customer?.phone && (
                    <p>
                      <span className="font-bold">Phone:</span> {lastSale.customer?.phone}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p>{new Date(lastSale.createdAt).toLocaleDateString()}</p>
                  <p>{new Date(lastSale.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  <p className="font-bold text-rose-700">{lastSale.paymentMode}</p>
                </div>
              </div>

              {/* Itemized Table */}
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
                    {lastSale.items?.map((it, idx) => (
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

              {/* Totals */}
              <div className="py-2.5 border-t border-dashed border-slate-300 space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>₹{lastSale.subtotal?.toLocaleString('en-IN')}</span>
                </div>
                {lastSale.roundOff !== 0 && (
                  <div className="flex justify-between text-slate-500">
                    <span>Round Off:</span>
                    <span>₹{lastSale.roundOff}</span>
                  </div>
                )}
                <div className="flex justify-between font-black text-sm pt-1 border-t border-slate-300 text-slate-950">
                  <span>Grand Total:</span>
                  <span>₹{lastSale.grandTotal?.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Footer Note */}
              <div className="text-center pt-4 border-t border-dashed border-slate-300 text-[10px] text-slate-500 space-y-0.5">
                <p className="font-bold text-slate-700">Thank you for shopping at V.R. Fashion Palace!</p>
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
                  title="Send digital e-bill link via SMS to customer's mobile number"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>{sendingSms ? 'Sending...' : 'Send SMS Link'}</span>
                </button>

                {/* 2. Send WhatsApp Link */}
                <button
                  type="button"
                  onClick={handleShareWhatsAppLink}
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
                  href={getCustomerBillUrl(lastSale)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 hover:text-rose-800 underline"
                >
                  <span>Preview Customer View</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            {/* Modal Bottom Actions (Hidden during print) */}
            <div className="no-print p-4 bg-slate-100 border-t border-slate-200 flex items-center justify-between gap-2">
              <button
                onClick={() => setShowInvoiceModal(false)}
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
