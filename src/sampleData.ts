/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { InventoryItem, TransactionLog } from './types';

export const INITIAL_ITEMS: InventoryItem[] = [
  {
    id: 'item-1',
    name: 'Retina Studio Display Pro',
    sku: 'DISP-STUDIO-5K',
    category: 'Electronics',
    price: 1599.00,
    stock: 8,
    minThreshold: 10, // Under threshold!
    description: 'High-fidelity 5K resolution display with immersive audio and camera array.',
    imageUrl: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&q=80&w=400',
    createdAt: '2026-05-15T09:30:00Z',
    updatedAt: '2026-06-01T14:45:00Z',
  },
  {
    id: 'item-2',
    name: 'Ergonomic Desk Chair Series-F',
    sku: 'CHAIR-SF-GREY',
    category: 'Furniture',
    price: 449.50,
    stock: 25,
    minThreshold: 15,
    description: 'Fully adjustable postural back support chair upholstered in charcoal mesh textile.',
    imageUrl: 'https://images.unsplash.com/photo-1592078615290-033ee584e267?auto=format&fit=crop&q=80&w=400',
    createdAt: '2026-05-16T11:00:00Z',
    updatedAt: '2026-05-28T16:20:00Z',
  },
  {
    id: 'item-3',
    name: 'Super-Charge USB-C Hub (8-in-1)',
    sku: 'HUB-USBC-8P',
    category: 'Accessories',
    price: 79.99,
    stock: 0, // Out of stock!
    minThreshold: 12,
    description: 'Multi-port adapter featuring HDMI 4K, Gigabit Ethernet, SD card readers, and Power Delivery.',
    imageUrl: 'https://images.unsplash.com/photo-1468495244123-6c6c332eeece?auto=format&fit=crop&q=80&w=400',
    createdAt: '2026-05-18T15:20:00Z',
    updatedAt: '2026-06-02T02:10:00Z',
  },
  {
    id: 'item-4',
    name: 'Mechanical Linear Keyboard MX',
    sku: 'KBD-MX-LINEAR',
    category: 'Electronics',
    price: 189.00,
    stock: 14,
    minThreshold: 5,
    description: 'Hot-swappable tactile linear keyboard with double-shot PBT keycaps and sound dampening foam.',
    imageUrl: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&q=80&w=400',
    createdAt: '2026-05-20T08:45:00Z',
    updatedAt: '2026-06-01T10:15:00Z',
  },
  {
    id: 'item-5',
    name: 'Stainless Steel Flask 1.2L',
    sku: 'FLSK-SS-1200',
    category: 'Accessories',
    price: 34.00,
    stock: 45,
    minThreshold: 20,
    description: 'Double-walled vacuum insulated flask keeping liquids hot for 12 hours or cold for 24 hours.',
    imageUrl: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&q=80&w=400',
    createdAt: '2026-05-22T13:10:00Z',
    updatedAt: '2026-05-31T09:00:00Z',
  },
];

export const INITIAL_LOGS: TransactionLog[] = [
  {
    id: 'tx-1',
    itemId: 'item-3',
    itemName: 'Super-Charge USB-C Hub (8-in-1)',
    sku: 'HUB-USBC-8P',
    type: 'CREATE',
    quantityChange: 12,
    newStock: 12,
    reason: 'Initial intake from distributor shipment.',
    timestamp: '2026-05-18T15:20:00Z',
  },
  {
    id: 'tx-2',
    itemId: 'item-1',
    itemName: 'Retina Studio Display Pro',
    sku: 'DISP-STUDIO-5K',
    type: 'REMOVE',
    quantityChange: -2,
    newStock: 8,
    reason: 'Outbound order fulfillment #ORD-4491.',
    timestamp: '2026-06-01T14:45:00Z',
  },
  {
    id: 'tx-3',
    itemId: 'item-3',
    itemName: 'Super-Charge USB-C Hub (8-in-1)',
    sku: 'HUB-USBC-8P',
    type: 'REMOVE',
    quantityChange: -12,
    newStock: 0,
    reason: 'Stock fully depleted due to bulk purchase for workspace onboarding.',
    timestamp: '2026-06-02T02:10:00Z',
  },
  {
    id: 'tx-4',
    itemId: 'item-4',
    itemName: 'Mechanical Linear Keyboard MX',
    sku: 'KBD-MX-LINEAR',
    type: 'ADD',
    quantityChange: 5,
    newStock: 14,
    reason: 'Return received, inspected, fit for restocking.',
    timestamp: '2026-06-01T10:15:00Z',
  }
];

export const PRESET_CATEGORIES = [
  'Electronics',
  'Furniture',
  'Accessories',
  'Office Supplies',
  'Apparel',
  'Food & Beverage',
  'Other'
];
