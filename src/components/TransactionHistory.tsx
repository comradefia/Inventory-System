/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  ClipboardList, 
  Trash2, 
  Search, 
  PlusCircle, 
  MinusCircle, 
  FilePlus2, 
  RefreshCcw, 
  X, 
  Settings, 
  ListCollapse,
  BadgeAlert
} from 'lucide-react';
import { TransactionLog, TransactionType } from '../types';

interface TransactionHistoryProps {
  logs: TransactionLog[];
  onClearLogs: () => void;
  selectedFilterSku?: string;
  onClearSelectedSkuFilter?: () => void;
}

export function TransactionHistory({
  logs,
  onClearLogs,
  selectedFilterSku,
  onClearSelectedSkuFilter,
}: TransactionHistoryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | TransactionType>('all');

  // Filter logs based on inputs
  const filteredLogs = logs
    .filter((log) => {
      // 1. Single SKU override filter (activated from Table row click)
      if (selectedFilterSku && log.sku !== selectedFilterSku) {
        return false;
      }
      // 2. Generic Search query (text or SKU matching)
      const q = searchQuery.toLowerCase();
      const matchesSearch = 
        log.itemName.toLowerCase().includes(q) ||
        log.sku.toLowerCase().includes(q) ||
        log.reason.toLowerCase().includes(q);

      // 3. Category Type Filter
      const matchesType = typeFilter === 'all' || log.type === typeFilter;

      return matchesSearch && matchesType;
    })
    // Sort youngest first
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const getTransactionTypeStyle = (type: TransactionType) => {
    switch (type) {
      case 'CREATE':
        return {
          icon: <FilePlus2 size={16} />,
          badge: 'bg-indigo-50 border-indigo-200 text-indigo-700',
          indicator: 'bg-indigo-500',
          label: 'Creation'
        };
      case 'ADD':
        return {
          icon: <PlusCircle size={16} />,
          badge: 'bg-emerald-50 border-emerald-200 text-emerald-700',
          indicator: 'bg-emerald-500',
          label: 'Replenish'
        };
      case 'REMOVE':
        return {
          icon: <MinusCircle size={16} />,
          badge: 'bg-rose-50 border-rose-200 text-rose-700',
          indicator: 'bg-rose-500',
          label: 'Deduction'
        };
      case 'UPDATE':
        return {
          icon: <RefreshCcw size={16} />,
          badge: 'bg-blue-50 border-blue-200 text-blue-700',
          indicator: 'bg-blue-500',
          label: 'Property Edit'
        };
      case 'STOCKTAKE':
        return {
          icon: <Settings size={16} />,
          badge: 'bg-amber-50 border-amber-200 text-amber-700',
          indicator: 'bg-amber-500',
          label: 'Stocktake'
        };
      default:
        return {
          icon: <ClipboardList size={16} />,
          badge: 'bg-slate-50 border-slate-100 text-slate-700',
          indicator: 'bg-slate-500',
          label: 'General'
        };
    }
  };

  const formatDate = (isoStr: string) => {
    const d = new Date(isoStr);
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
      {/* Header operations row */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between border-b border-slate-100 pb-5 mb-5">
        <div>
          <h2 className="text-lg font-bold text-slate-900 font-sans tracking-tight flex items-center gap-2">
            <ClipboardList size={20} className="text-slate-500" />
            Stock Movements Ledger
          </h2>
          <p className="text-xs text-slate-500 font-sans mt-0.5">
            Real-time audit trailing of item creation, stock replenishments, sales, and corrections.
          </p>
        </div>

        {logs.length > 0 && (
          <button
            onClick={onClearLogs}
            className="text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100/80 px-3 py-2 rounded-lg cursor-pointer transition-colors duration-150 flex items-center gap-1.5 align-right"
          >
            <Trash2 size={13} />
            Purge History
          </button>
        )}
      </div>

      {/* Selected SKU Focused alert banner */}
      {selectedFilterSku && (
        <div className="bg-indigo-50 border border-indigo-100/60 rounded-xl p-3.5 mb-5 flex items-center justify-between animate-fade-in text-indigo-900">
          <div className="flex items-center gap-2 text-xs">
            <BadgeAlert size={16} className="text-indigo-600" />
            <span>
              Now focusing exclusively on audit history for SKU: <code className="font-mono bg-indigo-100 text-indigo-800 px-1.5 py-0.5 rounded font-bold">{selectedFilterSku}</code>
            </span>
          </div>
          <button 
            onClick={onClearSelectedSkuFilter}
            className="text-indigo-500 hover:text-indigo-700 cursor-pointer p-1 rounded-md"
            title="Clear SKU Focus"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Filtering options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {/* Text Search */}
        <div className="relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
            <Search size={16} />
          </span>
          <input
            id="audit-log-search"
            type="text"
            placeholder="Search active trails..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs border border-slate-200 rounded-lg pl-9 pr-4 py-2 bg-slate-50/50 hover:bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 font-sans"
          />
        </div>

        {/* Transaction Type SelectionDropdown */}
        <div className="flex items-center gap-2 justify-end">
          <label htmlFor="audit-type-filter" className="text-xs font-semibold text-slate-500 uppercase font-sans">Trail Group:</label>
          <select
            id="audit-type-filter"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
            className="text-xs border border-slate-200 bg-white rounded-lg px-2.5 py-2 hover:border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-700 font-medium cursor-pointer"
          >
            <option value="all">All Movements</option>
            <option value="CREATE">Product Creations</option>
            <option value="ADD">Replenishments (+)</option>
            <option value="REMOVE">Deductions (-)</option>
            <option value="UPDATE">Properties/Updates</option>
            <option value="STOCKTAKE">Stocktakes</option>
          </select>
        </div>
      </div>

      {/* LOG TIMEFLOW DISPLAY */}
      {filteredLogs.length === 0 ? (
        <div className="py-12 text-center border-2 border-dashed border-slate-100 rounded-xl bg-slate-50/20">
          <ListCollapse size={32} className="mx-auto text-slate-300 mb-3" />
          <h4 className="text-sm font-bold text-slate-700 font-sans">No logs record</h4>
          <p className="text-xs text-slate-400 font-sans mt-1 max-w-xs mx-auto">
            No audit transaction found matching specified search criteria or tags. Try broadening your filter range.
          </p>
        </div>
      ) : (
        <div className="relative border-l border-slate-100 pl-6 space-y-6 ml-3">
          {filteredLogs.map((log) => {
            const style = getTransactionTypeStyle(log.type);
            const quantityText = log.quantityChange > 0 
              ? `+${log.quantityChange}` 
              : log.quantityChange === 0 
              ? '—' 
              : `${log.quantityChange}`;

            return (
              <div key={log.id} className="relative group/log animate-fade-in">
                {/* Visual Circle Indicator */}
                <span className={`absolute -left-[30px] top-1 flex h-4.5 w-4.5 items-center justify-center rounded-full border-2 border-white ring-4 ring-white ${style.indicator}`} />
                
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 bg-slate-50/40 hover:bg-slate-50 border border-transparent hover:border-slate-100/60 p-4 rounded-xl transition-all">
                  {/* Item and Action Title info */}
                  <div className="space-y-1 md:max-w-xl">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold text-slate-900 font-sans">{log.itemName}</span>
                      <code className="text-[10px] font-mono tracking-tight text-slate-500 bg-slate-100 px-1 rounded">{log.sku}</code>
                      <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded border text-[9px] font-semibold font-sans tracking-wide uppercase ${style.badge}`}>
                        {style.icon}
                        {style.label}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 font-sans leading-relaxed">{log.reason}</p>
                    <time className="text-[10px] text-slate-400 font-mono block mt-1">{formatDate(log.timestamp)}</time>
                  </div>

                  {/* Quantity and resultant logs */}
                  <div className="text-right sm:self-center flex flex-row sm:flex-col justify-between sm:justify-start items-center sm:items-end gap-1.5 pt-2 sm:pt-0 border-t border-slate-100/50 sm:border-0">
                    <span className="text-xs text-slate-400 font-sans sm:hidden">Quantity action:</span>
                    <div>
                      {log.quantityChange !== 0 && (
                        <span className={`text-sm font-bold font-mono mr-2.5 ${
                          log.quantityChange > 0 ? 'text-emerald-600' : 'text-rose-600'
                        }`}>
                          {quantityText}
                        </span>
                      )}
                      <span className="inline-flex rounded-md bg-white border border-slate-200 px-2.5 py-1 text-[11px] font-semibold text-slate-700 font-mono shadow-xs">
                        Bal: {log.newStock}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
