import React, { useState, useEffect, useMemo } from "react";
import { 
  Scissors, 
  ArrowLeft, 
  Plus, 
  Search, 
  Filter, 
  Clock, 
  ShieldCheck, 
  FileText, 
  HeartPulse, 
  CheckCircle2, 
  AlertTriangle, 
  Activity,
  Bed,
  ChevronRight
} from "lucide-react";
import { theatreApi } from "./api";
import { 
  SurgeryBooking, 
  SurgeryStatus, 
  SurgeryPriority, 
  TheatreRoom,
  PreOpChecklist,
  IntraOpNotes,
  PacuRecoveryLog
} from "./types";
import { SurgeryScheduleModal } from "./components/SurgeryScheduleModal";
import { PreOpChecklistModal } from "./components/PreOpChecklistModal";
import { IntraOpNotesModal } from "./components/IntraOpNotesModal";
import { PacuRecoveryModal } from "./components/PacuRecoveryModal";

interface TheatreViewProps {
  onBackToDashboard?: () => void;
}

export const TheatreView: React.FC<TheatreViewProps> = ({ onBackToDashboard }) => {
  const [bookings, setBookings] = useState<SurgeryBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"schedule" | "theatres" | "pacu" | "completed">("schedule");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [priorityFilter, setPriorityFilter] = useState<string>("ALL");

  // Modal states
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [selectedBookingForPreOp, setSelectedBookingForPreOp] = useState<SurgeryBooking | null>(null);
  const [selectedBookingForIntraOp, setSelectedBookingForIntraOp] = useState<SurgeryBooking | null>(null);
  const [selectedBookingForPacu, setSelectedBookingForPacu] = useState<SurgeryBooking | null>(null);

  const loadData = async () => {
    try {
      const data = await theatreApi.getBookings();
      setBookings(data);
    } catch (err) {
      console.error("Failed to load theatre bookings", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered list
  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      const matchesSearch = 
        b.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.hospitalNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.procedureName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.leadSurgeon.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.bookingNumber.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === "ALL" || b.status === statusFilter;
      const matchesPriority = priorityFilter === "ALL" || b.priority === priorityFilter;

      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [bookings, searchTerm, statusFilter, priorityFilter]);

  // Operational metrics
  const inTheatreCount = bookings.filter((b) => b.status === "IN_THEATRE").length;
  const preOpCount = bookings.filter((b) => b.status === "SCHEDULED" || b.status === "PRE_OP").length;
  const pacuCount = bookings.filter((b) => b.status === "PACU").length;
  const completedTodayCount = bookings.filter((b) => b.status === "COMPLETED").length;

  const theatreRooms: TheatreRoom[] = [
    "OR 1 - General Surgery",
    "OR 2 - Orthopaedic",
    "OR 3 - Emergency / Trauma",
    "OR 4 - Laparoscopic & Endoscopy",
  ];

  const handleScheduleSubmit = async (newBooking: Omit<SurgeryBooking, "id" | "bookingNumber" | "createdAt" | "updatedAt">) => {
    await theatreApi.createBooking(newBooking);
    await loadData();
  };

  const handlePreOpSave = async (bookingId: string, checklist: PreOpChecklist) => {
    await theatreApi.updatePreOpChecklist(bookingId, checklist);
    await loadData();
  };

  const handleIntraOpSave = async (bookingId: string, notes: IntraOpNotes) => {
    await theatreApi.recordIntraOpNotes(bookingId, notes);
    await loadData();
  };

  const handlePacuSave = async (bookingId: string, log: PacuRecoveryLog) => {
    await theatreApi.updatePacuLog(bookingId, log);
    await loadData();
  };

  const getPriorityBadge = (p: SurgeryPriority) => {
    switch (p) {
      case "EMERGENCY":
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-700 border border-rose-200 animate-pulse"><AlertTriangle className="w-3 h-3" /> EMERGENCY</span>;
      case "URGENT":
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">URGENT</span>;
      case "ELECTIVE":
      default:
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">ELECTIVE</span>;
    }
  };

  const getStatusBadge = (s: SurgeryStatus) => {
    switch (s) {
      case "IN_THEATRE":
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200"><Activity className="w-3 h-3 animate-spin text-blue-600" /> IN THEATRE</span>;
      case "PRE_OP":
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-teal-50 text-teal-700 border border-teal-200"><ShieldCheck className="w-3 h-3" /> PRE-OP READY</span>;
      case "PACU":
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200"><HeartPulse className="w-3 h-3 text-purple-600" /> PACU RECOVERY</span>;
      case "COMPLETED":
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200"><CheckCircle2 className="w-3 h-3 text-emerald-600" /> COMPLETED</span>;
      case "CANCELLED":
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">CANCELLED</span>;
      case "SCHEDULED":
      default:
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200"><Clock className="w-3 h-3 text-slate-500" /> SCHEDULED</span>;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-4">
          {onBackToDashboard && (
            <button
              onClick={onBackToDashboard}
              className="p-2.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all border border-slate-200"
              title="Back to Dashboard"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-2xl text-white shadow-md shadow-indigo-500/20">
              <Scissors className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                Operating Theatre & Surgical Suite
              </h1>
              <p className="text-xs text-slate-500">
                Surgical scheduling, WHO safety checklists, intra-op documentation & PACU recovery
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setIsScheduleOpen(true)}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/30 transition-all flex items-center gap-2 w-fit active:scale-95"
        >
          <Plus className="w-4 h-4" />
          Schedule Surgery
        </button>
      </div>

      {/* KPI Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <span className="text-2xl font-black text-slate-900">{inTheatreCount}</span>
            <p className="text-xs font-medium text-slate-500">Active in Theatre</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-teal-50 text-teal-600 rounded-xl">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <span className="text-2xl font-black text-slate-900">{preOpCount}</span>
            <p className="text-xs font-medium text-slate-500">Pre-Op / Pending</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
            <HeartPulse className="w-6 h-6" />
          </div>
          <div>
            <span className="text-2xl font-black text-slate-900">{pacuCount}</span>
            <p className="text-xs font-medium text-slate-500">PACU Recovery</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-2xl font-black text-slate-900">{completedTodayCount}</span>
            <p className="text-xs font-medium text-slate-500">Completed Surgeries</p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-1 bg-slate-100 p-1 rounded-xl w-fit overflow-x-auto">
        <button
          onClick={() => setActiveTab("schedule")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 whitespace-nowrap ${
            activeTab === "schedule"
              ? "bg-white text-indigo-600 shadow-sm"
              : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
          }`}
        >
          <Clock className="w-4 h-4" />
          Surgery Schedule & Worklist
        </button>
        <button
          onClick={() => setActiveTab("theatres")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 whitespace-nowrap ${
            activeTab === "theatres"
              ? "bg-white text-indigo-600 shadow-sm"
              : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
          }`}
        >
          <Scissors className="w-4 h-4" />
          Operating Rooms (Live OR Map)
        </button>
        <button
          onClick={() => setActiveTab("pacu")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 whitespace-nowrap ${
            activeTab === "pacu"
              ? "bg-white text-indigo-600 shadow-sm"
              : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
          }`}
        >
          <HeartPulse className="w-4 h-4" />
          PACU Recovery Unit ({pacuCount})
        </button>
        <button
          onClick={() => setActiveTab("completed")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 whitespace-nowrap ${
            activeTab === "completed"
              ? "bg-white text-indigo-600 shadow-sm"
              : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          Completed Operations Logbook
        </button>
      </div>

      {/* Tab Content: SCHEDULE */}
      {activeTab === "schedule" && (
        <div className="space-y-4">
          {/* Search & Filters */}
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search patient, MRN, surgeon, procedure..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Filter className="w-3.5 h-3.5" />
                <span>Status:</span>
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 outline-none"
              >
                <option value="ALL">All Statuses</option>
                <option value="SCHEDULED">Scheduled</option>
                <option value="PRE_OP">Pre-Op</option>
                <option value="IN_THEATRE">In Theatre</option>
                <option value="PACU">PACU</option>
                <option value="COMPLETED">Completed</option>
              </select>

              <div className="flex items-center gap-2 text-xs text-slate-500 ml-2">
                <span>Priority:</span>
              </div>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 outline-none"
              >
                <option value="ALL">All Priorities</option>
                <option value="ELECTIVE">Elective</option>
                <option value="URGENT">Urgent</option>
                <option value="EMERGENCY">Emergency</option>
              </select>
            </div>
          </div>

          {/* Bookings Table */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            {loading ? (
              <div className="text-center py-16 text-slate-500 text-sm">Loading surgical schedule...</div>
            ) : filteredBookings.length === 0 ? (
              <div className="text-center py-16 text-slate-500 text-sm">
                No surgical cases matched your criteria.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead className="bg-slate-50/80 text-slate-600 text-xs font-semibold uppercase tracking-wider border-b border-slate-100">
                    <tr>
                      <th className="py-3.5 px-4">Case #</th>
                      <th className="py-3.5 px-4">Patient & MRN</th>
                      <th className="py-3.5 px-4">Procedure & Room</th>
                      <th className="py-3.5 px-4">Surgeon & Anaesthetist</th>
                      <th className="py-3.5 px-4">Scheduled Time</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {filteredBookings.map((b) => (
                      <tr key={b.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3.5 px-4 font-semibold text-indigo-700 whitespace-nowrap">
                          {b.bookingNumber}
                          <div className="mt-1">{getPriorityBadge(b.priority)}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900">{b.patientName}</div>
                          <div className="text-xs text-slate-500">{b.hospitalNumber} • {b.age}y/{b.gender}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-800">{b.procedureName}</div>
                          <div className="text-xs text-indigo-600 font-medium">{b.theatreRoom}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="text-xs font-semibold text-slate-800">{b.leadSurgeon}</div>
                          <div className="text-xs text-slate-500">{b.anaesthetist}</div>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap text-xs">
                          <div className="font-medium text-slate-800">
                            {new Date(b.scheduledStartTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                          <div className="text-slate-500">
                            Est. {b.estimatedDurationMinutes} mins
                          </div>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {getStatusBadge(b.status)}
                        </td>
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2">
                            {/* WHO Sign-In Button */}
                            <button
                              onClick={() => setSelectedBookingForPreOp(b)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                                b.preOpChecklist
                                  ? "bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-100"
                                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                              }`}
                              title="WHO Surgical Safety Checklist"
                            >
                              <ShieldCheck className="w-3.5 h-3.5 inline mr-1 text-teal-600" />
                              {b.preOpChecklist ? "Checklist ✓" : "Pre-Op"}
                            </button>

                            {/* Operative Notes Button */}
                            <button
                              onClick={() => setSelectedBookingForIntraOp(b)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                                b.intraOpNotes
                                  ? "bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100"
                                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                              }`}
                              title="Intra-operative Record & Notes"
                            >
                              <FileText className="w-3.5 h-3.5 inline mr-1 text-indigo-600" />
                              {b.intraOpNotes ? "Notes ✓" : "Intra-Op"}
                            </button>

                            {/* PACU Recovery Button */}
                            <button
                              onClick={() => setSelectedBookingForPacu(b)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                                b.pacuLog
                                  ? "bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100"
                                  : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                              }`}
                              title="PACU Aldrete Scoring & Ward Transfer"
                            >
                              <HeartPulse className="w-3.5 h-3.5 inline mr-1 text-purple-600" />
                              PACU
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab Content: THEATRE ROOMS (Live Map) */}
      {activeTab === "theatres" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {theatreRooms.map((room) => {
            const currentBooking = bookings.find((b) => b.theatreRoom === room && b.status === "IN_THEATRE");
            const upcomingBooking = bookings.find((b) => b.theatreRoom === room && (b.status === "SCHEDULED" || b.status === "PRE_OP"));

            return (
              <div 
                key={room} 
                className={`bg-white rounded-2xl border p-6 shadow-sm flex flex-col justify-between transition-all ${
                  currentBooking ? "border-blue-300 ring-2 ring-blue-500/10" : "border-slate-200"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2.5">
                      <div className={`p-2.5 rounded-xl ${currentBooking ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600"}`}>
                        <Scissors className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900">{room}</h3>
                        <p className="text-xs text-slate-500">Operating Suite</p>
                      </div>
                    </div>
                    {currentBooking ? (
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping"></span>
                        IN USE
                      </span>
                    ) : (
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        AVAILABLE
                      </span>
                    )}
                  </div>

                  {currentBooking ? (
                    <div className="bg-blue-50/60 p-4 rounded-xl border border-blue-100 space-y-3 mb-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600">Active Case</span>
                          <h4 className="font-bold text-slate-900 text-base">{currentBooking.procedureName}</h4>
                          <p className="text-xs text-slate-600">
                            Patient: <span className="font-semibold">{currentBooking.patientName}</span> ({currentBooking.hospitalNumber})
                          </p>
                        </div>
                        {getPriorityBadge(currentBooking.priority)}
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-blue-100">
                        <div>
                          <span className="text-slate-500 block">Surgeon:</span>
                          <span className="font-medium text-slate-800">{currentBooking.leadSurgeon}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Anaesthetist:</span>
                          <span className="font-medium text-slate-800">{currentBooking.anaesthetist}</span>
                        </div>
                      </div>

                      <div className="pt-2 flex items-center gap-2">
                        <button
                          onClick={() => setSelectedBookingForIntraOp(currentBooking)}
                          className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          Record Operative Notes
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-6 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center my-4">
                      <p className="text-xs text-slate-500">Theatre sanitization complete. Ready for next case intake.</p>
                    </div>
                  )}
                </div>

                {upcomingBooking && (
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                    <div>
                      <span className="text-[10px] font-bold uppercase text-slate-400 block">Next Scheduled Case</span>
                      <span className="font-medium text-slate-800">{upcomingBooking.procedureName}</span> ({upcomingBooking.patientName})
                    </div>
                    <button
                      onClick={() => setSelectedBookingForPreOp(upcomingBooking)}
                      className="text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-1"
                    >
                      Pre-Op Checklist <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Tab Content: PACU RECOVERY */}
      {activeTab === "pacu" && (
        <div className="space-y-4">
          <div className="bg-purple-900 text-white p-5 rounded-2xl shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold flex items-center gap-2">
                <HeartPulse className="w-5 h-5 text-purple-300" />
                Post-Anesthesia Care Unit (PACU)
              </h3>
              <p className="text-xs text-purple-200 mt-1">
                Real-time recovery monitoring and Aldrete criteria clearance prior to ward re-admission.
              </p>
            </div>
            <div className="px-4 py-2 bg-white/10 rounded-xl border border-white/20 text-xs font-medium backdrop-blur-sm">
              Aldrete Transfer Gate: <strong className="text-emerald-300">Score ≥ 8 / 10</strong>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {bookings.filter((b) => b.status === "PACU").length === 0 ? (
              <div className="col-span-2 text-center py-16 bg-white rounded-2xl border border-slate-100 text-slate-500 text-sm">
                No patients currently in PACU recovery.
              </div>
            ) : (
              bookings
                .filter((b) => b.status === "PACU")
                .map((b) => (
                  <div key={b.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-xs font-bold text-purple-600 uppercase tracking-wider">{b.theatreRoom}</span>
                        <h4 className="text-lg font-bold text-slate-900">{b.patientName}</h4>
                        <p className="text-xs text-slate-500">{b.hospitalNumber} • {b.age}y/{b.gender}</p>
                      </div>
                      <div className="text-right">
                        <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold border ${
                          (b.pacuLog?.aldreteScore.totalScore ?? 0) >= 8
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-amber-50 text-amber-700 border-amber-200"
                        }`}>
                          Aldrete: {b.pacuLog?.aldreteScore.totalScore ?? "Not Scored"}/10
                        </span>
                      </div>
                    </div>

                    <div className="p-3 bg-purple-50/50 rounded-xl border border-purple-100 text-xs text-slate-700 space-y-1">
                      <div className="font-semibold text-purple-950">Procedure: {b.procedureName}</div>
                      <div className="text-slate-600">Surgeon: {b.leadSurgeon} | Anaesthetist: {b.anaesthetist}</div>
                      {b.pacuLog && (
                        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-purple-100/80 font-mono text-[11px]">
                          <span>BP: {b.pacuLog.initialVitals.bloodPressure}</span>
                          <span>HR: {b.pacuLog.initialVitals.pulseRate} bpm</span>
                          <span>SpO2: {b.pacuLog.initialVitals.oxygenSaturation}%</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <span className="text-xs text-slate-500 flex items-center gap-1">
                        <Bed className="w-3.5 h-3.5 text-slate-400" />
                        Target: {b.pacuLog?.destinationWard || "Surgical Ward"}
                      </span>
                      <button
                        onClick={() => setSelectedBookingForPacu(b)}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-purple-600/20 flex items-center gap-1.5"
                      >
                        <HeartPulse className="w-3.5 h-3.5" />
                        Update PACU & Transfer
                      </button>
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>
      )}

      {/* Tab Content: COMPLETED LOGBOOK */}
      {activeTab === "completed" && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Surgical Registry & Histopathology Logbook
            </h3>
            <span className="text-xs text-slate-500">
              Total Recorded: {bookings.filter((b) => b.status === "COMPLETED").length} cases
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead className="bg-slate-50/80 text-slate-600 text-xs font-semibold uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-3.5 px-4">Case #</th>
                  <th className="py-3.5 px-4">Patient</th>
                  <th className="py-3.5 px-4">Procedure Performed</th>
                  <th className="py-3.5 px-4">Surgical Findings</th>
                  <th className="py-3.5 px-4">Blood Loss</th>
                  <th className="py-3.5 px-4">Specimens / Biopsy</th>
                  <th className="py-3.5 px-4">Discharge Ward</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {bookings
                  .filter((b) => b.status === "COMPLETED")
                  .map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50/60">
                      <td className="py-3 px-4 font-semibold text-slate-900 whitespace-nowrap">{b.bookingNumber}</td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900">{b.patientName}</div>
                        <div className="text-xs text-slate-500">{b.hospitalNumber}</div>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-800">{b.intraOpNotes?.procedurePerformed || b.procedureName}</td>
                      <td className="py-3 px-4 text-xs text-slate-600 max-w-xs truncate">{b.intraOpNotes?.surgicalFindings || "Uneventful"}</td>
                      <td className="py-3 px-4 font-mono text-xs">{b.intraOpNotes?.estimatedBloodLossMl ?? 0} mL</td>
                      <td className="py-3 px-4 text-xs">
                        {b.intraOpNotes?.specimensCollected ? (
                          <span className="text-teal-700 font-semibold">{b.intraOpNotes.specimenLabels.join(", ")}</span>
                        ) : (
                          <span className="text-slate-400">None</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-xs font-semibold text-slate-800">
                        {b.pacuLog?.destinationWard || "Surgical Ward"}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}
      <SurgeryScheduleModal
        isOpen={isScheduleOpen}
        onClose={() => setIsScheduleOpen(false)}
        onSchedule={handleScheduleSubmit}
      />

      <PreOpChecklistModal
        isOpen={!!selectedBookingForPreOp}
        booking={selectedBookingForPreOp}
        onClose={() => setSelectedBookingForPreOp(null)}
        onSaveChecklist={handlePreOpSave}
      />

      <IntraOpNotesModal
        isOpen={!!selectedBookingForIntraOp}
        booking={selectedBookingForIntraOp}
        onClose={() => setSelectedBookingForIntraOp(null)}
        onSaveNotes={handleIntraOpSave}
      />

      <PacuRecoveryModal
        isOpen={!!selectedBookingForPacu}
        booking={selectedBookingForPacu}
        onClose={() => setSelectedBookingForPacu(null)}
        onSavePacu={handlePacuSave}
      />
    </div>
  );
};
