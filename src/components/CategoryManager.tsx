/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Tag, Plus, Edit2, Trash2, Check, X, AlertTriangle, HelpCircle, Inbox } from 'lucide-react';
import { InventoryItem } from '../types';

interface CategoryManagerProps {
  categories: string[];
  items: InventoryItem[];
  onAddCategory: (name: string) => boolean; // returns true if successful
  onRenameCategory: (oldName: string, newName: string) => void;
  onDeleteCategory: (name: string) => void;
}

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

export function CategoryManager({
  categories,
  items,
  onAddCategory,
  onRenameCategory,
  onDeleteCategory
}: CategoryManagerProps) {
  const [newCatName, setNewCatName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Editing state
  const [editingCat, setEditingCat] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const [editingError, setEditingError] = useState('');

  // Delete modal state
  const [deletingCat, setDeletingCat] = useState<string | null>(null);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const trimmed = newCatName.trim();
    if (!trimmed) {
      setError('Category name cannot be blank.');
      return;
    }

    if (trimmed.toLowerCase() === 'all') {
      setError('"All" is a system-reserved filter keyword.');
      return;
    }

    // Check if duplicate
    const isDuplicate = categories.some(cat => cat.toLowerCase() === trimmed.toLowerCase());
    if (isDuplicate) {
      setError(`Category "${trimmed}" already exists.`);
      return;
    }

    const added = onAddCategory(trimmed);
    if (added) {
      setSuccess(`Category "${trimmed}" created successfully!`);
      setNewCatName('');
      setTimeout(() => setSuccess(''), 3000);
    } else {
      setError('Failed to create category.');
    }
  };

  const startRename = (catName: string) => {
    if (catName.toLowerCase() === 'other') {
      alert('"Other" is a system-reserved fallback category and cannot be renamed.');
      return;
    }
    setEditingCat(catName);
    setEditingValue(catName);
    setEditingError('');
  };

  const handleRenameSubmit = (oldName: string) => {
    setEditingError('');
    const trimmed = editingValue.trim();
    if (!trimmed) {
      setEditingError('Name cannot be blank.');
      return;
    }

    if (trimmed.toLowerCase() === oldName.toLowerCase()) {
      setEditingCat(null);
      return;
    }

    if (trimmed.toLowerCase() === 'all') {
      setEditingError('"All" is system-reserved.');
      return;
    }

    const isDuplicate = categories.some(cat => cat.toLowerCase() === trimmed.toLowerCase() && cat.toLowerCase() !== oldName.toLowerCase());
    if (isDuplicate) {
      setEditingError(`Category "${trimmed}" already exists.`);
      return;
    }

    onRenameCategory(oldName, trimmed);
    setEditingCat(null);
  };

  const handleDeleteTrigger = (catName: string) => {
    if (catName.toLowerCase() === 'other') {
      alert('"Other" is a system-reserved fallback category and cannot be deleted.');
      return;
    }
    setDeletingCat(catName);
  };

  const confirmDelete = () => {
    if (deletingCat) {
      onDeleteCategory(deletingCat);
      setDeletingCat(null);
    }
  };

  // Help calculate statistical counts
  const getCatItemCount = (catName: string) => {
    return items.filter(item => item.category.toLowerCase() === catName.toLowerCase()).length;
  };

  return (
    <div className="bg-white rounded-xl border border-slate-100 p-6 shadow-sm space-y-6">
      
      {/* View Header */}
      <div className="border-b border-slate-100 pb-5">
        <h2 className="text-lg font-bold text-slate-900 font-sans tracking-tight flex items-center gap-2">
          <Tag size={20} className="text-indigo-600" />
          Category Classification Workspace
        </h2>
        <p className="text-xs text-slate-500 font-sans mt-0.5">
          Add, edit, or remove catalog categories. Renaming a category automatically updates all associated products in real time.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Create Category */}
        <div className="bg-slate-50/50 p-5 rounded-xl border border-slate-200/50 space-y-5 h-fit">
          <div>
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Plus size={14} className="text-slate-500" />
              Create Custom Category
            </h3>
            <p className="text-[11px] text-slate-400">Add a new inventory classification class</p>
          </div>

          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label htmlFor="category-input-field" className="sr-only">Category Name</label>
              <input
                id="category-input-field"
                type="text"
                placeholder="e.g. Warehousing Tools"
                value={newCatName}
                onChange={(e) => {
                  setNewCatName(e.target.value);
                  if (error) setError('');
                }}
                className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-medium"
              />
            </div>

            {error && (
              <p className="text-[11px] text-rose-600 font-sans font-medium flex items-center gap-1">
                <AlertTriangle size={11} />
                {error}
              </p>
            )}

            {success && (
              <p className="text-[11px] text-emerald-600 font-sans font-medium flex items-center gap-1">
                <Check size={11} />
                {success}
              </p>
            )}

            <button
              type="submit"
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white font-semibold text-xs rounded transition-all shadow-xs flex items-center justify-center gap-1"
            >
              <Plus size={13} />
              Add Category
            </button>
          </form>

          <div className="pt-3 border-t border-slate-200 text-[10px] text-slate-400 leading-normal flex items-start gap-1.5">
            <HelpCircle size={12} className="text-slate-300 flex-shrink-0 mt-0.5" />
            <span>
              Categories are used to filter products in your catalogue and track stock summaries.
            </span>
          </div>
        </div>

        {/* Right Columns: Categories Table List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-sans">
              Currently Registered Categories ({categories.length})
            </h3>
          </div>

          <div className="border border-slate-100 rounded-xl overflow-hidden bg-white">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-slate-100">
                  <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Category Name</th>
                  <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase text-center w-28">Items Count</th>
                  <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase text-right w-36">Avg. Item Cost</th>
                  <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase text-right w-36">Total Value</th>
                  <th className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase text-right w-32">Operations</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {categories.map((catName) => {
                  const isEditing = editingCat === catName;
                  const itemCount = getCatItemCount(catName);
                  const isReserved = catName.toLowerCase() === 'other';

                  // Calculate pricing and cost analytics for this specific category
                  const categoryItems = items.filter(
                    (item) => item.category.toLowerCase() === catName.toLowerCase()
                  );
                  const averageItemCost = categoryItems.length > 0
                    ? categoryItems.reduce((sum, item) => sum + (item.cost !== undefined ? item.cost : item.price), 0) / categoryItems.length
                    : 0;
                  const totalStockCostValue = categoryItems.reduce(
                    (sum, item) => sum + (item.cost !== undefined ? item.cost : item.price) * item.stock,
                    0
                  );

                  return (
                    <tr key={catName} className="hover:bg-slate-50/20 group text-slate-700 transition-colors">
                      {/* Name or Edit Field */}
                      <td className="py-3.5 px-4 text-xs font-medium">
                        {isEditing ? (
                          <div className="flex flex-col gap-1 max-w-[200px]">
                            <input
                              type="text"
                              value={editingValue}
                              onChange={(e) => setEditingValue(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleRenameSubmit(catName);
                                else if (e.key === 'Escape') setEditingCat(null);
                              }}
                              className="text-xs border border-slate-200 rounded px-2 py-1 focus:ring-1 focus:ring-indigo-500 focus:outline-none"
                              autoFocus
                            />
                            {editingError && (
                              <span className="text-[10px] text-rose-500 font-semibold">{editingError}</span>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-slate-800">{catName}</span>
                            {isReserved && (
                              <span className="px-1.5 py-0.2 bg-slate-100 text-slate-400 text-[9px] font-mono rounded">
                                Fallback
                              </span>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Items counter */}
                      <td className="py-3.5 px-4 text-center">
                        <span className={`inline-flex items-center gap-1 font-mono text-xs font-bold px-2 py-0.5 rounded ${
                          itemCount > 0 
                            ? 'bg-indigo-50 text-indigo-700' 
                            : 'bg-slate-100 text-slate-400'
                        }`}>
                          {itemCount}
                        </span>
                      </td>

                      {/* Average Item Cost */}
                      <td className="py-3.5 px-4 text-right">
                        <span className="font-mono text-xs text-slate-600 font-medium">
                          {currencyFormatter.format(averageItemCost)}
                        </span>
                      </td>

                      {/* Total Category stock valuation */}
                      <td className="py-3.5 px-4 text-right">
                        <span className={`font-mono text-xs font-bold ${
                          totalStockCostValue > 0 ? 'text-indigo-600' : 'text-slate-400'
                        }`}>
                          {currencyFormatter.format(totalStockCostValue)}
                        </span>
                      </td>

                      {/* Controls */}
                      <td className="py-3.5 px-4 text-right">
                        {isEditing ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleRenameSubmit(catName)}
                              className="p-1 bg-emerald-50 text-emerald-600 rounded hover:bg-emerald-100"
                              title="Save translation"
                            >
                              <Check size={13} />
                            </button>
                            <button
                              onClick={() => setEditingCat(null)}
                              className="p-1 bg-slate-50 text-slate-400 rounded hover:bg-slate-100"
                              title="Cancel change"
                            >
                              <X size={13} />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-1 opacity-90 group-hover:opacity-100 transition-opacity">
                            {!isReserved ? (
                              <>
                                <button
                                  onClick={() => startRename(catName)}
                                  className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded"
                                  title="Rename category"
                                >
                                  <Edit2 size={13} />
                                </button>
                                <button
                                  onClick={() => handleDeleteTrigger(catName)}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                                  title="Delete category"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </>
                            ) : (
                              <span className="text-[10px] text-slate-400 font-mono italic pr-2">Protected</span>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* CONFIRM DELETE MODAL BACKDROP */}
      {deletingCat && (() => {
        const affectedCount = getCatItemCount(deletingCat);
        return (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="bg-white rounded-xl border border-slate-100 shadow-xl max-w-sm w-full p-6 animate-scale-up">
              
              <div className="flex items-center gap-2.5 text-rose-600 mb-4 border-b border-slate-100 pb-3">
                <AlertTriangle size={20} className="animate-pulse" />
                <h4 className="font-bold text-slate-900 text-sm">Discard Category Classification?</h4>
              </div>

              <div className="space-y-3.5 text-xs text-slate-600 leading-relaxed font-sans font-medium">
                <p>
                  You are about to permanently delete the <strong>"{deletingCat}"</strong> category listing.
                </p>

                {affectedCount > 0 ? (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-[11px] flex gap-2">
                    <AlertTriangle size={15} className="text-amber-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="font-bold">Caution: </span>
                      We detected <strong>{affectedCount} products</strong> currently classified in this category. They will be safe, but their category tag will automatically be reset to <strong>"Other"</strong>.
                    </div>
                  </div>
                ) : (
                  <p className="text-slate-500 leading-normal">
                    This category currently has zero products assigned; it is empty and is entirely safe to purge immediately.
                  </p>
                )}
              </div>

              <div className="flex gap-2.5 mt-6 pt-3.5 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setDeletingCat(null)}
                  className="flex-1 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 border border-slate-200/80 rounded-lg cursor-pointer"
                >
                  Keep Category
                </button>
                <button
                  type="button"
                  onClick={confirmDelete}
                  className="flex-1 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm transition-all cursor-pointer"
                >
                  Discard Permanently
                </button>
              </div>

            </div>
          </div>
        );
      })()}

    </div>
  );
}
