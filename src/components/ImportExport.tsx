/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState } from 'react';
import { 
  Download, 
  UploadCloud, 
  DatabaseBackup, 
  FileSpreadsheet, 
  RefreshCcw, 
  Check, 
  AlertTriangle,
  Server,
  Globe,
  Info,
  Terminal,
  ArrowRight
} from 'lucide-react';
import { InventoryItem, TransactionLog } from '../types';

interface ImportExportProps {
  items: InventoryItem[];
  logs: TransactionLog[];
  onImportData: (items: InventoryItem[], logs: TransactionLog[]) => void;
  onResetDemo: () => void;
}

export function ImportExport({ items, logs, onImportData, onResetDemo }: ImportExportProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // 1. Export as Raw JSON backup (items + logs)
  const exportAsJson = () => {
    try {
      const backupPayload = {
        app: 'inventory-and-stock-tracker',
        exportedAt: new Date().toISOString(),
        items,
        logs
      };
      
      const blob = new Blob([JSON.stringify(backupPayload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `inventory-backup-${new Date().toISOString().slice(0,10)}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      triggerSuccess('Database backup JSON successfully generated and downloaded.');
    } catch (err) {
      triggerError('Error preparing JSON backup. Please try again.');
    }
  };

  // 2. Export items as standard CSV
  const exportAsCsv = () => {
    try {
      const headers = ['SKU', 'Name', 'Category', 'Price', 'Stock Level', 'Min Threshold', 'CreatedAt', 'UpdatedAt', 'Description'];
      const rows = items.map(item => [
        `"${item.sku.replace(/"/g, '""')}"`,
        `"${item.name.replace(/"/g, '""')}"`,
        `"${item.category.replace(/"/g, '""')}"`,
        item.price,
        item.stock,
        item.minThreshold,
        `"${item.createdAt}"`,
        `"${item.updatedAt}"`,
        `"${(item.description || '').replace(/"/g, '""').replace(/\n/g, ' ')}"`
      ]);

      const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `inventory-catalog-${new Date().toISOString().slice(0,10)}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      triggerSuccess('Standard catalog CSV generated; perfect for Spreadsheet imports.');
    } catch (err) {
      triggerError('Unable to generate CSV list. Try again.');
    }
  };

  // 3. Import previously backed up JSON
  const handleJsonUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const payload = JSON.parse(event.target?.result as string);
        
        // Validation checking
        if (!payload.items || !Array.isArray(payload.items)) {
          throw new Error('Unsupported JSON form template formatting: missing items list.');
        }

        const validItems: InventoryItem[] = payload.items.filter((item: any) => {
          return item.id && item.name && item.sku && typeof item.price === 'number' && typeof item.stock === 'number';
        });

        const validLogs: TransactionLog[] = Array.isArray(payload.logs) 
          ? payload.logs.filter((log: any) => log.id && log.itemId && log.itemName && log.sku)
          : [];

        if (validItems.length === 0) {
          throw new Error('No valid SKU products were parsed from this import template.');
        }

        onImportData(validItems, validLogs);
        triggerSuccess(`Database recovered: ${validItems.length} items and ${validLogs.length} activity logs added.`);
        
        // Reset file input value
        if (fileInputRef.current) fileInputRef.current.value = '';
      } catch (err: any) {
        triggerError(err.message || 'File parsing failed. Please check the schema formatting.');
      }
    };
    reader.readAsText(file);
  };

  const triggerSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setErrorMsg('');
    setTimeout(() => setSuccessMsg(''), 4500);
  };

  const triggerError = (msg: string) => {
    setErrorMsg(msg);
    setSuccessMsg('');
    setTimeout(() => setErrorMsg(''), 4500);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-100 p-6 shadow-sm">
      <div className="border-b border-slate-100 pb-5 mb-6">
        <h2 className="text-lg font-bold text-slate-900 font-sans tracking-tight flex items-center gap-2">
          <DatabaseBackup size={20} className="text-slate-500" />
          Backup &amp; Data Integration
        </h2>
        <p className="text-xs text-slate-500 font-sans mt-0.5">
          Download inventory snapshots, migrate stock list from spreadsheets, or diagnostic rebuilds.
        </p>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl flex items-start gap-2.5 text-emerald-800 text-xs mb-5 animate-fade-in">
          <Check size={16} className="text-emerald-600 mt-0.5 flex-shrink-0" />
          <span className="font-sans font-semibold leading-relaxed">{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl flex items-start gap-2.5 text-rose-800 text-xs mb-5 animate-fade-in">
          <AlertTriangle size={16} className="text-rose-600 mt-0.5 flex-shrink-0" />
          <span className="font-sans font-semibold leading-relaxed">{errorMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Export Column */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-slate-400 font-sans uppercase tracking-wider">Download Outbound Assets</h3>
          <div className="flex flex-col gap-3">
            <button
              onClick={exportAsCsv}
              className="w-full flex items-center justify-between border border-slate-200 hover:border-emerald-200 p-3.5 rounded-xl hover:bg-emerald-50/10 text-slate-700 transition-all font-sans cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <span className="p-2 bg-emerald-50 text-emerald-600 rounded-lg group-hover:scale-105 transition-transform">
                  <FileSpreadsheet size={16} />
                </span>
                <div className="text-left">
                  <p className="text-xs font-bold">Export CSV Format</p>
                  <p className="text-[10px] text-slate-400">Save SKUs for Excel/Sheets</p>
                </div>
              </div>
              <Download size={14} className="text-slate-300 group-hover:text-slate-600 group-hover:translate-y-0.5 transition-all" />
            </button>

            <button
              onClick={exportAsJson}
              className="w-full flex items-center justify-between border border-slate-200 hover:border-slate-300 p-3.5 rounded-xl hover:bg-slate-50 text-slate-700 transition-all font-sans cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <span className="p-2 bg-slate-50 text-slate-500 rounded-lg group-hover:scale-105 transition-transform">
                  <DatabaseBackup size={16} />
                </span>
                <div className="text-left">
                  <p className="text-xs font-bold">Backup System JSON</p>
                  <p className="text-[10px] text-slate-400">Backup all SKUs &amp; audit trails</p>
                </div>
              </div>
              <Download size={14} className="text-slate-300 group-hover:text-slate-600 group-hover:translate-y-0.5 transition-all" />
            </button>
          </div>
        </div>

        {/* Import Column */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-slate-400 font-sans uppercase tracking-wider">Upload Inbound Snapshots</h3>
          
          <div className="relative">
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleJsonUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center justify-between border-2 border-dashed border-slate-200 hover:border-indigo-400 p-3.5 rounded-xl hover:bg-indigo-50/10 text-slate-700 transition-all font-sans cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <span className="p-2 bg-indigo-50 text-indigo-600 rounded-lg group-hover:scale-105 transition-transform">
                  <UploadCloud size={16} />
                </span>
                <div className="text-left">
                  <p className="text-xs font-bold">Restore JSON Database</p>
                  <p className="text-[10px] text-slate-400">Restore products from *.json files</p>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Diagnostics Sandbox Column */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold text-slate-400 font-sans uppercase tracking-wider">Product Diagnostics</h3>
          <div>
            <button
              onClick={onResetDemo}
              className="w-full flex items-center justify-between border border-slate-200 hover:border-amber-300 p-3.5 rounded-xl hover:bg-amber-50/10 text-slate-700 transition-all font-sans cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <span className="p-2 bg-amber-50 text-amber-600 rounded-lg group-hover:rotate-180 transition-transform duration-300">
                  <RefreshCcw size={16} />
                </span>
                <div className="text-left">
                  <p className="text-xs font-bold text-amber-700">Reload Sample Sandbox</p>
                  <p className="text-[10px] text-amber-500">Restore 5 products &amp; 4 default logs</p>
                </div>
              </div>
            </button>
          </div>
        </div>

      </div>

      <hr className="my-8 border-slate-100" />

      <div className="bg-slate-50/50 rounded-lg border border-slate-200/60 p-5 font-sans">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
          <Globe size={14} className="text-slate-500" />
          Production Deployment &amp; Normal Hosting Guide
        </h3>
        
        <p className="text-xs text-slate-650 mb-6 leading-relaxed">
          Because this Stockyard Solutions instance is a <strong>fully client-side Web App (React + Vite) with local database persistence</strong>, it does not require an active SQL cluster, PHP, or Node.js backend server. You can host it instantly on any traditional hosting panel (such as Apache, Nginx, or cPanel) or zero-overhead static hosts:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded border border-slate-200/50 flex flex-col gap-2">
            <span className="w-6 h-6 rounded-full bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-[10px] select-none">
              1
            </span>
            <span className="font-bold text-xs text-slate-800">Export ZIP Code</span>
            <span className="text-[11px] text-slate-500 leading-normal">
              Click the settings cog in the top-right toolbar of AI Studio and choose <strong>Export to ZIP</strong> (or sync with GitHub).
            </span>
          </div>

          <div className="bg-white p-4 rounded border border-slate-200/50 flex flex-col gap-2">
            <span className="w-6 h-6 rounded-full bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-[10px] select-none">
              2
            </span>
            <span className="font-bold text-xs text-slate-800">Build Locally</span>
            <span className="text-[11px] text-slate-500 leading-normal">
              Unzip the files on your computer, verify Node.js is installed locally, and run the standard build script:
            </span>
            <div className="bg-slate-900 text-slate-200 p-2 rounded text-[10px] font-mono mt-1 select-all select-none leading-relaxed">
              npm install<br />
              npm run build
            </div>
          </div>

          <div className="bg-white p-4 rounded border border-slate-200/50 flex flex-col gap-2">
            <span className="w-6 h-6 rounded-full bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-[10px] select-none">
              3
            </span>
            <span className="font-bold text-xs text-slate-800">Traditional cPanel</span>
            <span className="text-[11px] text-slate-500 leading-normal">
              Copy the compiled folder contents from the resulting <strong>dist/</strong> directory and upload them directly into your host's FTP/File Manager (inside <code>public_html/</code>).
            </span>
          </div>

          <div className="bg-white p-4 rounded border border-slate-200/50 flex flex-col gap-2">
            <span className="w-6 h-6 rounded-full bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-[10px] select-none">
              4
            </span>
            <span className="font-bold text-xs text-slate-800">Modern Static Hosting</span>
            <span className="text-[11px] text-slate-500 leading-normal">
              Drag-and-drop the <strong>dist/</strong> folder directly into <strong>Netlify</strong>, <strong>Vercel</strong>, or host on <strong>GitHub Pages</strong> for free with continuous integration.
            </span>
          </div>
        </div>

        <div className="mt-5 p-3.5 bg-indigo-50/50 border border-indigo-100 rounded flex gap-3 text-indigo-950 text-xs select-none">
          <Server size={16} className="text-indigo-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="font-semibold text-xs leading-normal text-indigo-900">Why this makes hosting incredibly easy:</p>
            <p className="text-[11px] text-indigo-700 mt-1 leading-normal">
              No backend database setup stands between your static files and your active users. Product listings, categories, transactional ledger logs, search indexes, and custom margins persist locally in your browser memory context (`localStorage`). This means $0/mo server maintenance!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
