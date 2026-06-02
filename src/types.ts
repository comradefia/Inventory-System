/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  category: string;
  price: number;
  cost: number;
  stock: number;
  minThreshold: number; // Low stock alert threshold
  description: string;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export type TransactionType = 'ADD' | 'REMOVE' | 'STOCKTAKE' | 'CREATE' | 'UPDATE';

export interface TransactionLog {
  id: string;
  itemId: string;
  itemName: string;
  sku: string;
  type: TransactionType;
  quantityChange: number; // Positive for additions, negative for reductions
  newStock: number;
  reason: string;
  timestamp: string;
}

export interface InventoryStats {
  totalItems: number;
  totalStockValue: number;
  lowStockCount: number;
  outOfStockCount: number;
}

export type SortField = 'name' | 'sku' | 'stock' | 'price' | 'category' | 'updatedAt';
export type SortOrder = 'asc' | 'desc';

export interface FilterOptions {
  search: string;
  category: string;
  stockStatus: 'all' | 'low' | 'out' | 'normal';
  sortBy: SortField;
  sortOrder: SortOrder;
}

export interface ReceiptItem {
  itemId: string;
  itemName: string;
  sku: string;
  quantity: number;
  soldPrice: number;
}

export interface SaleReceipt {
  id: string;
  invoiceRef: string;
  customerName: string;
  notes: string;
  vatPercent: number;
  subtotal: number;
  taxAmount: number;
  finalTotal: number;
  items: ReceiptItem[];
  timestamp: string;
}

