import React from 'react';
import {
  Search,
  Filter,
  RotateCcw,
  AlertTriangle,
  Server,
  FileSpreadsheet,
  FileCode,
  Calendar
} from 'lucide-react';
import { AuditFilterParams, AuditActionCategory, ServiceOrigin } from '../types';

interface AuditFilterToolbarProps {
  filters: AuditFilterParams;
  onFilterChange: (filters: AuditFilterParams) => void;
  onResetFilters: () => void;
  onExportCSV: () => void;
  onExportJSON: () => void;
  anomaliesCount: number;
}

const MODULE_OPTIONS = [
  { value: 'ALL', label: 'All Modules (20 Total)' },
  { value: 'billing', label: 'Billing & Invoicing' },
  { value: 'theatre', label: 'Operating Theatre' },
  { value: 'emergency', label: 'Accident & Emergency' },
  { value: 'maternity', label: 'Maternity' },
  { value: 'mortuary', label: 'Mortuary' },
  { value: 'nursing', label: 'Nursing Services' },
  { value: 'pharmacy', label: 'Pharmacy' },
  { value: 'laboratory', label: 'Laboratory (LIS)' },
  { value: 'nhia', label: 'NHIA / HMO' },
  { value: 'accounting', label: 'General Ledger' },
  { value: 'medicalrecords', label: 'Medical Records' },
  { value: 'admin', label: 'System Admin / RBAC' }
];

const ACTION_CATEGORIES: { id: AuditActionCategory; label: string }[] = [
  { id: 'ALL', label: 'All Actions' },
  { id: 'CLINICAL', label: 'Clinical' },
  { id: 'FINANCIAL', label: 'Financial' },
  { id: 'SECURITY', label: 'Security & Auth' },
  { id: 'OVERRIDE', label: 'Overrides & Bypasses' }
];

export const AuditFilterToolbar: React.FC<AuditFilterToolbarProps> = ({
  filters,
  onFilterChange,
  onResetFilters,
  onExportCSV,
  onExportJSON,
  anomaliesCount
}) => {
  const handleServiceChange = (service: 'ALL' | ServiceOrigin) => {
    onFilterChange({ ...filters, service });
  };

  const handleCategoryChange = (category: AuditActionCategory) => {
    onFilterChange({ ...filters, actionCategory: category });
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-4">
      {/* Top search & quick export row */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={filters.searchQuery || ''}
            onChange={(e) => onFilterChange({ ...filters, searchQuery: e.target.value })}
            placeholder="Search by User Name, Staff ID, Resource ID (e.g. INV-2026), IP, Action..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
        </div>

        {/* Export Buttons & Reset */}
        <div className="flex items-center gap-2">
          <div className="relative inline-block text-left">
            <button
              onClick={onExportCSV}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg border border-slate-300 transition-colors flex items-center gap-1.5 shadow-sm"
              title="Export filtered records to CSV"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Export CSV</span>
            </button>
          </div>

          <button
            onClick={onExportJSON}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg border border-slate-300 transition-colors flex items-center gap-1.5 shadow-sm"
            title="Export complete cryptographic JSON audit bundle"
          >
            <FileCode className="w-3.5 h-3.5 text-indigo-600" />
            <span>Export JSON</span>
          </button>

          <button
            onClick={onResetFilters}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors"
            title="Reset all filters to default"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Action Categories Pills */}
      <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-100">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1 flex items-center gap-1">
          <Filter className="w-3 h-3" /> Category:
        </span>
        {ACTION_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => handleCategoryChange(cat.id)}
            className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-all ${
              (filters.actionCategory || 'ALL') === cat.id
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {cat.label}
          </button>
        ))}

        {/* Anomaly Only Toggle Pill */}
        <button
          onClick={() => onFilterChange({ ...filters, onlyAnomalies: !filters.onlyAnomalies })}
          className={`ml-auto px-2.5 py-1 text-xs rounded-lg font-bold transition-all flex items-center gap-1.5 ${
            filters.onlyAnomalies
              ? 'bg-amber-600 text-white shadow-sm ring-2 ring-amber-300'
              : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
          <span>Anomalies Only ({anomaliesCount})</span>
        </button>
      </div>

      {/* Advanced Filter Selectors Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-slate-100 text-xs">
        {/* Service Selector */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 mb-1 flex items-center gap-1">
            <Server className="w-3 h-3 text-slate-400" /> Service Origin
          </label>
          <select
            value={filters.service || 'ALL'}
            onChange={(e) => handleServiceChange(e.target.value as 'ALL' | ServiceOrigin)}
            className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 font-medium focus:ring-1 focus:ring-blue-500"
          >
            <option value="ALL">All Services (Go + Python)</option>
            <option value="core-go">Go Core (:8080)</option>
            <option value="interop-py">Python Interop (:8000)</option>
          </select>
        </div>

        {/* Module Selector */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 mb-1">
            Hospital Module
          </label>
          <select
            value={filters.module || 'ALL'}
            onChange={(e) => onFilterChange({ ...filters, module: e.target.value })}
            className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 font-medium focus:ring-1 focus:ring-blue-500"
          >
            {MODULE_OPTIONS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </div>

        {/* Status Selector */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 mb-1">
            Execution Status
          </label>
          <select
            value={filters.status || 'ALL'}
            onChange={(e) => onFilterChange({ ...filters, status: e.target.value as 'ALL' | 'SUCCESS' | 'FAILURE' })}
            className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 font-medium focus:ring-1 focus:ring-blue-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="SUCCESS">SUCCESS only</option>
            <option value="FAILURE">FAILURE only</option>
          </select>
        </div>

        {/* Date Range Start */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 mb-1 flex items-center gap-1">
            <Calendar className="w-3 h-3 text-slate-400" /> Start Date
          </label>
          <input
            type="date"
            value={filters.startDate || ''}
            onChange={(e) => onFilterChange({ ...filters, startDate: e.target.value })}
            className="w-full bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1 text-xs text-slate-700 font-medium focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>
    </div>
  );
};
