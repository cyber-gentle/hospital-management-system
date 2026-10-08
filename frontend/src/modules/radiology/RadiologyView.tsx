import React, { useState } from "react";
import {
  ArrowLeft,
  Activity,
  Search,
  Filter,
  Monitor,
  CheckCircle2,
  Clock,
  Image as ImageIcon,
  FileText,
  UploadCloud,
  Layers,
  ChevronRight
} from "lucide-react";

interface RadiologyViewProps {
  onBackToDashboard: () => void;
}

type TabType = "worklist" | "completed" | "modalities";

// Mock data for radiology orders
const MOCK_ORDERS = [
  {
    id: "RAD-001",
    patientName: "John Doe",
    patientId: "HPT-2023-001",
    modality: "X-Ray",
    scanType: "Chest PA",
    urgency: "Routine",
    status: "Pending",
    requestedBy: "Dr. Smith",
    time: "10:30 AM",
  },
  {
    id: "RAD-002",
    patientName: "Sarah Jane",
    patientId: "HPT-2023-088",
    modality: "MRI",
    scanType: "Brain w/o Contrast",
    urgency: "Urgent",
    status: "In Progress",
    requestedBy: "Dr. Adams",
    time: "09:15 AM",
  },
  {
    id: "RAD-003",
    patientName: "Michael Chen",
    patientId: "HPT-2023-142",
    modality: "Ultrasound",
    scanType: "Abdomen Complete",
    urgency: "Routine",
    status: "Pending",
    requestedBy: "Dr. Lee",
    time: "11:45 AM",
  },
  {
    id: "RAD-004",
    patientName: "Emily White",
    patientId: "HPT-2023-093",
    modality: "CT",
    scanType: "CT Pelvis",
    urgency: "STAT",
    status: "Pending",
    requestedBy: "Dr. Martinez",
    time: "12:10 PM",
  }
];

export const RadiologyView: React.FC<RadiologyViewProps> = ({ onBackToDashboard }) => {
  const [activeTab, setActiveTab] = useState<TabType>("worklist");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredOrders = MOCK_ORDERS.filter(o => 
    o.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.patientId.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={onBackToDashboard}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                title="Back to Dashboard"
              >
                <ArrowLeft className="w-5 h-5 text-slate-600" />
              </button>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center">
                  <Monitor className="w-5 h-5" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-slate-900">Radiology & PACS</h1>
                  <p className="text-xs text-slate-500 font-medium">Diagnostic Imaging Department</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-sm">
                <UploadCloud className="w-4 h-4" />
                Upload External DICOM
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex flex-col gap-6">
        {/* Top Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Pending Orders</p>
              <h3 className="text-2xl font-bold text-slate-900">12</h3>
            </div>
          </div>
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">In Progress</p>
              <h3 className="text-2xl font-bold text-slate-900">4</h3>
            </div>
          </div>
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Completed Today</p>
              <h3 className="text-2xl font-bold text-slate-900">28</h3>
            </div>
          </div>
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Modalities Online</p>
              <h3 className="text-2xl font-bold text-slate-900">5 / 6</h3>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex-1 flex flex-col overflow-hidden">
          {/* Tabs */}
          <div className="flex items-center gap-6 px-6 border-b border-slate-200">
            <button
              onClick={() => setActiveTab("worklist")}
              className={`py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "worklist"
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              Imaging Worklist
            </button>
            <button
              onClick={() => setActiveTab("completed")}
              className={`py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "completed"
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              Completed Scans
            </button>
            <button
              onClick={() => setActiveTab("modalities")}
              className={`py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "modalities"
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              Modality Status
            </button>
          </div>

          {/* Search Bar (Only for Worklist/Completed) */}
          {activeTab !== "modalities" && (
            <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
              <div className="relative w-96">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by Patient Name, ID, or Order No..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-shadow bg-white"
                />
              </div>
              <button className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50">
                <Filter className="w-4 h-4" />
                Filter Options
              </button>
            </div>
          )}

          {/* Tab Content */}
          <div className="flex-1 overflow-auto">
            {activeTab === "worklist" && (
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-white border-b border-slate-200">
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Order / Time</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Patient Details</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Modality / Scan</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Urgency</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-indigo-600">{order.id}</div>
                        <div className="text-xs text-slate-500 mt-0.5">{order.time}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-slate-900">{order.patientName}</div>
                        <div className="text-xs text-slate-500 mt-0.5">{order.patientId}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-slate-900">{order.modality}</div>
                        <div className="text-xs text-slate-500 mt-0.5">{order.scanType}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          order.urgency === 'STAT' ? 'bg-red-50 text-red-700 border border-red-200' :
                          order.urgency === 'Urgent' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                          'bg-slate-100 text-slate-700'
                        }`}>
                          {order.urgency}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 text-sm font-medium ${
                          order.status === 'In Progress' ? 'text-amber-600' : 'text-slate-600'
                        }`}>
                          <span className={`w-2 h-2 rounded-full ${
                            order.status === 'In Progress' ? 'bg-amber-500' : 'bg-slate-300'
                          }`}></span>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 rounded text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-indigo-600 hover:border-indigo-300 transition-colors">
                          {order.status === 'Pending' ? 'Begin Scan' : 'View Study'}
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredOrders.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center">
                        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-100 mb-4">
                          <Search className="w-6 h-6 text-slate-400" />
                        </div>
                        <h3 className="text-sm font-medium text-slate-900">No orders found</h3>
                        <p className="text-sm text-slate-500 mt-1">Adjust your search query to find more orders.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}

            {activeTab === "completed" && (
              <div className="p-12 text-center text-slate-500">
                <ImageIcon className="w-12 h-12 mx-auto text-slate-300 mb-4" />
                <h3 className="text-lg font-medium text-slate-900">Completed Scans</h3>
                <p className="mt-2 text-sm">Archived studies and reports will appear here once the radiologist signs off.</p>
              </div>
            )}

            {activeTab === "modalities" && (
              <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  { name: "Digital X-Ray 1", status: "Online", icon: Activity, load: "Low" },
                  { name: "MRI Scanner", status: "In Use", icon: Layers, load: "High" },
                  { name: "CT Scanner (128 Slice)", status: "Online", icon: Monitor, load: "Medium" },
                  { name: "Ultrasound Room A", status: "Online", icon: Activity, load: "Low" },
                  { name: "Ultrasound Room B", status: "Offline - Maintenance", icon: Activity, load: "-" },
                  { name: "Mammography", status: "Online", icon: Monitor, load: "Low" }
                ].map((modality, idx) => (
                  <div key={idx} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-indigo-200 transition-colors cursor-default">
                    <div className="flex justify-between items-start mb-4">
                      <div className={`p-2 rounded-lg ${modality.status === 'Online' ? 'bg-emerald-50 text-emerald-600' : modality.status === 'In Use' ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-500'}`}>
                        <modality.icon className="w-5 h-5" />
                      </div>
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                        modality.status === 'Online' ? 'bg-emerald-100 text-emerald-700' : 
                        modality.status === 'In Use' ? 'bg-amber-100 text-amber-700' : 
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {modality.status}
                      </span>
                    </div>
                    <h4 className="font-medium text-slate-900">{modality.name}</h4>
                    <p className="text-sm text-slate-500 mt-1">Queue Load: {modality.load}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};
