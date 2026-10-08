import React, { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  FileText,
  ChevronDown,
  ChevronUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  Building,
  RefreshCw,
  Send,
  UserCheck,
} from 'lucide-react';
import { InventoryItem, POStatus, PurchaseOrder, Vendor } from '../types';
import { inventoryApi } from '../api';
import { PurchaseOrderModal } from './PurchaseOrderModal';
import { PurchaseOrderApprovalModal } from './PurchaseOrderApprovalModal';

interface PurchaseOrderListViewProps {
  pos: PurchaseOrder[];
  catalogItems: InventoryItem[];
  vendors: Vendor[];
  onRefresh: () => void;
  onPOUpdated: (po: PurchaseOrder) => void;
  onPOCreated: (po: PurchaseOrder) => void;
}

const STATUS_FILTERS: { label: string; value: string }[] = [
  { label: 'All Orders', value: 'ALL' },
  { label: 'Pending Approval', value: 'SUBMITTED_FOR_APPROVAL' },
  { label: 'Approved & Active', value: 'APPROVED' },
  { label: 'Fulfilled', value: 'FULFILLED' },
  { label: 'Drafts', value: 'DRAFT' },
  { label: 'Cancelled', value: 'CANCELLED' },
];

export const PurchaseOrderListView: React.FC<PurchaseOrderListViewProps> = ({
  pos,
  catalogItems,
  vendors,
  onRefresh,
  onPOUpdated,
  onPOCreated,
}) => {
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [expandedPoId, setExpandedPoId] = useState<string | null>(null);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [poToReview, setPoToReview] = useState<PurchaseOrder | null>(null);

  const filteredPOs = useMemo(() => {
    return pos.filter((po) => {
      if (selectedStatus !== 'ALL' && po.status !== selectedStatus) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const matches =
          po.poNumber.toLowerCase().includes(q) ||
          po.vendorName.toLowerCase().includes(q) ||
          po.createdBy.toLowerCase().includes(q) ||
          (po.approvedBy && po.approvedBy.toLowerCase().includes(q));
        if (!matches) return false;
      }
      return true;
    });
  }, [pos, selectedStatus, search]);

  const toggleExpand = (id: string) => {
    setExpandedPoId((prev) => (prev === id ? null : id));
  };

  const handleQuickSubmit = async (po: PurchaseOrder) => {
    try {
      const updated = await inventoryApi.updatePOStatus(po.id, 'SUBMITTED_FOR_APPROVAL');
      onPOUpdated(updated);
    } catch (e) {
      console.error('Failed to submit PO', e);
    }
  };

  const getStatusBadge = (status: POStatus) => {
    switch (status) {
      case 'DRAFT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-500/10 text-slate-400 border border-slate-500/20">
            <Clock className="w-3 h-3" />
            Draft
          </span>
        );
      case 'SUBMITTED_FOR_APPROVAL':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Clock className="w-3 h-3" />
            Awaiting Approval
          </span>
        );
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <CheckCircle2 className="w-3 h-3" />
            Approved
          </span>
        );
      case 'PARTIALLY_RECEIVED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <CheckCircle2 className="w-3 h-3" />
            Partially Received
          </span>
        );
      case 'FULFILLED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3" />
            Fulfilled
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <AlertCircle className="w-3 h-3" />
            Cancelled
          </span>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Search & Actions Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by PO#, vendor name, or creator..."
              className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500"
            />
          </div>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-slate-300 text-sm focus:outline-none focus:border-blue-500"
          >
            {STATUS_FILTERS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onRefresh}
            title="Refresh Orders"
            className="p-2 rounded-xl border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-medium transition shadow-lg shadow-blue-900/30 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Generate PO</span>
          </button>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950/80 text-xs text-slate-400 uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="px-5 py-3.5 font-semibold">PO Number & Date</th>
                <th className="px-4 py-3.5 font-semibold">Supplier / Vendor</th>
                <th className="px-4 py-3.5 font-semibold">Line Items</th>
                <th className="px-4 py-3.5 font-semibold">Total Amount</th>
                <th className="px-4 py-3.5 font-semibold">Expected By</th>
                <th className="px-4 py-3.5 font-semibold">Status</th>
                <th className="px-4 py-3.5 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredPOs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                    <p className="text-sm font-medium">No purchase orders found</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Generate a new purchase order or adjust filters.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredPOs.map((po) => {
                  const isExpanded = expandedPoId === po.id;
                  return (
                    <React.Fragment key={po.id}>
                      <tr className="hover:bg-slate-800/30 transition">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-blue-400 shrink-0" />
                            <span className="font-mono font-semibold text-white">{po.poNumber}</span>
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5">
                            Created {new Date(po.createdAt).toLocaleDateString('en-GB')}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-xs">
                          <div className="flex items-center gap-1.5 font-medium text-slate-200">
                            <Building className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                            <span>{po.vendorName}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-xs text-slate-400">
                          <span className="font-medium text-white">{po.items.length}</span> items
                        </td>
                        <td className="px-4 py-4">
                          <span className="font-semibold text-blue-400 text-sm">
                            {po.totalAmount}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-xs text-slate-300">
                          {new Date(po.expectedDeliveryDate).toLocaleDateString('en-GB', {
                            day: 'numeric',
                            month: 'short',
                          })}
                        </td>
                        <td className="px-4 py-4">
                          {getStatusBadge(po.status)}
                          {po.approvedBy && (
                            <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                              <UserCheck className="w-3 h-3 text-slate-500" />
                              <span className="truncate max-w-[120px]">{po.approvedBy}</span>
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {po.status === 'SUBMITTED_FOR_APPROVAL' && (
                              <button
                                onClick={() => setPoToReview(po)}
                                className="px-2.5 py-1 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 text-xs font-medium transition flex items-center gap-1"
                              >
                                <span>Review</span>
                              </button>
                            )}
                            {po.status === 'DRAFT' && (
                              <button
                                onClick={() => handleQuickSubmit(po)}
                                title="Submit for Approval"
                                className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition flex items-center gap-1"
                              >
                                <Send className="w-3 h-3 text-blue-400" />
                                <span>Submit</span>
                              </button>
                            )}
                            <button
                              onClick={() => toggleExpand(po.id)}
                              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                              title="Toggle Items Details"
                            >
                              {isExpanded ? (
                                <ChevronUp className="w-4 h-4" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expandable line items sub-table */}
                      {isExpanded && (
                        <tr className="bg-slate-950/70 border-b border-slate-800/80">
                          <td colSpan={7} className="px-8 py-4">
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-xs text-slate-400">
                                <span className="font-semibold text-slate-300 uppercase tracking-wider">
                                  Line Items Breakdown ({po.poNumber})
                                </span>
                                {po.approvalNotes && (
                                  <span className="italic text-slate-400">
                                    Remark: &quot;{po.approvalNotes}&quot;
                                  </span>
                                )}
                              </div>
                              <div className="border border-slate-800 rounded-xl overflow-hidden">
                                <table className="w-full text-xs text-slate-300">
                                  <thead className="bg-slate-900/90 text-slate-400">
                                    <tr>
                                      <th className="px-4 py-2 font-medium">Code</th>
                                      <th className="px-4 py-2 font-medium">Description</th>
                                      <th className="px-4 py-2 font-medium text-right">Qty</th>
                                      <th className="px-4 py-2 font-medium text-right">Unit Price</th>
                                      <th className="px-4 py-2 font-medium text-right">Total</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-800/60">
                                    {po.items.map((item, idx) => (
                                      <tr key={idx} className="hover:bg-slate-900/40">
                                        <td className="px-4 py-2 font-mono text-emerald-400">
                                          {item.itemCode}
                                        </td>
                                        <td className="px-4 py-2 font-medium text-white">
                                          {item.itemName}
                                        </td>
                                        <td className="px-4 py-2 text-right">{item.quantityOrdered}</td>
                                        <td className="px-4 py-2 text-right">
                                          ₦{item.unitPrice.toLocaleString('en-NG')}
                                        </td>
                                        <td className="px-4 py-2 text-right font-semibold text-white">
                                          ₦{item.totalPrice.toLocaleString('en-NG')}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <PurchaseOrderModal
        isOpen={isCreateModalOpen}
        catalogItems={catalogItems}
        vendors={vendors}
        onClose={() => setIsCreateModalOpen(false)}
        onCreated={(created) => {
          onPOCreated(created);
        }}
      />

      <PurchaseOrderApprovalModal
        isOpen={Boolean(poToReview)}
        po={poToReview}
        onClose={() => setPoToReview(null)}
        onStatusUpdated={(updated) => {
          onPOUpdated(updated);
        }}
      />
    </div>
  );
};
