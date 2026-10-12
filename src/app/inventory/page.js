'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Layers,
  Plus,
  Search,
  AlertTriangle,
  Package,
  Edit3,
  Check,
  X,
  ChevronDown,
  DollarSign,
  Crown,
  Sparkles,
  ShoppingBag,
  Trash2,
  CheckCircle2,
  Filter,
  ArrowUpDown,
  Loader2
} from 'lucide-react';

export default function InventoryPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedSection, setSelectedSection] = useState('All');
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [stockAdjustModal, setStockAdjustModal] = useState(null);
  const [adjustAmount, setAdjustAmount] = useState('10');

  // New Outfit Form State
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    section: 'Women',
    category: 'Kurtis & Tunics',
    size: 'M',
    color: '',
    fabric: 'Cotton',
    brand: 'VR Collection',
    mrp: '',
    costPrice: '',
    sellingPrice: '',
    currentStock: '15',
    minStockAlert: '5',
    barcode: '',
  });

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/products?limit=150');
      const data = await res.json();
      if (data.success) {
        setProducts(data.products || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const sections = ['All', 'Women', 'Kids Girls', 'Kids Boys', 'Infants'];

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchSection = selectedSection === 'All' || p.section === selectedSection;
      const matchLowStock = !showLowStockOnly || (p.currentStock || 0) <= (p.minStockAlert || 5);

      const q = search.trim().toLowerCase();
      const matchSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.code.toLowerCase().includes(q) ||
        (p.size && p.size.toLowerCase().includes(q)) ||
        (p.color && p.color.toLowerCase().includes(q)) ||
        (p.fabric && p.fabric.toLowerCase().includes(q)) ||
        (p.brand && p.brand.toLowerCase().includes(q));

      return matchSection && matchLowStock && matchSearch;
    });
  }, [products, selectedSection, showLowStockOnly, search]);

  // Handle Quick Stock Adjust (+1 / -1)
  const handleQuickAdjust = async (product, delta) => {
    try {
      const res = await fetch(`/api/products/${product._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stockDelta: delta }),
      });
      const data = await res.json();
      if (data.success) {
        setProducts((prev) =>
          prev.map((item) => (item._id === product._id ? data.product : item))
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Submit Restock
  const handleApplyRestock = async () => {
    if (!stockAdjustModal) return;
    const addQty = parseInt(adjustAmount, 10);
    if (isNaN(addQty) || addQty <= 0) {
      alert('Please enter a valid stock quantity');
      return;
    }

    try {
      const res = await fetch(`/api/products/${stockAdjustModal._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stockDelta: addQty }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg(`Restocked ${addQty} pcs of "${stockAdjustModal.name}"!`);
        setStockAdjustModal(null);
        fetchProducts();
        setTimeout(() => setSuccessMsg(''), 3000);
      }
    } catch (err) {
      alert('Error updating stock: ' + err.message);
    }
  };

  // Handle Save / Add Product
  const handleSaveProduct = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.code.trim()) {
      setErrorMsg('Outfit name and code are required');
      return;
    }

    setSaving(true);
    setErrorMsg('');
    try {
      const url = editingProduct ? `/api/products/${editingProduct._id}` : '/api/products';
      const method = editingProduct ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (data.success) {
        setSuccessMsg(
          editingProduct ? 'Outfit updated successfully!' : 'New outfit added to catalog!'
        );
        setShowAddModal(false);
        setEditingProduct(null);
        fetchProducts();
        setTimeout(() => setSuccessMsg(''), 3000);
      } else {
        setErrorMsg(data.error || 'Failed to save product');
      }
    } catch (err) {
      setErrorMsg('Error: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Open Edit modal
  const openEditModal = (p) => {
    setEditingProduct(p);
    setFormData({
      name: p.name,
      code: p.code,
      section: p.section || 'Women',
      category: p.category || 'Kurtis & Suits',
      size: p.size || 'Free Size',
      color: p.color || '',
      fabric: p.fabric || 'Cotton',
      brand: p.brand || 'VR Collection',
      mrp: p.mrp || p.sellingPrice || '',
      costPrice: p.costPrice || '',
      sellingPrice: p.sellingPrice || '',
      currentStock: p.currentStock || 0,
      minStockAlert: p.minStockAlert || 5,
      barcode: p.barcode || '',
    });
    setShowAddModal(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-5 sm:space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-rose-100 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-900 to-rose-600 text-amber-300 flex items-center justify-center font-bold shadow-md shadow-rose-500/20">
            <Crown className="w-6 h-6" />
          </div>
          <div>
            <h1 className="font-heading text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Stock & Apparel Management
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Manage Women & Kids wear inventory, pieces in stock, sizes, and restock shipments.
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            setEditingProduct(null);
            setFormData({
              name: '',
              code: `VR-${Date.now().toString().slice(-4)}`,
              section: 'Women',
              category: 'Kurtis & Tunics',
              size: 'M',
              color: '',
              fabric: 'Cotton',
              brand: 'VR Collection',
              mrp: '',
              costPrice: '',
              sellingPrice: '',
              currentStock: '15',
              minStockAlert: '5',
              barcode: '',
            });
            setShowAddModal(true);
          }}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-rose-600/25 transition active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Outfit</span>
        </button>
      </div>

      {/* Feedback Messages */}
      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search outfit name, code, size, fabric, or brand..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm font-medium focus:ring-2 focus:ring-rose-500 focus:outline-none"
            />
          </div>

          {/* Low Stock Toggle */}
          <button
            onClick={() => setShowLowStockOnly(!showLowStockOnly)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
              showLowStockOnly
                ? 'bg-red-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Low Stock Alerts Only</span>
          </button>
        </div>

        {/* Section Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {sections.map((sec) => (
            <button
              key={sec}
              onClick={() => setSelectedSection(sec)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold shrink-0 transition ${
                selectedSection === sec
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'bg-slate-50 text-slate-600 hover:bg-rose-50 hover:text-rose-700 border border-slate-200/60'
              }`}
            >
              {sec === 'All' && '🌟 All Items'}
              {sec === 'Women' && '👗 Women Wear'}
              {sec === 'Kids Girls' && '🎀 Kids Girls'}
              {sec === 'Kids Boys' && '👦 Kids Boys'}
              {sec === 'Infants' && '👶 Infant & Baby'}
            </button>
          ))}
        </div>
      </div>

      {/* Products Display (Responsive: Mobile Cards + Desktop Table) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-rose-600 mx-auto mb-2" />
            <p className="text-xs sm:text-sm font-semibold text-slate-500">Loading VR Fashion Palace stock...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <ShoppingBag className="w-12 h-12 mx-auto text-slate-300 mb-2" />
            <p className="text-sm font-bold text-slate-700">No outfits match the criteria</p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50 text-slate-600 text-xs font-bold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3.5 px-4">Outfit Details</th>
                    <th className="py-3.5 px-3">Section</th>
                    <th className="py-3.5 px-3">Size & Fabric</th>
                    <th className="py-3.5 px-3">Pricing (₹)</th>
                    <th className="py-3.5 px-3">Stock Units</th>
                    <th className="py-3.5 px-4 text-right">Quick Stock Adjust</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredProducts.map((p) => {
                    const isLow = (p.currentStock || 0) <= (p.minStockAlert || 5);
                    return (
                      <tr key={p._id} className="hover:bg-slate-50/70 transition">
                        {/* Name & Code */}
                        <td className="py-3 px-4">
                          <p className="font-bold text-slate-900">{p.name}</p>
                          <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                            <span className="font-mono text-slate-600">{p.code}</span>
                            <span>&bull;</span>
                            <span>{p.category}</span>
                            {p.brand && <span>({p.brand})</span>}
                          </div>
                        </td>

                        {/* Section */}
                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              p.section === 'Women'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-purple-100 text-purple-800'
                            }`}
                          >
                            {p.section}
                          </span>
                        </td>

                        {/* Size & Fabric */}
                        <td className="py-3 px-3 text-xs">
                          <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                            {p.size || 'Free'}
                          </span>
                          <p className="text-[11px] text-slate-500 mt-0.5">{p.fabric || 'Cotton'}</p>
                        </td>

                        {/* Pricing */}
                        <td className="py-3 px-3">
                          <div className="font-bold text-slate-900">
                            ₹{p.sellingPrice?.toLocaleString('en-IN')}
                          </div>
                          {p.mrp > p.sellingPrice && (
                            <span className="text-[10px] text-slate-400 line-through">
                              MRP ₹{p.mrp}
                            </span>
                          )}
                        </td>

                        {/* Stock Units */}
                        <td className="py-3 px-3">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                              isLow
                                ? 'bg-red-100 text-red-700'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {isLow && <AlertTriangle className="w-3 h-3 text-red-600" />}
                            <span>{p.currentStock || 0} pcs</span>
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Steppers */}
                            <button
                              onClick={() => handleQuickAdjust(p, -1)}
                              className="w-7 h-7 rounded-lg border border-slate-200 hover:bg-slate-100 flex items-center justify-center font-bold text-slate-700 transition"
                              title="Decrease 1 piece"
                            >
                              -
                            </button>
                            <button
                              onClick={() => handleQuickAdjust(p, 1)}
                              className="w-7 h-7 rounded-lg border border-slate-200 hover:bg-slate-100 flex items-center justify-center font-bold text-slate-700 transition"
                              title="Increase 1 piece"
                            >
                              +
                            </button>

                            {/* Restock button */}
                            <button
                              onClick={() => {
                                setStockAdjustModal(p);
                                setAdjustAmount('10');
                              }}
                              className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-bold transition"
                            >
                              Restock
                            </button>

                            {/* Edit button */}
                            <button
                              onClick={() => openEditModal(p)}
                              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition"
                              title="Edit outfit"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View */}
            <div className="md:hidden divide-y divide-slate-100">
              {filteredProducts.map((p) => {
                const isLow = (p.currentStock || 0) <= (p.minStockAlert || 5);
                return (
                  <div key={p._id} className="p-4 space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-rose-700 bg-rose-50 px-2 py-0.5 rounded">
                          {p.section}
                        </span>
                        <h3 className="font-bold text-slate-900 text-sm mt-1">{p.name}</h3>
                        <p className="text-[11px] text-slate-400 font-mono">{p.code}</p>
                      </div>

                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                          isLow ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {p.currentStock || 0} pcs
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                      <div>
                        <span className="font-black text-slate-900 text-sm">
                          ₹{p.sellingPrice?.toLocaleString('en-IN')}
                        </span>
                        <span className="text-slate-400 ml-1.5">Size: {p.size}</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleQuickAdjust(p, -1)}
                          className="w-7 h-7 rounded bg-slate-100 font-bold flex items-center justify-center text-xs"
                        >
                          -
                        </button>
                        <button
                          onClick={() => handleQuickAdjust(p, 1)}
                          className="w-7 h-7 rounded bg-slate-100 font-bold flex items-center justify-center text-xs"
                        >
                          +
                        </button>
                        <button
                          onClick={() => {
                            setStockAdjustModal(p);
                            setAdjustAmount('10');
                          }}
                          className="px-2 py-1 rounded bg-rose-50 text-rose-700 text-xs font-bold"
                        >
                          Restock
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Restock Shipment Modal */}
      {stockAdjustModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-2xl border border-slate-200 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-heading font-black text-base text-slate-900">
                Restock Outfit Pieces
              </h3>
              <button
                onClick={() => setStockAdjustModal(null)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Add new inward shipment pieces for{' '}
              <span className="font-bold text-slate-900">{stockAdjustModal.name}</span> (Current:{' '}
              {stockAdjustModal.currentStock} pcs):
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Pieces to Add
              </label>
              <input
                type="number"
                min="1"
                value={adjustAmount}
                onChange={(e) => setAdjustAmount(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-bold focus:ring-2 focus:ring-rose-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setStockAdjustModal(null)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleApplyRestock}
                className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-sm"
              >
                Add Stock
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Outfit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 sm:p-6 space-y-4 shadow-2xl border border-slate-200 my-6 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-rose-600" />
                <h2 className="font-heading font-black text-lg text-slate-900">
                  {editingProduct ? 'Edit Fashion Outfit' : 'Add New Fashion Outfit'}
                </h2>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSaveProduct} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Store Section
                  </label>
                  <select
                    value={formData.section}
                    onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold focus:ring-1 focus:ring-rose-500"
                  >
                    <option value="Women">Women Wear</option>
                    <option value="Kids Girls">Kids Girls</option>
                    <option value="Kids Boys">Kids Boys</option>
                    <option value="Infants">Infants & Baby</option>
                    <option value="Ethnic Material">Ethnic Material</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Category
                  </label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="e.g. Kurtis, Sarees, Frocks"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:ring-1 focus:ring-rose-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Outfit Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Banarasi Silk Saree, Girls Tutu Frock"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:ring-1 focus:ring-rose-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    SKU Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="e.g. WMN-01"
                    className="w-full px-2.5 py-2 rounded-xl border border-slate-300 text-xs font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Size
                  </label>
                  <input
                    type="text"
                    value={formData.size}
                    onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                    placeholder="M, XL, 3-4Y"
                    className="w-full px-2.5 py-2 rounded-xl border border-slate-300 text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Color
                  </label>
                  <input
                    type="text"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    placeholder="Pink, Wine"
                    className="w-full px-2.5 py-2 rounded-xl border border-slate-300 text-xs font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    MRP (₹)
                  </label>
                  <input
                    type="number"
                    value={formData.mrp}
                    onChange={(e) => setFormData({ ...formData, mrp: e.target.value })}
                    placeholder="1499"
                    className="w-full px-2.5 py-2 rounded-xl border border-slate-300 text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Selling Price *
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.sellingPrice}
                    onChange={(e) => setFormData({ ...formData, sellingPrice: e.target.value })}
                    placeholder="999"
                    className="w-full px-2.5 py-2 rounded-xl border border-slate-300 text-xs font-bold text-rose-600"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Cost Price
                  </label>
                  <input
                    type="number"
                    value={formData.costPrice}
                    onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                    placeholder="500"
                    className="w-full px-2.5 py-2 rounded-xl border border-slate-300 text-xs font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Stock Pieces
                  </label>
                  <input
                    type="number"
                    value={formData.currentStock}
                    onChange={(e) => setFormData({ ...formData, currentStock: e.target.value })}
                    placeholder="20"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                    Min Stock Alert
                  </label>
                  <input
                    type="number"
                    value={formData.minStockAlert}
                    onChange={(e) => setFormData({ ...formData, minStockAlert: e.target.value })}
                    placeholder="5"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 text-white font-bold text-xs shadow-md shadow-rose-600/25 flex items-center gap-1.5"
                >
                  {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{saving ? 'Saving...' : editingProduct ? 'Update Outfit' : 'Add Outfit'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
