/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Package, DollarSign, AlertTriangle, XCircle, ArrowUpRight } from 'lucide-react';
import { InventoryItem } from '../types';

interface DashboardStatsProps {
  items: InventoryItem[];
}

export function DashboardStats({ items }: DashboardStatsProps) {
  // Compute analytics
  const totalItems = items.length;
  
  const totalValue = items.reduce((sum, item) => sum + (item.price * item.stock), 0);
  const totalCostValue = items.reduce((sum, item) => sum + ((item.cost !== undefined ? item.cost : item.price) * item.stock), 0);
  
  const outOfStockCount = items.filter(item => item.stock <= 0).length;
  
  const lowStockCount = items.filter(
    item => item.stock > 0 && item.stock <= item.minThreshold
  ).length;

  const currencyFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  });

  const percentFormatter = new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });

  const potentialMarkupValue = totalValue - totalCostValue;
  const grossProfitMargin = totalValue > 0 ? potentialMarkupValue / totalValue : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {/* Total Items */}
      <div id="stat-total-items" className="bg-white rounded-xl border border-slate-100 p-6 shadow-sm transition-all duration-200 hover:shadow-md hover:border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium text-slate-500 font-sans">Total Products</span>
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
            <Package size={20} />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-slate-900 font-sans tracking-tight">{totalItems}</span>
          <span className="text-xs font-mono text-indigo-600 font-medium">SKUs Managed</span>
        </div>
        <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-400">
          <span className="flex h-2 w-2 rounded-full bg-indigo-500 animate-pulse"></span>
          <span>Real-time monitoring active</span>
        </div>
      </div>

      {/* Total Inventory Value */}
      <div id="stat-total-value" className="bg-white rounded-xl border border-slate-100 p-6 shadow-sm transition-all duration-200 hover:shadow-md hover:border-slate-200">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-slate-500 font-sans">Asset Valuation (Retail)</span>
          <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
            <DollarSign size={20} />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-slate-900 font-sans tracking-tight">
            {currencyFormatter.format(totalValue)}
          </span>
        </div>
        <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-col gap-1 text-[11px] text-slate-500 font-sans">
          <div className="flex justify-between items-center">
            <span>Capital Invested (Cost):</span>
            <span className="font-mono font-medium text-slate-700">{currencyFormatter.format(totalCostValue)}</span>
          </div>
          <div className="flex justify-between items-center">
            <span>Potential Margin:</span>
            <span className="font-mono font-semibold text-indigo-600">{percentFormatter.format(grossProfitMargin)}</span>
          </div>
        </div>
      </div>

      {/* Low Stock Alerts */}
      <div id="stat-low-stock" className={`rounded-xl border p-6 shadow-sm transition-all duration-200 hover:shadow-md ${
        lowStockCount > 0 
          ? 'bg-amber-50/40 border-amber-200/60 hover:border-amber-300' 
          : 'bg-white border-slate-100 hover:border-slate-200'
      }`}>
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium text-slate-500 font-sans">Low-Stock Warnings</span>
          <div className={`p-2 rounded-lg ${
            lowStockCount > 0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-50 text-slate-400'
          }`}>
            <AlertTriangle size={20} />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className={`text-3xl font-bold font-sans tracking-tight ${
            lowStockCount > 0 ? 'text-amber-700' : 'text-slate-900'
          }`}>{lowStockCount}</span>
          <span className="text-xs font-sans text-slate-400">Items below safety margin</span>
        </div>
        <div className="mt-3 text-xs">
          {lowStockCount > 0 ? (
            <span className="text-amber-600 font-medium font-sans">Action required: Restock advised</span>
          ) : (
            <span className="text-slate-400">All products above minimum safety levels</span>
          )}
        </div>
      </div>

      {/* Out of Stock */}
      <div id="stat-out-of-stock" className={`rounded-xl border p-6 shadow-sm transition-all duration-200 hover:shadow-md ${
        outOfStockCount > 0 
          ? 'bg-rose-50/40 border-rose-200/60 hover:border-rose-300' 
          : 'bg-white border-slate-100 hover:border-slate-200'
      }`}>
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium text-slate-500 font-sans">Depleted Stock</span>
          <div className={`p-2 rounded-lg ${
            outOfStockCount > 0 ? 'bg-rose-100 text-rose-700' : 'bg-slate-50 text-slate-400'
          }`}>
            <XCircle size={20} />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className={`text-3xl font-bold font-sans tracking-tight ${
            outOfStockCount > 0 ? 'text-rose-700' : 'text-slate-900'
          }`}>{outOfStockCount}</span>
          <span className="text-xs font-sans text-slate-400">Items currently unavailable</span>
        </div>
        <div className="mt-3 text-xs">
          {outOfStockCount > 0 ? (
            <span className="text-rose-600 font-medium font-sans">Critical: Immediate restock needed</span>
          ) : (
            <span className="text-emerald-600 font-medium font-sans">Perfect: Zero depleted listings</span>
          )}
        </div>
      </div>
    </div>
  );
}
