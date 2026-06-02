/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Search, 
  Plus, 
  Minus, 
  Grid, 
  List, 
  Edit2, 
  Trash2, 
  AlertTriangle, 
  ChevronUp, 
  ChevronDown, 
  MoreVertical,
  Check,
  PackageCheck,
  History,
  Tag,
  X
} from 'lucide-react';
import { InventoryItem, FilterOptions, SortField, SortOrder } from '../types';
import { PRESET_CATEGORIES } from '../sampleData';

interface InventoryTableProps {
  items: InventoryItem[];
  filters: FilterOptions;
  setFilters: (filters: FilterOptions) => void;
  onEditItem: (item: InventoryItem) => void;
  onDeleteItem: (id: string) => void;
  onAdjustStock: (itemId: string, change: number, reason: string) => void;
  onViewHistory: (itemSku: string) => void;
}

export function InventoryTable({
  items,
  filters,
  setFilters,
  onEditItem,
  onDeleteItem,
  onAdjustStock,
  onViewHistory
}: InventoryTableProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [activeAdjustId, setActiveAdjustId] = useState<string | null>(null);
  const [adjustAmount, setAdjustAmount] = useState<string>('5');
  const [adjustReason, setAdjustReason] = useState<string>('Inventory replenishment');
  const [adjustType, setAdjustType] = useState<'add' | 'remove'>('add');

  // Multi-action popover / menu
  const [activeActionMenuId, setActiveActionMenuId] = useState<string | null>(null);

  // Sorting helper
  const handleSort = (field: SortField) => {
    let newOrder: SortOrder = 'asc';
    if (filters.sortBy === field && filters.sortOrder === 'asc') {
      newOrder = 'desc';
    }
    setFilters({
      ...filters,
      sortBy: field,
      sortOrder: newOrder,
    });
  };

  // Quick Inline Adjust Form
  const openAdjustForm = (id: string, type: 'add' | 'remove') => {
    setActiveAdjustId(id);
    setAdjustType(type);
    setAdjustAmount('5');
    setAdjustReason(type === 'add' ? 'Restocked from distributor' : 'Sold outbound items');
  };

  const submitAdjustment = (itemId: string) => {
    const amount = parseInt(adjustAmount, 10);
    if (isNaN(amount) || amount <= 0) return;
    
    const finalChange = adjustType === 'add' ? amount : -amount;
    onAdjustStock(itemId, finalChange, adjustReason.trim() || 'Manual stock update');
    setActiveAdjustId(null);
  };

  // Categories helper to extract unique categories from actual current items
  const uniqueCategories = Array.from(new Set([
    ...PRESET_CATEGORIES,
    ...items.map(item => item.category)
  ])).filter(cat => cat !== 'Other');
  
  uniqueCategories.push('Other');

  // Filter & Sort core logic
  const filteredItems = items
    .filter((item) => {
      // 1. Search Query
      const q = filters.search.toLowerCase();
      const matchSearch = 
        item.name.toLowerCase().includes(q) ||
        item.sku.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q);

      // 2. Category Filter
      const matchCategory = 
        filters.category === 'all' || 
        item.category.toLowerCase() === filters.category.toLowerCase();

      // 3. Stock Level threshold filter
      const isOut = item.stock <= 0;
      const isLow = item.stock > 0 && item.stock <= item.minThreshold;
      
      let matchStatus = true;
      if (filters.stockStatus === 'out') matchStatus = isOut;
      else if (filters.stockStatus === 'low') matchStatus = isLow;
      else if (filters.stockStatus === 'normal') matchStatus = !isOut && !isLow;

      return matchSearch && matchCategory && matchStatus;
    })
    .sort((a, b) => {
      // 4. Sorting logic
      const field = filters.sortBy;
      const orderMultiplier = filters.sortOrder === 'asc' ? 1 : -1;

      if (field === 'price' || field === 'stock') {
        const valA = a[field] as number;
        const valB = b[field] as number;
        return (valA - valB) * orderMultiplier;
      }

      const valA = String(a[field] || '').toLowerCase();
      const valB = String(b[field] || '').toLowerCase();
      
      if (valA < valB) return -1 * orderMultiplier;
      if (valA > valB) return 1 * orderMultiplier;
      return 0;
    });

  const currencyFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  });

  return (
    <div className="space-y-6">
      {/* Search, Filter Operations */}
      <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
          
          {/* SEARCH BAR */}
          <div className="relative w-full lg:max-w-md">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <Search size={18} />
            </span>
            <input
              id="product-search"
              type="text"
              placeholder="Search by name, SKU, tags..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="w-full text-sm border border-slate-200 rounded-lg pl-10 pr-4 py-2.5 bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-sans"
            />
          </div>

          {/* RIGHT BUTTONS (FILTERS TRIGGER + VIEW MODE) */}
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-end">
            
            {/* Category Dropdown */}
            <div className="flex items-center gap-1.5">
              <label htmlFor="cat-filter" className="text-xs font-semibold text-slate-500 font-sans uppercase">Category</label>
              <select
                id="cat-filter"
                value={filters.category}
                onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                className="text-xs border border-slate-200/80 rounded-lg px-2.5 py-2 bg-white hover:border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer text-slate-700 font-medium"
              >
                <option value="all">All Categories</option>
                {uniqueCategories
                  .filter(c => c !== 'all')
                  .map((cat) => (
                    <option key={cat} value={cat.toLowerCase()}>
                      {cat}
                    </option>
                  ))}
              </select>
            </div>

            {/* Threshold Condition */}
            <div className="flex items-center gap-1.5">
              <label htmlFor="status-filter" className="text-xs font-semibold text-slate-500 font-sans uppercase">Quality</label>
              <select
                id="status-filter"
                value={filters.stockStatus}
                onChange={(e) => setFilters({ ...filters, stockStatus: e.target.value as any })}
                className="text-xs border border-slate-200/80 rounded-lg px-2.5 py-2 bg-white hover:border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer text-slate-700 font-medium"
              >
                <option value="all">All Stock Statuses</option>
                <option value="normal">In Stock / Normal</option>
                <option value="low">Low Stock Alerts</option>
                <option value="out">Depleted / Out of Stock</option>
              </select>
            </div>

            {/* Layout Toggles */}
            <div className="border border-slate-200 rounded-lg p-0.5 flex items-center bg-slate-50">
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-md transition-all cursor-pointer ${
                  viewMode === 'list' 
                    ? 'bg-white text-indigo-600 shadow-sm' 
                    : 'text-slate-400 hover:text-slate-700'
                }`}
                title="Table List View"
              >
                <List size={16} />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-md transition-all cursor-pointer ${
                  viewMode === 'grid' 
                    ? 'bg-white text-indigo-600 shadow-sm' 
                    : 'text-slate-400 hover:text-slate-700'
                }`}
                title="Bento Grid View"
              >
                <Grid size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* RENDER VIEW: LIST OR GRID */}
      {filteredItems.length === 0 ? (
        <div id="no-products-view" className="text-center py-16 bg-white rounded-xl border border-slate-100 shadow-sm">
          <div className="max-w-md mx-auto flex flex-col items-center">
            <div className="p-4 bg-slate-50 rounded-full text-slate-400 mb-4 animate-bounce">
              <Search size={32} />
            </div>
            <h3 className="text-lg font-bold text-slate-900 font-sans">No Products Found</h3>
            <p className="text-sm text-slate-400 font-sans mt-2 max-w-sm">
              We couldn't find any products matching those parameters. Reset your search input or filters to try again.
            </p>
            <button
              onClick={() => setFilters({
                search: '',
                category: 'all',
                stockStatus: 'all',
                sortBy: 'updatedAt',
                sortOrder: 'desc',
              })}
              className="mt-5 px-4 py-2 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors cursor-pointer"
            >
              Clear Current Diagnostics
            </button>
          </div>
        </div>
      ) : viewMode === 'list' ? (
        
        /* ==================== LIST / TABLE VIEW ==================== */
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="py-3.5 px-5 text-xs font-semibold text-slate-500 font-sans uppercase">Product Details</th>
                  <th onClick={() => handleSort('category')} className="py-3.5 px-4 text-xs font-semibold text-slate-500 font-sans uppercase cursor-pointer select-none group">
                    <span className="flex items-center gap-1.5">
                      Category
                      {filters.sortBy === 'category' ? (
                        filters.sortOrder === 'asc' ? <ChevronUp size={14} className="text-indigo-600" /> : <ChevronDown size={14} className="text-indigo-600" />
                      ) : (
                        <ChevronDown size={14} className="opacity-0 group-hover:opacity-60 transition-opacity" />
                      )}
                    </span>
                  </th>
                  <th onClick={() => handleSort('sku')} className="py-3.5 px-4 text-xs font-semibold text-slate-500 font-sans uppercase cursor-pointer select-none group font-mono">
                    <span className="flex items-center gap-1.5">
                      SKU
                      {filters.sortBy === 'sku' ? (
                        filters.sortOrder === 'asc' ? <ChevronUp size={14} className="text-indigo-600" /> : <ChevronDown size={14} className="text-indigo-600" />
                      ) : (
                        <ChevronDown size={14} className="opacity-0 group-hover:opacity-60 transition-opacity" />
                      )}
                    </span>
                  </th>
                  <th onClick={() => handleSort('price')} className="py-3.5 px-4 text-xs font-semibold text-slate-500 font-sans uppercase cursor-pointer select-none group">
                    <span className="flex items-center gap-1.5">
                      Unit Price
                      {filters.sortBy === 'price' ? (
                        filters.sortOrder === 'asc' ? <ChevronUp size={14} className="text-indigo-600" /> : <ChevronDown size={14} className="text-indigo-600" />
                      ) : (
                        <ChevronDown size={14} className="opacity-0 group-hover:opacity-60 transition-opacity" />
                      )}
                    </span>
                  </th>
                  <th onClick={() => handleSort('stock')} className="py-3.5 px-4 text-xs font-semibold text-slate-500 font-sans uppercase cursor-pointer select-none group text-right">
                    <span className="flex items-center gap-1.5 justify-end">
                      Stock Level
                      {filters.sortBy === 'stock' ? (
                        filters.sortOrder === 'asc' ? <ChevronUp size={14} className="text-indigo-600" /> : <ChevronDown size={14} className="text-indigo-600" />
                      ) : (
                        <ChevronDown size={14} className="opacity-0 group-hover:opacity-60 transition-opacity" />
                      )}
                    </span>
                  </th>
                  <th className="py-3.5 px-4 text-xs font-semibold text-slate-500 font-sans uppercase text-center">Fast Stocks Adjustment</th>
                  <th className="py-3.5 px-5 text-right text-xs font-semibold text-slate-500 font-sans uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredItems.map((item) => {
                  const isLow = item.stock > 0 && item.stock <= item.minThreshold;
                  const isOut = item.stock <= 0;
                  
                  // Image/preset matching 
                  const hasImage = !!item.imageUrl;

                  return (
                    <tr 
                      key={item.id} 
                      className={`hover:bg-slate-50/50 transition-colors group ${
                        isOut ? 'bg-rose-50/5' : isLow ? 'bg-amber-50/5' : ''
                      }`}
                    >
                      {/* Product details */}
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-lg border border-slate-100 bg-slate-100 flex-shrink-0 overflow-hidden relative">
                            {hasImage ? (
                              <img
                                src={item.imageUrl}
                                alt={item.name}
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-indigo-100 to-indigo-50 text-indigo-500 flex items-center justify-center font-bold text-sm">
                                {item.name.charAt(0)}
                              </div>
                            )}
                          </div>
                          <div className="max-w-[200px] md:max-w-[300px]">
                            <h4 className="text-sm font-semibold text-slate-900 font-sans truncate" title={item.name}>
                              {item.name}
                            </h4>
                            <p className="text-xs text-slate-400 font-sans truncate mt-0.5" title={item.description}>
                              {item.description || 'No description assigned'}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-4 px-4">
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-slate-50 border border-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-sans">
                          <Tag size={10} />
                          {item.category}
                        </span>
                      </td>

                      {/* SKU */}
                      <td className="py-4 px-4">
                        <code className="text-xs font-mono text-slate-500 tracking-tight bg-slate-100 px-1.5 py-0.5 rounded">{item.sku}</code>
                      </td>

                      {/* Unit Price */}
                      <td className="py-4 px-4 font-mono text-xs text-slate-600 font-medium">
                        {currencyFormatter.format(item.price)}
                      </td>

                      {/* Stock Badges */}
                      <td className="py-4 px-4 text-right">
                        <div className="flex flex-col items-end">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold font-sans ${
                            isOut 
                              ? 'bg-rose-100 text-rose-800 border border-rose-200' 
                              : isLow 
                              ? 'bg-amber-100 text-amber-800 border border-amber-200' 
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              isOut ? 'bg-rose-600' : isLow ? 'bg-amber-600 animate-pulse' : 'bg-emerald-600'
                            }`}></span>
                            {item.stock} in stock
                          </span>
                          <span className="text-[10px] text-slate-400 font-sans font-medium mt-1">
                            Min threshold: {item.minThreshold}
                          </span>
                        </div>
                      </td>

                      {/* Fast Stock Adjustments */}
                      <td className="py-4 px-4">
                        <div className="flex justify-center items-center gap-2">
                          <button
                            onClick={() => openAdjustForm(item.id, 'remove')}
                            className="p-1.5 bg-slate-50 hover:bg-rose-50 hover:text-rose-600 text-slate-500 rounded-lg border border-slate-200 cursor-pointer transition-all active:scale-95"
                            title="Quickly Deduct Stock"
                            disabled={item.stock <= 0}
                          >
                            <Minus size={14} />
                          </button>
                          
                          <button
                            onClick={() => openAdjustForm(item.id, 'add')}
                            className="p-1.5 bg-slate-50 hover:bg-emerald-50 hover:text-emerald-600 text-slate-500 rounded-lg border border-slate-200 cursor-pointer transition-all active:scale-95"
                            title="Quickly Add Stock"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      </td>

                      {/* Action Dropdown / Buttons */}
                      <td className="py-4 px-5 text-right relative">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => onViewHistory(item.sku)}
                            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 relative cursor-pointer"
                            title="Audit log / transactional history"
                          >
                            <History size={16} />
                          </button>
                          
                          <button
                            onClick={() => onEditItem(item)}
                            className="p-2 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-100 relative cursor-pointer"
                            title="Edit properties"
                          >
                            <Edit2 size={16} />
                          </button>

                          <button
                            onClick={() => onDeleteItem(item.id)}
                            className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 relative cursor-pointer"
                            title="Delete SKU permanently"
                          >
                            <Trash2 size={16} />
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
      ) : (
        
        /* ==================== BENTO GRID VIEW ==================== */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => {
            const isLow = item.stock > 0 && item.stock <= item.minThreshold;
            const isOut = item.stock <= 0;
            const hasImage = !!item.imageUrl;

            return (
              <div 
                key={item.id}
                className={`bg-white rounded-xl border p-5 shadow-sm hover:shadow-md transition-all relative flex flex-col justify-between ${
                  isOut 
                    ? 'border-rose-200 bg-rose-50/10' 
                    : isLow 
                    ? 'border-amber-200 bg-amber-50/10' 
                    : 'border-slate-100'
                }`}
              >
                <div>
                  {/* Category & Badge Row */}
                  <div className="flex items-center justify-between mb-3.5">
                    <span className="text-[10px] font-semibold bg-slate-100 border border-slate-200/50 text-slate-500 px-2.5 py-0.5 rounded-full font-sans uppercase tracking-wider">
                      {item.category}
                    </span>
                    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-0.5 rounded-full ${
                      isOut 
                        ? 'bg-rose-100 text-rose-800' 
                        : isLow 
                        ? 'bg-amber-100 text-amber-800' 
                        : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      <span className={`w-1 h-1 rounded-full ${
                        isOut ? 'bg-rose-600' : isLow ? 'bg-amber-600 animate-pulse' : 'bg-emerald-600'
                      }`}></span>
                      {isOut ? 'Out of stock' : isLow ? 'Low stock' : 'Product active'}
                    </span>
                  </div>

                  {/* Product visual banner */}
                  <div className="aspect-[21/9] rounded-lg bg-slate-50 border border-slate-100 mb-3.5 overflow-hidden relative">
                    {hasImage ? (
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-indigo-50 text-indigo-400 flex items-center justify-center font-bold text-lg">
                        {item.name.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <span className="absolute bottom-2 right-2 bg-slate-900/70 backdrop-blur-xs text-white text-[10px] font-mono px-1.5 py-0.5 rounded">
                      {item.sku}
                    </span>
                  </div>

                  {/* Product description */}
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 font-sans tracking-tight line-clamp-1">{item.name}</h4>
                    <p className="text-xs text-slate-400 font-sans line-clamp-2 mt-1">{item.description || 'No description assigned for this listing.'}</p>
                  </div>
                </div>

                {/* Pricing & Stock adjustments layout */}
                <div className="mt-5 pt-3.5 border-t border-slate-100">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-[10px] text-slate-400 font-sans uppercase">Unit Pricing</p>
                      <p className="text-sm font-bold font-mono text-slate-900 mt-0.5">{currencyFormatter.format(item.price)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-slate-400 font-sans uppercase">Current Stock</p>
                      <p className="text-sm font-bold font-mono text-indigo-600 mt-0.5">{item.stock} Units</p>
                    </div>
                  </div>

                  {/* Actions buttons */}
                  <div className="flex items-center gap-2 pt-1 border-t border-slate-50">
                    <button
                      onClick={() => openAdjustForm(item.id, 'remove')}
                      disabled={item.stock <= 0}
                      className="flex-1 py-1 px-2 border border-slate-200 hover:border-rose-400 hover:text-rose-600 font-semibold text-xs rounded-lg text-slate-600 bg-white cursor-pointer select-none transition-all active:scale-[0.98]"
                      title="Quick stock-out deduction"
                    >
                      Deduct
                    </button>
                    <button
                      onClick={() => openAdjustForm(item.id, 'add')}
                      className="flex-1 py-1 px-2 border border-slate-200 hover:border-emerald-400 hover:text-emerald-600 font-semibold text-xs rounded-lg text-slate-600 bg-white cursor-pointer select-none transition-all active:scale-[0.98]"
                      title="Quick replenishment add"
                    >
                      Restock
                    </button>
                    
                    {/* Ellipsis menu button */}
                    <div className="flex gap-1">
                      <button
                        onClick={() => onViewHistory(item.sku)}
                        className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
                        title="View history logs"
                      >
                        <History size={14} />
                      </button>
                      <button
                        onClick={() => onEditItem(item)}
                        className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-indigo-600 cursor-pointer"
                        title="Edit properties"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => onDeleteItem(item.id)}
                        className="p-1.5 hover:bg-rose-50 rounded-lg text-slate-400 hover:text-rose-600 cursor-pointer"
                        title="Permanently remove"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* QUICK ADJUST MODAL LIGHTWEIGHT BACKDROP INTEGRATION */}
      {activeAdjustId && (() => {
        const item = items.find(i => i.id === activeAdjustId);
        if (!item) return null;

        return (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="bg-white rounded-xl border border-slate-100 shadow-xl max-w-sm w-full p-6 animate-scale-up">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <span className={`p-1.5 rounded-lg ${
                    adjustType === 'add' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                  }`}>
                    <PackageCheck size={16} />
                  </span>
                  <h4 className="font-bold text-slate-900 text-sm font-sans">
                    Audit Quantities: {item.name}
                  </h4>
                </div>
                <button 
                  onClick={() => setActiveAdjustId(null)} 
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-4">
                {/* Visual inventory math */}
                <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 flex justify-between items-center text-xs">
                  <div>
                    <span className="text-slate-400 block font-sans">Current Level</span>
                    <span className="font-mono font-bold text-slate-900">{item.stock} Units</span>
                  </div>
                  <div className="text-slate-300 font-bold font-sans">→</div>
                  <div className="text-right">
                    <span className="text-slate-400 block font-sans">Adjusted To</span>
                    <span className="font-mono font-bold text-indigo-600">
                      {adjustType === 'add' 
                        ? item.stock + (parseInt(adjustAmount, 10) || 0) 
                        : Math.max(0, item.stock - (parseInt(adjustAmount, 10) || 0))
                      } Units
                    </span>
                  </div>
                </div>

                {/* Amount input */}
                <div>
                  <label htmlFor="adjust-qty" className="block text-xs font-semibold text-slate-600 uppercase mb-1 font-sans">
                    {adjustType === 'add' ? 'Addition Quantity' : 'Deduction Quantity'}
                  </label>
                  <input
                    id="adjust-qty"
                    type="number"
                    min="1"
                    required
                    value={adjustAmount}
                    onChange={(e) => setAdjustAmount(e.target.value)}
                    className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 font-mono"
                  />
                </div>

                {/* Reason input */}
                <div>
                  <label htmlFor="adjust-cause" className="block text-xs font-semibold text-slate-600 uppercase mb-1 font-sans">
                    Audit Reason
                  </label>
                  <select
                    id="adjust-cause"
                    value={adjustReason}
                    onChange={(e) => setAdjustReason(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-lg p-2 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-sans"
                  >
                    {adjustType === 'add' ? (
                      <>
                        <option value="Restocked from vendor shipment">Shipment entry from distributor</option>
                        <option value="Return collection restocked">Customer return restocked</option>
                        <option value="Found unaccounted warehouse stock">Stocktake corrections (+)</option>
                        <option value="Refurbished repair stock">Items rebuilt/refurbished</option>
                      </>
                    ) : (
                      <>
                        <option value="Dispatched outbound order">Outbound shipment fulfillment</option>
                        <option value="Customer in-store checkout sale">Customer checkout sale</option>
                        <option value="Damaged / Broken container write-off">Defective/damaged write-off</option>
                        <option value="Product theft write-off">Missing inventory write-off (-)</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              <div className="flex gap-2.5 mt-5 pt-3.5 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActiveAdjustId(null)}
                  className="flex-1 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 border border-slate-200/80 rounded-lg cursor-pointer"
                >
                  Discard
                </button>
                <button
                  type="button"
                  onClick={() => submitAdjustment(item.id)}
                  disabled={!adjustAmount || isNaN(parseInt(adjustAmount, 10)) || parseInt(adjustAmount, 10) <= 0}
                  className={`flex-1 py-2 text-xs font-semibold text-white rounded-lg shadow-sm transition-all cursor-pointer ${
                    adjustType === 'add' 
                      ? 'bg-emerald-600 hover:bg-emerald-700' 
                      : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  Adjust Stock
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
