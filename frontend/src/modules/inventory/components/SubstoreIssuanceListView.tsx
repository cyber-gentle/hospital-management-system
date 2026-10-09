import React, { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  Send,
  Building2,
  Calendar,
  UserCheck,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { InventoryItem, SubstoreIssuance } from '../types';
import { SubstoreIssuanceModal } from './SubstoreIssuanceModal';

interface SubstoreIssuanceListViewProps {
  issuances: SubstoreIssuance[];
  catalogItems: InventoryItem[];
  onRefresh: () => void;
  onIssuanceCreated: (issuance: SubstoreIssuance) => void;
}

export const SubstoreIssuanceListView: React.FC<SubstoreIssuanceListViewProps> = ({
  issuances,
  catalogItems,
  onRefresh,
  onIssuanceCreated,
}) => {
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filteredIssuances = useMemo(() => {
    return issuances.filter((iss) => {
      if (search.trim()) {
        const q = search.toLowerCase();
        const matches =
          iss.requisitionId.toLowerCase().includes(q) ||
          iss.targetDepartment.toLowerCase().includes(q) ||
          iss.issuedBy.toLowerCase().includes(q) ||
          (iss.receivedBy && iss.receivedBy.toLowerCase().includes(q));
        if (!matches) return false;
      }
      return true;
    });
  }, [issuances, search]);

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="space-y-4">
      {/* Search & Actions Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        <div className="relative flex-1 max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
            <Search className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by requisition #, ward/department, or storekeeper..."
            className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-teal-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onRefresh}
            title="Refresh Issuances"
            className="p-2 rounded-xl border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-sm font-medium transition shadow-lg shadow-teal-900/30 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Dispatch Buffer Supplies</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950/80 text-xs text-slate-400 uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="px-5 py-3.5 font-semibold">Docket & Requisition</th>
                <th className="px-4 py-3.5 font-semibold">Target Ward / Unit</th>
                <th className="px-4 py-3.5 font-semibold">Items Dispatched</th>
                <th className="px-4 py-3.5 font-semibold">Date Dispatched</th>
                <th className="px-4 py-3.5 font-semibold">Storekeeper</th>
                <th className="px-4 py-3.5 font-semibold">Status</th>
                <th className="px-4 py-3.5 font-semibold text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredIssuances.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                    <p className="text-sm font-medium">No substore issuances found</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Dispatch supplies to ward sub-stores using the action button above.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredIssuances.map((iss) => {
                  const isExpanded = expandedId === iss.id;
                  return (
                    <React.Fragment key={iss.id}>
                      <tr className="hover:bg-slate-800/30 transition">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <Send className="w-4 h-4 text-teal-400 shrink-0" />
                            <span className="font-mono font-semibold text-white">{iss.id}</span>
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5">
                            Ref: <span className="font-mono text-slate-400">{iss.requisitionId}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-xs">
                          <div className="font-medium text-slate-200 flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                            <span>{iss.targetDepartment}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-xs text-slate-300">
                          <span className="font-medium text-white">{iss.items.length}</span> supply lines
                        </td>
                        <td className="px-4 py-4 text-xs text-slate-300">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                            <span>{new Date(iss.issuedDate).toLocaleDateString('en-GB')}</span>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-xs text-slate-300">
                          <div className="flex items-center gap-1.5">
                            <UserCheck className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                            <span>{iss.issuedBy}</span>
                          </div>
                          {iss.receivedBy && (
                            <div className="text-[11px] text-emerald-400 mt-0.5">
                              Recv: {iss.receivedBy}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          {iss.status === 'ACKNOWLEDGED' ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Acknowledged
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                              <Clock className="w-3.5 h-3.5" />
                              Dispatched
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-4 text-right">
                          <button
                            onClick={() => toggleExpand(iss.id)}
                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition inline-flex items-center gap-1"
                          >
                            <span>Items</span>
                            {isExpanded ? (
                              <ChevronUp className="w-3.5 h-3.5" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </td>
                      </tr>

                      {/* Expandable items detail */}
                      {isExpanded && (
                        <tr className="bg-slate-950/70 border-b border-slate-800/80">
                          <td colSpan={7} className="px-8 py-4">
                            <div className="space-y-2">
                              <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                                Dispatched Items Breakdown ({iss.targetDepartment})
                              </div>
                              <div className="border border-slate-800 rounded-xl overflow-hidden">
                                <table className="w-full text-xs text-slate-300">
                                  <thead className="bg-slate-900 text-slate-400">
                                    <tr>
                                      <th className="px-4 py-2 font-medium">Supply Item</th>
                                      <th className="px-4 py-2 font-medium text-right">Requested</th>
                                      <th className="px-4 py-2 font-medium text-right">Issued</th>
                                      <th className="px-4 py-2 font-medium">Batch Number</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-800/60">
                                    {iss.items.map((item, idx) => (
                                      <tr key={idx} className="hover:bg-slate-900/40">
                                        <td className="px-4 py-2 font-medium text-white">
                                          {item.itemName}
                                        </td>
                                        <td className="px-4 py-2 text-right text-slate-400">
                                          {item.quantityRequested}
                                        </td>
                                        <td className="px-4 py-2 text-right font-semibold text-teal-400">
                                          {item.quantityIssued}
                                        </td>
                                        <td className="px-4 py-2 font-mono text-purple-300">
                                          {item.batchNumber}
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
      <SubstoreIssuanceModal
        isOpen={isModalOpen}
        catalogItems={catalogItems}
        onClose={() => setIsModalOpen(false)}
        onIssuanceCreated={(created) => {
          onIssuanceCreated(created);
        }}
      />
    </div>
  );
};
