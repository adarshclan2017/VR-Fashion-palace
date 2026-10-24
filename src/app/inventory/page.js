'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/components/AuthProvider';
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
  ChevronRight,
  DollarSign,
  Sparkles,
  ShoppingBag,
  Trash2,
  CheckCircle2,
  Filter,
  ArrowUpDown,
  Loader2,
  Grid3X3,
  Tag
} from 'lucide-react';


const SECTION_SIZES = {
  '__women__':      ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL', 'Free Size'],
  '__kids__':       ['0-1Y', '1-2Y', '2-3Y', '3-4Y', '4-5Y', '5-6Y', '6-7Y', '7-8Y', '8-9Y', '9-10Y', '10-11Y', '11-12Y', 'Free Size'],
  '__infants__':    ['0-3M', '3-6M', '6-9M', '9-12M', '12-18M', '18-24M'],
  '__default__':    ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Free Size'],
};

const LS_SECTIONS = 'vr_palace_sections';
const LS_CATEGORIES = 'vr_palace_categories';

const loadLS = (key, fallback) => {
  if (typeof window === 'undefined') return fallback;
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
};
const saveLS = (key, val) => {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
};

// Persist to MongoDB
const saveSettingToDB = async (key, value) => {
  try {
    await fetch('/api/store-settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, value }),
    });
  } catch (err) {
    console.error('Failed to persist setting to DB:', err);
  }
};
// ─────────────────────────────────────────────────────────────────────────────

