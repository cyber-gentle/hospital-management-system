import React, { useState, useEffect } from 'react';
import { Invoice, AgedDebtorSummary, InvoiceStatus, PayerScheme } from './types';
import { billingApi } from './api';
import { CreateInvoiceModal } from './components/CreateInvoiceModal';
import { PaymentReceiptModal } from './components/PaymentReceiptModal';
import { InvoiceDetailDrawer } from './components/InvoiceDetailDrawer';

export const BillingView: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [agedSummary, setAgedSummary] = useState<AgedDebtorSummary | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus | 'all'>('all');
  const [payerFilter, setPayerFilter] = useState<PayerScheme | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [includeDeleted, setIncludeDeleted] = useState(false);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  useEffect(() => {
    loadData();
  }, [includeDeleted]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [invoiceList, summary] = await Promise.all([
        billingApi.getInvoices({ includeDeleted }),
        billingApi.getAgedSummary()
      ]);
      setInvoices(invoiceList);
      setAgedSummary(summary);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenPayment = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setIsPaymentModalOpen(true);
  };

  const handleOpenDrawer = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setIsDetailDrawerOpen(true);
  };

  // Filtered List
  const filteredInvoices = invoices.filter(inv => {
    if (statusFilter !== 'all' && inv.status !== statusFilter) return false;
    if (payerFilter !== 'all' && inv.payerScheme !== payerFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      return (
        inv.invoiceNumber.toLowerCase().includes(q) ||
        inv.patientName.toLowerCase().includes(q) ||
        inv.hospitalNumber.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white p-6 rounded-3xl shadow-lg border border-emerald-800/40 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-200 border border-emerald-400/30">
                Build Group 1 • Financial Operations
              </span>
              <span className="text-xs text-emerald-300">FR-AC-01 to FR-AC-08</span>
            </div>
            <h1 className="text-2xl font-black tracking-tight">Accounts & Patient Billing</h1>
            <p className="text-xs text-emerald-200 mt-1">
              Central Cashier Station: <strong className="text-white">Cashier G. Alabi (Terminal 01)</strong> • NHIA Tariffs & Patient Ledger
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
            >
              <span>+</span> New Patient Invoice (FR-AC-01)
            </button>
          </div>
        </div>
      </div>

      {/* Financial KPIs & Aged Debtors Breakdown (FR-AC-02) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>Total Revenue Billed</span>
            <span className="text-blue-600 font-bold">Gross</span>
          </div>
          <p className="text-2xl font-black text-slate-900">
            ₦{(agedSummary?.totalRevenueBilled || 0).toLocaleString()}
          </p>
          <div className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-400">
            <span>Across all active invoices</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-emerald-200 shadow-xs bg-emerald-50/20">
          <div className="flex items-center justify-between text-xs text-emerald-700 mb-1">
            <span className="font-semibold">Cash / POS Collected</span>
            <span className="text-emerald-600 font-bold text-xs">Verified</span>
          </div>
          <p className="text-2xl font-black text-emerald-700">
            ₦{(agedSummary?.totalCashCollected || 0).toLocaleString()}
          </p>
          <div className="mt-1 flex items-center gap-1.5 text-[11px] text-emerald-600 font-medium">
            <span>✓ Settled into Hospital Bank</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-rose-200 shadow-xs bg-rose-50/20">
          <div className="flex items-center justify-between text-xs text-rose-700 mb-1">
            <span className="font-semibold">Outstanding Patient Debt</span>
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
          </div>
          <p className="text-2xl font-black text-rose-600">
            ₦{(agedSummary?.totalOutstanding || 0).toLocaleString()}
          </p>
          <div className="mt-1 flex items-center gap-1.5 text-[11px] text-rose-600 font-medium">
            <span>Pending settlement / co-pay</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-blue-200 shadow-xs bg-blue-50/20">
          <div className="flex items-center justify-between text-xs text-blue-700 mb-1">
            <span className="font-semibold">NHIA Claims Primary (90%)</span>
            <span className="text-blue-600 font-bold text-xs">Capitation</span>
          </div>
          <p className="text-2xl font-black text-blue-700">
            ₦{(agedSummary?.totalNhiaPending || 0).toLocaleString()}
          </p>
          <div className="mt-1 flex items-center gap-1.5 text-[11px] text-blue-600 font-medium">
            <span>Bundled for NHIA Module</span>
          </div>
        </div>
      </div>

      {/* Aged Invoices Breakdown (FR-AC-02) */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
          <span>Aged Invoices Debt Breakdown (FR-AC-02)</span>
          <span className="font-normal text-[11px] text-slate-400">Aging from date of service</span>
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-slate-500 block text-[11px]">Current (0 - 30 Days)</span>
            <strong className="text-slate-900 font-mono text-sm">
              ₦{(agedSummary?.current0to30 || 0).toLocaleString()}
            </strong>
          </div>
          <div className="p-3 rounded-xl bg-yellow-50/60 border border-yellow-200">
            <span className="text-yellow-800 block text-[11px]">31 - 60 Days</span>
            <strong className="text-yellow-900 font-mono text-sm">
              ₦{(agedSummary?.days31to60 || 0).toLocaleString()}
            </strong>
          </div>
          <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200">
            <span className="text-amber-800 block text-[11px]">61 - 90 Days</span>
            <strong className="text-amber-900 font-mono text-sm">
              ₦{(agedSummary?.days61to90 || 0).toLocaleString()}
            </strong>
          </div>
          <div className="p-3 rounded-xl bg-rose-50/60 border border-rose-200">
            <span className="text-rose-800 block text-[11px]">Over 90 Days (Overdue)</span>
            <strong className="text-rose-900 font-mono text-sm">
              ₦{(agedSummary?.over90days || 0).toLocaleString()}
            </strong>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200">
        {/* Status Chips */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="font-semibold text-slate-500 mr-1">Status:</span>
          {(['all', 'issued', 'partially_paid', 'paid', 'cancelled'] as const).map(st => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 rounded-lg font-bold capitalize transition-colors ${
                statusFilter === st
                  ? 'bg-slate-800 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st.replace('_', ' ')}
            </button>
          ))}
        </div>

        {/* Scheme & Search */}
        <div className="flex items-center gap-2">
          <select
            value={payerFilter}
            onChange={(e) => setPayerFilter(e.target.value as PayerScheme | 'all')}
            className="px-2.5 py-1.5 border border-slate-300 rounded-xl text-xs font-semibold bg-white"
          >
            <option value="all">All Payers</option>
            <option value="Cash">Cash Paying</option>
            <option value="NHIA">NHIA Enrollees</option>
            <option value="Retainership">Retainership</option>
          </select>

          <input
            type="text"
            placeholder="Search invoice, patient, no..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full sm:w-56 px-3 py-1.5 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500"
          />

          <label className="flex items-center gap-1.5 text-xs text-slate-500 cursor-pointer ml-1 select-none">
            <input
              type="checkbox"
              checked={includeDeleted}
              onChange={(e) => setIncludeDeleted(e.target.checked)}
              className="w-3.5 h-3.5 rounded text-rose-600 border-slate-300"
            />
            <span>Show Voided</span>
          </label>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-5 py-3">Invoice Details</th>
                <th className="px-5 py-3">Patient & Demographics</th>
                <th className="px-5 py-3">Payer Scheme</th>
                <th className="px-5 py-3 text-right">Gross Total</th>
                <th className="px-5 py-3 text-right">Net Patient Due</th>
                <th className="px-5 py-3 text-right">Balance Due</th>
                <th className="px-5 py-3 text-center">Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-400">Loading invoices...</td>
                </tr>
              ) : filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-400">No invoices matching current filter.</td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => (
                  <tr key={inv.id} className={`hover:bg-slate-50/60 transition-colors ${inv.isDeleted ? 'bg-rose-50/20 opacity-60' : ''}`}>
                    {/* Invoice Meta */}
                    <td className="px-5 py-3.5">
                      <div className="font-mono font-bold text-slate-900 text-xs">
                        {inv.invoiceNumber}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {new Date(inv.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                    </td>

                    {/* Patient */}
                    <td className="px-5 py-3.5">
                      <div className="font-bold text-slate-900 text-xs">
                        {inv.patientName}
                      </div>
                      <div className="font-mono text-[11px] text-slate-500">
                        {inv.hospitalNumber}
                      </div>
                    </td>

                    {/* Payer Scheme */}
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        inv.payerScheme === 'NHIA'
                          ? 'bg-blue-100 text-blue-800'
                          : inv.payerScheme === 'Retainership'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        {inv.payerScheme}
                      </span>
                    </td>

                    {/* Gross */}
                    <td className="px-5 py-3.5 text-right font-mono text-slate-600">
                      ₦{inv.totalGrossAmount.toLocaleString()}
                    </td>

                    {/* Net Due */}
                    <td className="px-5 py-3.5 text-right font-mono font-semibold text-slate-800">
                      ₦{inv.netAmountDue.toLocaleString()}
                      {inv.depositApplied > 0 && (
                        <span className="block text-[10px] text-emerald-600">
                          (-₦50k deposit)
                        </span>
                      )}
                    </td>

                    {/* Balance */}
                    <td className="px-5 py-3.5 text-right font-mono font-black text-xs">
                      <span className={inv.balanceDue > 0 ? 'text-rose-600' : 'text-emerald-700'}>
                        ₦{inv.balanceDue.toLocaleString()}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-5 py-3.5 text-center">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        inv.status === 'paid'
                          ? 'bg-emerald-100 text-emerald-800'
                          : inv.status === 'partially_paid'
                          ? 'bg-amber-100 text-amber-800'
                          : inv.status === 'cancelled'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {inv.status.replace('_', ' ')}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-3.5 text-right space-x-1.5 whitespace-nowrap">
                      {inv.balanceDue > 0 && !inv.isDeleted && (
                        <button
                          onClick={() => handleOpenPayment(inv)}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors"
                        >
                          💵 Collect
                        </button>
                      )}

                      <button
                        onClick={() => handleOpenDrawer(inv)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors"
                      >
                        📄 View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <CreateInvoiceModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onInvoiceCreated={loadData}
      />

      <PaymentReceiptModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        invoice={selectedInvoice}
        onPaymentRecorded={loadData}
      />

      <InvoiceDetailDrawer
        isOpen={isDetailDrawerOpen}
        onClose={() => setIsDetailDrawerOpen(false)}
        invoice={selectedInvoice}
        onInvoiceUpdated={loadData}
        onOpenPaymentModal={handleOpenPayment}
      />
    </div>
  );
};
