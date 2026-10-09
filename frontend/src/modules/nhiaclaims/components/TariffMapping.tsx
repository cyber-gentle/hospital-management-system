import React, { useState, useEffect } from "react";
import { nhiaApi } from "../api";
import { Tariff } from "../types";
import { Plus, Tag, Settings, Search } from "lucide-react";

export const TariffMapping: React.FC = () => {
  const [tariffs, setTariffs] = useState<Tariff[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchTariffs = async () => {
      try {
        const data = await nhiaApi.getTariffs();
        setTariffs(data);
      } catch (err) {
        console.error("Failed to load tariffs", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTariffs();
  }, []);

  const filteredTariffs = tariffs.filter(t => 
    t.description.toLowerCase().includes(search.toLowerCase()) || 
    t.serviceCode.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Tag className="w-5 h-5 text-indigo-500" />
            Tariff Mapping
          </h2>
          <p className="text-slate-500 text-sm mt-1">Manage NHIA prices and co-pay percentages for hospital services.</p>
        </div>
        <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors shadow-sm flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Tariff
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search by code or description..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500">Loading tariffs...</div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-100">
              <tr>
                <th className="p-4 font-semibold">Service Code</th>
                <th className="p-4 font-semibold">Description</th>
                <th className="p-4 font-semibold">NHIA Price (₦)</th>
                <th className="p-4 font-semibold">Co-Pay %</th>
                <th className="p-4 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredTariffs.map(tariff => (
                <tr key={tariff.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-4 font-medium text-indigo-600">{tariff.serviceCode}</td>
                  <td className="p-4 text-slate-800">{tariff.description}</td>
                  <td className="p-4 font-medium text-slate-700">₦{tariff.nhiaPrice.toLocaleString()}</td>
                  <td className="p-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 text-xs font-semibold border border-amber-100">
                      {tariff.coPayPercentage}%
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <button className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                      <Settings className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredTariffs.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500">
                    No tariffs match your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
