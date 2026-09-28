import React, { useMemo, useState } from "react";
import {
  Bell,
  BookOpen,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  CreditCard,
  FileCheck2,
  FilePlus2,
  FileText,
  HeartPulse,
  LayoutDashboard,
  Menu,
  MoreHorizontal,
  Pencil,
  Pill,
  Printer,
  Receipt,
  RefreshCcw,
  Search,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Trash2,
  UsersRound,
  WalletCards,
  X,
} from "lucide-react";
import { AuthProvider, useAuth, UserRole } from "./lib/auth";

interface Invoice {
  id: string;
  date: string;
  patient: string;
  initials: string;
  service: string;
  billed: string;
  amount: number;
  status: "Draft" | "Unpaid" | "Paid" | "Partial";
}

type ModalView = "detail" | "permissions" | "create" | "adjust" | null;

const invoices: Invoice[] = [
  { id: "INV/2024/05/0456", date: "13/05/2024", patient: "Adeniyi, Boluwatife", initials: "AB", service: "GOPD Consultation", billed: "GOPD Consultation, Pharmacy - Detailed", amount: 18400, status: "Draft" },
  { id: "INV/2024/05/0456", date: "13/05/2024", patient: "Akeniyi, Boluwatife", initials: "AK", service: "Pharmacy - Detailed", billed: "Procedure/Test, Procedures/Test", amount: 125000, status: "Unpaid" },
  { id: "INV/2024/05/0454", date: "13/05/2024", patient: "Oliafex, Orafu", initials: "OO", service: "Pharmacy - Detailed", billed: "Procedure/Test, Procedures/Test", amount: 18450, status: "Paid" },
  { id: "INV/2024/05/0453", date: "13/05/2024", patient: "Imahan, Aniha", initials: "IA", service: "Pharmacy - Detailed", billed: "Procedure/Test, Anlineenment", amount: 73800, status: "Paid" },
  { id: "INV/2024/05/0452", date: "13/05/2024", patient: "Ibrahim, Ahabut", initials: "IA", service: "Pharmacy - Detailed", billed: "Procedure/Test, Tests", amount: 78000, status: "Paid" },
  { id: "INV/2024/05/0451", date: "13/05/2024", patient: "Enzloal, Enzloy", initials: "EE", service: "Pharmacy - Detailed", billed: "Procedure/Test, Equipment", amount: 22000, status: "Paid" },
  { id: "INV/2024/05/0450", date: "13/05/2024", patient: "Adeniyi, Boluwatife", initials: "AB", service: "Pharmacy - Detailed", billed: "-", amount: 78500, status: "Partial" },
  { id: "INV/2024/05/0449", date: "13/05/2024", patient: "Akefon, Olafar", initials: "AO", service: "Pharmacy - Detailed", billed: "Procedure/Test, Tests", amount: 725000, status: "Partial" },
];

const formatNaira = (value: number) => `₦${value.toLocaleString("en-NG", { minimumFractionDigits: 2 })}`;

const roleLabels: Record<UserRole, string> = {
  DOCTOR: "Doctor",
  NURSE: "Nurse",
  PHARMACIST: "Pharmacist",
  ACCOUNTANT: "Accountant",
  CHIEF_ACCOUNTANT: "Chief Accountant",
  NHIA_OFFICER: "NHIA Officer",
  AUDITOR: "Auditor",
  ADMIN: "Administrator",
};

