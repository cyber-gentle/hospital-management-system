import React, { useState, useEffect } from 'react';
import { fetchPatientOptions, PatientOption } from '../../medicalrecords/patientOptions';
import { nursingApi } from '../../nursing/api';
import type { InpatientAdmission } from '../../nursing/types';
import { CreateInvoiceInput, PayerScheme, LineItemCategory } from '../types';
import { billingApi } from '../api';

interface CreateInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInvoiceCreated: () => void;
}

interface DraftItem {
  id: string;
  description: string;
  category: LineItemCategory;
  unitPrice: number;
  quantity: number;
}

export const CreateInvoiceModal: React.FC<CreateInvoiceModalProps> = ({
  isOpen,
  onClose,
  onInvoiceCreated
}) => {
  const [patientName, setPatientName] = useState('');
  const [hospitalNumber, setHospitalNumber] = useState('');
  const [payerScheme, setPayerScheme] = useState<PayerScheme>('Cash');
  const [nhiaNumber, setNhiaNumber] = useState('');
  const [retainershipCompany, setRetainershipCompany] = useState('');
  const [applyDeposit, setApplyDeposit] = useState(false);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPullingNursing, setIsPullingNursing] = useState(false);
  const [patients, setPatients] = useState<PatientOption[]>([]);
  const [patientId, setPatientId] = useState('');
  const [admissions, setAdmissions] = useState<InpatientAdmission[]>([]);
  const [admissionId, setAdmissionId] = useState('');
  const [pulledAdmissionId, setPulledAdmissionId] = useState<string>();
  useEffect(() => {
    if (!isOpen) return;
    let active = true;
    Promise.all([fetchPatientOptions(), nursingApi.getAdmissions()]).then(([list, stays]) => {
      if (active) { setPatients(list); setAdmissions(stays); }
    }).catch(() => alert('Unable to load patient index.'));
    return () => { active = false; };
  }, [isOpen]);

  // Line items state
  const [items, setItems] = useState<DraftItem[]>([
    { id: '1', description: 'Consultant Clinical Consultation', category: 'Consultation', unitPrice: 15000, quantity: 1 }
  ]);

  if (!isOpen) return null;

  const handleAddItem = () => {
    setItems([
      ...items,
      {
        id: Date.now().toString(),
        description: '',
        category: 'Pharmacy',
        unitPrice: 5000,
        quantity: 1
      }
    ]);
  };

  const handleRemoveItem = (id: string) => {
    if (items.length <= 1) return;
    setItems(items.filter(i => i.id !== id));
  };

  const handleItemChange = (id: string, field: keyof DraftItem, value: string | number) => {
    setItems(items.map(item => {
      if (item.id === id) {
        return { ...item, [field]: value };
      }
      return item;
    }));
  };

  // FR-AC-06: Pull consolidated charges from Nursing Tasks and Inpatient Admissions
  const handlePullNursingCharges = async () => {
    setIsPullingNursing(true);
    try {
      if (!admissionId) throw new Error('Select this patient’s admission first.');
      const dossier = await nursingApi.getDischargeDossier(admissionId);
      if (!dossier.canTriggerBilling) throw new Error('Complete the Nursing discharge checklist first.');
      const extracted = await billingApi.pullConsolidatedNursingCharges(admissionId);
      const formatted: DraftItem[] = extracted.map((ex, idx) => ({
        id: `pulled-${Date.now()}-${idx}`,
        description: ex.description,
        category: ex.category,
        unitPrice: ex.unitPrice,
        quantity: ex.quantity
      }));
      setItems(formatted);
      setPulledAdmissionId(admissionId);
      setNotes('Consolidated charges pulled automatically from completed nursing tasks & inpatient bed stay (FR-AC-06).');
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : 'Failed to pull nursing charges.');
    } finally {
      setIsPullingNursing(false);
    }
  };

  // Computations
  const isNhia = payerScheme === 'NHIA';
  const totalGross = items.reduce((acc, i) => acc + (i.unitPrice * i.quantity), 0);
  const totalNhia = isNhia ? Math.round(totalGross * 0.9) : 0;
  const totalPatient = isNhia ? totalGross - totalNhia : totalGross;
  const depositDeduction = applyDeposit ? 50000 : 0;
  const netDue = Math.max(0, totalPatient - depositDeduction);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientId || !patientName.trim() || !hospitalNumber.trim()) {
      alert('Please fill out patient name and hospital number.');
      return;
    }

    setIsSubmitting(true);
    try {
      const input: CreateInvoiceInput = {
        patientId,
        admissionId: pulledAdmissionId,
        patientName,
        hospitalNumber,
        payerScheme,
        nhiaNumber: isNhia ? nhiaNumber : undefined,
        retainershipCompany: payerScheme === 'Retainership' ? retainershipCompany : undefined,
        items: items.map(i => ({
          description: i.description || 'Clinical Service',
          category: i.category,
          unitPrice: Number(i.unitPrice),
          quantity: Number(i.quantity)
        })),
        depositApplied: depositDeduction,
        notes: notes.trim() || undefined
      };

      await billingApi.createInvoice(input);
      onInvoiceCreated();
      onClose();
    } catch (err) {
      console.error(err);
      alert('Failed to generate invoice.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-emerald-800 to-teal-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center font-bold text-lg">
              🧾
            </div>
            <div>
              <h2 className="text-lg font-bold">Create Patient Invoice (FR-AC-01)</h2>
              <p className="text-xs text-emerald-100">NHIA Co-pay Calculation, Nursing Charge Sync & Deposit Offset</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 text-sm">
          <label className="block">Registered patient (MPI) *
            <select aria-label="Billing patient" required value={patientId} className="w-full border rounded-lg p-2" onChange={e => {
              const p = patients.find(patient => patient.id === e.target.value);
              setPatientId(e.target.value); setPatientName(p ? `${p.firstName} ${p.lastName}` : ''); setHospitalNumber(p?.mrn || '');
              setPayerScheme(p?.tariffType || 'Cash'); setNhiaNumber(p?.insuranceNumber || '');
              setAdmissionId(''); setPulledAdmissionId(undefined);
              setItems([{id:'1',description:'Consultant Clinical Consultation',category:'Consultation',unitPrice:15000,quantity:1}]);
            }}><option value="">Select a registered patient</option>
              {patients.map(p => <option key={p.id} value={p.id}>{p.firstName} {p.lastName} — {p.mrn}</option>)}
            </select>
          </label>
          <label className="block">Admission for discharge charges
            <select aria-label="Admission for discharge charges" value={admissionId} className="w-full border rounded-lg p-2" onChange={e => {
              setAdmissionId(e.target.value); setPulledAdmissionId(undefined);
              setItems([{id:'1',description:'Consultant Clinical Consultation',category:'Consultation',unitPrice:15000,quantity:1}]);
            }}><option value="">Select an admission</option>
              {admissions.filter(a => a.patientId === patientId).map(a => <option key={a.id} value={a.id}>{a.wardName} / {a.bedNumber} — {a.admissionDate.slice(0,10)}</option>)}
            </select>
          </label>
          {/* Patient Details & Payer Scheme */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Patient Full Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Amina Bello"
                value={patientName}
                readOnly
                onChange={(e) => setPatientName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Hospital Number *</label>
              <input
                type="text"
                required
                placeholder="e.g. HIMS/2026/000102"
                value={hospitalNumber}
                readOnly
                onChange={(e) => setHospitalNumber(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Payer Scheme *</label>
              <select
                value={payerScheme}
                onChange={(e) => setPayerScheme(e.target.value as PayerScheme)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="Cash">Cash Paying (100% Patient Fee)</option>
                <option value="NHIA">NHIA (90% Scheme / 10% Co-pay)</option>
                <option value="Retainership">Corporate Retainership</option>
              </select>
            </div>
          </div>

          {/* Conditional Payer Details */}
          {isNhia && (
            <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-200 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-xs font-semibold text-blue-900 mb-1">NHIA Enrollee ID Number</label>
                <input
                  type="text"
                  placeholder="e.g. NHIA-88492019-A"
                  value={nhiaNumber}
                  onChange={(e) => setNhiaNumber(e.target.value)}
                  className="w-full px-3 py-1.5 border border-blue-300 rounded-lg text-xs font-mono bg-white"
                />
              </div>
              <div className="flex items-center text-xs text-blue-800">
                <span>
                  ℹ️ <strong>NHIA Statutory Rule:</strong> System automatically bundles 90% to primary insurance and creates a 10% patient co-payment invoice.
                </span>
              </div>
            </div>
          )}

          {payerScheme === 'Retainership' && (
            <div className="p-3 bg-purple-50/60 rounded-xl border border-purple-200 text-xs">
              <label className="block text-xs font-semibold text-purple-900 mb-1">Corporate Client / Organization</label>
              <input
                type="text"
                placeholder="e.g. Nigerian National Petroleum Corporation (NNPC)"
                value={retainershipCompany}
                onChange={(e) => setRetainershipCompany(e.target.value)}
                className="w-full px-3 py-1.5 border border-purple-300 rounded-lg text-xs bg-white"
              />
            </div>
          )}

          {/* Line Items Section */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Itemized Clinical Services & Consumables
              </h3>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePullNursingCharges}
                  disabled={isPullingNursing}
                  className="px-3 py-1.5 bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5"
                >
                  {isPullingNursing ? 'Pulling...' : '⚡ Pull Nursing Ward Charges (FR-AC-06)'}
                </button>

                <button
                  type="button"
                  onClick={handleAddItem}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors"
                >
                  + Add Item
                </button>
              </div>
            </div>

            <div className="space-y-2 border border-slate-200 rounded-xl p-3 bg-slate-50/50">
              {items.map((item) => {
                const gross = item.unitPrice * item.quantity;
                const coPay = isNhia ? Math.round(gross * 0.1) : gross;

                return (
                  <div key={item.id} className="grid grid-cols-12 gap-2 items-center bg-white p-2.5 rounded-lg border border-slate-200 text-xs">
                    <div className="col-span-3">
                      <select
                        value={item.category}
                        onChange={(e) => handleItemChange(item.id, 'category', e.target.value)}
                        className="w-full px-2 py-1.5 border border-slate-200 rounded text-xs"
                      >
                        <option value="Consultation">Consultation</option>
                        <option value="Pharmacy">Pharmacy</option>
                        <option value="Laboratory">Laboratory</option>
                        <option value="Nursing / Bed">Nursing / Bed</option>
                        <option value="Procedure">Procedure</option>
                        <option value="Consumables">Consumables</option>
                      </select>
                    </div>

                    <div className="col-span-4">
                      <input
                        type="text"
                        placeholder="Service / Drug description"
                        value={item.description}
                        onChange={(e) => handleItemChange(item.id, 'description', e.target.value)}
                        className="w-full px-2 py-1.5 border border-slate-200 rounded text-xs"
                      />
                    </div>

                    <div className="col-span-2">
                      <input
                        type="number"
                        min="0"
                        placeholder="Price ₦"
                        value={item.unitPrice}
                        onChange={(e) => handleItemChange(item.id, 'unitPrice', parseFloat(e.target.value) || 0)}
                        className="w-full px-2 py-1.5 border border-slate-200 rounded text-xs font-mono text-right"
                      />
                    </div>

                    <div className="col-span-1">
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(item.id, 'quantity', parseInt(e.target.value) || 1)}
                        className="w-full px-2 py-1.5 border border-slate-200 rounded text-xs font-mono text-center"
                      />
                    </div>

                    <div className="col-span-1 text-right font-mono font-bold text-xs text-slate-800">
                      ₦{coPay.toLocaleString()}
                    </div>

                    <div className="col-span-1 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(item.id)}
                        disabled={items.length <= 1}
                        className="text-slate-400 hover:text-rose-600 disabled:opacity-30"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Admission Deposit Offset (FR-AC-08) */}
          <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-200 flex items-center justify-between">
            <div>
              <label className="flex items-center gap-2 text-xs font-bold text-emerald-950 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={applyDeposit}
                  onChange={(e) => setApplyDeposit(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 border-slate-300"
                />
                <span>Offset with ₦50,000 Admission Deposit (FR-AC-08)</span>
              </label>
              <p className="text-[11px] text-emerald-800 mt-0.5 ml-6">
                Reconciles verified inpatient deposit previously paid at admission gate.
              </p>
            </div>
            <span className="font-mono font-bold text-emerald-800 text-sm">
              {applyDeposit ? '- ₦50,000' : '₦0'}
            </span>
          </div>

          {/* Summary Box */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Gross Total Charges:</span>
              <span className="font-mono">₦{totalGross.toLocaleString()}</span>
            </div>
            {isNhia && (
              <div className="flex justify-between text-blue-700">
                <span>NHIA Primary Insurance Coverage (90%):</span>
                <span className="font-mono">- ₦{totalNhia.toLocaleString()}</span>
              </div>
            )}
            {applyDeposit && (
              <div className="flex justify-between text-emerald-700">
                <span>Admission Deposit Reconciled:</span>
                <span className="font-mono">- ₦{depositDeduction.toLocaleString()}</span>
              </div>
            )}
            <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-sm text-slate-900">
              <span>Net Patient Balance Due:</span>
              <span className="font-mono text-emerald-700 text-base">₦{netDue.toLocaleString()}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white rounded-xl font-bold text-xs shadow-md transition-all flex items-center gap-2"
            >
              {isSubmitting ? 'Generating Invoice...' : 'Issue Invoice & Commit Ledger →'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
