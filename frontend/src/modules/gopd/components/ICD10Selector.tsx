import React, { useState, useRef, useEffect, useMemo } from "react";
import { Search, Plus, X, Star, AlertCircle, Check, Tag } from "lucide-react";
import { Diagnosis } from "../types";
import { COMMON_ICD10_CODES, ICD10Entry } from "../icd10Data";

interface ICD10SelectorProps {
  diagnoses: Diagnosis[];
  onChange: (diagnoses: Diagnosis[]) => void;
  disabled?: boolean;
}

export const ICD10Selector: React.FC<ICD10SelectorProps> = ({
  diagnoses,
  onChange,
  disabled = false
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [selectedTypeForNext, setSelectedTypeForNext] = useState<"PRIMARY" | "SECONDARY">("PRIMARY");
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-switch default next type to SECONDARY if a PRIMARY diagnosis already exists
  useEffect(() => {
    const hasPrimary = diagnoses.some(d => d.type === "PRIMARY");
    setSelectedTypeForNext(hasPrimary ? "SECONDARY" : "PRIMARY");
  }, [diagnoses]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filtered ICD-10 entries
  const filteredEntries = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return [];

    // Filter out already selected codes
    const existingCodes = new Set(diagnoses.map(d => d.icd10Code.toLowerCase()));

    return COMMON_ICD10_CODES.filter(entry => {
      if (existingCodes.has(entry.code.toLowerCase())) return false;
      const codeMatch = entry.code.toLowerCase().includes(query);
      const descMatch = entry.description.toLowerCase().includes(query);
      const catMatch = entry.category.toLowerCase().includes(query);
      const keywordMatch = entry.keywords?.some(k => k.toLowerCase().includes(query));
      return codeMatch || descMatch || catMatch || keywordMatch;
    }).slice(0, 10);
  }, [searchTerm, diagnoses]);

  const handleSelect = (entry: ICD10Entry, forcedType?: "PRIMARY" | "SECONDARY") => {
    const typeToAssign = forcedType || selectedTypeForNext;

    let updated: Diagnosis[];
    if (typeToAssign === "PRIMARY") {
      // Demote any existing primary to secondary
      updated = diagnoses.map(d => ({
        ...d,
        type: d.type === "PRIMARY" ? "SECONDARY" : d.type
      }));
      updated.push({
        icd10Code: entry.code,
        description: entry.description,
        type: "PRIMARY"
      });
    } else {
      updated = [
        ...diagnoses,
        {
          icd10Code: entry.code,
          description: entry.description,
          type: "SECONDARY"
        }
      ];
    }

    onChange(updated);
    setSearchTerm("");
    setIsOpen(false);
    setSelectedIndex(0);
    inputRef.current?.focus();
  };

  const handleTogglePrimary = (index: number) => {
    const target = diagnoses[index];
    if (!target) return;
    if (target.type === "PRIMARY") {
      // Toggle to secondary
      const updated = diagnoses.map((d, i) =>
        i === index ? { ...d, type: "SECONDARY" as const } : d
      );
      onChange(updated);
    } else {
      // Promote target to PRIMARY, demote others
      const updated = diagnoses.map((d, i) => ({
        ...d,
        type: i === index ? ("PRIMARY" as const) : ("SECONDARY" as const)
      }));
      onChange(updated);
    }
  };

  const handleRemove = (codeToRemove: string) => {
    onChange(diagnoses.filter(d => d.icd10Code !== codeToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || filteredEntries.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % filteredEntries.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + filteredEntries.length) % filteredEntries.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filteredEntries[selectedIndex]) {
        handleSelect(filteredEntries[selectedIndex]);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  // Top frequent diagnoses for quick addition
  const quickPicks = [
    { code: "B50.9", label: "Malaria (P. falciparum)" },
    { code: "I10", label: "Hypertension" },
    { code: "J06.9", label: "URTI" },
    { code: "A09", label: "Gastroenteritis" },
    { code: "E11.9", label: "Diabetes Type 2" },
    { code: "N39.0", label: "UTI" }
  ];

  const hasPrimary = diagnoses.some(d => d.type === "PRIMARY");

  return (
    <div className="space-y-3" ref={wrapperRef}>
      <div className="flex items-center justify-between">
        <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
          <Tag className="w-4 h-4 text-blue-600" />
          ICD-10 Clinical Diagnoses
        </label>
        <span className="text-xs text-slate-500">
          {diagnoses.length} selected ({diagnoses.filter(d => d.type === "PRIMARY").length} Primary)
        </span>
      </div>

      {/* Warning banner if no primary diagnosis */}
      {diagnoses.length > 0 && !hasPrimary && (
        <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg text-xs">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>Please designate one diagnosis as <strong>Primary</strong> for accurate billing and claims reporting.</span>
        </div>
      )}

      {/* Search Input and Type Selector */}
      <div className="relative">
        <div className="flex rounded-lg border border-slate-300 shadow-sm focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 bg-white overflow-hidden">
          <div className="flex items-center pl-3 pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>
          <input
            ref={inputRef}
            type="text"
            disabled={disabled}
            value={searchTerm}
            onChange={e => {
              setSearchTerm(e.target.value);
              setIsOpen(true);
              setSelectedIndex(0);
            }}
            onFocus={() => {
              if (searchTerm.trim()) setIsOpen(true);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Search by ICD-10 code (e.g. B50.9, I10) or description (e.g. Malaria, Cough)..."
            className="flex-1 py-2.5 px-3 text-sm text-slate-900 placeholder-slate-400 focus:outline-none disabled:bg-slate-100"
          />

          {/* Add-as selector */}
          <div className="flex items-center pr-2 gap-1 border-l border-slate-200 pl-2 bg-slate-50">
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Next as:</span>
            <button
              type="button"
              disabled={disabled}
              onClick={() => setSelectedTypeForNext("PRIMARY")}
              className={`px-2 py-1 text-xs font-semibold rounded transition-colors ${
                selectedTypeForNext === "PRIMARY"
                  ? "bg-blue-600 text-white shadow-xs"
                  : "text-slate-600 hover:bg-slate-200"
              }`}
            >
              Primary
            </button>
            <button
              type="button"
              disabled={disabled}
              onClick={() => setSelectedTypeForNext("SECONDARY")}
              className={`px-2 py-1 text-xs font-semibold rounded transition-colors ${
                selectedTypeForNext === "SECONDARY"
                  ? "bg-slate-700 text-white shadow-xs"
                  : "text-slate-600 hover:bg-slate-200"
              }`}
            >
              Secondary
            </button>
          </div>
        </div>

        {/* Autocomplete Dropdown */}
        {isOpen && searchTerm.trim().length > 0 && (
          <div className="absolute z-30 left-0 right-0 mt-1 max-h-72 overflow-y-auto bg-white rounded-lg shadow-xl border border-slate-200 py-1 divide-y divide-slate-100">
            {filteredEntries.length > 0 ? (
              filteredEntries.map((entry, idx) => (
                <div
                  key={entry.code}
                  onClick={() => handleSelect(entry)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`px-3 py-2.5 cursor-pointer flex items-center justify-between text-sm transition-colors ${
                    selectedIndex === idx ? "bg-blue-50 text-blue-900" : "hover:bg-slate-50 text-slate-800"
                  }`}
                >
                  <div className="flex-1 min-w-0 pr-3">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-slate-100 text-blue-700 border border-slate-200">
                        {entry.code}
                      </span>
                      <span className="font-medium truncate">{entry.description}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5 ml-1">
                      Category: {entry.category}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelect(entry);
                    }}
                    className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 bg-blue-100 text-blue-800 hover:bg-blue-200 rounded transition-colors shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add as {selectedTypeForNext}
                  </button>
                </div>
              ))
            ) : (
              <div className="px-4 py-3 text-sm text-slate-500 text-center">
                No matching ICD-10 code found for &quot;{searchTerm}&quot;.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Quick Picks for Frequent Diagnoses */}
      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
        <span className="text-xs text-slate-500 font-medium mr-1">Frequent:</span>
        {quickPicks.map(qp => {
          const isAdded = diagnoses.some(d => d.icd10Code === qp.code);
          return (
            <button
              key={qp.code}
              type="button"
              disabled={disabled || isAdded}
              onClick={() => {
                const found = COMMON_ICD10_CODES.find(c => c.code === qp.code);
                if (found) handleSelect(found);
              }}
              className={`text-xs px-2.5 py-1 rounded-full border transition-all flex items-center gap-1 ${
                isAdded
                  ? "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed"
                  : "bg-white border-slate-200 text-slate-700 hover:border-blue-400 hover:bg-blue-50/50 hover:text-blue-700"
              }`}
            >
              {isAdded && <Check className="w-3 h-3 text-emerald-600" />}
              <span>{qp.label}</span>
              <span className="font-mono text-[10px] text-slate-400">({qp.code})</span>
            </button>
          );
        })}
      </div>

      {/* Selected Diagnoses List */}
      <div className="space-y-2 pt-1">
        {diagnoses.length > 0 ? (
          <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg bg-white overflow-hidden shadow-xs">
            {diagnoses.map((diag, index) => {
              const isPrimary = diag.type === "PRIMARY";
              return (
                <div
                  key={diag.icd10Code}
                  className={`p-3 flex items-center justify-between gap-3 transition-colors ${
                    isPrimary ? "bg-blue-50/40" : "hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => handleTogglePrimary(index)}
                      title={isPrimary ? "Primary Diagnosis (Click to demote)" : "Click to promote to Primary"}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold tracking-wide transition-all ${
                        isPrimary
                          ? "bg-blue-600 text-white shadow-xs"
                          : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                      }`}
                    >
                      <Star className={`w-3 h-3 ${isPrimary ? "fill-white" : ""}`} />
                      {diag.type}
                    </button>

                    <span className="font-mono font-bold text-xs bg-slate-100 text-slate-800 px-2 py-0.5 rounded border border-slate-200">
                      {diag.icd10Code}
                    </span>

                    <span className="text-sm font-medium text-slate-900 truncate">
                      {diag.description}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => handleRemove(diag.icd10Code)}
                      className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                      title="Remove diagnosis"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-4 border-2 border-dashed border-slate-200 rounded-lg text-center text-slate-400 text-xs">
            No ICD-10 diagnoses added yet. Search above or select from frequent conditions.
          </div>
        )}
      </div>
    </div>
  );
};