function AppShell() {
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState("Billing / Invoices");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All statuses");
  const fallbackInvoice: Invoice = { id: "INV/2024/05/0000", date: "13/05/2024", patient: "—", initials: "—", service: "—", billed: "—", amount: 0, status: "Draft" };
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice>(() => invoices[1] ?? invoices[0] ?? fallbackInvoice);
  const [modal, setModal] = useState<ModalView>(null);
  const [notice, setNotice] = useState("");

  const filteredInvoices = useMemo(() => invoices.filter((invoice) => {
    const matchesSearch = `${invoice.id} ${invoice.patient} ${invoice.service} ${invoice.billed}`.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "All statuses" || invoice.status === statusFilter;
    return matchesSearch && matchesStatus;
  }), [search, statusFilter]);

  const showNotice = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2600);
  };

  return (
    <div className="min-h-screen bg-[#f4f7fb] text-slate-900">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[220px] flex-col bg-[#071a32] text-white lg:flex">
        <div className="flex h-[72px] items-center gap-3 border-b border-white/10 px-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-emerald-300/70 bg-emerald-400/10 text-emerald-200"><HeartPulse size={22} /></div>
          <div><p className="text-sm font-bold tracking-wide">FUHS TEACHING HOSPITAL</p><p className="text-[10px] text-slate-300">Accounts Department</p></div>
        </div>
        <nav className="flex-1 px-3 py-5 text-sm">
          <SidebarLink icon={<LayoutDashboard size={16} />} label="Dashboard" active={activeSection === "Dashboard"} onClick={() => setActiveSection("Dashboard")} />
          <p className="mb-2 mt-7 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Revenue</p>
          <SidebarLink icon={<FileText size={16} />} label="Billing / Invoices" active={activeSection === "Billing / Invoices"} onClick={() => setActiveSection("Billing / Invoices")} />
          <SidebarLink icon={<WalletCards size={16} />} label="Cash Collections" onClick={() => showNotice("Cash Collections is available from the revenue workspace.")} />
          <SidebarLink icon={<Receipt size={16} />} label="Receipts" onClick={() => showNotice("Receipt history will open from the selected invoice.")} />
          <SidebarLink icon={<RefreshCcw size={16} />} label="Refunds" onClick={() => showNotice("Refunds require a paid invoice and approval.")} />
          <SidebarLink icon={<ShieldCheck size={16} />} label="NHIA / Insurance Claims" onClick={() => showNotice("NHIA claim review is ready for eligible invoices.")} />
          <SidebarLink icon={<BookOpen size={16} />} label="Credit Sales / AR" onClick={() => showNotice("Accounts receivable summary selected.")} />
          <p className="mb-2 mt-7 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Expenses</p>
          <SidebarLink icon={<CreditCard size={16} />} label="Payments" onClick={() => showNotice("Payment collection is linked to invoice receipts.")} />
          <SidebarLink icon={<UsersRound size={16} />} label="Suppliers" onClick={() => showNotice("Supplier records are available to authorised users.")} />
          <SidebarLink icon={<FileCheck2 size={16} />} label="Purchase Onikes" onClick={() => showNotice("Purchase orders selected.")} />
          <SidebarLink icon={<WalletCards size={16} />} label="Expenses" onClick={() => showNotice("Expense tracking selected.")} />
          <p className="mb-2 mt-7 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Reports</p>
          <SidebarLink icon={<FileText size={16} />} label="Reports" onClick={() => showNotice("Reports are being prepared for the current period.")} />
          <p className="mb-2 mt-7 px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Setup</p>
          <SidebarLink icon={<BookOpen size={16} />} label="Chart of Accounts" onClick={() => showNotice("Chart of Accounts selected.")} />
          <SidebarLink icon={<LayoutDashboard size={16} />} label="Cost Centres" onClick={() => showNotice("Cost Centres selected.")} />
          <SidebarLink icon={<UsersRound size={16} />} label="Users & Roles" onClick={() => setModal("permissions")} />
        </nav>
        <div className="m-3 rounded-xl border border-white/20 bg-white/5 p-4 text-xs text-slate-200">
          <div className="mb-3 flex items-center gap-2"><CalendarDays size={15} /><span className="font-semibold">Today&apos;s Date</span></div>
          <p className="text-slate-300">Monday, 13 May 2024</p><p className="mt-3 text-slate-400">Financial Year</p><p className="font-semibold">2024</p>
          <button className="mt-4 flex w-full items-center justify-between rounded-md bg-blue-700 px-3 py-2 text-left font-medium">Period: May 2024 <ChevronDown size={14} /></button>
        </div>
      </aside>

      <div className="lg:pl-[220px]">
        <header className="sticky top-0 z-20 flex h-[72px] items-center gap-4 border-b border-slate-200 bg-white/95 px-4 shadow-sm backdrop-blur md:px-7">
          <button className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden" aria-label="Open menu"><Menu size={20} /></button>
          <div className="relative max-w-[510px] flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search patient, invoice, receipt, NHIA No. or anything..." className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm outline-none transition focus:border-blue-500 focus:bg-white" /></div>
          <div className="hidden items-center gap-5 text-xs font-semibold text-slate-700 md:flex"><TopAction icon={<CircleHelp size={17} />} label="Messages" count="3" /><TopAction icon={<Bell size={17} />} label="Alerts" count="8" /><TopAction icon={<FileCheck2 size={17} />} label="Tasks" count="3" /><Settings size={17} /></div>
          <div className="hidden items-center gap-2 border-l border-slate-200 pl-4 sm:flex"><div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">JO</div><div className="text-right"><p className="text-xs font-bold">{user?.name || "Mr. Jim Okafor"}</p><p className="text-[10px] text-slate-500">{roleLabels[user?.role || "ACCOUNTANT"]}</p></div><ChevronDown size={14} className="text-slate-400" /></div>
        </header>

        <main className="mx-auto max-w-[1430px] p-4 md:p-7">
          <div className="mb-5 flex flex-col justify-between gap-4 md:flex-row md:items-center"><div><p className="mb-1 text-xs font-semibold text-blue-700">Accounts Department / Revenue</p><h1 className="text-2xl font-bold tracking-tight md:text-[28px]">Manage Invoices</h1><button className="mt-2 flex items-center gap-1 text-sm font-semibold text-slate-700">May 2024 <ChevronDown size={16} /></button></div><div className="flex flex-wrap items-center gap-2"><span className="mr-1 hidden text-sm font-semibold text-slate-700 md:inline">Quick Actions</span><button onClick={() => setModal("create")} className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800"><FilePlus2 size={16} /> Create New Invoice</button><button onClick={() => showNotice("Invoice list exported successfully.")} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"><FileText size={16} /> Export Invoice List</button><button onClick={() => showNotice("Invoice list sent to the print queue.")} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"><Printer size={16} /> Bulk Print</button></div></div>

          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_285px]">
            <section className="min-w-0 space-y-5">
              <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><div className="mb-3 flex items-center justify-between"><h2 className="text-sm font-bold">Detailed Filter &amp; Search</h2><button onClick={() => { setSearch(""); setStatusFilter("All statuses"); }} className="text-xs font-semibold text-blue-700 hover:underline">Reset filters</button></div><div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_150px_150px_175px]"><div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by Patient Name, Invoice No., Receipt No., or NHIA No..." className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-xs outline-none focus:border-blue-500" /></div><FilterSelect label="Date Range" icon={<CalendarDays size={15} />} /><FilterSelect label={statusFilter} icon={<SlidersHorizontal size={15} />} options={["All statuses", "Draft", "Unpaid", "Paid", "Partial"]} onChange={setStatusFilter} /><FilterSelect label="Department / Service" icon={<Pill size={15} />} /></div></div>

              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"><div className="flex items-center justify-between border-b border-slate-200 px-4 py-3"><h2 className="text-sm font-bold">Invoice Listing <span className="ml-1 text-xs font-normal text-slate-400">({filteredInvoices.length} records)</span></h2><button className="text-xs font-semibold text-blue-700 hover:underline">View All</button></div><div className="overflow-x-auto"><table className="w-full min-w-[850px] text-left text-xs"><thead className="bg-slate-50 text-[11px] font-bold text-slate-600"><tr><th className="px-3 py-3">Invoice No. <span className="text-blue-700">▲</span></th><th className="px-3 py-3">Date</th><th className="px-3 py-3">Patient Name</th><th className="px-3 py-3">Service / Items</th><th className="px-3 py-3">Billed Items</th><th className="px-3 py-3 text-right">Total Amount (₦)</th><th className="px-3 py-3">Status</th><th className="px-3 py-3">Action</th></tr></thead><tbody>{filteredInvoices.map((invoice, index) => <tr key={`${invoice.id}-${index}`} className={`border-t border-slate-100 transition hover:bg-blue-50/60 ${selectedInvoice === invoice ? "bg-blue-50" : ""}`} onClick={() => setSelectedInvoice(invoice)}><td className="px-3 py-3 font-semibold text-blue-800 underline decoration-blue-200 underline-offset-2">{invoice.id}</td><td className="px-3 py-3 text-slate-600">{invoice.date}</td><td className="whitespace-nowrap px-3 py-3"><span className="mr-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-200 text-[10px] font-bold text-slate-700">{invoice.initials}</span>{invoice.patient}</td><td className="px-3 py-3 font-semibold text-slate-700">{invoice.service}</td><td className="max-w-[170px] px-3 py-3 text-slate-600">{invoice.billed}</td><td className="px-3 py-3 text-right font-bold">{formatNaira(invoice.amount)}</td><td className="px-3 py-3"><StatusBadge status={invoice.status} /></td><td className="whitespace-nowrap px-3 py-3"><button onClick={(event) => { event.stopPropagation(); setSelectedInvoice(invoice); setModal("detail"); }} className="font-semibold text-blue-700 hover:underline">View</button><span className="px-1 text-slate-300">/</span><button onClick={(event) => { event.stopPropagation(); setSelectedInvoice(invoice); setModal("detail"); }} className="font-semibold text-blue-700 hover:underline">Edit</button><span className="px-1 text-slate-300">/</span><button onClick={(event) => { event.stopPropagation(); setSelectedInvoice(invoice); setModal("adjust"); }} className="font-semibold text-rose-600 hover:underline">Delete</button></td></tr>)}</tbody></table></div></div>

              <div className="grid gap-5 md:grid-cols-[335px_minmax(0,1fr)]"><AgedSummary /><div className="hidden rounded-xl border border-slate-200 bg-white md:block" /></div>
            </section>
            <InvoicePreview invoice={selectedInvoice} onOpen={() => setModal("detail")} onAdjust={() => setModal("adjust")} />
          </div>
        </main>
      </div>
      {notice && <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-lg bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-xl">{notice}</div>}
      {modal && <Modal view={modal} invoice={selectedInvoice} onClose={() => setModal(null)} onNotice={showNotice} />}
      <div className="fixed bottom-5 right-5 hidden h-12 w-12 items-center justify-center rounded-full bg-blue-700 text-white shadow-lg md:flex"><CircleHelp size={22} /></div>
    </div>
  );
}