export default function InventoryPage() {
  const { user } = useAuth();
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
    section: '',
    category: '',
    size: '',
    fabric: '',
    brand: '',
    mrp: '',
    costPrice: '',
    sellingPrice: '',
    currentStock: '',
    minStockAlert: '',
  });

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Delete product state
  const [deleteProduct, setDeleteProduct] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // ── Dynamic sections + categories (saved in localStorage + MongoDB) ────────
  const [sections, setSections] = useState(() => loadLS(LS_SECTIONS, []));
  const [categoriesMap, setCategoriesMap] = useState(() => loadLS(LS_CATEGORIES, {}));

  // Inline "add" inputs
  const [addingSection, setAddingSection] = useState(false);
  const [newSectionText, setNewSectionText] = useState('');
  const [addingCategory, setAddingCategory] = useState(false);
  const [newCategoryText, setNewCategoryText] = useState('');

  // Load sections & categories from DB on mount (overrides localStorage if DB has data)
  useEffect(() => {
    const loadFromDB = async () => {
      try {
        const res = await fetch('/api/store-settings');
        const data = await res.json();
        if (data.success && data.settings) {
          if (Array.isArray(data.settings.sections) && data.settings.sections.length > 0) {
            setSections(data.settings.sections);
            saveLS(LS_SECTIONS, data.settings.sections);
          }
          if (data.settings.categories && typeof data.settings.categories === 'object') {
            setCategoriesMap(data.settings.categories);
            saveLS(LS_CATEGORIES, data.settings.categories);
          }
        }
      } catch (err) {
        console.error('Could not load store settings from DB:', err);
      }
    };
    loadFromDB();
  }, []);

  const handleAddSection = () => {
    const name = newSectionText.trim();
    if (!name) { setAddingSection(false); setNewSectionText(''); return; }
    const updated = sections.includes(name) ? sections : [...sections, name];
    setSections(updated);
    saveLS(LS_SECTIONS, updated);
    saveSettingToDB('sections', updated);
    const existingCats = categoriesMap[name] || [];
    setFormData((prev) => ({
      ...prev,
      section: name,
      category: existingCats[0] || '',
      size: getSizesForSection(name)[0] || 'Free Size'
    }));
    setAddingSection(false);
    setNewSectionText('');
  };

  const handleAddCategory = () => {
    const name = newCategoryText.trim();
    if (!name) { setAddingCategory(false); setNewCategoryText(''); return; }
    const sec = formData.section || sections[0] || 'Women';
    const existing = categoriesMap[sec] || [];
    const updatedCats = existing.includes(name) ? existing : [...existing, name];
    const updatedMap = { ...categoriesMap, [sec]: updatedCats };
    setCategoriesMap(updatedMap);
    saveLS(LS_CATEGORIES, updatedMap);
    saveSettingToDB('categories', updatedMap);
    setFormData((prev) => ({ ...prev, section: sec, category: name }));
    setAddingCategory(false);
    setNewCategoryText('');
  };

  const handleDeleteSection = (secToDelete) => {
    if (!window.confirm(`Delete section "${secToDelete}"? This only removes it from the list — existing products keep their section.`)) return;
    const updated = sections.filter((s) => s !== secToDelete);
    setSections(updated);
    saveLS(LS_SECTIONS, updated);
    saveSettingToDB('sections', updated);
    // If the currently selected section in form is being deleted, switch to first remaining
    if (formData.section === secToDelete) {
      const nextSec = updated[0] || '';
      const cats = categoriesMap[nextSec] || [];
      setFormData((prev) => ({ ...prev, section: nextSec, category: cats[0] || '', size: getSizesForSection(nextSec)[0] || 'Free Size' }));
    }
  };

  const handleDeleteCategory = (catToDelete) => {
    if (!window.confirm(`Delete category "${catToDelete}"? This only removes it from the list — existing products keep their category.`)) return;
    const sec = formData.section;
    const existing = categoriesMap[sec] || [];
    const updatedCats = existing.filter((c) => c !== catToDelete);
    const updatedMap = { ...categoriesMap, [sec]: updatedCats };
    setCategoriesMap(updatedMap);
    saveLS(LS_CATEGORIES, updatedMap);
    saveSettingToDB('categories', updatedMap);
    if (formData.category === catToDelete) {
      setFormData((prev) => ({ ...prev, category: updatedCats[0] || '' }));
    }
  };

  // Size options: simple heuristic based on section name
  const getSizesForSection = (sec) => {
    const lower = (sec || '').toLowerCase();
    if (lower.includes('infant') || lower.includes('baby')) return SECTION_SIZES['__infants__'];
    if (lower.includes('kid') || lower.includes('boy') || lower.includes('girl') || lower.includes('child'))
      return SECTION_SIZES['__kids__'];
    if (lower.includes('women') || lower.includes('ladies') || lower.includes('female'))
      return SECTION_SIZES['__women__'];
    return SECTION_SIZES['__default__'];
  };

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
    if (user) fetchProducts();
  }, [user]);



  // Size & price filter states
  const [filterSize, setFilterSize] = useState('');
  const [filterMinPrice, setFilterMinPrice] = useState('');
  const [filterMaxPrice, setFilterMaxPrice] = useState('');

  // Derive all unique sizes from products for the filter dropdown
  const allSizes = useMemo(() => {
    const sizeSet = new Set();
    products.forEach((p) => { if (p.size) sizeSet.add(p.size); });
    return Array.from(sizeSet).sort();
  }, [products]);

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
        (p.fabric && p.fabric.toLowerCase().includes(q)) ||
        (p.brand && p.brand.toLowerCase().includes(q));

      // Size filter
      const matchSize = !filterSize || p.size === filterSize;

      // Price filter
      const price = p.sellingPrice || 0;
      const minP = parseFloat(filterMinPrice);
      const maxP = parseFloat(filterMaxPrice);
      const matchMinPrice = isNaN(minP) || price >= minP;
      const matchMaxPrice = isNaN(maxP) || price <= maxP;

      return matchSection && matchLowStock && matchSearch && matchSize && matchMinPrice && matchMaxPrice;
    });
  }, [products, selectedSection, showLowStockOnly, search, filterSize, filterMinPrice, filterMaxPrice]);

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
    if (!formData.name?.trim()) {
      setErrorMsg('Outfit name is required');
      return;
    }

    if (!formData.sellingPrice || Number(formData.sellingPrice) <= 0) {
      setErrorMsg('Please enter a valid selling price');
      return;
    }

    const sec = formData.section?.trim() || (sections[0] || 'Women');
    const cat = formData.category?.trim() || (categoriesMap[sec] && categoriesMap[sec][0]) || 'General';

    // Auto-save section to localStorage + DB if not yet recorded
    if (!sections.includes(sec)) {
      const updatedSecs = [...sections, sec];
      setSections(updatedSecs);
      saveLS(LS_SECTIONS, updatedSecs);
      saveSettingToDB('sections', updatedSecs);
    }

    // Auto-save category to localStorage + DB if not yet recorded
    if (cat && cat !== 'General') {
      const existingCats = categoriesMap[sec] || [];
      if (!existingCats.includes(cat)) {
        const updatedCats = { ...categoriesMap, [sec]: [...existingCats, cat] };
        setCategoriesMap(updatedCats);
        saveLS(LS_CATEGORIES, updatedCats);
        saveSettingToDB('categories', updatedCats);
      }
    }

    // Auto-generate SKU always (no manual code entry)
    const sectionPrefix = (sec.replace(/[^a-zA-Z]/g, '').slice(0, 3) || 'VR').toUpperCase();
    const code = editingProduct?.code || `${sectionPrefix}-${Date.now().toString().slice(-6)}`;

    const payload = {
      ...formData,
      name: formData.name.trim(),
      code,
      section: sec,
      category: cat,
      mrp: Number(formData.mrp) || Number(formData.sellingPrice) || 0,
      costPrice: Number(formData.costPrice) || 0,
      sellingPrice: Number(formData.sellingPrice) || 0,
      currentStock: Number(formData.currentStock) || 0,
      minStockAlert: Number(formData.minStockAlert) || 5,
    };

    setSaving(true);
    setErrorMsg('');
    try {
      const url = editingProduct ? `/api/products/${editingProduct._id}` : '/api/products';
      const method = editingProduct ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
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
        setErrorMsg(data.error || 'Failed to save outfit');
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
      section: p.section || '',
      category: p.category || '',
      size: p.size || '',
      fabric: p.fabric || '',
      brand: p.brand || '',
      mrp: p.mrp || p.sellingPrice || '',
      costPrice: p.costPrice || '',
      sellingPrice: p.sellingPrice || '',
      currentStock: p.currentStock || 0,
      minStockAlert: p.minStockAlert || 5,
    });
    if (p.section && !sections.includes(p.section)) {
      const updated = [...sections, p.section];
      setSections(updated);
      saveLS(LS_SECTIONS, updated);
    }
    setErrorMsg('');
    setShowAddModal(true);
  };

  // Delete product permanently
  const handleDeleteProduct = async () => {
    if (!deleteProduct) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/products/${deleteProduct._id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg(`"${deleteProduct.name}" deleted from catalog.`);
        setProducts((prev) => prev.filter((p) => p._id !== deleteProduct._id));
        setDeleteProduct(null);
        setTimeout(() => setSuccessMsg(''), 3000);
      } else {
        setErrorMsg(data.error || 'Failed to delete product');
        setDeleteProduct(null);
      }
    } catch (err) {
      setErrorMsg('Delete failed: ' + err.message);
      setDeleteProduct(null);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-5 sm:space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-200/70">
        <div>
          <h1 className="font-heading text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Stock & Inventory
          </h1>
        </div>

        <button
          onClick={() => {
            setEditingProduct(null);
            setFormData({
              name: '',
              section: '',
              category: '',
              size: '',
              fabric: '',
              brand: '',
              mrp: '',
              costPrice: '',
              sellingPrice: '',
              currentStock: '',
              minStockAlert: '',
            });
            setErrorMsg('');
            setShowAddModal(true);
          }}
          className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-bold text-xs sm:text-sm shadow-sm transition active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Add Outfit</span>
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

        {/* Size & Price Filters */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100">
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[11px] font-bold text-slate-500 uppercase">Filters:</span>
          </div>
          {/* Size filter */}
          <select
            value={filterSize}
            onChange={(e) => setFilterSize(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 focus:ring-1 focus:ring-rose-500 bg-slate-50"
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
              className="w-20 px-2 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 focus:ring-1 focus:ring-rose-500 bg-slate-50"
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
              className="w-20 px-2 py-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-700 focus:ring-1 focus:ring-rose-500 bg-slate-50"
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

        {/* Section Filter Pills - built from user's dynamic sections + catalog */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {['All', ...Array.from(new Set([...sections, ...products.map((p) => p.section).filter(Boolean)]))].map((sec) => (
            <button
              key={sec}
              onClick={() => setSelectedSection(sec)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold shrink-0 transition ${
                selectedSection === sec
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'bg-slate-50 text-slate-600 hover:bg-rose-50 hover:text-rose-700 border border-slate-200/60'
              }`}
            >
              {sec === 'All' ? '🌟 All Items' : sec}
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

                            {/* Delete button */}
                            <button
                              onClick={() => setDeleteProduct(p)}
                              className="p-1.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 hover:text-red-700 transition"
                              title="Delete outfit permanently"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile 2-Column Grid View */}
            <div className="md:hidden grid grid-cols-2 gap-2.5 p-2.5 bg-slate-50/50">
              {filteredProducts.map((p) => {
                const isLow = (p.currentStock || 0) <= (p.minStockAlert || 5);
                return (
                  <div key={p._id} className="bg-white rounded-xl border border-slate-200/80 p-2.5 shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="text-[9px] font-black uppercase tracking-wider text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded truncate max-w-[85px]">
                          {p.section}
                        </span>
                        <span
                          className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                            isLow ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {p.currentStock || 0} pcs
                        </span>
                      </div>
                      <h3 className="font-bold text-slate-900 text-xs line-clamp-2 leading-snug">{p.name}</h3>
                      <p className="text-[10px] text-slate-400 font-mono">{p.code}</p>
                      <div className="flex items-center gap-1 mt-1 text-[10px] text-slate-500">
                        <span className="font-black text-slate-900 text-xs">₹{p.sellingPrice?.toLocaleString('en-IN')}</span>
                        <span>• {p.size}</span>
                      </div>
                    </div>

                    <div className="pt-2 mt-2 border-t border-slate-100 space-y-1.5">
                      {/* Steppers & Restock */}
                      <div className="flex items-center justify-between gap-1">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleQuickAdjust(p, -1)}
                            className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 font-bold flex items-center justify-center text-xs"
                            title="-1 pc"
                          >
                            -
                          </button>
                          <button
                            onClick={() => handleQuickAdjust(p, 1)}
                            className="w-6 h-6 rounded bg-slate-100 hover:bg-slate-200 font-bold flex items-center justify-center text-xs"
                            title="+1 pc"
                          >
                            +
                          </button>
                        </div>
                        <button
                          onClick={() => {
                            setStockAdjustModal(p);
                            setAdjustAmount('10');
                          }}
                          className="px-2 py-0.5 rounded bg-rose-50 text-rose-700 hover:bg-rose-100 text-[10px] font-bold"
                        >
                          Restock
                        </button>
                      </div>

                      {/* Edit & Delete */}
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEditModal(p)}
                          className="p-1 rounded border border-slate-200 text-slate-500 hover:bg-slate-100 text-xs"
                          title="Edit"
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => setDeleteProduct(p)}
                          className="p-1 rounded border border-red-200 text-red-500 hover:bg-red-50 text-xs"
                          title="Delete"
                        >
                          <Trash2 className="w-3 h-3" />
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

      {/* Add / Edit Outfit — Inline Grid Section (replaces overlay modal) */}
      {showAddModal && (
        <div className="bg-white rounded-2xl border-2 border-rose-200 shadow-lg overflow-hidden animate-in slide-in-from-top duration-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-rose-600 to-pink-600 px-5 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-white">
              <Grid3X3 className="w-5 h-5" />
              <h2 className="font-heading font-black text-base sm:text-lg">
                {editingProduct ? 'Edit Fashion Outfit' : 'Add New Fashion Outfit'}
              </h2>
            </div>
            <button
              onClick={() => setShowAddModal(false)}
              className="text-white/70 hover:text-white font-bold text-lg transition"
            >
              ✕
            </button>
          </div>

          {errorMsg && (
            <div className="mx-5 mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSaveProduct} className="p-5 space-y-4">
            {/* ── Section + Category as Grid tiles ─── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* STORE SECTION (Collection) — Grid of tiles */}
              <div>
                <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700 uppercase mb-2">
                  <Layers className="w-3.5 h-3.5 text-rose-500" />
                  Store Section (Collection)
                </label>

                {sections.length === 0 && !addingSection ? (
                  <div className="p-4 rounded-xl border-2 border-dashed border-slate-300 text-center">
                    <p className="text-xs text-slate-400 mb-2">No sections yet. Add your first collection.</p>
                    <button type="button" onClick={() => setAddingSection(true)}
                      className="px-3 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-bold">
                      + Add Collection
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {Array.from(new Set([...sections, ...(formData.section ? [formData.section] : [])])).map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => {
                            const cats = categoriesMap[s] || [];
                            setFormData({ ...formData, section: s, category: cats[0] || '', size: getSizesForSection(s)[0] || '' });
                          }}
                          className={`relative px-3 py-2.5 rounded-xl text-xs font-bold transition text-left border ${
                            formData.section === s
                              ? 'bg-rose-600 text-white border-rose-600 shadow-md shadow-rose-600/20 ring-2 ring-rose-300'
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-rose-50 hover:border-rose-300 hover:text-rose-700'
                          }`}
                        >
                          <span className="block truncate">{s}</span>
                          {(categoriesMap[s] || []).length > 0 && (
                            <span className={`text-[9px] font-semibold mt-0.5 block ${
                              formData.section === s ? 'text-rose-200' : 'text-slate-400'
                            }`}>
                              {(categoriesMap[s] || []).length} categories
                            </span>
                          )}
                        </button>
                      ))}
                      {/* Add new section tile */}
                      <button
                        type="button"
                        onClick={() => { setAddingSection(true); setNewSectionText(''); }}
                        className="px-3 py-2.5 rounded-xl text-xs font-bold border-2 border-dashed border-rose-300 text-rose-600 hover:bg-rose-50 transition flex items-center justify-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add New
                      </button>
                    </div>

                    {/* Delete selected section */}
                    {formData.section && sections.includes(formData.section) && (
                      <button type="button" onClick={() => handleDeleteSection(formData.section)}
                        className="text-[10px] font-bold text-red-500 hover:text-red-700 transition">
                        🗑 Remove "{formData.section}" section
                      </button>
                    )}
                  </div>
                )}

                {addingSection && (
                  <div className="mt-2 flex gap-2">
                    <input
                      autoFocus
                      type="text"
                      value={newSectionText}
                      onChange={(e) => setNewSectionText(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddSection(); } if (e.key === 'Escape') { setAddingSection(false); setNewSectionText(''); } }}
                      placeholder="e.g. Women Wear, Kids, Ethnic..."
                      className="flex-1 px-3 py-2 rounded-xl border border-rose-400 text-xs font-medium focus:ring-1 focus:ring-rose-500 focus:outline-none"
                    />
                    <button type="button" onClick={handleAddSection}
                      className="px-3 py-1.5 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700">
                      Save
                    </button>
                    <button type="button" onClick={() => { setAddingSection(false); setNewSectionText(''); }}
                      className="px-2.5 py-1.5 rounded-xl bg-slate-100 text-slate-600 text-xs font-bold hover:bg-slate-200">
                      ✕
                    </button>
                  </div>
                )}
              </div>

              {/* CATEGORY — Grid of tiles showing ALL category names */}
              <div>
                <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700 uppercase mb-2">
                  <Tag className="w-3.5 h-3.5 text-purple-500" />
                  Category
                  <span className="text-[9px] text-slate-400 font-normal lowercase ml-1">(Optional)</span>
                </label>

                {!formData.section ? (
                  <div className="p-4 rounded-xl border-2 border-dashed border-slate-200 text-center">
                    <p className="text-xs text-slate-400">← Select a collection first to see categories</p>
                  </div>
                ) : (categoriesMap[formData.section] || []).length === 0 && !addingCategory ? (
                  <div className="p-4 rounded-xl border-2 border-dashed border-purple-200 text-center">
                    <p className="text-xs text-slate-400 mb-2">
                      No categories in "{formData.section}" yet.
                    </p>
                    <button type="button" onClick={() => setAddingCategory(true)}
                      className="px-3 py-1.5 rounded-lg bg-purple-600 text-white text-xs font-bold">
                      + Add Category
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {/* "General" option */}
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, category: '' })}
                        className={`px-3 py-2.5 rounded-xl text-xs font-bold transition border ${
                          !formData.category
                            ? 'bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-600/20 ring-2 ring-purple-300'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-purple-50 hover:border-purple-300 hover:text-purple-700'
                        }`}
                      >
                        General
                      </button>
                      {/* All category tiles */}
                      {Array.from(new Set([...(categoriesMap[formData.section] || []), ...(formData.category ? [formData.category] : [])])).filter(Boolean).map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setFormData({ ...formData, category: cat })}
                          className={`px-3 py-2.5 rounded-xl text-xs font-bold transition border truncate ${
                            formData.category === cat
                              ? 'bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-600/20 ring-2 ring-purple-300'
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-purple-50 hover:border-purple-300 hover:text-purple-700'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                      {/* Add new category tile */}
                      <button
                        type="button"
                        onClick={() => { setAddingCategory(true); setNewCategoryText(''); }}
                        className="px-3 py-2.5 rounded-xl text-xs font-bold border-2 border-dashed border-purple-300 text-purple-600 hover:bg-purple-50 transition flex items-center justify-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add New
                      </button>
                    </div>

                    {/* Delete selected category */}
                    {formData.category && (categoriesMap[formData.section] || []).includes(formData.category) && (
                      <button type="button" onClick={() => handleDeleteCategory(formData.category)}
                        className="text-[10px] font-bold text-red-500 hover:text-red-700 transition">
                        🗑 Remove "{formData.category}" category
                      </button>
                    )}
                  </div>
                )}

                {addingCategory && (
                  <div className="mt-2 flex gap-2">
                    <input
                      autoFocus
                      type="text"
                      value={newCategoryText}
                      onChange={(e) => setNewCategoryText(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddCategory(); } if (e.key === 'Escape') { setAddingCategory(false); setNewCategoryText(''); } }}
                      placeholder="e.g. Sarees, Kurtis, Frocks..."
                      className="flex-1 px-3 py-2 rounded-xl border border-purple-400 text-xs font-medium focus:ring-1 focus:ring-purple-500 focus:outline-none"
                    />
                    <button type="button" onClick={handleAddCategory}
                      className="px-3 py-1.5 rounded-xl bg-purple-600 text-white text-xs font-bold hover:bg-purple-700">
                      Save
                    </button>
                    <button type="button" onClick={() => { setAddingCategory(false); setNewCategoryText(''); }}
                      className="px-2.5 py-1.5 rounded-xl bg-slate-100 text-slate-600 text-xs font-bold hover:bg-slate-200">
                      ✕
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* ── Product Details Grid ─── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-3 border-t border-slate-100">
              {/* Outfit Name */}
              <div className="sm:col-span-2 lg:col-span-3">
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Outfit Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Banarasi Silk Saree, Girls Tutu Frock"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              {/* Size */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Size</label>
                <select
                  value={formData.size}
                  onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs font-bold focus:ring-1 focus:ring-rose-500"
                >
                  <option value="">Select size</option>
                  {getSizesForSection(formData.section).map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              {/* MRP */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">MRP (₹)</label>
                <input
                  type="number"
                  value={formData.mrp}
                  onChange={(e) => setFormData({ ...formData, mrp: e.target.value })}
                  placeholder="1499"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs font-bold"
                />
              </div>

              {/* Selling Price */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Selling Price * (₹)</label>
                <input
                  type="number"
                  required
                  value={formData.sellingPrice}
                  onChange={(e) => setFormData({ ...formData, sellingPrice: e.target.value })}
                  placeholder="999"
                  className="w-full px-3 py-2.5 rounded-xl border border-rose-300 text-xs font-bold text-rose-600 focus:ring-2 focus:ring-rose-500"
                />
              </div>

              {/* Cost Price */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Cost Price (₹)</label>
                <input
                  type="number"
                  value={formData.costPrice}
                  onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                  placeholder="500"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs font-medium"
                />
              </div>

              {/* Stock Pieces */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Stock Pieces</label>
                <input
                  type="number"
                  value={formData.currentStock}
                  onChange={(e) => setFormData({ ...formData, currentStock: e.target.value })}
                  placeholder="0"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs font-bold"
                />
              </div>

              {/* Min Stock Alert */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Min Stock Alert</label>
                <input
                  type="number"
                  value={formData.minStockAlert}
                  onChange={(e) => setFormData({ ...formData, minStockAlert: e.target.value })}
                  placeholder="5"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs font-medium"
                />
              </div>
            </div>

            {/* Live profit preview */}
            {formData.sellingPrice && formData.costPrice && (
              (() => {
                const profit = Number(formData.sellingPrice) - Number(formData.costPrice);
                const margin = formData.sellingPrice > 0 ? Math.round((profit / Number(formData.sellingPrice)) * 100) : 0;
                const isPositive = profit >= 0;
                return (
                  <div className={`px-4 py-2.5 rounded-xl flex items-center justify-between text-xs font-bold ${
                    isPositive ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' : 'bg-red-50 border border-red-200 text-red-700'
                  }`}>
                    <span>Profit per piece:</span>
                    <span>{isPositive ? '+' : ''}₹{profit.toLocaleString('en-IN')} &nbsp;({margin}% margin)</span>
                  </div>
                );
              })()
            )}

            {/* Action buttons */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 border border-slate-200 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-bold text-xs shadow-lg shadow-rose-600/25 flex items-center gap-2 transition active:scale-95"
              >
                {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{saving ? 'Saving...' : editingProduct ? 'Update Outfit' : 'Add Outfit'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Delete Product Confirmation Modal */}
      {deleteProduct && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl border border-red-100 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900">Delete Outfit from Catalog</h3>
                <p className="text-xs text-red-600 font-semibold">This action is permanent and cannot be undone</p>
              </div>
            </div>

            <p className="text-sm text-slate-600">
              Are you sure you want to permanently delete{' '}
              <span className="font-bold text-slate-900">{deleteProduct.name}</span>
              {' '}({deleteProduct.code}) from the stock catalog? This outfit will no longer appear in billing.
            </p>

            <div className="flex items-center justify-end gap-3 pt-1">
              <button
                onClick={() => setDeleteProduct(null)}
                disabled={deleting}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteProduct}
                disabled={deleting}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm shadow-sm shadow-red-600/20 transition disabled:opacity-50 active:scale-95"
              >
                {deleting && <Loader2 className="w-4 h-4 animate-spin" />}
                <span>{deleting ? 'Deleting...' : 'Yes, Delete Permanently'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
