/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { Upload, X, RefreshCw, FileText, Check, AlertCircle } from 'lucide-react';
import { InventoryItem } from '../types';

interface ItemFormProps {
  initialItem?: InventoryItem;
  existingItems: InventoryItem[];
  categories: string[];
  onSubmit: (item: Omit<InventoryItem, 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
}

// Preset product mockup images for quick selection
const SAMPLE_IMAGE_PRESETS = [
  { name: 'Hardware', url: 'https://images.unsplash.com/photo-1468495244123-6c6c332eeece?auto=format&fit=crop&q=80&w=400' },
  { name: 'Workspace', url: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&q=80&w=400' },
  { name: 'Modern Seat', url: 'https://images.unsplash.com/photo-1592078615290-033ee584e267?auto=format&fit=crop&q=80&w=400' },
  { name: 'Desk Accessories', url: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&q=80&w=400' },
  { name: 'Devices', url: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&q=80&w=400' },
];

export function ItemForm({ initialItem, existingItems, categories, onSubmit, onCancel }: ItemFormProps) {
  const isEditing = !!initialItem;

  const [name, setName] = useState(initialItem?.name || '');
  const [sku, setSku] = useState(initialItem?.sku || '');
  const [category, setCategory] = useState(initialItem?.category || categories[0] || 'Other');
  const [customCategory, setCustomCategory] = useState('');
  const [showCustomCategoryInput, setShowCustomCategoryInput] = useState(false);
  const [price, setPrice] = useState(initialItem?.price !== undefined ? String(initialItem.price) : '');
  const [cost, setCost] = useState(initialItem?.cost !== undefined ? String(initialItem.cost) : '');
  const [stock, setStock] = useState(initialItem?.stock !== undefined ? String(initialItem.stock) : '');
  const [minThreshold, setMinThreshold] = useState(initialItem?.minThreshold !== undefined ? String(initialItem.minThreshold) : '5');
  const [description, setDescription] = useState(initialItem?.description || '');
  const [imageUrl, setImageUrl] = useState(initialItem?.imageUrl || '');
  
  // Drag & drop file upload state
  const [isDragActive, setIsDragActive] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // SKU uniqueness validation
  const [skuError, setSkuError] = useState('');

  // Auto-generate a clean, professional SKU
  const generateSku = () => {
    if (!name) {
      setSkuError('Please enter a product name first to generate SKU.');
      return;
    }
    const sanitizedName = name
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .slice(0, 4);
    
    const catCode = (showCustomCategoryInput ? customCategory : category)
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '')
      .slice(0, 3);
    
    const randomCode = Math.floor(1000 + Math.random() * 9000);
    const newSku = `${catCode || 'GEN'}-${sanitizedName || 'PROD'}-${randomCode}`;
    
    setSku(newSku);
    setSkuError('');
  };

  useEffect(() => {
    // Validate SKU while editing or entering
    if (!sku) {
      setSkuError('');
      return;
    }
    const isDuplicate = existingItems.some(
      (item) => item.sku.toUpperCase() === sku.toUpperCase() && item.id !== initialItem?.id
    );
    if (isDuplicate) {
      setSkuError('This SKU is already standard/assigned to another item.');
    } else {
      setSkuError('');
    }
  }, [sku, existingItems, initialItem]);

  // Handle uploaded file data URI compression and conversion
  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setUploadError('Unsupported file type. Please upload a standard web image formats (PNG, JPG, SVG, WebP).');
      return;
    }

    // Limit size to ~1.5MB for happy local storage sizes
    if (file.size > 1.5 * 1024 * 1024) {
      setUploadError('Image size exceeds limit of 1.5MB. Please choose a smaller file to accommodate storage constraints.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setImageUrl(dataUrl);
      setUploadError('');
    };
    reader.readAsDataURL(file);
  };

  // Drag and Drop triggers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true);
    } else if (e.type === 'dragleave') {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // Submit validation and final trigger
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) return;
    if (!sku.trim() || skuError) return;
    
    const parsedPrice = parseFloat(price);
    if (isNaN(parsedPrice) || parsedPrice < 0) return;

    const parsedCost = parseFloat(cost);
    if (isNaN(parsedCost) || parsedCost < 0) return;

    const parsedStock = parseInt(stock, 10);
    if (isNaN(parsedStock) || parsedStock < 0) return;

    const parsedThreshold = parseInt(minThreshold, 10);
    if (isNaN(parsedThreshold) || parsedThreshold < 0) return;

    const finalCategory = showCustomCategoryInput && customCategory.trim() 
      ? customCategory.trim() 
      : category;

    onSubmit({
      id: initialItem?.id || `item-${Date.now()}`,
      name: name.trim(),
      sku: sku.trim().toUpperCase(),
      category: finalCategory,
      price: parsedPrice,
      cost: parsedCost,
      stock: parsedStock,
      minThreshold: parsedThreshold,
      description: description.trim(),
      imageUrl: imageUrl || undefined,
    });
  };

