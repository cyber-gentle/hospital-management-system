import React, { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  Truck,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
  FileCheck,
  Calendar,
  Building,
  RefreshCw,
  UserCheck,
} from 'lucide-react';
import { GoodsReceiptNote, PurchaseOrder } from '../types';
import { GoodsReceiptModal } from './GoodsReceiptModal';

interface GoodsReceiptListViewProps {
  grns: GoodsReceiptNote[];
  approvedPOs: PurchaseOrder[];
  onRefresh: () => void;
  onGRNCreated: (grn: GoodsReceiptNote) => void;
}

export const GoodsReceiptListView: React.FC<GoodsReceiptListViewProps> = ({
  grns,
  approvedPOs,
  onRefresh,
  onGRNCreated,
}) => {
  const [search, setSearch] = useState('');
  const [expandedGrnId, setExpandedGrnId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filteredGRNs = useMemo(() => {
    return grns.filter((g) => {
      if (search.trim()) {
        const q = search.toLowerCase();
        const matches =
          g.grnNumber.toLowerCase().includes(q) ||
          g.poNumber.toLowerCase().includes(q) ||
          g.vendorName.toLowerCase().includes(q) ||
          g.deliveryNoteNumber.toLowerCase().includes(q) ||
          g.receivedBy.toLowerCase().includes(q) ||
          g.inspectionOfficer.toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }, [grns, search]);

  const toggleExpand = (id: string) => {
    setExpandedGrnId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="space-y-4">
      {/* Search & Action Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        <div className="relative flex-1 max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by GRN#, PO#, vendor, or delivery note..."
            className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-purple-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onRefresh}
            title="Refresh GRNs"
            className="p-2 rounded-xl border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            disabled={approvedPOs.length === 0}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition shadow-lg flex items-center gap-2 ${
              approvedPOs.length === 0
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                : 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-900/30'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>Record GRN Intake</span>
          </button>
        </div>
      </div>

      {approvedPOs.length === 0 && (
        <div className="p-3 bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs rounded-xl flex items-center gap-2">
          <FileCheck className="w-4 h-4 shrink-0 text-blue-400" />
          <span>
            Note: All pending purchase orders have been received or none are currently in &apos;APPROVED&apos; status. Authorize a PO in the Orders tab to intake a new delivery.
          </span>
        </div>
      )}

      {/* GRN Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950/80 text-xs text-slate-400 uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="px-5 py-3.5 font-semibold">GRN Number</th>
                <th className="px-4 py-3.5 font-semibold">PO Reference</th>
                <th className="px-4 py-3.5 font-semibold">Supplier & Waybill</th>
                <th className="px-4 py-3.5 font-semibold">Date Received</th>
                <th className="px-4 py-3.5 font-semibold">Inspection Officer</th>
                <th className="px-4 py-3.5 font-semibold">Status</th>
                <th className="px-4 py-3.5 font-semibold text-right">Batch Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredGRNs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                    <p className="text-sm font-medium">No Goods Receipt Notes recorded</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Received shipments will appear here once inspected.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredGRNs.map((grn) => {
                  const isExpanded = expandedGrnId === grn.id;
                  return (
                    <React.Fragment key={grn.id}>
                      <tr className="hover:bg-slate-800/30 transition">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <Truck className="w-4 h-4 text-purple-400 shrink-0" />
                            <span className="font-mono font-semibold text-white">{grn.grnNumber}</span>
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5">
                            Value: {grn.totalValue}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <span className="font-mono text-xs font-medium text-blue-400 bg-blue-950/40 px-2 py-0.5 rounded border border-blue-900/30">
                            {grn.poNumber}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-xs">
                          <div className="font-medium text-slate-200 flex items-center gap-1.5">
                            <Building className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                            <span>{grn.vendorName}</span>
                          </div>
                          <div className="text-slate-500 mt-0.5">
                            Waybill: <span className="font-mono text-slate-400">{grn.deliveryNoteNumber}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-xs text-slate-300">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                            <span>{new Date(grn.receivedDate).toLocaleDateString('en-GB')}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-xs text-slate-300">
                          <div className="flex items-center gap-1.5 font-medium">
                            <UserCheck className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                            <span>{grn.inspectionOfficer}</span>
                          </div>
                          <div className="text-[11px] text-slate-500">Recv: {grn.receivedBy}</div>
                        </td>
                        <td className="px-4 py-4">
                          {grn.status === 'INSPECTED_ACCEPTED' ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Accepted & Stocked
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
                              <XCircle className="w-3.5 h-3.5" />
                              Rejected / Damaged
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-4 text-right">
                          <button
                            onClick={() => toggleExpand(grn.id)}
                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition inline-flex items-center gap-1"
                          >
                            <span>{grn.receivedItems.length} Items</span>
                            {isExpanded ? (
                              <ChevronUp className="w-3.5 h-3.5" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </td>
                      </tr>

                      {/* Expandable items detail row */}
                      {isExpanded && (
                        <tr className="bg-slate-950/70 border-b border-slate-800/80">
                          <td colSpan={7} className="px-8 py-4">
                            <div className="space-y-2">
                              <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                                QA Batch & Expiry Breakdown ({grn.grnNumber})
                              </div>
                              <div className="border border-slate-800 rounded-xl overflow-hidden">
                                <table className="w-full text-xs text-slate-300">
                                  <thead className="bg-slate-900 text-slate-400">
                                    <tr>
                                      <th className="px-4 py-2 font-medium">Item Name</th>
                                      <th className="px-4 py-2 font-medium text-right">Ordered</th>
                                      <th className="px-4 py-2 font-medium text-right">Received</th>
                                      <th className="px-4 py-2 font-medium">Batch Number</th>
                                      <th className="px-4 py-2 font-medium">Expiry Date</th>
                                      <th className="px-4 py-2 font-medium text-center">QA Result</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-800/60">
                                    {grn.receivedItems.map((item, idx) => (
                                      <tr key={idx} className="hover:bg-slate-900/40">
                                        <td className="px-4 py-2 font-medium text-white">
                                          {item.itemName}
                                        </td>
                                        <td className="px-4 py-2 text-right text-slate-400">
                                          {item.quantityOrdered}
                                        </td>
                                        <td className="px-4 py-2 text-right font-semibold text-white">
                                          {item.quantityReceived}
                                        </td>
                                        <td className="px-4 py-2 font-mono text-purple-300">
                                          {item.batchNumber}
                                        </td>
                                        <td className="px-4 py-2 text-slate-300">{item.expiryDate}</td>
                                        <td className="px-4 py-2 text-center">
                                          {item.inspectionPass ? (
                                            <span className="text-emerald-400 font-medium">PASS</span>
                                          ) : (
                                            <span className="text-rose-400 font-medium">
                                              FAIL {item.discrepancyReason ? `(${item.discrepancyReason})` : ''}
                                            </span>
                                          )}
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

      {/* Modal */}
      <GoodsReceiptModal
        isOpen={isModalOpen}
        approvedPOs={approvedPOs}
        onClose={() => setIsModalOpen(false)}
        onGRNCreated={(created) => {
          onGRNCreated(created);
        }}
      />
    </div>
  );
};
