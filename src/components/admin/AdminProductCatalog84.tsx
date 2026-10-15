import React, { useState } from 'react';
import { 
  Package, 
  Search, 
  Filter, 
  Edit, 
  CheckCircle2, 
  XCircle, 
  Download, 
  Upload, 
  Sliders, 
  History, 
  DollarSign, 
  RefreshCw,
  Plus,
  AlertTriangle,
  ArrowUpDown,
  Lock,
  Layers,
  X
} from 'lucide-react';
import { storeService } from '../../services/storeService';
import { ProductPlanEntry, PriceHistoryRecord, ImportReport } from '../../types';

export const AdminProductCatalog84: React.FC<{
  onNotify: (msg: string, type?: 'success' | 'info' | 'error') => void;
}> = ({ onNotify }) => {
  const [products, setProducts] = useState<ProductPlanEntry[]>(() => storeService.getAllProducts());
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE' | 'PRICE_UNSET' | 'OUT_OF_STOCK'>('ALL');

  // Modal: Edit Product
  const [editingProduct, setEditingProduct] = useState<ProductPlanEntry | null>(null);
  const [editPriceReason, setEditPriceReason] = useState('');

  // Modal: Bulk Edit
  const [bulkEditOpen, setBulkEditOpen] = useState(false);
  const [bulkAction, setBulkAction] = useState<'AUTO_CALC_BDT' | 'SET_BDT_FIXED' | 'ACTIVATE_ALL' | 'DEACTIVATE_ALL'>('AUTO_CALC_BDT');
  const [bulkMultiplier, setBulkMultiplier] = useState('1.48');
  const [bulkFixedBdt, setBulkFixedBdt] = useState('500');

  // Modal: Price History
  const [priceHistoryOpen, setPriceHistoryOpen] = useState(false);
  const [selectedProductHistory, setSelectedProductHistory] = useState<string | null>(null);

  // Modal: Import / Export Report
  const [importReportModal, setImportReportModal] = useState<ImportReport | null>(null);

  const categories = storeService.getCategories();
  const priceHistory = storeService.getPriceHistory(selectedProductHistory || undefined);

  const refreshData = () => {
    setProducts([...storeService.getAllProducts()]);
  };

  const filteredProducts = products.filter(p => {
    if (categoryFilter !== 'ALL' && p.category !== categoryFilter) return false;
    
    if (statusFilter === 'ACTIVE' && !p.isActive) return false;
    if (statusFilter === 'INACTIVE' && p.isActive) return false;
    if (statusFilter === 'PRICE_UNSET' && (p.sellingPriceBdt !== null || p.isPriceUnavailable)) return false;
    if (statusFilter === 'OUT_OF_STOCK' && (!p.isOutOfStock && p.stock > 0)) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = p.productName.toLowerCase().includes(q);
      const matchPlan = p.duration.toLowerCase().includes(q) || p.planName.toLowerCase().includes(q);
      const matchCat = p.categoryName.toLowerCase().includes(q);
      if (!matchName && !matchPlan && !matchCat) return false;
    }
    return true;
  });

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    storeService.updateProduct(editingProduct, 'admin@telestore.io', editPriceReason || 'Admin Update');
    refreshData();
    setEditingProduct(null);
    setEditPriceReason('');
    onNotify(`Saved changes for ${editingProduct.productName} (${editingProduct.duration})!`, 'success');
  };

  const handleRunBulkEdit = (e: React.FormEvent) => {
    e.preventDefault();
    const affected = storeService.bulkUpdatePrices({
      category: categoryFilter !== 'ALL' ? categoryFilter : undefined,
      action: bulkAction,
      exchangeRateMultiplier: parseFloat(bulkMultiplier) || 1.48,
      fixedBdtPrice: parseFloat(bulkFixedBdt) || undefined,
      adminEmail: 'admin@telestore.io'
    });

    refreshData();
    setBulkEditOpen(false);
    onNotify(`Bulk edit applied to ${affected} product-plan entries!`, 'success');
  };

  const handleReimportSeed = () => {
    if (!window.confirm('Run safe import on all 84 product-plan entries? This will verify and upsert entries without deleting users or orders.')) return;
    const report = storeService.importCatalog84('UPSERT');
    refreshData();
    setImportReportModal(report);
    onNotify(`Import completed: ${report.inserted} inserted, ${report.updated} updated, ${report.failed} failed.`, 'success');
  };

  const handleExportCsv = () => {
    const headers = ['ID', 'Product Name', 'Category', 'Plan Name', 'Duration', 'Source Price (INR)', 'Selling Price (BDT)', 'Stock', 'Delivery Mode', 'Active', 'Price Unavailable', 'Out of Stock'];
    const rows = products.map(p => [
      p.id,
      `"${p.productName.replace(/"/g, '""')}"`,
      `"${p.categoryName}"`,
      `"${p.planName}"`,
      `"${p.duration}"`,
      p.sourcePriceInr !== null ? p.sourcePriceInr : 'N/A',
      p.sellingPriceBdt !== null ? p.sellingPriceBdt : 'UNSET',
      p.stock,
      p.deliveryType,
      p.isActive ? 'YES' : 'NO',
      p.isPriceUnavailable ? 'YES' : 'NO',
      p.isOutOfStock ? 'YES' : 'NO'
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `telestore_84_products_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onNotify('84 Products catalog exported to CSV!', 'success');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-500/20 text-sky-400 border border-sky-500/30">
              84 Product-Plan Entries Loaded
            </span>
            <span className="text-xs text-slate-400 font-mono">Catalog 2026 Engine</span>
          </div>
          <h2 className="text-xl font-bold text-white mt-1.5">Master Digital Product Catalog Manager</h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Multi-plan duration manager with source INR preservation, optional BDT selling price configuration, bulk price calculation, and price change audit history.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setBulkEditOpen(true)}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow transition flex items-center gap-1.5"
          >
            <Sliders className="w-3.5 h-3.5" />
            Bulk Price Edit
          </button>

          <button
            onClick={handleExportCsv}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl shadow transition flex items-center gap-1.5 border border-slate-700"
          >
            <Download className="w-3.5 h-3.5" />
            Export CSV
          </button>

          <button
            onClick={handleReimportSeed}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl shadow transition flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Safe Re-Sync 84 Items
          </button>

          <button
            onClick={() => { setSelectedProductHistory(null); setPriceHistoryOpen(true); }}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 font-semibold text-xs rounded-xl shadow transition flex items-center gap-1.5 border border-slate-700"
          >
            <History className="w-3.5 h-3.5" />
            Price History
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 p-4 border border-slate-800 rounded-xl">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by Product Name, Duration, or Category..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 text-xs rounded-lg pl-9 pr-3 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-sky-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-xs rounded-lg px-3 py-2 text-white"
          >
            <option value="ALL">All Categories ({products.length})</option>
            {categories.map(c => {
              const count = products.filter(p => p.category === c.id).length;
              return (
                <option key={c.id} value={c.id}>{c.icon} {c.name} ({count})</option>
              );
            })}
          </select>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as any)}
            className="bg-slate-800 border border-slate-700 text-xs rounded-lg px-3 py-2 text-white"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active (Purchasable)</option>
            <option value="INACTIVE">Inactive</option>
            <option value="PRICE_UNSET">BDT Price Unset</option>
            <option value="OUT_OF_STOCK">Out of Stock</option>
          </select>
        </div>
      </div>

      {/* Catalog Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-800/90 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-700">
              <tr>
                <th className="py-3 px-4">Product & Plan</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Source Price (INR)</th>
                <th className="py-3 px-4">Selling Price (BDT)</th>
                <th className="py-3 px-4">Stock</th>
                <th className="py-3 px-4">Delivery Mode</th>
                <th className="py-3 px-4">Bot Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredProducts.map(prod => {
                const isPriceReady = prod.sellingPriceBdt !== null && prod.sellingPriceBdt > 0;
                return (
                  <tr key={prod.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-3">
                        <img
                          src={prod.imageUrl}
                          alt=""
                          className="w-9 h-9 rounded-lg object-cover bg-slate-800 shrink-0 border border-slate-700"
                        />
                        <div>
                          <div className="font-semibold text-white text-xs">{prod.productName}</div>
                          <div className="text-[11px] text-sky-400 font-mono font-medium">
                            {prod.duration} &bull; <span className="text-slate-400">{prod.planName}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-indigo-300 font-medium text-[11px]">
                        {prod.categoryName}
                      </span>
                    </td>

                    <td className="py-3 px-4 font-mono font-semibold">
                      {prod.sourcePriceInr !== null ? (
                        <span className="text-slate-200">₹{prod.sourcePriceInr}</span>
                      ) : (
                        <span className="text-amber-400 text-[11px]">Unavailable</span>
                      )}
                    </td>

                    <td className="py-3 px-4 font-mono font-bold">
                      {prod.sellingPriceBdt !== null ? (
                        <span className="text-emerald-400">{prod.sellingPriceBdt} BDT</span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-rose-950/40 text-rose-400 text-[10px] font-semibold border border-rose-900/60">
                          Price Unset
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 font-mono">
                      {prod.isOutOfStock ? (
                        <span className="text-rose-400 font-bold text-[10px]">OUT OF STOCK</span>
                      ) : (
                        <span className="text-slate-300">{prod.stock} units</span>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        prod.deliveryType === 'AUTOMATIC_CODE' ? 'bg-sky-500/20 text-sky-400' : 'bg-amber-500/20 text-amber-400'
                      }`}>
                        {prod.deliveryType === 'AUTOMATIC_CODE' ? '⚡ AUTO' : '🛠️ MANUAL'}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        prod.isActive && isPriceReady && !prod.isOutOfStock
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-slate-800 text-slate-400'
                      }`}>
                        {prod.isActive && isPriceReady && !prod.isOutOfStock ? 'PURCHASABLE' : 'DISABLED'}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          onClick={() => { setSelectedProductHistory(prod.id); setPriceHistoryOpen(true); }}
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-lg transition"
                          title="Price Change History"
                        >
                          <History className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => setEditingProduct(JSON.parse(JSON.stringify(prod)))}
                          className="px-2 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-[11px] font-semibold transition flex items-center gap-1"
                        >
                          <Edit className="w-3 h-3" />
                          Edit
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- MODAL: Edit Product & Prices --- */}
      {editingProduct && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div>
                <h3 className="font-bold text-white text-base">{editingProduct.productName}</h3>
                <span className="text-xs text-sky-400 font-mono">{editingProduct.duration} &bull; {editingProduct.id}</span>
              </div>
              <button onClick={() => setEditingProduct(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Product Name</label>
                  <input
                    type="text"
                    value={editingProduct.productName}
                    onChange={e => setEditingProduct({ ...editingProduct, productName: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Duration / Plan</label>
                  <input
                    type="text"
                    value={editingProduct.duration}
                    onChange={e => setEditingProduct({ ...editingProduct, duration: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800">
                <div>
                  <label className="block text-slate-400 mb-1">Source Price (INR)</label>
                  <input
                    type="number"
                    value={editingProduct.sourcePriceInr !== null ? editingProduct.sourcePriceInr : ''}
                    placeholder="Unavailable"
                    onChange={e => setEditingProduct({
                      ...editingProduct,
                      sourcePriceInr: e.target.value ? parseFloat(e.target.value) : null,
                      isPriceUnavailable: !e.target.value
                    })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">Original INR supplier cost</span>
                </div>

                <div>
                  <label className="block text-emerald-400 font-semibold mb-1">Selling Price (BDT)</label>
                  <input
                    type="number"
                    value={editingProduct.sellingPriceBdt !== null ? editingProduct.sellingPriceBdt : ''}
                    placeholder="Set BDT Price"
                    onChange={e => setEditingProduct({
                      ...editingProduct,
                      sellingPriceBdt: e.target.value ? parseFloat(e.target.value) : null
                    })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-emerald-400 font-mono font-bold"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">Purchasing disabled if unset</span>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Description (English)</label>
                <textarea
                  rows={2}
                  value={editingProduct.description}
                  onChange={e => setEditingProduct({ ...editingProduct, description: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1">Stock Quantity</label>
                  <input
                    type="number"
                    value={editingProduct.stock}
                    onChange={e => setEditingProduct({ ...editingProduct, stock: parseInt(e.target.value, 10) || 0 })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1">Delivery Mode</label>
                  <select
                    value={editingProduct.deliveryType}
                    onChange={e => setEditingProduct({ ...editingProduct, deliveryType: e.target.value as any })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                  >
                    <option value="AUTOMATIC_CODE">AUTOMATIC_CODE (Instant Key)</option>
                    <option value="MANUAL">MANUAL (Staff Fulfilled)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <label className="flex items-center space-x-2 bg-slate-800 p-2.5 rounded-lg border border-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingProduct.isActive}
                    onChange={e => setEditingProduct({ ...editingProduct, isActive: e.target.checked })}
                    className="w-4 h-4 rounded text-sky-600"
                  />
                  <span className="text-white font-medium">Active in Bot</span>
                </label>

                <label className="flex items-center space-x-2 bg-slate-800 p-2.5 rounded-lg border border-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editingProduct.isOutOfStock}
                    onChange={e => setEditingProduct({ ...editingProduct, isOutOfStock: e.target.checked })}
                    className="w-4 h-4 rounded text-rose-600"
                  />
                  <span className="text-white font-medium">Mark Out of Stock</span>
                </label>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Price Change Audit Reason</label>
                <input
                  type="text"
                  placeholder="e.g. Adjusted to reflect latest FX rates"
                  value={editPriceReason}
                  onChange={e => setEditPriceReason(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                />
              </div>

              <div className="flex space-x-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-white font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-sky-600 hover:bg-sky-500 rounded-lg text-white font-semibold"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL: Bulk Edit Prices --- */}
      {bulkEditOpen && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl text-xs">
            <h3 className="font-bold text-white text-base mb-1">Bulk Price & Status Editor</h3>
            <p className="text-slate-400 mb-4">
              Apply pricing formulas or status changes across products in {categoryFilter === 'ALL' ? 'all 84 products' : categoryFilter}.
            </p>

            <form onSubmit={handleRunBulkEdit} className="space-y-4">
              <div>
                <label className="block text-slate-400 mb-1">Action</label>
                <select
                  value={bulkAction}
                  onChange={e => setBulkAction(e.target.value as any)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                >
                  <option value="AUTO_CALC_BDT">Auto-Calculate BDT from INR (Multiplier)</option>
                  <option value="SET_BDT_FIXED">Set Fixed BDT Price for Selected</option>
                  <option value="ACTIVATE_ALL">Activate All Priced Products</option>
                  <option value="DEACTIVATE_ALL">Deactivate All in Category</option>
                </select>
              </div>

              {bulkAction === 'AUTO_CALC_BDT' && (
                <div>
                  <label className="block text-slate-400 mb-1">INR to BDT Multiplier (Rate)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={bulkMultiplier}
                    onChange={e => setBulkMultiplier(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
                    required
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Formula: BDT = Round(Source INR * Multiplier). Skips products with unavailable price.
                  </span>
                </div>
              )}

              {bulkAction === 'SET_BDT_FIXED' && (
                <div>
                  <label className="block text-slate-400 mb-1">Fixed Selling Price (BDT)</label>
                  <input
                    type="number"
                    value={bulkFixedBdt}
                    onChange={e => setBulkFixedBdt(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
                    required
                  />
                </div>
              )}

              <div className="flex space-x-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setBulkEditOpen(false)}
                  className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg"
                >
                  Apply Bulk Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL: Price History --- */}
      {priceHistoryOpen && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl p-6 shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div className="flex items-center space-x-2">
                <History className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-white text-base">Price Audit Log & History</h3>
              </div>
              <button onClick={() => setPriceHistoryOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {priceHistory.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-xs">
                No price modifications recorded yet. Any edit to INR or BDT prices will appear here.
              </div>
            ) : (
              <div className="divide-y divide-slate-800 text-xs font-mono">
                {priceHistory.map(h => (
                  <div key={h.id} className="py-3 flex items-center justify-between">
                    <div>
                      <div className="font-sans font-bold text-white">{h.productName} ({h.planName})</div>
                      <div className="text-slate-400 mt-0.5 font-sans">Reason: {h.reason}</div>
                      <div className="text-[10px] text-slate-500 font-sans mt-0.5">By {h.changedBy} &bull; {new Date(h.timestamp).toLocaleString()}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-slate-400 line-through">{h.oldPriceBdt !== null ? `${h.oldPriceBdt} BDT` : 'Unset'}</div>
                      <div className="text-emerald-400 font-bold">{h.newPriceBdt !== null ? `${h.newPriceBdt} BDT` : 'Unset'}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- MODAL: Import Report --- */}
      {importReportModal && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl text-xs">
            <h3 className="font-bold text-white text-base mb-2">Catalog Sync Report</h3>
            <div className="grid grid-cols-4 gap-2 mb-4 text-center">
              <div className="bg-slate-800 p-2.5 rounded-lg">
                <div className="text-slate-400 text-[10px]">Total</div>
                <div className="font-bold text-white text-sm">{importReportModal.totalEntries}</div>
              </div>
              <div className="bg-emerald-950/50 p-2.5 rounded-lg border border-emerald-900/60">
                <div className="text-emerald-400 text-[10px]">Inserted</div>
                <div className="font-bold text-emerald-400 text-sm">{importReportModal.inserted}</div>
              </div>
              <div className="bg-sky-950/50 p-2.5 rounded-lg border border-sky-900/60">
                <div className="text-sky-400 text-[10px]">Updated</div>
                <div className="font-bold text-sky-400 text-sm">{importReportModal.updated}</div>
              </div>
              <div className="bg-slate-800 p-2.5 rounded-lg">
                <div className="text-slate-400 text-[10px]">Failed</div>
                <div className="font-bold text-white text-sm">{importReportModal.failed}</div>
              </div>
            </div>

            <p className="text-slate-300 mb-4 text-xs leading-relaxed">
              All 84 product-plan entries are safely accounted for. Existing customers, wallets, and orders were preserved without interruption.
            </p>

            <button
              onClick={() => setImportReportModal(null)}
              className="w-full py-2 bg-sky-600 hover:bg-sky-500 text-white font-semibold rounded-lg"
            >
              Close Report
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
