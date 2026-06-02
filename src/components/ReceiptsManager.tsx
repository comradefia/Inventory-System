/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  Receipt, 
  Search, 
  Calendar, 
  User, 
  ChevronRight, 
  X, 
  Printer, 
  Share2, 
  TrendingUp, 
  DollarSign, 
  Percent, 
  Clock, 
  Tag,
  Sparkles
} from 'lucide-react';
import { SaleReceipt } from '../types';

interface ReceiptsManagerProps {
  receipts: SaleReceipt[];
  onClearReceipts?: () => void;
}

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

const dateFormatter = (isoString: string) => {
  try {
    const date = new Date(isoString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return isoString;
  }
};

export function ReceiptsManager({ receipts, onClearReceipts }: ReceiptsManagerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReceiptId, setSelectedReceiptId] = useState<string | null>(null);

  // Filters State
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'seven-days' | 'thirty-days'>('all');

  // Filter receipt list
  const filteredReceipts = useMemo(() => {
    return receipts.filter((rcpt) => {
      const matchSearch = 
        rcpt.invoiceRef.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rcpt.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rcpt.notes.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rcpt.items.some(it => it.itemName.toLowerCase().includes(searchTerm.toLowerCase()) || it.sku.toLowerCase().includes(searchTerm.toLowerCase()));

      if (!matchSearch) return false;

      if (dateFilter === 'all') return true;

      const receiptDate = new Date(rcpt.timestamp);
      const isTodayStr = new Date().toDateString() === receiptDate.toDateString();

      if (dateFilter === 'today') {
        return isTodayStr;
      }

      const diffTime = Math.abs(new Date().getTime() - receiptDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (dateFilter === 'seven-days') {
        return diffDays <= 7;
      }

      if (dateFilter === 'thirty-days') {
        return diffDays <= 30;
      }

      return true;
    });
  }, [receipts, searchTerm, dateFilter]);

  // Aggregate stats
  const stats = useMemo(() => {
    const totalSalesVol = filteredReceipts.reduce((sum, r) => sum + r.finalTotal, 0);
    const totalSubtotal = filteredReceipts.reduce((sum, r) => sum + r.subtotal, 0);
    const totalVAT = filteredReceipts.reduce((sum, r) => sum + r.taxAmount, 0);
    const totalQuantity = filteredReceipts.reduce((sum, r) => sum + r.items.reduce((s, it) => s + it.quantity, 0), 0);
    
    return {
      totalSalesVol,
      totalSubtotal,
      totalVAT,
      totalQuantity,
      count: filteredReceipts.length
    };
  }, [filteredReceipts]);

  // Single active detailed receipt
  const activeReceipt = useMemo(() => {
    return receipts.find(r => r.id === selectedReceiptId) || null;
  }, [receipts, selectedReceiptId]);

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="bg-white rounded-xl border border-slate-100 p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 font-sans tracking-tight flex items-center gap-2">
              <Receipt size={20} className="text-indigo-600" />
              Receipts Archives Ledger
            </h2>
            <p className="text-xs text-slate-500 font-sans mt-0.5">
              Browse fully compiled customer receipts, retrieve invoices with instant search parameters, review total subtotal calculations, and inspect itemized breakdown lists.
            </p>
          </div>
          {onClearReceipts && receipts.length > 0 && (
            <button
              onClick={onClearReceipts}
              className="px-3.5 py-2 hover:bg-rose-50 text-rose-600 border border-rose-100 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
            >
              Clear Local Ledger
            </button>
          )}
        </div>
      </div>

      {/* Aggregate Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm flex items-center gap-4">
          <div className="p-3.5 bg-indigo-50 text-indigo-600 rounded-lg">
            <DollarSign size={20} />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Sales Invoiced</p>
            <p className="text-xl font-bold font-mono text-slate-800 mt-1">{currencyFormatter.format(stats.totalSalesVol)}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Net subtotal: {currencyFormatter.format(stats.totalSubtotal)}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm flex items-center gap-4">
          <div className="p-3.5 bg-rose-50 text-rose-600 rounded-lg">
            <Percent size={20} />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Estimated VAT Collected</p>
            <p className="text-xl font-bold font-mono text-rose-600 mt-1">{currencyFormatter.format(stats.totalVAT)}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Based on client-specified rates</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm flex items-center gap-4">
          <div className="p-3.5 bg-emerald-50 text-emerald-600 rounded-lg">
            <Receipt size={20} />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Transactions Processed</p>
            <p className="text-xl font-bold font-mono text-emerald-600 mt-1">{stats.count} Receipts</p>
            <p className="text-[10px] text-slate-400 mt-0.5">{stats.totalQuantity} total inventory units dispatched</p>
          </div>
        </div>
      </div>

      {/* Table & Searches */}
      <div className="bg-white rounded-xl border border-slate-100 overflow-hidden shadow-sm">
        <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row items-center gap-4 justify-between">
          
          {/* Search Inputs */}
          <div className="relative flex-1 w-full">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
              <Search size={15} />
            </span>
            <input
              type="text"
              placeholder="Filter archives by customer, invoice reference code, or component SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs border border-slate-200 rounded-lg pl-9 pr-3 py-2.5 bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors font-sans font-medium"
            />
          </div>

          {/* Date Selector */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <Calendar size={14} className="text-slate-400" />
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as any)}
              className="text-xs border border-slate-200 rounded-lg px-3 py-2.5 bg-white font-semibold text-slate-700 cursor-pointer focus:outline-none w-full md:w-44"
            >
              <option value="all">All Dates</option>
              <option value="today">Today's Receipts</option>
              <option value="seven-days">Past 7 Days</option>
              <option value="thirty-days">Past 30 Days</option>
            </select>
          </div>
        </div>

        {/* Dynamic Table List */}
        {filteredReceipts.length === 0 ? (
          <div className="p-12 text-center">
            <Receipt size={36} className="text-slate-300 mx-auto mb-4" />
            <h4 className="text-xs font-bold text-slate-700 font-sans uppercase tracking-wider">No Archive Matches Found</h4>
            <p className="text-xs text-slate-400 font-sans mt-1 max-w-sm mx-auto">
              We couldn't locate any archived receipts matching your search. Try adjusting date filters or clearing search queries.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse" id="receipts-record-table">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="py-3 px-5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Invoice Reference</th>
                  <th className="py-3 px-5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date & Time</th>
                  <th className="py-3 px-5 text-xs font-semibold text-slate-500 uppercase tracking-wider">Customer Client</th>
                  <th className="py-3 px-5 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">Units Sold</th>
                  <th className="py-3 px-5 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Subtotal</th>
                  <th className="py-3 px-5 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">VAT</th>
                  <th className="py-3 px-5 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Total Invoice</th>
                  <th className="py-3 px-5 text-xs font-semibold text-slate-500 uppercase text-center w-24">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredReceipts.map((receipt) => {
                  const itemCount = receipt.items.reduce((s, it) => s + it.quantity, 0);
                  return (
                    <tr 
                      key={receipt.id} 
                      className="hover:bg-indigo-50/5 text-slate-700 transition-colors group cursor-pointer"
                      onClick={() => setSelectedReceiptId(receipt.id)}
                    >
                      {/* Invoice ID */}
                      <td className="py-4.5 px-5">
                        <div className="flex items-center gap-2">
                          <Receipt size={14} className="text-slate-400 group-hover:text-indigo-600 transition-colors" />
                          <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                            {receipt.invoiceRef}
                          </span>
                        </div>
                      </td>

                      {/* Created At */}
                      <td className="py-4.5 px-5">
                        <div className="flex items-center gap-1.5 text-slate-500 text-xs">
                          <Clock size={12} className="text-slate-400" />
                          <span>{dateFormatter(receipt.timestamp)}</span>
                        </div>
                      </td>

                      {/* Customer Name */}
                      <td className="py-4.5 px-5">
                        <div className="flex flex-col">
                          <span className="text-xs font-semibold text-slate-800">
                            {receipt.customerName || 'Walk-in Customer'}
                          </span>
                          {receipt.notes && (
                            <span className="text-[10px] text-slate-400 truncate max-w-xs font-sans italic mt-0.5">
                              {receipt.notes}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Items Count */}
                      <td className="py-4.5 px-5 text-center">
                        <span className="inline-flex items-center justify-center bg-indigo-50 text-indigo-700 text-[11px] font-mono font-bold rounded-full h-5.5 px-2">
                          {itemCount} units
                        </span>
                      </td>

                      {/* Subtotal */}
                      <td className="py-4.5 px-5 text-right font-mono text-xs text-slate-600">
                        {currencyFormatter.format(receipt.subtotal)}
                      </td>

                      {/* VAT rate and cash */}
                      <td className="py-4.5 px-5 text-right">
                        <div className="flex flex-col items-end">
                          <span className="font-mono text-xs font-medium text-slate-600">
                            {currencyFormatter.format(receipt.taxAmount)}
                          </span>
                          <span className="text-[9px] text-slate-400 font-mono">
                            {receipt.vatPercent}% VAT
                          </span>
                        </div>
                      </td>

                      {/* Final Total */}
                      <td className="py-4.5 px-5 text-right">
                        <span className="font-mono text-xs font-bold text-indigo-600 bg-indigo-50/40 px-2 py-1 rounded border border-indigo-100/30">
                          {currencyFormatter.format(receipt.finalTotal)}
                        </span>
                      </td>

                      {/* View Action */}
                      <td className="py-4.5 px-5 text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedReceiptId(receipt.id);
                          }}
                          className="p-1 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-semibold transition-colors flex items-center gap-1 mx-auto"
                        >
                          Invoice
                          <ChevronRight size={12} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Invoice Receipt Detail Flyout Modal */}
      {activeReceipt && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto animate-fade-in" id="receipt-details-modal">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-sm sm:max-w-md w-full overflow-hidden flex flex-col my-8">
            
            {/* Modal Header Actions */}
            <div className="bg-slate-50 border-b border-slate-100 px-6 py-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <Receipt size={16} className="text-indigo-600" />
                <span className="text-xs font-bold text-slate-800 tracking-wide uppercase">Print Invoice View</span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => window.print()}
                  className="p-1.5 text-slate-500 hover:text-slate-800 transition-colors hover:bg-slate-100 rounded"
                  title="Simulate print"
                >
                  <Printer size={15} />
                </button>
                <button
                  onClick={() => setSelectedReceiptId(null)}
                  className="p-1.5 text-slate-500 hover:text-rose-600 transition-colors hover:bg-slate-100 rounded"
                >
                  <X size={15} />
                </button>
              </div>
            </div>

            {/* Receipt Modal Content (Styled beautifully like a thermal/luxury invoice receipt) */}
            <div className="p-6 overflow-y-auto space-y-6 max-h-[80vh] font-sans">
              
              {/* Receipt Header details */}
              <div className="text-center space-y-1.5 pb-5 border-b border-dashed border-slate-200">
                <div className="w-10 h-10 bg-slate-900 text-white font-extrabold text-lg flex items-center justify-center rounded-lg mx-auto shadow-xs leading-none select-none">
                  S
                </div>
                <h3 className="text-xs font-bold tracking-widest text-slate-900 uppercase">Stockyard Solutions</h3>
                <p className="text-[10px] text-slate-400 font-mono tracking-wide leading-relaxed">
                  Operational Logistics & Supplies Board<br />
                  100 Tech Terminal, West-1 Cloud District<br />
                  alahmad.firas@gmail.com
                </p>
              </div>

              {/* Invoice Meta */}
              <div className="grid grid-cols-2 gap-4 text-[10px] pb-5 border-b border-slate-100 font-mono text-slate-500">
                <div>
                  <p className="font-bold text-slate-800 uppercase tracking-wider mb-1">Receipt Information</p>
                  <p>Invoice: <strong className="text-slate-700">{activeReceipt.invoiceRef}</strong></p>
                  <p>Ref ID: <span className="text-xs text-slate-400">{activeReceipt.id}</span></p>
                  <p>Time: <span>{dateFormatter(activeReceipt.timestamp)}</span></p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-slate-800 uppercase tracking-wider mb-1">Customer / Client</p>
                  <p className="font-sans font-semibold text-slate-800">{activeReceipt.customerName || 'Walk-In client'}</p>
                  <p className="italic font-sans text-slate-400 mt-1 max-w-[160px] truncate ml-auto">
                    {activeReceipt.notes ? `"${activeReceipt.notes}"` : 'Cash desk checkout'}
                  </p>
                </div>
              </div>

              {/* Itemized list items */}
              <div className="space-y-3.5">
                <p className="text-[10px] font-bold text-slate-800 uppercase tracking-wider font-mono">Invoice Lines</p>
                <div className="divide-y divide-slate-100">
                  {activeReceipt.items.map((lineItem) => (
                    <div key={lineItem.sku} className="py-2.5 flex justify-between gap-4 text-xs font-sans">
                      <div className="space-y-0.5">
                        <p className="font-medium text-slate-800">{lineItem.itemName}</p>
                        <p className="text-[10px] text-slate-400 font-mono">
                          {lineItem.sku} • {currencyFormatter.format(lineItem.soldPrice)} / unit
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-semibold text-slate-800">
                          {currencyFormatter.format(lineItem.quantity * lineItem.soldPrice)}
                        </p>
                        <p className="text-[10px] text-slate-400 font-mono">Qty: {lineItem.quantity}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Subtotal tax and total section */}
              <div className="pt-4 border-t border-dashed border-slate-200">
                <div className="space-y-1.5 font-mono text-[11px] text-slate-500">
                  <div className="flex justify-between">
                    <span>Invoice Net Subtotal:</span>
                    <span className="text-slate-700">{currencyFormatter.format(activeReceipt.subtotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Output Sales Tax ({activeReceipt.vatPercent}% VAT):</span>
                    <span className="text-slate-700">{currencyFormatter.format(activeReceipt.taxAmount)}</span>
                  </div>
                  <div className="h-px bg-slate-100 my-1"></div>
                  <div className="flex justify-between text-xs font-sans font-bold text-slate-900 pt-1">
                    <span className="flex items-center gap-1">
                      <Sparkles size={11} className="text-indigo-500" />
                      Grand Total (USD):
                    </span>
                    <span className="text-indigo-600 text-sm font-mono">{currencyFormatter.format(activeReceipt.finalTotal)}</span>
                  </div>
                </div>
              </div>

              {/* Invoice footer message */}
              <div className="bg-slate-50 border border-slate-100 p-3 rounded-lg text-center space-y-1">
                <p className="text-[10px] text-slate-500 font-sans leading-normal">
                  Thank you for your business. For inventory returns, safety inspections, or operational queries, please consult the ledger logs or email support.
                </p>
                <div className="flex items-center justify-center gap-1.5 text-[9px] text-slate-400 font-mono uppercase mt-1">
                  <span>Powering Stockyard Solutions</span>
                  <span>•</span>
                  <span>2026 Archive</span>
                </div>
              </div>

            </div>

            {/* Cancel view */}
            <div className="bg-slate-50 border-t border-slate-100 px-6 py-4 flex justify-end">
              <button
                onClick={() => setSelectedReceiptId(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 transition-colors rounded-lg text-xs font-semibold text-slate-700 cursor-pointer"
              >
                Close Invoice
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
