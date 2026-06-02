/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Coins, 
  Warehouse, 
  Percent, 
  ArrowUpRight, 
  PieChart, 
  Layers, 
  Tag, 
  Activity, 
  Info,
  Package,
  Calendar,
  Zap,
  Sparkles
} from 'lucide-react';
import { InventoryItem, SaleReceipt } from '../types';

interface FinanceDashboardProps {
  items: InventoryItem[];
  receipts: SaleReceipt[];
}

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

const percentFormatter = new Intl.NumberFormat('en-US', {
  style: 'percent',
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

export function FinanceDashboard({ items, receipts }: FinanceDashboardProps) {

  // 1. Asset Evaluation (Retail Value of remaining stock)
  const assetEvaluation = useMemo(() => {
    return items.reduce((sum, item) => sum + (item.price * item.stock), 0);
  }, [items]);

  // 2. Asset Cost Evaluation (Acquisition value of remaining stock)
  const assetCostEvaluation = useMemo(() => {
    return items.reduce((sum, item) => {
      const cost = item.cost !== undefined ? item.cost : 0;
      return sum + (cost * item.stock);
    }, 0);
  }, [items]);

  // Total Stock Units
  const totalStockUnits = useMemo(() => {
    return items.reduce((sum, item) => sum + item.stock, 0);
  }, [items]);

  // Potential Unrealized Markup Value of inventory
  const unrealizedMarkup = useMemo(() => {
    return Math.max(0, assetEvaluation - assetCostEvaluation);
  }, [assetEvaluation, assetCostEvaluation]);

  const unrealizedMargin = useMemo(() => {
    return assetEvaluation > 0 ? unrealizedMarkup / assetEvaluation : 0;
  }, [assetEvaluation, unrealizedMarkup]);


  // 3. Sales Volume (Using Net Subtotal as core sales revenue, excluding VAT as tax liability)
  const totalSalesRevenue = useMemo(() => {
    return receipts.reduce((sum, rcpt) => sum + rcpt.subtotal, 0);
  }, [receipts]);

  // Gross Sales (including output VAT)
  const totalGrossRevenue = useMemo(() => {
    return receipts.reduce((sum, rcpt) => sum + rcpt.finalTotal, 0);
  }, [receipts]);

  const totalVatCollected = useMemo(() => {
    return receipts.reduce((sum, rcpt) => sum + rcpt.taxAmount, 0);
  }, [receipts]);


  // 4. Cost of Sales (COGS)
  // Sum of (quantity * item.cost) for each receipt item based on the stock acquisition cost
  const costOfSales = useMemo(() => {
    return receipts.reduce((totalCogs, receipt) => {
      const receiptCogs = receipt.items.reduce((itemSum, rcptItem) => {
        // Find matched product in inventory
        const matched = items.find(i => i.id === rcptItem.itemId || i.sku === rcptItem.sku);
        // Fallback: If no item can be found or item doesn't have a cost set, fall back to a standard margin calculation
        const unitCost = matched && matched.cost !== undefined 
          ? matched.cost 
          : (matched ? matched.price * 0.65 : rcptItem.soldPrice * 0.65);
        return itemSum + (rcptItem.quantity * unitCost);
      }, 0);
      return totalCogs + receiptCogs;
    }, 0);
  }, [receipts, items]);


  // 5. Sales Profit
  const salesProfit = useMemo(() => {
    return totalSalesRevenue - costOfSales;
  }, [totalSalesRevenue, costOfSales]);


  // 6. Sales Margin %
  const salesMargin = useMemo(() => {
    return totalSalesRevenue > 0 ? salesProfit / totalSalesRevenue : 0;
  }, [totalSalesRevenue, salesProfit]);


  // Category Breakdown for analysis
  const categoryAnalyses = useMemo(() => {
    const categoriesMap: {
      [cat: string]: {
        name: string;
        retailValue: number;
        costValue: number;
        stockCount: number;
        salesVolume: number;
        cogs: number;
      }
    } = {};

    // Seed empty groupings based on items
    items.forEach(item => {
      const cat = item.category || 'Other';
      if (!categoriesMap[cat]) {
        categoriesMap[cat] = {
          name: cat,
          retailValue: 0,
          costValue: 0,
          stockCount: 0,
          salesVolume: 0,
          cogs: 0
        };
      }
      categoriesMap[cat].retailValue += item.price * item.stock;
      categoriesMap[cat].costValue += (item.cost !== undefined ? item.cost : 0) * item.stock;
      categoriesMap[cat].stockCount += item.stock;
    });

    // Populate calculations with sold quantities by category
    receipts.forEach(rcpt => {
      rcpt.items.forEach(rcptItem => {
        const itemInList = items.find(i => i.id === rcptItem.itemId || i.sku === rcptItem.sku);
        const cat = itemInList ? itemInList.category : 'Other';
        const cost = itemInList && itemInList.cost !== undefined 
          ? itemInList.cost 
          : (itemInList ? itemInList.price * 0.65 : rcptItem.soldPrice * 0.65);

        if (!categoriesMap[cat]) {
          categoriesMap[cat] = {
            name: cat,
            retailValue: 0,
            costValue: 0,
            stockCount: 0,
            salesVolume: 0,
            cogs: 0
          };
        }

        categoriesMap[cat].salesVolume += rcptItem.quantity * rcptItem.soldPrice;
        categoriesMap[cat].cogs += rcptItem.quantity * cost;
      });
    });

    return Object.values(categoriesMap).sort((a, b) => b.salesVolume - a.salesVolume);
  }, [items, receipts]);


  // Most profitable items based on margin value or volume
  const topProfitableProducts = useMemo(() => {
    return items.map(item => {
      const cost = item.cost !== undefined ? item.cost : 0;
      const unitProfit = item.price - cost;
      const profitRate = item.price > 0 ? unitProfit / item.price : 0;
      const potentialProfit = unitProfit * item.stock;

      // Find real-world sold stats from receipts
      let totalQtySold = 0;
      receipts.forEach(r => {
        const line = r.items.find(it => it.itemId === item.id || it.sku === item.sku);
        if (line) {
          totalQtySold += line.quantity;
        }
      });
      const realizedProfit = totalQtySold * unitProfit;

      return {
        item,
        unitProfit,
        profitRate,
        potentialProfit,
        totalQtySold,
        realizedProfit
      };
    })
    .sort((a, b) => b.realizedProfit - a.realizedProfit || b.potentialProfit - a.potentialProfit)
    .slice(0, 5);
  }, [items, receipts]);


  // Color classes for Margins
  const getMarginBgColor = (margin: number) => {
    if (margin >= 0.4) return 'text-emerald-600 bg-emerald-50 border-emerald-100';
    if (margin >= 0.2) return 'text-indigo-600 bg-indigo-50 border-indigo-100';
    if (margin > 0) return 'text-amber-600 bg-amber-50 border-amber-100';
    return 'text-rose-600 bg-rose-50 border-rose-100';
  };

  return (
    <div className="space-y-6">
      
      {/* Upper Dashboard Header Banner */}
      <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 text-white shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 opacity-10 pointer-events-none translate-x-12 -translate-y-12">
          <Activity size={240} className="stroke-indigo-400" />
        </div>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-indigo-500 rounded text-white text-xs font-bold leading-none">
                Finance Workspace
              </span>
              <span className="text-[10px] text-indigo-200 font-mono tracking-wider uppercase">
                • Capital & Profit Matrix
              </span>
            </div>
            <h2 className="text-xl font-bold font-sans tracking-tight mt-1.5 flex items-center gap-2">
              <Coins size={22} className="text-indigo-400" />
              Corporate Financial Analytics Dashboard
            </h2>
            <p className="text-xs text-indigo-200 font-sans mt-0.5 max-w-2xl leading-relaxed">
              Consolidated real-time evaluations reflecting asset pricing structures, live inventory capital investments, cost of goods sold variables, output margins, and net sales profitability.
            </p>
          </div>
          
          <div className="flex items-center gap-2.5 bg-slate-800/80 backdrop-blur-xs px-3.5 py-2 rounded-lg border border-slate-700/55 font-mono text-xs">
            <Calendar size={13} className="text-slate-400" />
            <span className="text-slate-300 font-medium">As of June 2, 2026</span>
          </div>
        </div>
      </div>

      {/* CORE FINANCIAL METRICS ROW - Bento cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Metric 1 & 2: Inventory Asset Evaluation */}
        <div className="bg-white rounded-xl border border-slate-100 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest font-sans">
              Inventory Asset Valuation
            </span>
            <div className="p-2 bg-slate-50 text-slate-500 rounded-lg">
              <Warehouse size={18} />
            </div>
          </div>
          
          <div className="space-y-1">
            <p className="text-xs text-slate-500 font-sans">Asset Evaluation (Retail Value)</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-slate-900 font-mono">
                {currencyFormatter.format(assetEvaluation)}
              </span>
            </div>
          </div>

          <div className="h-px bg-slate-100"></div>

          <div className="space-y-1">
            <p className="text-xs text-slate-500 font-sans">Asset Cost Evaluation (Acquisition Cap)</p>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold text-slate-700 font-mono">
                {currencyFormatter.format(assetCostEvaluation)}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">Cost Value</span>
            </div>
          </div>

          <div className="bg-indigo-50/50 p-2.5 rounded-lg border border-indigo-100/30 flex items-center justify-between text-xs font-sans">
            <div className="space-y-0.5">
              <span className="text-slate-500 block">Total Capital Margin:</span>
              <span className="font-semibold text-slate-800">Unrealized Revenue Markup</span>
            </div>
            <div className="text-right">
              <span className="text-indigo-600 font-bold block font-mono">{currencyFormatter.format(unrealizedMarkup)}</span>
              <span className="text-[10px] text-slate-400 font-mono">Markup: {percentFormatter.format(unrealizedMargin)}</span>
            </div>
          </div>
        </div>

        {/* Metric 3 & 4: Sales & Cost of Sales */}
        <div className="bg-white rounded-xl border border-slate-100 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest font-sans">
              Sales Output Metrics
            </span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <DollarSign size={18} />
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-xs text-slate-500 font-sans flex items-center justify-between">
              <span>Sales (Net Subtotal)</span>
              {totalVatCollected > 0 && <span className="text-[10px] text-slate-400">Total with VAT: {currencyFormatter.format(totalGrossRevenue)}</span>}
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-slate-900 font-mono">
                {currencyFormatter.format(totalSalesRevenue)}
              </span>
              {receipts.length > 0 && (
                <span className="text-xs text-indigo-600 font-semibold bg-indigo-50 px-1.5 py-0.5 rounded font-mono">
                  {receipts.length} sold
                </span>
              )}
            </div>
          </div>

          <div className="h-px bg-slate-100"></div>

          <div className="space-y-1">
            <p className="text-xs text-slate-500 font-sans">Cost of Sales (COGS)</p>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold text-slate-700 font-mono">
                {currencyFormatter.format(costOfSales)}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">Cost value of stock sold</span>
            </div>
          </div>

          <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200/50 flex justify-between items-center text-xs">
            <div className="space-y-0.5">
              <span className="text-slate-500 block">Total VAT Liability:</span>
              <span className="text-[10px] text-slate-400 font-sans">Invoiced output tax value</span>
            </div>
            <div className="text-right font-mono font-semibold text-slate-700">
              {currencyFormatter.format(totalVatCollected)}
            </div>
          </div>
        </div>

        {/* Metric 5 & 6: Sales Margin & Sales Profit */}
        <div className="bg-white rounded-xl border border-slate-100 p-6 shadow-sm space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest font-sans">
                Profitability Performance
              </span>
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                <Percent size={18} />
              </div>
            </div>

            <div className="space-y-1">
              <p className="text-xs text-slate-500 font-sans">Sales Margin (%)</p>
              <div className="flex items-center gap-3">
                <span className="text-3xl font-extrabold text-indigo-600 font-mono leading-none">
                  {percentFormatter.format(salesMargin)}
                </span>
                <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border ${getMarginBgColor(salesMargin)}`}>
                  {salesMargin >= 0.35 ? 'Highly Lucrative' : salesMargin >= 0.20 ? 'Optimal' : salesMargin > 0 ? 'Narrow' : 'Negative'}
                </span>
              </div>
            </div>

            <div className="h-px bg-slate-100"></div>

            <div className="space-y-1">
              <p className="text-xs text-slate-500 font-sans">Sales Profit (Net Earned)</p>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-extrabold text-emerald-600 font-mono">
                  {currencyFormatter.format(salesProfit)}
                </span>
              </div>
            </div>
          </div>

          {/* Simple HTML inline comparative bar chart for Margin explanation */}
          <div className="space-y-1.5 pt-3">
            <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
              <span>COGS ({salesMargin > 0 ? percentFormatter.format(1 - salesMargin) : '100%'})</span>
              <span>PROFIT ({percentFormatter.format(salesMargin)})</span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden flex">
              <div 
                className="bg-slate-300 transition-all duration-500" 
                style={{ width: `${Math.min(100, Math.max(0, (1 - salesMargin) * 100))}%` }} 
              />
              <div 
                className="bg-emerald-500 transition-all duration-500 flex-1" 
                style={{ width: `${Math.min(100, Math.max(0, salesMargin * 100))}%` }} 
              />
            </div>
          </div>
        </div>

      </div>

      {/* DETAILED CATEGORY & PRODUCTS BREAKDOWN SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Category Performance Breakdown */}
        <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 font-sans tracking-tight flex items-center gap-1.5">
              <Layers size={16} className="text-indigo-600" />
              Category Profitability Analysis
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Review stock capitalization and real-world sales performance grouped by department categories.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse font-sans">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50">
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3 text-right">Asset Cost</th>
                  <th className="py-2.5 px-3 text-right">Asset Retail</th>
                  <th className="py-2.5 px-3 text-right">Receipt Sales</th>
                  <th className="py-2.5 px-3 text-right">Sales COGS</th>
                  <th className="py-2.5 px-3 text-right">Margin %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {categoryAnalyses.map((cat) => {
                  const catSalesProfit = cat.salesVolume - cat.cogs;
                  const catSalesMargin = cat.salesVolume > 0 ? catSalesProfit / cat.salesVolume : 0;
                  return (
                    <tr key={cat.name} className="hover:bg-slate-50/50">
                      <td className="py-3 px-3 font-semibold text-slate-700">{cat.name}</td>
                      <td className="py-3 px-3 text-right font-mono text-slate-500">
                        {currencyFormatter.format(cat.costValue)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-slate-600">
                        {currencyFormatter.format(cat.retailValue)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-indigo-600 font-semibold">
                        {currencyFormatter.format(cat.salesVolume)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-slate-400">
                        {currencyFormatter.format(cat.cogs)}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <span className={`px-1.5 py-0.5 rounded font-mono font-medium text-[10px] ${
                          catSalesMargin > 0 ? 'text-emerald-700 bg-emerald-50' : 'text-slate-400 bg-slate-100'
                        }`}>
                          {cat.salesVolume > 0 ? percentFormatter.format(catSalesMargin) : '—'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Profitable Products */}
        <div className="bg-white rounded-xl border border-slate-100 p-5 shadow-sm space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 font-sans tracking-tight flex items-center gap-1.5">
              <Package size={16} className="text-emerald-600" />
              Highest Gross Profit Contributions
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              A list of top inventory listings ranked by cumulative gross profits (realized through sales and upcoming potential).
            </p>
          </div>

          <div className="space-y-3">
            {topProfitableProducts.map(({ item, unitProfit, profitRate, totalQtySold, realizedProfit, potentialProfit }) => {
              const displayProfit = realizedProfit > 0 ? realizedProfit : potentialProfit;
              const isRealized = realizedProfit > 0;
              
              return (
                <div key={item.id} className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex items-center justify-between gap-4">
                  <div className="min-w-0 space-y-0.5">
                    <p className="text-xs font-bold text-slate-800 truncate">{item.name}</p>
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono">
                      <span>{item.sku}</span>
                      <span>•</span>
                      <span>Acq: {currencyFormatter.format(item.cost || 0)}</span>
                      <span>•</span>
                      <span>Rtl: {currencyFormatter.format(item.price)}</span>
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0 space-y-1">
                    <p className={`text-xs font-bold font-mono ${isRealized ? 'text-emerald-600' : 'text-slate-600'}`}>
                      {currencyFormatter.format(displayProfit)}
                    </p>
                    <div className="flex items-center justify-end gap-1 text-[9px]">
                      {isRealized ? (
                        <span className="text-[9px] font-semibold text-emerald-700 bg-emerald-50 px-1 border border-emerald-100 rounded">
                          {totalQtySold} sold
                        </span>
                      ) : (
                        <span className="text-slate-400">
                          {item.stock} in stock
                        </span>
                      )}
                      <span className="text-slate-400 font-mono">({percentFormatter.format(profitRate)} margin)</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* QUICK EXPLANATIONS CAROUSEL */}
      <div className="bg-indigo-50/40 border border-indigo-100/50 rounded-xl p-5 flex flex-col md:flex-row gap-4 items-start">
        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg shrink-0 mt-0.5">
          <Info size={18} />
        </div>
        <div className="space-y-1 text-xs text-slate-600 font-sans">
          <p className="font-bold text-slate-800 flex items-center gap-1">
            Accounting Formula Definitions
          </p>
          <ul className="list-disc pl-4 space-y-1.5 mt-2 text-[11px] leading-relaxed">
            <li>
              <strong>Asset Evaluation (Retail):</strong> Derived as the product of all catalog stock quantities multiplied by their active retail prices. Represented as potential cash inflow.
            </li>
            <li>
              <strong>Asset Cost Evaluation (Capital):</strong> Calculated by taking current stock levels and multiplying by acquisition costs. Represents locked cash value of resources.
            </li>
            <li>
              <strong>Sales Volume:</strong> The total net monetary value of finalized customers' purchases (net of sales surcharge output VAT tax liability).
            </li>
            <li>
              <strong>Cost of Sales (COGS):</strong> The direct logistical acquisition expenses incurred in procuring items that have been successfully sold to customers.
            </li>
            <li>
              <strong>Sales Profit & Margin:</strong> Expresses capital earnings (Revenue minus Costs) in absolute terms and as a percentage index from direct sales streams. High indexes denote superior capital efficiencies.
            </li>
          </ul>
        </div>
      </div>

    </div>
  );
}
