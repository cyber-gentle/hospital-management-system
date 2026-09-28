import React, { useState, useEffect } from 'react';
import { Prescription, Drug, AllergyAlert } from '../types';
import { pharmacyApi } from '../api';

interface DispenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  prescription: Prescription | null;
  onDispenseSuccess: () => void;
}

export const DispenseModal: React.FC<DispenseModalProps> = ({
  isOpen,
  onClose,
  prescription,
  onDispenseSuccess
}) => {
  const [pharmacistName, setPharmacistName] = useState('Pharm. U. Chukwu, B.Pharm');
  const [dispenseSelections, setDispenseSelections] = useState<{ [itemId: string]: number }>({});
  const [allergyAlerts, setAllergyAlerts] = useState<AllergyAlert[]>([]);
  const [overrideReason, setOverrideReason] = useState('');
  const [drugs, setDrugs] = useState<Drug[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && prescription) {
      loadDrugsAndCheckAllergies();
      // Initialize dispense quantities to remaining prescribed
      const initialQty: { [itemId: string]: number } = {};
      prescription.items.forEach(item => {
        initialQty[item.id] = Math.max(0, item.quantityPrescribed - item.quantityDispensed);
      });
      setDispenseSelections(initialQty);
    }
  }, [isOpen, prescription]);

  const loadDrugsAndCheckAllergies = async () => {
    if (!prescription) return;
    try {
      const allDrugs = await pharmacyApi.getDrugFormulary();
      setDrugs(allDrugs);

      // FR-PH-02: Run allergy checks against all prescription items
      const alerts: AllergyAlert[] = [];
      for (const item of prescription.items) {
        const drug = allDrugs.find(d => d.id === item.drugId);
        if (drug) {
          const alertResult = await pharmacyApi.checkAllergySafety(prescription, drug);
          if (alertResult.hasConflict) {
            alerts.push(alertResult);
          }
        }
      }
      setAllergyAlerts(alerts);
    } catch (err) {
      console.error(err);
    }
  };

  if (!isOpen || !prescription) return null;

  const hasCriticalAllergy = allergyAlerts.some(a => a.severity === 'critical');
  const requiresOverride = allergyAlerts.some(a => a.requiresOverride);

  const handleQuantityChange = (itemId: string, qty: number) => {
    setDispenseSelections(prev => ({
      ...prev,
      [itemId]: qty
    }));
  };

  const handleDispense = async (e: React.FormEvent) => {
    e.preventDefault();

    if (requiresOverride && !overrideReason.trim()) {
      alert('Clinical allergy alert flagged. You must provide a formal pharmacist clinical justification before dispensing.');
      return;
    }

    const itemsToDispense = Object.entries(dispenseSelections)
      .filter(([_, qty]) => qty > 0)
      .map(([itemId, qty]) => ({
        itemId,
        quantityToDispense: qty
      }));

    if (itemsToDispense.length === 0) {
      alert('Please specify at least one item and quantity to dispense.');
      return;
    }

    setIsSubmitting(true);
    try {
      await pharmacyApi.dispensePrescription(
        prescription.id,
        itemsToDispense,
        pharmacistName,
        requiresOverride ? overrideReason : undefined
      );

      onDispenseSuccess();
      onClose();
    } catch (err) {
      alert((err as Error).message || 'Failed to dispense medication.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-emerald-800 to-teal-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center font-bold text-lg">
              💊
            </div>
            <div>
              <h2 className="text-lg font-bold">Dispense Prescription (FR-PH-02 / FR-PH-03)</h2>
              <p className="text-xs text-emerald-100">
                {prescription.prescriptionNumber} • {prescription.patientName} ({prescription.hospitalNumber})
              </p>
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
        <form onSubmit={handleDispense} className="p-6 overflow-y-auto space-y-6 text-sm">
          {/* FR-PH-02: Clinical Allergy & Contraindication Alert Banner */}
          {allergyAlerts.length > 0 && (
            <div className={`p-4 rounded-xl border space-y-2 ${
              hasCriticalAllergy
                ? 'bg-rose-50 border-rose-300 text-rose-900'
                : 'bg-amber-50 border-amber-300 text-amber-900'
            }`}>
              <div className="flex items-center gap-2 font-bold text-sm">
                <span>⚠️</span>
                <span>{hasCriticalAllergy ? 'CRITICAL DRUG-ALLERGY CONTRAINDICATION DETECTED' : 'CLINICAL ALLERGY CAUTION'}</span>
              </div>
              {allergyAlerts.map((alt, idx) => (
                <p key={idx} className="text-xs leading-relaxed font-medium">
                  {alt.alertMessage}
                </p>
              ))}

              <div className="pt-2 border-t border-rose-200">
                <label className="block text-xs font-bold mb-1">
                  Pharmacist Clinical Override Justification *
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="e.g. Discussed with Consultant Dr. Ibrahim. Patient skin prick test negative; premedication administered; desensitization protocol active."
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  className="w-full px-3 py-1.5 border border-rose-300 rounded-lg text-xs bg-white text-slate-800"
                />
              </div>
            </div>
          )}

          {/* Patient Details & Prescriber Banner */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div>
              <span className="text-slate-400 block">Patient Category:</span>
              <strong className="text-slate-800">{prescription.patientType}</strong>
              {prescription.wardName && (
                <span className="block text-[11px] text-slate-500 font-mono">
                  {prescription.wardName} (Bed {prescription.bedNumber})
                </span>
              )}
            </div>

            <div>
              <span className="text-slate-400 block">Known Allergies:</span>
              <span className="font-semibold text-rose-700">
                {prescription.knownAllergies.join(', ') || 'None Reported'}
              </span>
            </div>

            <div>
              <span className="text-slate-400 block">Prescribing Physician:</span>
              <span className="text-slate-800 font-medium">{prescription.prescriberName}</span>
              <span className="block text-[11px] text-slate-400">{prescription.prescriberDepartment}</span>
            </div>

            <div>
              <span className="text-slate-400 block">Tariff Scheme:</span>
              <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${
                prescription.payerScheme === 'NHIA'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-slate-200 text-slate-800'
              }`}>
                {prescription.payerScheme}
              </span>
            </div>
          </div>

          {/* Prescribed Items & Stock Verification Table */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Prescription Items & Real-Time Stock Check (FR-PH-03)
            </h3>

            <div className="space-y-3">
              {prescription.items.map((item) => {
                const drug = drugs.find(d => d.id === item.drugId);
                const currentStock = drug ? drug.stockOnHand : 0;
                const remainingToDispense = item.quantityPrescribed - item.quantityDispensed;
                const isOutOfStock = currentStock === 0;
                const isLowStock = currentStock < remainingToDispense;

                return (
                  <div
                    key={item.id}
                    className={`p-4 rounded-xl border transition-all ${
                      item.isDispensed
                        ? 'bg-slate-50 border-slate-200 opacity-60'
                        : isOutOfStock
                        ? 'bg-rose-50/50 border-rose-300'
                        : isLowStock
                        ? 'bg-amber-50/50 border-amber-300'
                        : 'bg-white border-slate-200'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-slate-900 text-sm">{item.drugName}</h4>
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                            {item.dosageForm} • {item.strength}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 font-medium mt-0.5">
                          Dosage: <strong className="text-slate-800">{item.dosage}</strong> • Route: <strong>{item.route}</strong> • Freq: <strong>{item.frequency}</strong> ({item.durationDays} days)
                        </p>
                      </div>

                      {/* Stock Badge */}
                      <div className="text-right">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          isOutOfStock
                            ? 'bg-rose-100 text-rose-800'
                            : isLowStock
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          Stock: {currentStock} Available
                        </span>
                      </div>
                    </div>

                    {/* Dispense Label Instructions */}
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-xs text-slate-600 mb-3">
                      <span className="text-[10px] font-bold uppercase text-slate-400 block mb-0.5">Dispensing Label Directions:</span>
                      "{item.instructions}"
                    </div>

                    {/* Dispense Quantity Control */}
                    {!item.isDispensed ? (
                      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
                        <div className="text-xs text-slate-500">
                          Prescribed: <strong className="text-slate-800">{item.quantityPrescribed}</strong> • Previously Dispensed: <strong className="text-slate-800">{item.quantityDispensed}</strong>
                        </div>

                        <div className="flex items-center gap-2">
                          <label className="text-xs font-semibold text-slate-700">Quantity to Dispense Now:</label>
                          <input
                            type="number"
                            min="0"
                            max={Math.min(currentStock, remainingToDispense)}
                            disabled={isOutOfStock}
                            value={dispenseSelections[item.id] || 0}
                            onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value) || 0)}
                            className="w-20 px-2 py-1 border border-slate-300 rounded-lg text-xs font-mono font-bold text-center outline-none focus:ring-2 focus:ring-emerald-500"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="text-xs font-bold text-emerald-700 flex items-center gap-1 pt-1">
                        <span>✓</span> Fully Dispensed ({item.quantityDispensed} units)
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Pharmacist Signature Block */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Dispensing Pharmacist *</label>
              <input
                type="text"
                required
                value={pharmacistName}
                onChange={(e) => setPharmacistName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
              />
            </div>

            <div className="flex items-center text-xs text-slate-500">
              <span>
                📦 Stock levels will automatically decrement from the central dispensary inventory upon confirmation.
              </span>
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
              {isSubmitting ? 'Dispensing...' : 'Confirm Dispensing & Deduct Stock →'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
