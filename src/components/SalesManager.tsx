/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  ShoppingCart, 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  User, 
  FileText, 
  DollarSign, 
  Check, 
  AlertTriangle, 
  HelpCircle, 
  Receipt,
  Grid,
  List,
  ChevronRight,
  TrendingDown,
  Info
} from 'lucide-react';
import { InventoryItem } from '../types';

interface CartItem {
  item: InventoryItem;
  quantity: number;
  soldPrice: number;
}

interface SalesManagerProps {
  items: InventoryItem[];
  onSubmitSale: (
    cart: { itemId: string; quantity: number; soldPrice: number }[],
    customerName: string,
    notes: string,
    invoiceRef: string,
    vatPercent: number
  ) => void;
}

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

export function SalesManager({ items, onSubmitSale }: SalesManagerProps) {
  // Navigation inside sales
  const [salesSearch, setSalesSearch] = useState('');
  const [salesCategory, setSalesCategory] = useState('all');
  
  // Cart state
  const [cart, setCart] = useState<CartItem[]>([]);
  
  // Invoice form metadata state
  const [customerName, setCustomerName] = useState('');
  const [notes, setNotes] = useState('');
  const [invoiceRefCode, setInvoiceRefCode] = useState(() => {
    const rand = Math.floor(1000 + Math.random() * 9000);
    const date = new Date();
    const yr = date.getFullYear();
    const mo = String(date.getMonth() + 1).padStart(2, '0');
    return `INV-${yr}${mo}-${rand}`;
  });

  const [saleSuccessMessage, setSaleSuccessMessage] = useState('');
  const [vatPercent, setVatPercent] = useState<string>('5');

  // Extract unique categories for catalog filter
  const uniqueCategories = useMemo(() => {
    return Array.from(new Set(items.map(item => item.category))).filter(Boolean);
  }, [items]);

  // Filter products for the catalog selector
  const availableGridProducts = useMemo(() => {
    return items.filter(item => {
      const matchSearch = item.name.toLowerCase().includes(salesSearch.toLowerCase()) || 
                          item.sku.toLowerCase().includes(salesSearch.toLowerCase());
      const matchCategory = salesCategory === 'all' || item.category.toLowerCase() === salesCategory.toLowerCase();
      return matchSearch && matchCategory;
    });
  }, [items, salesSearch, salesCategory]);

  // Cart operations
  const addToCart = (product: InventoryItem) => {
    if (product.stock <= 0) return;
    
    setCart(prevCart => {
      const existing = prevCart.find(c => c.item.id === product.id);
      if (existing) {
        // Increment up to available stock limit
        const nextQty = Math.min(product.stock, existing.quantity + 1);
        return prevCart.map(c => 
          c.item.id === product.id 
            ? { ...c, quantity: nextQty } 
            : c
        );
      } else {
        return [...prevCart, { item: product, quantity: 1, soldPrice: product.price }];
      }
    });
  };

  const updateCartQty = (productId: string, val: number) => {
    const targetItem = items.find(i => i.id === productId);
    if (!targetItem) return;

    setCart(prevCart => {
      return prevCart.map(c => {
        if (c.item.id === productId) {
          const limitedQty = Math.max(1, Math.min(targetItem.stock, val));
          return { ...c, quantity: limitedQty };
        }
        return c;
      });
    });
  };

  const updateCartPrice = (productId: string, priceVal: number) => {
    setCart(prevCart => {
      return prevCart.map(c => {
        if (c.item.id === productId) {
          const cleanPrice = Math.max(0, priceVal);
          return { ...c, soldPrice: cleanPrice };
        }
        return c;
      });
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prevCart => prevCart.filter(c => c.item.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
  };

  // Pricing calculations
  const cartTotals = useMemo(() => {
    const subtotal = cart.reduce((acc, c) => acc + (c.quantity * c.soldPrice), 0);
    const parsedVat = parseFloat(vatPercent);
    const vatRate = isNaN(parsedVat) || parsedVat < 0 ? 0 : parsedVat / 100;
    const taxAmount = subtotal * vatRate;
    const finalTotal = subtotal + taxAmount;

    return {
      subtotal,
      taxAmount,
      finalTotal,
      itemsCount: cart.reduce((acc, c) => acc + c.quantity, 0)
    };
  }, [cart, vatPercent]);

  // Submit operations
  const handleCheckoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;

    // Build checkout payload
    const submissionCart = cart.map(c => ({
      itemId: c.item.id,
      quantity: c.quantity,
      soldPrice: c.soldPrice
    }));

    const parsedVat = parseFloat(vatPercent);
    const finalVatPercent = isNaN(parsedVat) || parsedVat < 0 ? 0 : parsedVat;

    onSubmitSale(submissionCart, customerName.trim(), notes.trim(), invoiceRefCode, finalVatPercent);
    
    // Set a neat success overlay
    setSaleSuccessMessage(`Invoice ${invoiceRefCode} registered! $${cartTotals.finalTotal.toFixed(2)} recorded in revenues.`);
    
    // Reset Cart & client controls
    clearCart();
    setCustomerName('');
    setNotes('');
    setVatPercent('5');
    
    // Regenerate random sequence invoice code
    const rand = Math.floor(1000 + Math.random() * 9000);
    const date = new Date();
    const yr = date.getFullYear();
    const mo = String(date.getMonth() + 1).padStart(2, '0');
    setInvoiceRefCode(`INV-${yr}${mo}-${rand}`);

    setTimeout(() => {
      setSaleSuccessMessage('');
    }, 5000);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Title Banner */}
      <div className="bg-white rounded-xl border border-slate-100 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 font-sans tracking-tight flex items-center gap-2">
              <ShoppingCart size={20} className="text-emerald-600" />
              Direct Sales Dispatch Portal
            </h2>
            <p className="text-xs text-slate-500 font-sans mt-0.5">
              Select items from active inventory catalog, build a customized sales draft, adjust discount pricing, check stock quotas, and submit finalized sales records.
            </p>
          </div>
          <div className="bg-emerald-50 text-emerald-800 text-xs px-3.5 py-1.5 rounded-lg border border-emerald-100 font-medium font-sans flex items-center gap-2">
            <TrendingDown size={14} className="text-emerald-600" />
            <span>Reduces catalog stock counts and logs transaction entries instantly</span>
          </div>
        </div>
      </div>

      {saleSuccessMessage && (
        <div className="bg-emerald-900 border border-emerald-800 text-white p-4 rounded-xl shadow-md animate-fade-in flex items-start gap-3">
          <div className="p-1 bg-white/20 rounded-full text-emerald-100">
            <Check size={16} />
          </div>
          <div>
            <h4 className="text-xs font-bold font-sans">Sales Dispatch Successful!</h4>
            <p className="text-[11px] text-emerald-100 font-sans mt-0.5">{saleSuccessMessage}</p>
          </div>
        </div>
      )}

      {/* Grid: Left selector, Right Cart */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        
        {/* Left Side: Searchable Stock Picker (7 cols on XL) */}
        <div className="xl:col-span-7 space-y-4">
          
          {/* Filters controls */}
          <div className="bg-white rounded-xl border border-slate-100 p-4 shadow-sm flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Search size={14} />
              </span>
              <input
                type="text"
                placeholder="Find catalog item by name or SKU..."
                value={salesSearch}
                onChange={(e) => setSalesSearch(e.target.value)}
                className="w-full text-xs border border-slate-200 rounded-lg pl-9 pr-3 py-2 bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all font-sans font-medium"
              />
            </div>
            
            <select
              value={salesCategory}
              onChange={(e) => setSalesCategory(e.target.value)}
              className="w-full sm:w-44 text-xs border border-slate-200/80 rounded-lg px-2.5 py-2 bg-white hover:border-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer text-slate-700 font-medium"
            >
              <option value="all">All Classification Items</option>
              {uniqueCategories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Product Items Selection Panel */}
          <div className="bg-white rounded-xl border border-slate-100 overflow-hidden shadow-sm">
            <div className="border-b border-slate-100 px-4 py-3 bg-slate-50/50 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider font-sans">
                Active Catalog Availability ({availableGridProducts.length})
              </span>
            </div>

            {availableGridProducts.length === 0 ? (
              <div className="text-center py-12 px-4">
                <p className="text-xs text-slate-400 font-medium font-sans">No product items available matching search criteria.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
                {availableGridProducts.map(product => {
                  const itemsInBasket = cart.find(c => c.item.id === product.id)?.quantity || 0;
                  const realAvailable = product.stock - itemsInBasket;
                  const isDepleted = product.stock <= 0;
                  const isLow = product.stock <= product.minThreshold && product.stock > 0;

                  return (
                    <div 
                      key={product.id} 
                      className={`p-3.5 flex items-center justify-between gap-4 transition-colors ${
                        isDepleted ? 'bg-slate-50/50 opacity-60' : 'hover:bg-slate-50/50'
                      }`}
                    >
                      {/* Name Card */}
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-100 flex-shrink-0 overflow-hidden flex items-center justify-center font-bold text-xs text-slate-400 font-sans uppercase">
                          {product.imageUrl ? (
                            <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            product.name.slice(0, 2)
                          )}
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-slate-800 tracking-tight truncate font-sans">
                            {product.name}
                          </h4>
                          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                            <span className="text-[10px] text-slate-400 font-mono tracking-wider font-bold">
                              {product.sku}
                            </span>
                            <span className="text-slate-300">•</span>
                            <span className="text-[10px] text-indigo-600 font-semibold font-sans">
                              {currencyFormatter.format(product.price)}
                            </span>
                            <span className="text-slate-300">•</span>
                            <span className="text-[10px] text-slate-500 font-sans font-medium">
                              {product.category}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Stock availability controls & actions */}
                      <div className="flex items-center gap-3">
                        <div className="text-right flex-shrink-0">
                          <span className={`inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                            isDepleted 
                              ? 'bg-rose-50 text-rose-700' 
                              : isLow 
                              ? 'bg-amber-50 text-amber-700' 
                              : 'bg-emerald-50 text-emerald-700'
                          }`}>
                            {isDepleted ? 'Out of Stock' : `${realAvailable} available`}
                          </span>
                          {itemsInBasket > 0 && (
                            <p className="text-[9px] text-emerald-600 mt-0.5 font-bold font-sans">
                              {itemsInBasket} in draft basket
                            </p>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => addToCart(product)}
                          disabled={realAvailable <= 0}
                          className={`flex items-center justify-center px-2.5 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition-all border active:scale-95 flex-shrink-0 select-none ${
                            realAvailable <= 0
                              ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                              : 'bg-white border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                          }`}
                        >
                          <Plus size={12} className="mr-0.5" />
                          Add
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Sales Cart/Receipt Composer (5 cols on XL) */}
        <div className="xl:col-span-5 space-y-4">
          <form onSubmit={handleCheckoutSubmit} className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
            
            {/* Cart Header */}
            <div className="border-b border-slate-100 px-5 py-4 bg-slate-50/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Receipt size={16} className="text-slate-600" />
                <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider font-sans">
                  Checkout Receipt Composer
                </h3>
              </div>
              {cart.length > 0 && (
                <button
                  type="button"
                  onClick={clearCart}
                  className="text-[10px] font-semibold text-rose-600 hover:text-rose-700 cursor-pointer select-none"
                >
                  Clear Cart
                </button>
              )}
            </div>

            {/* Cart Items List */}
            {cart.length === 0 ? (
              <div className="p-8 text-center text-slate-400 flex flex-col items-center justify-center space-y-2 h-[220px]">
                <ShoppingCart size={28} className="text-slate-300 animate-pulse" />
                <p className="text-xs font-sans font-medium text-slate-500">Cart is empty.</p>
                <p className="text-[11px] text-slate-400 font-sans text-center max-w-xs">
                  Pick active product items from the stock catalog on the left to add them to this sales receipt.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 max-h-[300px] overflow-y-auto px-1">
                {cart.map(c => {
                  const skuTotal = c.quantity * c.soldPrice;
                  return (
                    <div key={c.item.id} className="p-3.5 space-y-2.5">
                      {/* Name header */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-800 font-sans truncate pr-1">
                            {c.item.name}
                          </p>
                          <p className="text-[10px] text-slate-400 font-mono tracking-wide">
                            SKU: {c.item.sku} (Max {c.item.stock} in stock)
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFromCart(c.item.id)}
                          className="p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded cursor-pointer transition-colors"
                          title="Remove item"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>

                      {/* Adjustment variables */}
                      <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
                        
                        {/* Quantity Counter */}
                        <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-white">
                          <button
                            type="button"
                            onClick={() => updateCartQty(c.item.id, c.quantity - 1)}
                            className="p-1 hover:bg-slate-50 text-slate-500 border-r border-slate-200"
                          >
                            <Minus size={11} />
                          </button>
                          
                          <input
                            type="number"
                            value={c.quantity}
                            onChange={(e) => updateCartQty(c.item.id, parseInt(e.target.value) || 1)}
                            className="w-10 text-center font-mono text-[11px] font-bold text-slate-800 focus:outline-none"
                            min="1"
                            max={c.item.stock}
                          />

                          <button
                            type="button"
                            onClick={() => updateCartQty(c.item.id, c.quantity + 1)}
                            disabled={c.quantity >= c.item.stock}
                            className={`p-1 text-slate-500 border-l border-slate-200 ${
                              c.quantity >= c.item.stock ? 'bg-slate-100 opacity-60 text-slate-300' : 'hover:bg-slate-50'
                            }`}
                          >
                            <Plus size={11} />
                          </button>
                        </div>

                        {/* Sold Price Override Input */}
                        <div className="flex items-center gap-1.5">
                          <label className="text-[10px] text-slate-400 font-sans font-medium uppercase">Unit price</label>
                          <div className="relative w-20">
                            <span className="absolute inset-y-0 left-0 pl-1.5 flex items-center text-slate-400 text-[10px]">
                              $
                            </span>
                            <input
                              type="number"
                              step="0.01"
                              value={c.soldPrice}
                              onChange={(e) => updateCartPrice(c.item.id, parseFloat(e.target.value) || 0)}
                              className="w-full text-right font-mono text-[11px] border border-slate-200 rounded px-1.5 py-0.5 focus:outline-none focus:border-indigo-500 font-bold text-slate-800"
                            />
                          </div>
                        </div>

                        {/* Calculated Subtotal */}
                        <div className="text-right min-w-[70px]">
                          <span className="text-xs font-mono font-bold text-slate-900 leading-none">
                            {currencyFormatter.format(skuTotal)}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Receipt Metadata Forms */}
            <div className="bg-slate-50/70 border-t border-b border-slate-100 p-4 space-y-3.5">
              
              {/* Receipt Reference and automatic ID */}
              <div className="flex items-center justify-between text-[11px] font-sans font-medium text-slate-500">
                <span className="flex items-center gap-1">
                  <FileText size={12} className="text-slate-400" />
                  Dispatch Reference ID
                </span>
                <span className="font-mono text-slate-700 font-semibold uppercase">{invoiceRefCode}</span>
              </div>

              {/* Customer Input */}
              <div className="space-y-1">
                <label htmlFor="customer-input" className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-sans block">
                  Customer / Destination Account
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-slate-400">
                    <User size={13} />
                  </span>
                  <input
                    id="customer-input"
                    type="text"
                    required
                    placeholder="e.g. Acme Corp (Walk-in Customer)"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500/10 focus:border-indigo-500 font-medium"
                  />
                </div>
              </div>

              {/* Notes Input */}
              <div className="space-y-1">
                <label htmlFor="sales-memo-notes" className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-sans block">
                  Billing Memo / Internal Notes
                </label>
                <input
                  id="sales-memo-notes"
                  type="text"
                  placeholder="e.g. Delivered via Ground Shipping. Standard net 30 payment."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500/10 focus:border-indigo-500 font-medium text-slate-700"
                />
              </div>

            </div>

            {/* Financial Ledger Aggregations Summary */}
            <div className="p-5 bg-slate-50/30 space-y-3">
              <div className="flex justify-between items-center text-xs font-sans text-slate-500">
                <span>Subtotal ({cartTotals.itemsCount} Units)</span>
                <span className="font-mono">{currencyFormatter.format(cartTotals.subtotal)}</span>
              </div>
              <div className="flex justify-between items-center text-xs font-sans text-slate-500">
                <span className="flex items-center gap-1">
                  VAT Rate (%)
                  <HelpCircle size={11} className="text-slate-300" title="Customize sales tax percentage markup" />
                </span>
                <div className="relative w-20">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    placeholder="5.0"
                    value={vatPercent}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '' || (!isNaN(parseFloat(val)) && parseFloat(val) >= 0 && parseFloat(val) <= 100)) {
                        setVatPercent(val);
                      }
                    }}
                    className="w-full text-right font-mono text-[11px] border border-slate-200 rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-rose-500/20 focus:border-rose-500 font-bold text-slate-800"
                  />
                </div>
              </div>
              <div className="flex justify-between items-center text-xs font-sans text-slate-400">
                <span>Calculated VAT ({vatPercent || '0'}%)</span>
                <span className="font-mono">{currencyFormatter.format(cartTotals.taxAmount)}</span>
              </div>
              <div className="h-px bg-slate-100 my-1"></div>
              <div className="flex justify-between items-center text-sm font-sans font-bold text-slate-900">
                <span className="text-xs font-bold uppercase tracking-wide text-slate-700">Receipt Total</span>
                <span className="font-mono font-black text-rose-600 text-lg">
                  {currencyFormatter.format(cartTotals.finalTotal)}
                </span>
              </div>
            </div>

            {/* Submission Action Button */}
            <div className="p-4 border-t border-slate-100">
              <button
                type="submit"
                disabled={cart.length === 0 || !customerName.trim()}
                className={`w-full py-2.5 rounded-lg font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-1.5 tracking-wide select-none ${
                  cart.length === 0 || !customerName.trim()
                    ? 'bg-slate-100 text-slate-400 border border-slate-200/60 cursor-not-allowed'
                    : 'bg-rose-600 hover:bg-rose-700 text-white cursor-pointer hover:shadow active:scale-[0.98]'
                }`}
              >
                <ShoppingCart size={14} />
                Register Sales Receipt
              </button>
              {cart.length > 0 && !customerName.trim() && (
                <p className="text-[10px] text-rose-500 text-center font-sans mt-2 font-medium">
                  * Customer or destination account name is required to log sales.
                </p>
              )}
            </div>

          </form>
        </div>

      </div>

    </div>
  );
}
