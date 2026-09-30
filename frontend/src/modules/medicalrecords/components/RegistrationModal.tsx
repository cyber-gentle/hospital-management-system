import React, { useState } from "react";
import { X, UserPlus, Shield, HeartPulse, CreditCard, AlertCircle } from "lucide-react";
import { CreatePatientFormInput, NHIAScheme, PaymentCategory } from "../types";

interface RegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreatePatientFormInput) => Promise<void>;
}

export const RegistrationModal: React.FC<RegistrationModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [formData, setFormData] = useState<CreatePatientFormInput>({
    first_name: "",
    last_name: "",
    other_names: "",
    date_of_birth: "",
    gender: "MALE",
    phone_number: "",
    email: "",
    address: "",
    blood_group: "O+",
    genotype: "AA",
    marital_status: "Single",
    emergency_contact_name: "",
    emergency_contact_phone: "",
    emergency_contact_relationship: "Next of Kin",
    payment_category: "CASH",
    nhia_number: "",
    nhia_scheme: "NHIA_FORMAL",
    registration_fee_paid: true,
    registration_fee_receipt_no: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [photoLoading, setPhotoLoading] = useState(false);

  const handlePhoto = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 512 * 1024) {
      setError('Choose a JPEG, PNG or WebP photo no larger than 512 KB.');
      event.target.value = '';
      return;
    }
    setPhotoLoading(true);
    const reader = new FileReader();
    reader.onload = () => { setFormData(previous => ({ ...previous, photo_data_url: String(reader.result) })); setPhotoLoading(false); setError(null); };
    reader.onerror = () => { setError('Unable to read the patient photo.'); setPhotoLoading(false); };
    reader.readAsDataURL(file);
  };

  if (!isOpen) return null;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (photoLoading) return;
    setError(null);

    // Validation
    if (!formData.first_name.trim() || !formData.last_name.trim()) {
      setError("First and Last name are mandatory.");
      return;
    }
    if (!formData.date_of_birth) {
      setError("Date of birth is mandatory.");
      return;
    }
    if (new Date(formData.date_of_birth) > new Date()) {
      setError("Date of birth cannot be in the future.");
      return;
    }
    if (!formData.address.trim()) {
      setError("Residential address is mandatory.");
      return;
    }
    if (!formData.emergency_contact_name.trim() || !formData.emergency_contact_phone.trim()) {
      setError("Emergency contact name and phone number are mandatory.");
      return;
    }
    if (formData.payment_category === "NHIA" && !formData.nhia_number?.trim()) {
      setError("NHIA/HMO identifier number is required for NHIA payment category.");
      return;
    }

    try {
      setLoading(true);
      await onSubmit(formData);
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to register patient";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                New Patient Registration (FR-MR-02)
              </h2>
              <p className="text-xs text-slate-500">
                Enroll a new patient into the Master Patient Index and issue an atomic Hospital Number (FR-MR-03).
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          <label className="block text-xs font-semibold text-slate-700">Patient photo (optional, up to 512 KB)
            <input type="file" accept="image/jpeg,image/png,image/webp" capture="user" onChange={handlePhoto} className="block mt-2" />
          </label>
          {photoLoading && <p role="status">Reading photo…</p>}
          {formData.photo_data_url && <img src={formData.photo_data_url} alt="Patient photo preview" className="w-24 h-28 object-cover rounded-lg" />}
          {/* Section 1: Demographics */}
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-blue-700 uppercase tracking-wider mb-3">
              <HeartPulse className="w-4 h-4" />
              <span>1. Patient Demographics</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  First Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  placeholder="e.g. Ibrahim"
                  required
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Last Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  placeholder="e.g. Balogun"
                  required
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Other Names</label>
                <input
                  type="text"
                  name="other_names"
                  value={formData.other_names || ""}
                  onChange={handleChange}
                  placeholder="e.g. Chinedu"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Date of Birth <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  name="date_of_birth"
                  value={formData.date_of_birth}
                  onChange={handleChange}
                  max={new Date().toISOString().split("T")[0]}
                  required
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Gender <span className="text-rose-500">*</span>
                </label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                >
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Marital Status</label>
                <select
                  name="marital_status"
                  value={formData.marital_status}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                >
                  <option value="Single">Single</option>
                  <option value="Married">Married</option>
                  <option value="Divorced">Divorced</option>
                  <option value="Widowed">Widowed</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  name="phone_number"
                  value={formData.phone_number || ""}
                  onChange={handleChange}
                  placeholder="+234..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email || ""}
                  onChange={handleChange}
                  placeholder="patient@example.com"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Blood Group</label>
                <select
                  name="blood_group"
                  value={formData.blood_group}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                >
                  {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((bg) => (
                    <option key={bg} value={bg}>
                      {bg}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Genotype</label>
                <select
                  name="genotype"
                  value={formData.genotype}
                  onChange={handleChange}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                >
                  {["AA", "AS", "SS", "AC", "SC"].map((gt) => (
                    <option key={gt} value={gt}>
                      {gt}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Residential Address <span className="text-rose-500">*</span>
              </label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleChange}
                rows={2}
                placeholder="House No, Street, Town/LGA, State"
                required
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Section 2: Emergency Contact */}
          <div className="pt-4 border-t border-slate-100">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-700 uppercase tracking-wider mb-3">
              <Shield className="w-4 h-4" />
              <span>2. Emergency Contact (Next of Kin)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Contact Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="emergency_contact_name"
                  value={formData.emergency_contact_name}
                  onChange={handleChange}
                  placeholder="Full name of contact"
                  required
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Contact Phone <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  name="emergency_contact_phone"
                  value={formData.emergency_contact_phone}
                  onChange={handleChange}
                  placeholder="+234..."
                  required
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Relationship <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="emergency_contact_relationship"
                  value={formData.emergency_contact_relationship}
                  onChange={handleChange}
                  placeholder="Spouse, Mother, Sibling..."
                  required
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Billing & Health Insurance */}
          <div className="pt-4 border-t border-slate-100">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 uppercase tracking-wider mb-3">
              <CreditCard className="w-4 h-4" />
              <span>3. Payment Category & Insurance (FR-MR-06)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Category</label>
                <select
                  name="payment_category"
                  value={formData.payment_category}
                  onChange={(e) => {
                    const cat = e.target.value as PaymentCategory;
                    setFormData((prev) => ({
                      ...prev,
                      payment_category: cat,
                      registration_fee_paid: cat === "NHIA" || cat === "RETAINERSHIP" ? true : prev.registration_fee_paid,
                    }));
                  }}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                >
                  <option value="CASH">Out-of-Pocket (Cash)</option>
                  <option value="NHIA">National Health Insurance (NHIA/HMO)</option>
                  <option value="RETAINERSHIP">Corporate Retainership</option>
                </select>
              </div>

              {formData.payment_category === "NHIA" && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      NHIA / HMO Number <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="nhia_number"
                      value={formData.nhia_number || ""}
                      onChange={handleChange}
                      placeholder="e.g. NHIA-123456"
                      required
                      className="w-full px-3 py-2 text-xs bg-emerald-50/50 border border-emerald-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">NHIA Plan Type</label>
                    <select
                      name="nhia_scheme"
                      value={formData.nhia_scheme}
                      onChange={(e) => setFormData((prev) => ({ ...prev, nhia_scheme: e.target.value as NHIAScheme }))}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                    >
                      <option value="NHIA_FORMAL">NHIA Formal Sector Program</option>
                      <option value="NHIA_INFORMAL">NHIA Informal Sector (GIFSHIP)</option>
                      <option value="NHIA_VULNERABLE">NHIA Vulnerable Group Fund</option>
                      <option value="STATE_SCHEME">State Social Health Insurance (SSHIS)</option>
                      <option value="PRIVATE_HMO">Private HMO Retainer</option>
                    </select>
                  </div>
                </>
              )}

              {formData.payment_category === "CASH" && (
                <>
                  <div className="flex items-center pt-6">
                    <label className="relative flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        name="registration_fee_paid"
                        checked={formData.registration_fee_paid}
                        onChange={handleChange}
                        className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                      />
                      <span>Registration Fee Settled (₦2,500)</span>
                    </label>
                  </div>

                  {formData.registration_fee_paid && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Cash Receipt No.</label>
                      <input
                        type="text"
                        name="registration_fee_receipt_no"
                        value={formData.registration_fee_receipt_no || ""}
                        onChange={handleChange}
                        placeholder="REC-2026-..."
                        className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Form Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
            <p className="text-[11px] text-slate-400">
              Hospital number sequence is atomic & compliant with Federal MOH patient folder indexing.
            </p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={loading || photoLoading}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || photoLoading}
                className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-md shadow-blue-500/20 transition-all active:scale-95 disabled:opacity-50"
              >
                {loading ? "Generating Record..." : "Register & Issue Card"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
