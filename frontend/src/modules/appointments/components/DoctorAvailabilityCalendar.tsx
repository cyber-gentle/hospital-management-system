import React, { useState } from "react";
import {
  Calendar as CalendarIcon,
  Clock,
  UserCheck,
  Building,
  CheckCircle,
  XCircle,
  AlertCircle,
  Filter,
  PlusCircle,
} from "lucide-react";
import { AvailabilitySlot, Doctor } from "../types";

interface DoctorAvailabilityCalendarProps {
  doctors: Doctor[];
  slots: AvailabilitySlot[];
  selectedDate: string;
  onDateChange: (date: string) => void;
  selectedDoctorId: string;
  onDoctorChange: (doctorId: string) => void;
  onBookSlot: (doctor: Doctor, slot: AvailabilitySlot) => void;
}

export const DoctorAvailabilityCalendar: React.FC<DoctorAvailabilityCalendarProps> = ({
  doctors,
  slots,
  selectedDate,
  onDateChange,
  selectedDoctorId,
  onDoctorChange,
  onBookSlot,
}) => {
  const [selectedDept, setSelectedDept] = useState<string>("ALL");

  const departments = Array.from(new Set(doctors.map((d) => d.department)));

  const filteredDoctors = doctors.filter((doc) => {
    if (selectedDept !== "ALL" && doc.department !== selectedDept) return false;
    if (selectedDoctorId !== "ALL" && doc.id !== selectedDoctorId) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Calendar Filter Controls */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <CalendarIcon className="w-4 h-4 text-blue-600" />
            <span>Clinic Date:</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => onDateChange(e.target.value)}
              className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2 text-sm text-slate-700">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="font-semibold">Department:</span>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="ALL">All Departments</option>
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 text-sm text-slate-700">
            <span className="font-semibold">Doctor:</span>
            <select
              value={selectedDoctorId}
              onChange={(e) => onDoctorChange(e.target.value)}
              className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="ALL">All Doctors</option>
              {doctors.map((doc) => (
                <option key={doc.id} value={doc.id}>
                  {doc.name} ({doc.specialty})
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span className="inline-flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Available
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span> Booked
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-400"></span> Blocked
          </span>
        </div>
      </div>

      {/* Doctors Grid with Schedule and Slots */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredDoctors.map((doc) => {
          const docSlots = slots.filter((s) => s.doctorId === doc.id);
          const availableCount = docSlots.filter((s) => s.status === "AVAILABLE").length;
          const bookedCount = docSlots.filter((s) => s.status === "BOOKED").length;

          return (
            <div
              key={doc.id}
              className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col hover:border-blue-300 transition-colors"
            >
              {/* Doctor Header */}
              <div className="p-4 bg-gradient-to-r from-slate-50 to-blue-50/30 border-b border-slate-200 flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900 text-base">{doc.name}</h3>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-medium">
                      {doc.specialty}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5 font-medium">{doc.title}</p>
                  <div className="flex items-center gap-3 text-xs text-slate-500 mt-2">
                    <span className="flex items-center gap-1">
                      <Building className="w-3.5 h-3.5 text-slate-400" />
                      {doc.roomNumber}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      Days: {doc.availableDays.join(", ")}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs font-semibold text-slate-500">Slot Status</div>
                  <div className="text-sm font-bold text-slate-800 mt-0.5">
                    <span className="text-emerald-600">{availableCount} open</span> /{" "}
                    <span className="text-blue-600">{bookedCount} booked</span>
                  </div>
                </div>
              </div>

              {/* Time Slots Area */}
              <div className="p-4 flex-1">
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2.5 flex items-center justify-between">
                  <span>Available Roster Slots for {selectedDate}</span>
                  <span className="text-[11px] text-slate-400">30-min consultation blocks</span>
                </div>

                {docSlots.length === 0 ? (
                  <div className="py-8 text-center bg-slate-50 rounded-lg border border-dashed border-slate-200">
                    <AlertCircle className="w-6 h-6 text-slate-400 mx-auto mb-1" />
                    <p className="text-xs text-slate-500 font-medium">
                      No consultation slots configured for {selectedDate}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Doctor roster days: {doc.availableDays.join(", ")}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {docSlots.map((slot) => {
                      const isAvailable = slot.status === "AVAILABLE";
                      const isBooked = slot.status === "BOOKED";
                      const isBlocked = slot.status === "BLOCKED";

                      return (
                        <div
                          key={slot.id}
                          className={`p-2.5 rounded-lg border text-xs flex flex-col justify-between transition-all ${
                            isAvailable
                              ? "bg-emerald-50/50 border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300"
                              : isBooked
                              ? "bg-blue-50/40 border-blue-200 text-blue-900"
                              : "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed"
                          }`}
                        >
                          <div className="flex items-center justify-between font-semibold">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-slate-500" />
                              {slot.startTime} - {slot.endTime}
                            </span>
                            {isAvailable && (
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                            )}
                            {isBooked && (
                              <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                            )}
                            {isBlocked && (
                              <XCircle className="w-3.5 h-3.5 text-slate-400" />
                            )}
                          </div>

                          <div className="mt-2 flex items-center justify-between">
                            <span
                              className={`text-[11px] font-medium ${
                                isAvailable
                                  ? "text-emerald-700"
                                  : isBooked
                                  ? "text-blue-700"
                                  : "text-slate-500"
                              }`}
                            >
                              {isAvailable ? "Open for booking" : isBooked ? "Patient Booked" : "Unavailable"}
                            </span>

                            {isAvailable && (
                              <button
                                type="button"
                                onClick={() => onBookSlot(doc, slot)}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition-colors shadow-xs"
                              >
                                <PlusCircle className="w-3 h-3" />
                                Book
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
