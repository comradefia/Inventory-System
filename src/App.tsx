/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Layers, 
  PackagePlus, 
  ClipboardList, 
  Database, 
  AlertTriangle, 
  X, 
  CheckCircle2, 
  ShieldAlert,
  Info,
  Tag,
  ShoppingCart,
  Receipt,
  BarChart3
} from 'lucide-react';
import { InventoryItem, TransactionLog, FilterOptions, SaleReceipt } from './types';
import { INITIAL_ITEMS, INITIAL_LOGS, PRESET_CATEGORIES, INITIAL_RECEIPTS } from './sampleData';
import { DashboardStats } from './components/DashboardStats';
import { InventoryTable } from './components/InventoryTable';
import { TransactionHistory } from './components/TransactionHistory';
import { ItemForm } from './components/ItemForm';
import { ImportExport } from './components/ImportExport';
import { CategoryManager } from './components/CategoryManager';
import { SalesManager } from './components/SalesManager';
import { ReceiptsManager } from './components/ReceiptsManager';
import { FinanceDashboard } from './components/FinanceDashboard';

const STORAGE_KEYS = {
  ITEMS: 'inventory_app_items_v1',
  LOGS: 'inventory_app_logs_v1',
  CATEGORIES: 'inventory_app_categories_v1',
  RECEIPTS: 'inventory_app_receipts_v1'
};