function SidebarLink({ icon, label, active = false, onClick }: { icon: React.ReactNode; label: string; active?: boolean; onClick: () => void }) {
  return <button onClick={onClick} className={`mb-1 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition ${active ? "bg-blue-700 text-white shadow-sm" : "text-slate-300 hover:bg-white/10 hover:text-white"}`}>{icon}<span>{label}</span></button>;
}

function TopAction({ icon, label, count }: { icon: React.ReactNode; label: string; count: string }) { return <button className="relative flex items-center gap-1.5 hover:text-blue-700">{icon}{label}<span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-600 px-1 text-[9px] text-white">{count}</span></button>; }

function FilterSelect({ label, icon, options, onChange }: { label: string; icon: React.ReactNode; options?: string[]; onChange?: (value: string) => void }) {
  return <div className="relative flex items-center rounded-lg border border-slate-200 bg-white"><span className="pointer-events-none pl-3 text-slate-500">{icon}</span><select value={options?.includes(label) ? label : undefined} onChange={(event) => onChange?.(event.target.value)} className="w-full appearance-none bg-transparent py-2.5 pl-2 pr-7 text-xs font-semibold text-slate-700 outline-none"><option value={label}>{label}</option>{options?.filter((option) => option !== label).map((option) => <option key={option}>{option}</option>)}</select><ChevronDown size={14} className="pointer-events-none absolute right-2 text-slate-400" /></div>;
}

function StatusBadge({ status }: { status: Invoice["status"] }) { const styles: Record<Invoice["status"], string> = { Draft: "bg-slate-100 text-slate-700 border-slate-300", Unpaid: "bg-rose-50 text-rose-700 border-rose-200", Paid: "bg-emerald-50 text-emerald-700 border-emerald-200", Partial: "bg-amber-50 text-amber-700 border-amber-200" }; return <span className={`rounded-md border px-2 py-1 text-[10px] font-bold ${styles[status]}`}>{status}</span>; }

function AgedSummary() {
  return <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="text-sm font-bold">Aged Invoices Summary</h2><div className="mt-4 flex items-center gap-5"><div className="relative flex h-32 w-32 shrink-0 items-center justify-center rounded-full" style={{ background: "conic-gradient(#3aa865 0deg 140deg, #f2ad13 140deg 238deg, #e84a35 238deg 328deg, #8e65bd 328deg 360deg)" }}><div className="flex h-20 w-20 items-center justify-center rounded-full bg-white text-center text-xs font-bold leading-tight">Unpaid<br />Invoice</div></div><div className="space-y-2 text-[11px]"><Legend color="bg-emerald-500" label="0 - 15 Days" value="₦86,450,000 (33.7%)" /><Legend color="bg-amber-500" label="16 - 30 Days" value="₦63,250,000 (28.1%)" /><Legend color="bg-rose-500" label="61 - 90 Days" value="₦66,780,000 (16.1%)" /><Legend color="bg-violet-400" label="90+ Days" value="₦439,000 (8.6%)" /></div></div></div>;
}
function Legend({ color, label, value }: { color: string; label: string; value: string }) { return <div className="flex items-center gap-2"><span className={`h-2.5 w-2.5 rounded-full ${color}`} /><span className="min-w-[68px] font-semibold">{label}</span><span className="text-slate-500">{value}</span></div>; }

function InvoicePreview({ invoice, onOpen, onAdjust }: { invoice: Invoice; onOpen: () => void; onAdjust: () => void }) {
  return <aside className="space-y-5"><div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"><div className="mb-3 flex items-center justify-between"><h2 className="text-sm font-bold">Detailed Invoice Preview</h2><MoreHorizontal size={18} className="text-slate-400" /></div><div className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm"><div className="flex items-start justify-between"><div className="flex items-center gap-2"><div className="flex h-8 w-8 items-center justify-center rounded-full border border-emerald-600 text-emerald-700"><ShieldCheck size={20} /></div><div><p className="text-[7px] font-bold">FUHS TEACHING HOSPITAL</p><p className="text-[6px] text-slate-500">Accounts Department</p></div></div><div className="text-right text-[7px] font-bold">{invoice.patient}<p className="font-normal text-slate-500">Account No. 0042</p></div></div><div className="mt-4 border-y border-slate-200 py-2 text-[8px]"><div className="mb-1 flex justify-between font-semibold"><span>Invoice No.</span><span>{invoice.id}</span></div><div className="flex justify-between"><span>Service</span><span>{invoice.service}</span></div></div><div className="space-y-1 py-2 text-[8px] text-slate-600"><div className="flex justify-between"><span>GOPD Consultation</span><span>₦18,400.00</span></div><div className="flex justify-between"><span>Medication &amp; services</span><span>₦{(invoice.amount - 18400).toLocaleString()}</span></div></div><div className="border-t border-dashed border-slate-300 pt-2 text-right text-[9px] font-bold">Total {formatNaira(invoice.amount)}</div></div><button onClick={onOpen} className="mt-3 w-full text-center text-xs font-bold text-blue-700 hover:underline">Interactive Preview</button></div><div className="rounded-xl border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-200 px-4 py-3 text-sm font-bold">Payment Information</div><div className="divide-y divide-slate-100 text-xs"><InfoRow label="Invoice No." value={invoice.id} /><InfoRow label="Payment Methods" value={invoice.status === "Paid" ? formatNaira(invoice.amount) : "Not recorded"} green={invoice.status === "Paid"} /><button onClick={onAdjust} className="flex w-full items-center justify-between px-4 py-3 text-left font-semibold hover:bg-slate-50">Payment Methods <ChevronRight size={15} className="text-slate-400" /></button><button onClick={onOpen} className="flex w-full items-center justify-between px-4 py-3 text-left font-semibold hover:bg-slate-50">Receipt History <ChevronRight size={15} className="text-slate-400" /></button></div></div></aside>;
}
function InfoRow({ label, value, green = false }: { label: string; value: string; green?: boolean }) { return <div className="flex items-center justify-between px-4 py-3"><span className="font-semibold">{label}</span><span className={`text-right ${green ? "font-bold text-emerald-700" : "text-slate-600"}`}>{value}</span></div>; }

function Modal({ view, invoice, onClose, onNotice }: { view: ModalView; invoice: Invoice; onClose: () => void; onNotice: (message: string) => void }) {
  const [tab, setTab] = useState(view === "permissions" ? "Permissions" : "Detailed View");
  const [discount, setDiscount] = useState("0");
  const [itemCount, setItemCount] = useState(3);
  if (view === "create") return <CreateInvoiceModal onClose={onClose} onNotice={onNotice} />;
  const save = () => { onClose(); onNotice(view === "adjust" ? "Adjustment request submitted for approval." : "Invoice changes saved successfully."); };
  return <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/55 p-4"><div className="max-h-[92vh] w-full max-w-[950px] overflow-y-auto rounded-xl bg-white shadow-2xl"><div className="flex items-center justify-between border-b border-slate-200 px-5 py-4"><h2 className="text-lg font-bold">{view === "permissions" ? `Manage Invoice Permissions for ${invoice.id}` : view === "adjust" ? `Invoice Adjustment: ${invoice.id}` : `Invoice Actions: ${invoice.id}`}</h2><button onClick={onClose} className="rounded p-1 text-slate-500 hover:bg-slate-100"><X size={20} /></button></div>{view !== "adjust" && <div className="flex border-b border-slate-200 px-5">{["Detailed View", "Edit Invoice", "Permissions"].map((tabName) => <button key={tabName} onClick={() => setTab(tabName)} className={`px-5 py-3 text-sm font-semibold ${tab === tabName ? "border-b-2 border-blue-700 text-slate-900" : "text-slate-500"}`}>{tabName}</button>)}</div>}{view === "permissions" || tab === "Permissions" ? <PermissionsPanel onSave={save} /> : view === "adjust" ? <AdjustmentPanel invoice={invoice} discount={discount} setDiscount={setDiscount} onSave={save} /> : <div className="grid gap-5 p-5 md:grid-cols-2"><InvoicePaper invoice={invoice} /><EditInvoicePanel invoice={invoice} itemCount={itemCount} setItemCount={setItemCount} onSave={save} /></div>}</div></div>;
}

function InvoicePaper({ invoice }: { invoice: Invoice }) { return <div className="rounded-lg border border-slate-200 p-5 text-xs"><div className="flex items-start justify-between border-b border-slate-200 pb-4"><div className="flex items-center gap-2"><ShieldCheck className="text-emerald-700" size={31} /><div><p className="font-bold">FUHS TEACHING HOSPITAL</p><p className="text-[10px] text-slate-500">Accounts Department</p></div></div><div className="text-right"><p className="font-bold">{invoice.patient}</p><p className="text-slate-500">Account No. 0042</p></div></div><div className="grid grid-cols-2 gap-2 border-b border-slate-200 py-4 text-[11px]"><p><span className="font-semibold">Patient No.</span><br />ADN/2024/0042</p><p><span className="font-semibold">Invoice No.</span><br />{invoice.id}</p><p><span className="font-semibold">NHIA No.</span><br />NHIA/10200033</p><p><span className="font-semibold">Date</span><br />13/05/2024</p></div><div className="mt-4 overflow-hidden rounded border border-slate-200"><div className="grid grid-cols-[1fr_45px_75px] bg-slate-50 p-2 text-[10px] font-bold"><span>Description</span><span>Qty</span><span>Amount</span></div>{["GOPD Consultation", "Administered medication", "Ward service and supplies"].map((item, index) => <div key={item} className="grid grid-cols-[1fr_45px_75px] border-t border-slate-100 p-2 text-[10px]"><span>{item}</span><span>1</span><span>{formatNaira(index === 0 ? 18400 : (invoice.amount - 18400) / 2)}</span></div>)}</div><div className="ml-auto mt-5 w-48 space-y-2 text-right text-[11px]"><div className="flex justify-between"><span>Subtotal</span><span>{formatNaira(invoice.amount)}</span></div><div className="flex justify-between"><span>Discount</span><span>₦0.00</span></div><div className="flex justify-between border-t border-slate-200 pt-2 text-sm font-bold"><span>Total</span><span>{formatNaira(invoice.amount)}</span></div></div></div>; }

function EditInvoicePanel({ invoice, itemCount, setItemCount, onSave }: { invoice: Invoice; itemCount: number; setItemCount: React.Dispatch<React.SetStateAction<number>>; onSave: () => void }) { return <div className="space-y-4"><div><label className="mb-1 block text-xs font-bold">Date</label><input defaultValue={invoice.id} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" /></div><div><label className="mb-1 block text-xs font-bold">Patient</label><input defaultValue={invoice.patient} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" /></div><div><div className="mb-2 flex items-center justify-between"><label className="text-xs font-bold">Billed Items</label><button onClick={() => setItemCount(itemCount + 1)} className="font-bold text-blue-700">+ Add</button></div>{Array.from({ length: itemCount }).map((_, index) => <div key={index} className="mb-2 flex gap-2"><input defaultValue={["GOPD Consultation", "Administered medication", "Procedure / Test"][index % 3]} className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-xs" /><button onClick={() => setItemCount(Math.max(1, itemCount - 1))} className="rounded-lg border border-rose-200 px-3 text-rose-600"><Trash2 size={15} /></button></div>)}</div><div><label className="mb-1 block text-xs font-bold">Total Amount</label><input defaultValue={formatNaira(invoice.amount)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm font-bold" /></div><div className="flex gap-2 pt-3"><button onClick={onSave} className="flex-1 rounded-lg bg-blue-700 px-4 py-3 text-sm font-bold text-white hover:bg-blue-800">Save Changes</button><button className="rounded-lg border border-slate-300 px-4 py-3 text-sm font-bold">Cancel</button></div></div>; }

function PermissionsPanel({ onSave }: { onSave: () => void }) { const rows = ["Accounts Officer", "Chief Accountant", "Auditor", "Cashier", "Department Head", "Admin Actions"]; const columns = ["Edit", "Approve", "Void", "Delete", "Export", "Admin Actions"]; return <div className="grid gap-5 p-5 md:grid-cols-[1.6fr_0.8fr]"><div className="overflow-hidden rounded-lg border border-slate-200"><div className="grid grid-cols-[1.5fr_repeat(6,1fr)] bg-slate-50 text-center text-[10px] font-bold"><span className="p-3 text-left">User &amp; Role Permissions</span>{columns.map((column) => <span key={column} className="p-3">{column}</span>)}</div>{rows.map((row, rowIndex) => <div key={row} className="grid grid-cols-[1.5fr_repeat(6,1fr)] items-center border-t border-slate-100 text-center text-xs"><span className="p-3 text-left font-semibold">{row}</span>{columns.map((column, columnIndex) => <button key={column} onClick={(event) => { event.currentTarget.classList.toggle("bg-blue-700"); event.currentTarget.classList.toggle("text-white"); }} className={`mx-auto my-2 h-5 w-9 rounded-full border border-slate-300 ${columnIndex < 2 || rowIndex === 0 ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-400"}`} aria-label={`${row} ${column} permission`}>{columnIndex < 2 || rowIndex === 0 ? "●" : "○"}</button>)}</div>)}</div><div className="rounded-lg border border-slate-200 p-4 text-sm"><h3 className="font-bold">Role Access Details</h3><select className="mt-3 w-full rounded-lg border border-slate-300 px-3 py-2"><option>Accounts Officer</option><option>Chief Accountant</option><option>Auditor</option></select><div className="mt-4 space-y-2 rounded-lg bg-slate-50 p-3 text-xs"><p><span className="font-semibold">Allows View:</span> <span className="text-emerald-700">Yes</span></p><p><span className="font-semibold">Allows Edit:</span> <span className="text-emerald-700">Yes</span></p><p><span className="font-semibold">Allows Void:</span> <span className="text-rose-600">No</span></p><p><span className="font-semibold">Allows Export:</span> <span className="text-emerald-700">Yes</span></p></div><button onClick={onSave} className="mt-4 w-full rounded-lg bg-blue-700 px-4 py-3 text-sm font-bold text-white">Save Permission Changes</button><button className="mt-2 w-full rounded-lg border border-slate-300 px-4 py-3 text-sm font-bold">Reset to Role Defaults</button></div></div>; }

function AdjustmentPanel({ invoice, discount, setDiscount, onSave }: { invoice: Invoice; discount: string; setDiscount: React.Dispatch<React.SetStateAction<string>>; onSave: () => void }) { return <div className="grid gap-5 p-5 md:grid-cols-2"><div className="rounded-lg border border-slate-200 p-5"><div className="mb-5 flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-700"><Pencil size={18} /></div><div><h3 className="font-bold">Adjust billed charges</h3><p className="text-xs text-slate-500">All changes require an approval trail.</p></div></div><label className="mb-1 block text-xs font-bold">Adjustment reason</label><textarea className="h-24 w-full resize-none rounded-lg border border-slate-300 p-3 text-sm" placeholder="Describe the disputed or corrected charge..." /><label className="mb-1 mt-4 block text-xs font-bold">Discount percentage</label><input value={discount} onChange={(event) => setDiscount(event.target.value)} type="number" min="0" max="100" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" /><button onClick={onSave} className="mt-5 w-full rounded-lg bg-blue-700 px-4 py-3 text-sm font-bold text-white">Submit Adjustment</button></div><div className="rounded-lg border border-slate-200 bg-slate-50 p-5"><h3 className="font-bold">Charge summary</h3><div className="mt-4 space-y-3 text-sm"><div className="flex justify-between"><span>Original invoice</span><span className="font-bold">{formatNaira(invoice.amount)}</span></div><div className="flex justify-between"><span>Adjustment</span><span className="font-bold text-amber-700">-{discount}%</span></div><div className="flex justify-between border-t border-slate-200 pt-3 text-base font-bold"><span>Proposed total</span><span>{formatNaira(invoice.amount * (1 - Math.min(100, Number(discount) || 0) / 100))}</span></div></div></div></div>; }

function CreateInvoiceModal({ onClose, onNotice }: { onClose: () => void; onNotice: (message: string) => void }) { const [lineItems, setLineItems] = useState(["GOPD Consultation", "Pharmacy - Line Item", "Ward services"]); const [patient] = useState("Akefon, Olafar"); const subtotal = 65000; const tax = 7500; return <div className="fixed inset-0 z-40 overflow-y-auto bg-slate-950/55 p-4"><div className="mx-auto max-w-[1150px] rounded-xl bg-white shadow-2xl"><div className="flex items-center justify-between border-b border-slate-200 px-5 py-4"><h2 className="text-xl font-bold">Create New Invoice <span className="text-slate-400">(INV/NEW/2024/...)</span></h2><button onClick={onClose} className="rounded p-1 text-slate-500 hover:bg-slate-100"><X size={20} /></button></div><div className="grid gap-5 p-5 lg:grid-cols-[minmax(0,1fr)_265px]"><div className="space-y-4"><FormSection number="1" title="Patient Information (Linked to NHIA)"><div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} /><input placeholder="Search Patient Name or NHIA ID" className="w-full rounded-lg border border-slate-300 py-3 pl-10 pr-3 text-sm" /></div><div className="mt-3 flex items-center gap-3 rounded-lg border border-slate-300 p-3"><div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-lg font-bold text-blue-700">AO</div><div className="flex-1 text-sm"><p className="font-bold">Name: {patient}</p><p>NHIA ID: 100320003038</p><p className="mt-1 font-semibold text-emerald-700">● NHIA - Active - General Plan</p></div></div></FormSection><FormSection number="2" title="Date & Reference"><div className="grid gap-3 md:grid-cols-3"><Field label="Invoice Date" value="May 13, 2024" /><Field label="Due Date" value="30 days" /><Field label="External Reference" value="Optional reference" /></div></FormSection><FormSection number="3" title="Service & Item Line Items"><div className="hidden grid-cols-[1.3fr_1fr_80px_110px_110px] gap-2 bg-slate-50 p-3 text-xs font-bold md:grid"><span>Service/Item Name</span><span>Item Code</span><span>Quantity</span><span>Unit Price (₦)</span><span>Total Price (₦)</span></div>{lineItems.map((item, index) => <div key={`${item}-${index}`} className="grid gap-2 border-t border-slate-100 p-2 md:grid-cols-[1.3fr_1fr_80px_110px_110px]"><input value={item} onChange={(event) => setLineItems(lineItems.map((current, currentIndex) => currentIndex === index ? event.target.value : current))} className="rounded border border-slate-300 px-2 py-2 text-sm" /><input defaultValue={index === 0 ? "CONSULTATION" : "N03000003"} className="rounded border border-slate-300 px-2 py-2 text-sm" /><input defaultValue="1" type="number" className="rounded border border-slate-300 px-2 py-2 text-sm" /><input defaultValue={index === 0 ? "18,400.00" : "32,000.00"} className="rounded border border-slate-300 px-2 py-2 text-sm" /><span className="flex items-center font-bold">{formatNaira(index === 0 ? 18400 : 23200)}</span></div>)}<button onClick={() => setLineItems([...lineItems, "New service or item"])} className="mt-2 rounded-lg border border-blue-700 px-3 py-2 text-sm font-bold text-blue-700">+ Add Line Item</button></FormSection></div><aside className="space-y-4"><FormSection number="4" title="Total & Payment Details"><div className="space-y-3 text-sm"><div className="flex justify-between"><span>Subtotal (₦)</span><span className="font-bold">{formatNaira(subtotal)}</span></div><div className="flex justify-between"><span>Tax Amount (₦)</span><span className="font-bold">{formatNaira(tax)}</span></div><label className="flex items-center justify-between gap-3"><span>Invoice Discount (%)</span><input defaultValue="0" className="w-20 rounded border border-slate-300 px-2 py-2 text-right" /></label><div className="flex justify-between border-t border-slate-200 pt-3 text-base font-bold"><span>Final Amount (₦)</span><span>{formatNaira(subtotal + tax)}</span></div></div></FormSection><div className="rounded-xl border border-slate-200 bg-slate-50 p-4"><h3 className="font-bold">Payment Info</h3><div className="mt-4 flex justify-between text-sm"><span>NHIA Contribution</span><span className="font-bold">₦14,500.00</span></div><div className="mt-3 flex justify-between text-sm"><span>Patient Portion</span><span className="font-bold">₦55,000.00</span></div></div><div className="space-y-2 rounded-xl border border-slate-200 p-4"><button onClick={() => onNotice("Invoice preview opened.")} className="w-full rounded-lg border border-slate-400 px-4 py-3 text-sm font-bold">Preview Invoice</button><button onClick={() => onNotice("Invoice saved as draft.")} className="w-full rounded-lg border border-slate-400 px-4 py-3 text-sm font-bold">Save Draft</button><button onClick={() => onNotice("Invoice placed on hold.")} className="w-full rounded-lg border border-slate-400 px-4 py-3 text-sm font-bold">Hold Invoice</button><button onClick={() => { onClose(); onNotice("Invoice generated and ready for payment."); }} className="w-full rounded-lg bg-blue-700 px-4 py-3 text-sm font-bold text-white">Confirm &amp; Generate Invoice</button><p className="text-xs text-slate-500">Patient portion will be charged upon generation. Verify all details.</p></div></aside></div></div></div>; }

function FormSection({ number, title, children }: { number: string; title: string; children: React.ReactNode }) { return <section className="rounded-xl border border-slate-200 bg-white p-4"><h3 className="mb-4 text-base font-bold"><span className="mr-2 text-blue-700">{number}.</span>{title}<ChevronDown className="float-right text-slate-400" size={18} /></h3>{children}</section>; }
function Field({ label, value }: { label: string; value: string }) { return <label className="block text-xs font-bold">{label}<input defaultValue={value} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm font-normal" /></label>; }

export default function App() { return <AuthProvider><AppShell /></AuthProvider>; }