  return (
    <div className="bg-white rounded-xl border border-slate-100 p-6 md:p-8 shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 pb-5 mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900 font-sans tracking-tight">
            {isEditing ? 'Modify Product Details' : 'Upload New Product'}
          </h2>
          <p className="text-xs text-slate-500 font-sans mt-1">
            {isEditing 
              ? 'Update the fields below to modify properties and real-time alerts.' 
              : 'Add a new product, assign starting quantities, and configure low-stock alerts.'}
          </p>
        </div>
        <button
          onClick={onCancel}
          className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-50 rounded-lg transition-colors duration-150"
        >
          <X size={18} />
        </button>
      </div>

      <form onSubmit={handleFormSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left Column: Text Attributes */}
          <div className="space-y-4">
            {/* Product Name */}
            <div>
              <label htmlFor="prod-name" className="block text-xs font-semibold text-slate-700 font-sans mb-1.5 uppercase tracking-wider">
                Product Name *
              </label>
              <input
                id="prod-name"
                type="text"
                required
                placeholder="e.g. Mechanical Linear Keyboard MX"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full text-sm border border-slate-200 rounded-lg px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors bg-slate-50/50"
              />
            </div>

            {/* SKU & Generator */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="prod-sku" className="block text-xs font-semibold text-slate-700 font-sans uppercase tracking-wider">
                  SKU Code *
                </label>
                <button
                  type="button"
                  onClick={generateSku}
                  className="text-xs font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1 hover:underline cursor-pointer"
                >
                  <RefreshCw size={12} />
                  Auto-Generate
                </button>
              </div>
              <div className="relative">
                <input
                  id="prod-sku"
                  type="text"
                  required
                  placeholder="e.g. KBD-MX-LINEAR"
                  value={sku}
                  onChange={(e) => setSku(e.target.value.toUpperCase().replace(/\s+/g, '-'))}
                  className={`w-full text-sm border rounded-lg px-3.5 py-2.5 focus:outline-none focus:ring-2 transition-colors font-mono ${
                    skuError
                      ? 'border-rose-300 focus:ring-rose-500/10 focus:border-rose-500 bg-rose-50/10 text-rose-800'
                      : 'border-slate-200 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50/50'
                  }`}
                />
              </div>
              {skuError ? (
                <div className="flex items-center gap-1 text-xs text-rose-600 mt-1.5">
                  <AlertCircle size={12} />
                  <span>{skuError}</span>
                </div>
              ) : (
                <p className="text-[11px] text-slate-400 mt-1 font-mono">Unique alphanumeric reference key.</p>
              )}
            </div>

            {/* Category selection */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700 font-sans uppercase tracking-wider">
                  Category *
                </label>
                <button
                  type="button"
                  onClick={() => setShowCustomCategoryInput(!showCustomCategoryInput)}
                  className="text-xs font-medium text-slate-500 hover:text-slate-700 flex items-center gap-1 cursor-pointer hover:underline"
                >
                  {showCustomCategoryInput ? 'Use Presets' : '+ Custom Category'}
                </button>
              </div>

              {!showCustomCategoryInput ? (
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded-lg px-3.5 py-2.5 bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  required={showCustomCategoryInput}
                  placeholder="Enter custom category name"
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded-lg px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50/50 transition-colors"
                />
              )}
            </div>

            {/* Financial & Quantities */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {/* Price */}
              <div>
                <label htmlFor="prod-price" className="block text-xs font-semibold text-slate-700 font-sans mb-1.5 uppercase tracking-wider">
                  Price ($) *
                </label>
                <input
                  id="prod-price"
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  placeholder="0.00"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50/50 transition-colors font-mono"
                />
              </div>

              {/* Cost */}
              <div>
                <label htmlFor="prod-cost" className="block text-xs font-semibold text-slate-700 font-sans mb-1.5 uppercase tracking-wider">
                  Cost ($) *
                </label>
                <input
                  id="prod-cost"
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  placeholder="0.00"
                  value={cost}
                  onChange={(e) => setCost(e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50/50 transition-colors font-mono"
                />
              </div>

              {/* Initial Stock */}
              <div>
                <label htmlFor="prod-stock" className="block text-xs font-semibold text-slate-700 font-sans mb-1.5 uppercase tracking-wider">
                  Initial Stock *
                </label>
                <input
                  id="prod-stock"
                  type="number"
                  min="0"
                  required
                  placeholder="0"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50/50 transition-colors font-mono"
                />
              </div>

              {/* Min Safety Alert Threshold */}
              <div>
                <label id="prod-threshold-label" htmlFor="prod-threshold" className="block text-xs font-semibold text-slate-700 font-sans mb-1.5 uppercase tracking-wider truncate">
                  Safety stock *
                </label>
                <input
                  id="prod-threshold"
                  type="number"
                  min="0"
                  required
                  placeholder="5"
                  value={minThreshold}
                  onChange={(e) => setMinThreshold(e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50/50 transition-colors font-mono"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label htmlFor="prod-desc" className="block text-xs font-semibold text-slate-700 font-sans mb-1.5 uppercase tracking-wider">
                Product Description
              </label>
              <textarea
                id="prod-desc"
                placeholder="Product attributes, dimensions, supplier contact details..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full text-sm border border-slate-200 rounded-lg px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50/50 transition-colors resize-none"
              />
            </div>
          </div>

          {/* Right Column: Image Manager */}
          <div className="space-y-5">
            <div>
              <span className="block text-xs font-semibold text-slate-700 font-sans mb-1.5 uppercase tracking-wider">
                Product Media Asset
              </span>
              
              {/* Drag and drop panel */}
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={triggerFileInput}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-150 flex flex-col items-center justify-center min-h-[220px] relative overflow-hidden group ${
                  isDragActive
                    ? 'border-indigo-500 bg-indigo-50/40'
                    : imageUrl
                    ? 'border-slate-100 bg-slate-50'
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/30'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileInputChange}
                  className="hidden"
                />

                {imageUrl ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-4 bg-slate-900/60 transition-opacity duration-200 opacity-0 group-hover:opacity-100 z-10">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setImageUrl('');
                      }}
                      className="p-2 bg-rose-600 text-white rounded-full hover:bg-rose-700 shadow transition-colors scale-90 group-hover:scale-100 duration-150"
                      title="Remove product photo"
                    >
                      <X size={16} />
                    </button>
                    <span className="text-white text-xs mt-2 font-medium">Remove photo</span>
                  </div>
                ) : null}

                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt="Uploaded Product Preview"
                    referrerPolicy="no-referrer"
                    className="absolute inset-0 w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <>
                    <div className="p-3 bg-white border border-slate-100 rounded-xl text-slate-400 group-hover:text-slate-600 transition-colors shadow-sm mb-3">
                      <Upload size={24} />
                    </div>
                    <p className="text-sm font-medium text-slate-700">
                      Drag &amp; drop product photo, or <span className="text-indigo-600 hover:underline">browse files</span>
                    </p>
                    <p className="text-xs text-slate-400 mt-1.5 font-sans">
                      PNG, JPG, WebP or SVG format (Max 1.5MB recommended)
                    </p>
                  </>
                )}
              </div>
              {uploadError && (
                <p className="text-xs text-rose-600 mt-2 flex items-center gap-1 font-sans font-medium">
                  <AlertCircle size={12} />
                  <span>{uploadError}</span>
                </p>
              )}
            </div>

            {/* Quick Presets Carousel */}
            <div>
              <span className="block text-xs font-semibold text-slate-500 font-sans mb-2 uppercase tracking-wide">
                Or choose an abstract preset photo:
              </span>
              <div className="grid grid-cols-5 gap-2">
                {SAMPLE_IMAGE_PRESETS.map((preset) => {
                  const isSelected = imageUrl === preset.url;
                  return (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => {
                        setImageUrl(preset.url);
                        setUploadError('');
                      }}
                      className={`relative aspect-video rounded-lg border overflow-hidden cursor-pointer transition-all ${
                        isSelected 
                          ? 'border-indigo-600 ring-2 ring-indigo-500/20' 
                          : 'border-slate-200 hover:border-slate-400'
                      }`}
                    >
                      <img
                        src={preset.url}
                        alt={preset.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover hover:scale-110 transition-transform duration-200"
                        title={preset.name}
                      />
                      {isSelected && (
                        <div className="absolute inset-0 bg-indigo-600/35 flex items-center justify-center">
                          <Check size={14} className="text-white" />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Action button rows */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2.5 text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-50 border border-slate-200/80 rounded-lg cursor-pointer transition-colors"
          >
            Cancel
          </button>
          
          <button
            type="submit"
            disabled={!!skuError || !name.trim()}
            className={`px-5 py-2.5 text-sm font-semibold text-white rounded-lg shadow-sm transition-all duration-150 cursor-pointer flex items-center gap-1.5 ${
              !!skuError || !name.trim()
                ? 'bg-indigo-300 cursor-not-allowed shadow-none'
                : 'bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98]'
            }`}
          >
            {isEditing ? 'Save Changes' : 'Upload Product'}
          </button>
        </div>
      </form>
    </div>
  );
}