export default function App() {
  // --- STATE ---
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [logs, setLogs] = useState<TransactionLog[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [receipts, setReceipts] = useState<SaleReceipt[]>([]);
  
  // Tab views: 'dashboard', 'catalog', 'audit', 'integration', 'categories', 'sales', 'receipts'
  const [activeTab, setActiveTab] = useState<'dashboard' | 'catalog' | 'audit' | 'integration' | 'categories' | 'sales' | 'receipts'>('dashboard');
  
  // Form modal triggers
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | undefined>(undefined);
  
  // Notification logs toast banners
  const [toast, setToast] = useState<{ type: 'success' | 'info' | 'error'; text: string } | null>(null);

  // Filters State
  const [filters, setFilters] = useState<FilterOptions>({
    search: '',
    category: 'all',
    stockStatus: 'all',
    sortBy: 'updatedAt',
    sortOrder: 'desc'
  });

  // Timed auto-dismiss for toasts
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Quick-focused SKU state for movement logs
  const [focusedLogSku, setFocusedLogSku] = useState<string | undefined>(undefined);

  // --- INITIALIZATION (LOCALSTORAGE LOAD) ---
  useEffect(() => {
    try {
      const storedItems = localStorage.getItem(STORAGE_KEYS.ITEMS);
      const storedLogs = localStorage.getItem(STORAGE_KEYS.LOGS);
      const storedCategories = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
      const storedReceipts = localStorage.getItem(STORAGE_KEYS.RECEIPTS);

      if (storedItems) {
        setItems(JSON.parse(storedItems));
      } else {
        // First-run: hydrate with lush sample items
        setItems(INITIAL_ITEMS);
        localStorage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify(INITIAL_ITEMS));
      }

      if (storedLogs) {
        setLogs(JSON.parse(storedLogs));
      } else {
        // First-run: hydrate with history logs
        setLogs(INITIAL_LOGS);
        localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(INITIAL_LOGS));
      }

      if (storedCategories) {
        setCategories(JSON.parse(storedCategories));
      } else {
        // First-run: hydrate with preset categories
        setCategories(PRESET_CATEGORIES);
        localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(PRESET_CATEGORIES));
      }

      if (storedReceipts) {
        setReceipts(JSON.parse(storedReceipts));
      } else {
        setReceipts(INITIAL_RECEIPTS);
        localStorage.setItem(STORAGE_KEYS.RECEIPTS, JSON.stringify(INITIAL_RECEIPTS));
      }
    } catch (e) {
      showToast('error', 'Browser storage failed to initialize. Reverting to session state.');
      setItems(INITIAL_ITEMS);
      setLogs(INITIAL_LOGS);
      setCategories(PRESET_CATEGORIES);
      setReceipts(INITIAL_RECEIPTS);
    }
  }, []);

  // --- PERSISTENCE SYNCS ---
  const saveStateToStorage = (
    updatedItems: InventoryItem[],
    updatedLogs: TransactionLog[],
    updatedCategories?: string[],
    updatedReceipts?: SaleReceipt[]
  ) => {
    try {
      localStorage.setItem(STORAGE_KEYS.ITEMS, JSON.stringify(updatedItems));
      localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(updatedLogs));
      localStorage.setItem(
        STORAGE_KEYS.CATEGORIES,
        JSON.stringify(updatedCategories || categories)
      );
      localStorage.setItem(
        STORAGE_KEYS.RECEIPTS,
        JSON.stringify(updatedReceipts || receipts)
      );
    } catch (e) {
      showToast('error', 'Storage exceeds quota limit. Image uploads may be too large.');
    }
  };

  const showToast = (type: 'success' | 'info' | 'error', text: string) => {
    setToast({ type, text });
  };

  // --- BUSINESS LOGIC ---

  // 1. Create/Add product item
  const handleCreateItem = (itemData: Omit<InventoryItem, 'createdAt' | 'updatedAt'>) => {
    // Duplicate SKU check (double guard check)
    if (items.some(x => x.sku.toUpperCase() === itemData.sku.toUpperCase())) {
      showToast('error', `SKU identifier '${itemData.sku}' already assigned to another catalog tier.`);
      return;
    }

    const isoNow = new Date().toISOString();
    const newItem: InventoryItem = {
      ...itemData,
      createdAt: isoNow,
      updatedAt: isoNow
    };

    const newItems = [newItem, ...items];
    
    // Log creation movement
    const logId = `tx-${Date.now()}`;
    const newLog: TransactionLog = {
      id: logId,
      itemId: newItem.id,
      itemName: newItem.name,
      sku: newItem.sku,
      type: 'CREATE',
      quantityChange: newItem.stock,
      newStock: newItem.stock,
      reason: `Catalog initial intake. ${newItem.stock} units recorded at base pricing of $${newItem.price.toFixed(2)}.`,
      timestamp: isoNow
    };

    const newLogs = [newLog, ...logs];

    setItems(newItems);
    setLogs(newLogs);
    saveStateToStorage(newItems, newLogs);
    setIsFormOpen(false);
    showToast('success', `Productized SKU [${newItem.sku}] successfully uploaded.`);
  };

  // 2. Select edit and configure properties
  const handleTriggerEdit = (item: InventoryItem) => {
    setEditingItem(item);
    setIsFormOpen(true);
  };

  const handleUpdateItem = (itemData: Omit<InventoryItem, 'createdAt' | 'updatedAt'>) => {
    const originalItem = items.find(x => x.id === itemData.id);
    if (!originalItem) return;

    const isoNow = new Date().toISOString();
    const updatedItem: InventoryItem = {
      ...originalItem,
      ...itemData,
      updatedAt: isoNow
    };

    // Calculate changes for transactional reasoning audit trail
    const updatedItemsList = items.map(x => x.id === itemData.id ? updatedItem : x);
    const auditNotes: string[] = [];
    
    if (originalItem.name !== updatedItem.name) auditNotes.push(`Name altered from "${originalItem.name}"`);
    if (originalItem.sku !== updatedItem.sku) auditNotes.push(`SKU key renamed from "${originalItem.sku}" to "${updatedItem.sku}"`);
    if (originalItem.price !== updatedItem.price) auditNotes.push(`Price adjusted from $${originalItem.price.toFixed(2)} to $${updatedItem.price.toFixed(2)}`);
    
    const oldCost = originalItem.cost !== undefined ? originalItem.cost : 0;
    const newCost = updatedItem.cost !== undefined ? updatedItem.cost : 0;
    if (oldCost !== newCost) {
      auditNotes.push(`Cost changed from $${oldCost.toFixed(2)} to $${newCost.toFixed(2)}`);
    }
    
    if (originalItem.category !== updatedItem.category) auditNotes.push(`Reassigned category from [${originalItem.category}] to [${updatedItem.category}]`);
    
    // Check if stock was modified manually via form
    const stockChange = updatedItem.stock - originalItem.stock;
    if (stockChange !== 0) {
      auditNotes.push(`Stock level forcefully updated by ${stockChange > 0 ? '+' : ''}${stockChange}`);
    }

    const logId = `tx-${Date.now()}`;
    const newLog: TransactionLog = {
      id: logId,
      itemId: updatedItem.id,
      itemName: updatedItem.name,
      sku: updatedItem.sku,
      type: stockChange !== 0 ? 'STOCKTAKE' : 'UPDATE',
      quantityChange: stockChange,
      newStock: updatedItem.stock,
      reason: `Properties modified: ${auditNotes.join(', ') || 'No pricing/critical attributes changed'}.`,
      timestamp: isoNow
    };

    const newLogs = [newLog, ...logs];

    setItems(updatedItemsList);
    setLogs(newLogs);
    saveStateToStorage(updatedItemsList, newLogs);
    setIsFormOpen(false);
    setEditingItem(undefined);
    showToast('success', `Product [${updatedItem.sku}] changes recorded successfully.`);
  };

  // 3. Delete SKU and related listing
  const handleDeleteItem = (id: string) => {
    const target = items.find(x => x.id === id);
    if (!target) return;

    if (!window.confirm(`Are you sure you want to permanently discard the catalog entry for: ${target.name}? This action cannot be reversed.`)) {
      return;
    }

    const remainingItems = items.filter(x => x.id !== id);
    const isoNow = new Date().toISOString();

    const logId = `tx-${Date.now()}`;
    const deleteLog: TransactionLog = {
      id: logId,
      itemId: target.id,
      itemName: target.name,
      sku: target.sku,
      type: 'REMOVE',
      quantityChange: -target.stock,
      newStock: 0,
      reason: `Product listing purged. Final available stock of ${target.stock} units written out of books.`,
      timestamp: isoNow
    };

    const updatedLogs = [deleteLog, ...logs];

    setItems(remainingItems);
    setLogs(updatedLogs);
    saveStateToStorage(remainingItems, updatedLogs);
    showToast('info', `Successfully removed product SKU [${target.sku}] from records.`);
  };

  // 4. Quick +/- Inline quantities action log
  const handleAdjustStock = (itemId: string, change: number, auditingReason: string) => {
    const originalItem = items.find(x => x.id === itemId);
    if (!originalItem) return;

    const resultantStock = Math.max(0, originalItem.stock + change);
    const actualChangeQuantity = resultantStock - originalItem.stock;

    if (actualChangeQuantity === 0 && change < 0) {
      showToast('error', 'Unable to deduct: stock level is already flat zero.');
      return;
    }

    const isoNow = new Date().toISOString();
    const updatedItem: InventoryItem = {
      ...originalItem,
      stock: resultantStock,
      updatedAt: isoNow
    };

    const updatedItemsList = items.map(x => x.id === itemId ? updatedItem : x);
    const logId = `tx-${Date.now()}`;
    const restockLog: TransactionLog = {
      id: logId,
      itemId: originalItem.id,
      itemName: originalItem.name,
      sku: originalItem.sku,
      type: actualChangeQuantity > 0 ? 'ADD' : 'REMOVE',
      quantityChange: actualChangeQuantity,
      newStock: resultantStock,
      reason: auditingReason,
      timestamp: isoNow
    };

    const updatedLogs = [restockLog, ...logs];

    setItems(updatedItemsList);
    setLogs(updatedLogs);
    saveStateToStorage(updatedItemsList, updatedLogs);
    showToast('success', `Stock level for [${originalItem.sku}] adjusted from ${originalItem.stock} to ${resultantStock}.`);
  };

  // 5. Purge history audit logs
  const handleClearHistoryLogs = () => {
    if (!window.confirm('Are you sure you want to clean up the activity logs list? This action will purge all structural movement ledger entries.')) {
      return;
    }
    const emptyLogs: TransactionLog[] = [];
    setLogs(emptyLogs);
    saveStateToStorage(items, emptyLogs);
    showToast('info', 'Transactional logs purged successfully.');
  };

  // 6. Restore demo parameters
  const handleTriggerRebootSandbox = () => {
    if (!window.confirm('Reset catalog sandbox? Your customized changes will be overwritten by original seed files.')) {
      return;
    }
    setItems(INITIAL_ITEMS);
    setLogs(INITIAL_LOGS);
    setCategories(PRESET_CATEGORIES);
    setReceipts(INITIAL_RECEIPTS);
    setFocusedLogSku(undefined);
    saveStateToStorage(INITIAL_ITEMS, INITIAL_LOGS, PRESET_CATEGORIES, INITIAL_RECEIPTS);
    showToast('success', 'Sandbox replenished. Mock items, logs and receipts seeded.');
  };

  const handleClearReceipts = () => {
    if (!window.confirm('Are you sure you want to delete all archived sales receipts?')) {
      return;
    }
    setReceipts([]);
    saveStateToStorage(items, logs, categories, []);
    showToast('info', 'Sales receipts archive has been cleared.');
  };

  // 7. Recover from JSON backup import
  const handleImportJsonBackup = (
    importedItems: InventoryItem[],
    importedLogs: TransactionLog[],
    importedCategories?: string[]
  ) => {
    setItems(importedItems);
    setLogs(importedLogs);
    
    let finalCategories = categories;
    if (importedCategories && importedCategories.length > 0) {
      const merged = Array.from(new Set([...importedCategories, ...categories]));
      finalCategories = merged;
      setCategories(merged);
    }
    
    saveStateToStorage(importedItems, importedLogs, finalCategories);
    showToast('success', `Data recovered: database backup restored successfully.`);
  };

  // 8. Custom Category Handlers
  const handleAddCategory = (name: string): boolean => {
    const trimmed = name.trim();
    if (!trimmed) return false;
    
    if (categories.some(cat => cat.toLowerCase() === trimmed.toLowerCase())) {
      showToast('error', `A category named "${trimmed}" already exists.`);
      return false;
    }

    const updatedCategories = [...categories, trimmed];
    setCategories(updatedCategories);
    saveStateToStorage(items, logs, updatedCategories);
    showToast('success', `Category "${trimmed}" successfully created.`);
    return true;
  };

  const handleRenameCategory = (oldName: string, newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed || oldName.toLowerCase() === 'other') return;

    const updatedCategories = categories.map(cat => 
      cat.toLowerCase() === oldName.toLowerCase() ? trimmed : cat
    );

    const updatedItems = items.map(item => {
      if (item.category.toLowerCase() === oldName.toLowerCase()) {
        return {
          ...item,
          category: trimmed,
          updatedAt: new Date().toISOString()
        };
      }
      return item;
    });

    const isoNow = new Date().toISOString();
    const affectedCount = items.filter(item => item.category.toLowerCase() === oldName.toLowerCase()).length;
    let updatedLogs = [...logs];

    if (affectedCount > 0) {
      const logId = `tx-${Date.now()}`;
      const renameLog: TransactionLog = {
        id: logId,
        itemId: 'category-system',
        itemName: `Rename: "${oldName}" → "${trimmed}"`,
        sku: 'SYSTEM-CAT',
        type: 'UPDATE',
        quantityChange: 0,
        newStock: 0,
        reason: `System classification change: Reclassified ${affectedCount} items from "${oldName}" category to "${trimmed}".`,
        timestamp: isoNow
      };
      updatedLogs = [renameLog, ...logs];
    }

    setCategories(updatedCategories);
    setItems(updatedItems);
    setLogs(updatedLogs);
    saveStateToStorage(updatedItems, updatedLogs, updatedCategories);
    showToast('success', `Successfully renamed category to "${trimmed}".`);
  };

  const handleDeleteCategory = (catName: string) => {
    if (catName.toLowerCase() === 'other') return;

    const updatedCategories = categories.filter(cat => cat.toLowerCase() !== catName.toLowerCase());

    const updatedItems = items.map(item => {
      if (item.category.toLowerCase() === catName.toLowerCase()) {
        return {
          ...item,
          category: 'Other',
          updatedAt: new Date().toISOString()
        };
      }
      return item;
    });

    const isoNow = new Date().toISOString();
    const affectedCount = items.filter(item => item.category.toLowerCase() === catName.toLowerCase()).length;
    let updatedLogs = [...logs];

    if (affectedCount > 0) {
      const logId = `tx-${Date.now()}`;
      const deleteLog: TransactionLog = {
        id: logId,
        itemId: 'category-system',
        itemName: `Deleted Category: "${catName}"`,
        sku: 'SYSTEM-CAT',
        type: 'UPDATE',
        quantityChange: 0,
        newStock: 0,
        reason: `System database optimization: Purged category "${catName}" and reassigned its ${affectedCount} active items to "Other" tag.`,
        timestamp: isoNow
      };
      updatedLogs = [deleteLog, ...logs];
    }

    setCategories(updatedCategories);
    setItems(updatedItems);
    setLogs(updatedLogs);
    saveStateToStorage(updatedItems, updatedLogs, updatedCategories);
    showToast('info', `Category "${catName}" deleted. ${affectedCount} items reassigned to "Other".`);
  };

  // 9. Records Sales dispatch transaction in batch
  const handleRecordSale = (
    cart: { itemId: string; quantity: number; soldPrice: number }[],
    customerName: string,
    notes: string,
    invoiceRef: string,
    vatPercent: number
  ) => {
    const isoNow = new Date().toISOString();
    let updatedLogs = [...logs];

    // Determine updated item entries mapping
    const updatedItems = items.map(item => {
      const saleLineItem = cart.find(c => c.itemId === item.id);
      if (saleLineItem) {
        const remainingStock = Math.max(0, item.stock - saleLineItem.quantity);
        
        // Log individual item sales reduction in ledger
        const logId = `tx-${Date.now()}-${item.id}`;
        const saleLog: TransactionLog = {
          id: logId,
          itemId: item.id,
          itemName: item.name,
          sku: item.sku,
          type: 'REMOVE',
          quantityChange: -saleLineItem.quantity,
          newStock: remainingStock,
          reason: `Sale Dispatched (Receipt Ref: ${invoiceRef}). Sold ${saleLineItem.quantity} qty to "${customerName}" for $${saleLineItem.soldPrice.toFixed(2)}/unit. ${notes ? 'Notes: ' + notes : ''}`,
          timestamp: isoNow
        };
        updatedLogs = [saleLog, ...updatedLogs];

        return {
          ...item,
          stock: remainingStock,
          updatedAt: isoNow
        };
      }
      return item;
    });

    // Create a detailed sales invoice receipt
    const receiptItems = cart.map(c => {
      const match = items.find(i => i.id === c.itemId);
      return {
        itemId: c.itemId,
        itemName: match ? match.name : 'Unknown Product',
        sku: match ? match.sku : 'SKU-UNKNOWN',
        quantity: c.quantity,
        soldPrice: c.soldPrice
      };
    });

    const subtotal = cart.reduce((sum, c) => sum + (c.quantity * c.soldPrice), 0);
    const taxAmount = subtotal * (vatPercent / 100);
    const finalTotal = subtotal + taxAmount;

    const newReceipt: SaleReceipt = {
      id: `rcpt-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      invoiceRef,
      customerName: customerName || 'Walk-in Customer',
      notes,
      vatPercent,
      subtotal,
      taxAmount,
      finalTotal,
      items: receiptItems,
      timestamp: isoNow
    };

    const updatedReceipts = [newReceipt, ...receipts];

    setItems(updatedItems);
    setLogs(updatedLogs);
    setReceipts(updatedReceipts);
    saveStateToStorage(updatedItems, updatedLogs, categories, updatedReceipts);
    showToast('success', `Sale registered completely! Invoice ${invoiceRef} recorded.`);
  };

  // --- DERIVED METRICS ---
  const criticalLowAlerts = useMemo(() => {
    return items.filter(x => x.stock > 0 && x.stock <= x.minThreshold);
  }, [items]);

  const absoluteDepletedAlerts = useMemo(() => {
    return items.filter(x => x.stock <= 0);
  }, [items]);

  // View timeline helper to redirect tab to logs with filter
  const handleViewLedgerForSku = (sku: string) => {
    setFocusedLogSku(sku);
    setActiveTab('audit');
  };

  // Dynamic SKU Capacity for Geometric Balance Sidebar
  const skuCount = items.length;
  const maxCapacity = 100;
  const capacityPercentage = Math.min(100, Math.round((skuCount / maxCapacity) * 100));

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col antialiased">
      
      {/* GLOBAL TOAST FLOATER */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce max-w-sm">
          <div className={`p-4 rounded-lg border shadow-lg flex items-start gap-3 ${
            toast.type === 'success' 
              ? 'bg-emerald-900 border-emerald-800 text-white' 
              : toast.type === 'error'
              ? 'bg-rose-900 border-rose-800 text-white'
              : 'bg-indigo-900 border-indigo-800 text-white'
          }`}>
            <span className="mt-0.5 font-bold">
              {toast.type === 'success' ? '✓' : toast.type === 'error' ? '✖' : 'ℹ'}
            </span>
            <div className="flex-1">
              <p className="text-xs font-sans font-medium leading-relaxed">{toast.text}</p>
            </div>
            <button 
              onClick={() => setToast(null)} 
              className="text-white/60 hover:text-white p-0.5 hover:bg-white/10 rounded"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* TOP HEADER STATUS / BRANDING */}
      <header className="h-16 flex items-center justify-between px-6 bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-sm flex items-center justify-center text-white font-bold select-none text-sm">
            S
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-xs tracking-[0.2em] text-slate-800 uppercase leading-none">Stockyard</span>
            <span className="text-[9px] text-slate-400 font-mono mt-1 tracking-wider uppercase leading-none">Solutions Board</span>
          </div>
        </div>

        {/* User Profile Info */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex flex-col text-right">
            <span className="text-xs font-semibold text-slate-800 leading-none">Firas Alahmad</span>
            <span className="text-[9px] text-slate-400 font-mono mt-0.5">alahmad.firas@gmail.com</span>
          </div>
          <div className="w-8 h-8 rounded-sm bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-xs border border-slate-200 select-none">
            FA
          </div>
        </div>
      </header>

      {/* DUAL-PANE BODY */}
      <div className="flex flex-1 flex-col md:flex-row">
        
        {/* PERSISTENT GEOMETRIC SIDEBAR */}
        <aside className="w-full md:w-64 border-b md:border-b-0 md:border-r border-slate-200 bg-white flex flex-col justify-between p-6 shrink-0 gap-6">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">
                Navigation Workspace
              </span>
              <nav className="flex flex-col gap-1">
                <button
                  onClick={() => {
                    setActiveTab('dashboard');
                  }}
                  className={`flex items-center gap-3 px-4 py-3 rounded-md transition-colors text-xs font-semibold select-none cursor-pointer ${
                    activeTab === 'dashboard'
                      ? 'bg-indigo-50 text-indigo-700 border border-indigo-100/50'
                      : 'text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  <BarChart3 size={15} />
                  <span>Finance Dashboard</span>
                </button>

                <button
                  onClick={() => {
                    setActiveTab('catalog');
                    setFocusedLogSku(undefined);
                  }}
                  className={`flex items-center gap-3 px-4 py-3 rounded-md transition-colors text-xs font-semibold select-none cursor-pointer ${
                    activeTab === 'catalog'
                      ? 'bg-indigo-50 text-indigo-700 border border-indigo-100/50'
                      : 'text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  <Layers size={15} />
                  <span>Catalogue Listing</span>
                </button>

                <button
                  onClick={() => {
                    setActiveTab('sales');
                  }}
                  className={`flex items-center justify-between px-4 py-3 rounded-md transition-colors text-xs font-semibold select-none cursor-pointer ${
                    activeTab === 'sales'
                      ? 'bg-indigo-50 text-indigo-700 border border-indigo-100/50'
                      : 'text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <ShoppingCart size={15} />
                    <span>Submit Sales</span>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setActiveTab('receipts');
                  }}
                  className={`flex items-center justify-between px-4 py-3 rounded-md transition-colors text-xs font-semibold select-none cursor-pointer ${
                    activeTab === 'receipts'
                      ? 'bg-indigo-50 text-indigo-700 border border-indigo-100/50'
                      : 'text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Receipt size={15} />
                    <span>Sales Receipts</span>
                  </div>
                  {receipts.length > 0 && (
                    <span className="px-1.5 py-0.5 bg-indigo-100 text-indigo-700 text-[10px] font-mono font-bold rounded">
                      {receipts.length}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => {
                    setActiveTab('categories');
                  }}
                  className={`flex items-center justify-between px-4 py-3 rounded-md transition-colors text-xs font-semibold select-none cursor-pointer ${
                    activeTab === 'categories'
                      ? 'bg-indigo-50 text-indigo-700 border border-indigo-100/50'
                      : 'text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Tag size={15} />
                    <span>Manage Categories</span>
                  </div>
                  {categories.length > 0 && (
                    <span className="px-1.5 py-0.5 bg-indigo-100 text-indigo-700 text-[10px] font-mono font-bold rounded">
                      {categories.length}
                    </span>
                  )}
                </button>
                
                <button
                  onClick={() => {
                    setActiveTab('audit');
                  }}
                  className={`flex items-center justify-between px-4 py-3 rounded-md transition-colors text-xs font-semibold select-none cursor-pointer ${
                    activeTab === 'audit'
                      ? 'bg-indigo-50 text-indigo-700 border border-indigo-100/50'
                      : 'text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <ClipboardList size={15} />
                    <span>Ledger Logs</span>
                  </div>
                  {logs.length > 0 && (
                    <span className="px-1.5 py-0.5 bg-indigo-100 text-indigo-700 text-[10px] font-mono font-bold rounded">
                      {logs.length}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => {
                    setActiveTab('integration');
                  }}
                  className={`flex items-center gap-3 px-4 py-3 rounded-md transition-colors text-xs font-semibold select-none cursor-pointer ${
                    activeTab === 'integration'
                      ? 'bg-indigo-50 text-indigo-700 border border-indigo-100/50'
                      : 'text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  <Database size={15} />
                  <span>Integration Panel</span>
                </button>
              </nav>
            </div>
          </div>

          {/* Bottom Active Limits Metadata box */}
          <div className="mt-auto pt-6 border-t border-slate-100">
            <div className="bg-slate-900 text-white p-4 rounded-lg">
              <p className="text-[9px] uppercase tracking-wider text-slate-400 mb-1">Stockyard limits</p>
              <p className="text-sm font-bold">Standard Tier</p>
              <div className="w-full bg-white/20 h-1 mt-3 rounded-full overflow-hidden">
                <div 
                  className="bg-indigo-500 h-full transition-all duration-500" 
                  style={{ width: `${capacityPercentage}%` }}
                ></div>
              </div>
              <div className="flex justify-between items-center text-[10px] mt-2 text-slate-400 font-mono">
                <span>{skuCount} / {maxCapacity} SKUs</span>
                <span>{capacityPercentage}%</span>
              </div>
            </div>
          </div>
        </aside>

        {/* MAIN DISPLAY VIEWPORT */}
        <main className="flex-1 bg-slate-50 p-6 md:p-8 flex flex-col gap-6 overflow-y-auto">
          
          {/* SYSTEM ALERT BAR (EMBEDDED GEOMETRAC STYLE) */}
          {(criticalLowAlerts.length > 0 || absoluteDepletedAlerts.length > 0) && activeTab === 'catalog' && (
            <section 
              aria-label="System Warnings" 
              id="alerts-banner" 
              className="bg-amber-50/80 border border-amber-200/60 p-4 rounded-lg text-xs text-amber-900 font-sans flex flex-col sm:flex-row items-center justify-between gap-4"
            >
              <div className="flex items-center gap-2.5">
                <ShieldAlert size={16} className="text-amber-600 flex-shrink-0 animate-pulse" />
                <span>
                  <strong>Inventory Warning:</strong> We detected{' '}
                  {absoluteDepletedAlerts.length > 0 && (
                    <span className="font-semibold text-red-700">{absoluteDepletedAlerts.length} stockout levels </span>
                  )}
                  {absoluteDepletedAlerts.length > 0 && criticalLowAlerts.length > 0 && 'and '}
                  {criticalLowAlerts.length > 0 && (
                    <span className="font-semibold text-amber-700">{criticalLowAlerts.length} low safety levels</span>
                  )}
                  ; stock allocation is running thinner than safety margins.
                </span>
              </div>
              
              <button
                onClick={() => setFilters({
                  ...filters,
                  stockStatus: absoluteDepletedAlerts.length > 0 ? 'out' : 'low'
                })}
                className="px-3 py-1.5 bg-white hover:bg-amber-100/30 border border-amber-200 rounded text-[11px] text-amber-800 transition-colors cursor-pointer font-semibold whitespace-nowrap"
              >
                Examine Weak SKUs
              </button>
            </section>
          )}

          {/* TAB CONTENT: FINANCIAL ANALYTICS DASHBOARD */}
          {activeTab === 'dashboard' && (
            <div className="animate-fade-in">
              <FinanceDashboard
                items={items}
                receipts={receipts}
              />
            </div>
          )}

          {/* TAB CONTENT: CATALOGUE */}
          {activeTab === 'catalog' && (
            <div className="flex flex-col gap-6 animate-fade-in">
              
              {/* Stats bento rows */}
              <DashboardStats items={items} />

              {/* Grid Header Controls */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900 tracking-tight">Inventory Catalog Board</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Manage, adjust, search, and update details regarding item components.</p>
                </div>

                {!isFormOpen && (
                  <button
                    id="add-item-btn"
                    onClick={() => {
                      setEditingItem(undefined);
                      setIsFormOpen(true);
                    }}
                    className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded transition-all active:scale-[0.98] cursor-pointer flex items-center gap-1.5 w-full sm:w-auto justify-center shadow-xs"
                  >
                    <PackagePlus size={15} />
                    Add New SKU List
                  </button>
                )}
              </div>

              {/* Upload Item Custom Modal (Geometric styled box) */}
              {isFormOpen && (
                <div className="border border-indigo-100 bg-white p-1 rounded-lg shadow-sm">
                  <ItemForm
                    key={editingItem?.id || 'new'}
                    initialItem={editingItem}
                    existingItems={items}
                    categories={categories}
                    onSubmit={(item) => {
                      if (editingItem) {
                        handleUpdateItem(item);
                      } else {
                        handleCreateItem(item);
                      }
                    }}
                    onCancel={() => {
                      setIsFormOpen(false);
                      setEditingItem(undefined);
                    }}
                  />
                </div>
              )}

              {/* Master Inventory Listing Grid */}
              <InventoryTable
                items={items}
                categories={categories}
                filters={filters}
                setFilters={setFilters}
                onEditItem={handleTriggerEdit}
                onDeleteItem={handleDeleteItem}
                onAdjustStock={handleAdjustStock}
                onViewHistory={handleViewLedgerForSku}
              />
            </div>
          )}

          {/* TAB CONTENT: CATEGORIES WORKSPACE */}
          {activeTab === 'categories' && (
            <div className="animate-fade-in">
              <CategoryManager
                categories={categories}
                items={items}
                onAddCategory={handleAddCategory}
                onRenameCategory={handleRenameCategory}
                onDeleteCategory={handleDeleteCategory}
              />
            </div>
          )}

          {/* TAB CONTENT: SALES DISPATCH PORTAL */}
          {activeTab === 'sales' && (
            <div className="animate-fade-in">
              <SalesManager
                items={items}
                onSubmitSale={handleRecordSale}
              />
            </div>
          )}

          {/* TAB CONTENT: SALES RECEIPTS ARCHIVE */}
          {activeTab === 'receipts' && (
            <div className="animate-fade-in">
              <ReceiptsManager
                receipts={receipts}
                onClearReceipts={handleClearReceipts}
              />
            </div>
          )}

          {/* TAB CONTENT: LEDGER LOGS */}
          {activeTab === 'audit' && (
            <div className="animate-fade-in">
              <TransactionHistory
                logs={logs}
                onClearLogs={handleClearHistoryLogs}
                selectedFilterSku={focusedLogSku}
                onClearSelectedSkuFilter={() => setFocusedLogSku(undefined)}
              />
            </div>
          )}

          {/* TAB CONTENT: INTEGRATION PANEL */}
          {activeTab === 'integration' && (
            <div className="animate-fade-in">
              <ImportExport
                items={items}
                logs={logs}
                categories={categories}
                onImportData={handleImportJsonBackup}
                onResetDemo={handleTriggerRebootSandbox}
              />
            </div>
          )}

          {/* Footer embedded cleanly inside viewport */}
          <footer className="mt-auto pt-8 pb-3 border-t border-slate-200">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-400 font-mono">
              <div className="flex items-center gap-1.5">
                <Info size={13} className="text-slate-300" />
                <span>Operational system loaded successfully • Session tracking active.</span>
              </div>
              <div>
                <span>Stockyard Solutions &copy; 2026</span>
              </div>
            </div>
          </footer>

        </main>
      </div>

    </div>
  );
}
