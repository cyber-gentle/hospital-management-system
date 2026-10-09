import React, { useState } from 'react';
import {
  ShieldCheck,
  Check,
  RotateCcw,
  Save,
  Search,
  Filter,
  Users,
  AlertCircle,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import {
  PermissionAction,
  RolePermissionsMatrix,
  UserRole,
} from '../types';
import { MODULE_PERMISSIONS_CATALOG, INITIAL_ROLE_MATRICES } from '../mockData';
import { adminApi } from '../api';

interface RolePermissionMatrixViewProps {
  matrices: RolePermissionsMatrix[];
  onMatrixUpdated: (updated: RolePermissionsMatrix) => void;
}

export const RolePermissionMatrixView: React.FC<RolePermissionMatrixViewProps> = ({
  matrices,
  onMatrixUpdated,
}) => {
  const [selectedRole, setSelectedRole] = useState<UserRole>('ADMIN');
  const [activePermissions, setActivePermissions] = useState<string[]>([]);
  const [searchFilter, setSearchFilter] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('ALL');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync state when role changes or matrices update
  React.useEffect(() => {
    const current = matrices.find((m) => m.role === selectedRole);
    if (current) {
      setActivePermissions([...current.permissions]);
    }
  }, [selectedRole, matrices]);

  const currentRoleMatrix = matrices.find((m) => m.role === selectedRole) || matrices[0];

  const handleTogglePermission = (permissionId: string) => {
    setActivePermissions((prev) =>
      prev.includes(permissionId)
        ? prev.filter((id) => id !== permissionId)
        : [...prev, permissionId]
    );
  };

  const handleToggleModuleGroup = (moduleKey: string, selectAll: boolean) => {
    const modulePermIds = MODULE_PERMISSIONS_CATALOG
      .filter((p) => p.module === moduleKey)
      .map((p) => p.id);

    if (selectAll) {
      setActivePermissions((prev) => Array.from(new Set([...prev, ...modulePermIds])));
    } else {
      setActivePermissions((prev) => prev.filter((id) => !modulePermIds.includes(id)));
    }
  };

  const handleResetToDefault = () => {
    const initial = INITIAL_ROLE_MATRICES.find((m) => m.role === selectedRole);
    if (initial) {
      setActivePermissions([...initial.permissions]);
    }
  };

  const handleSaveMatrix = async () => {
    setIsSaving(true);
    setErrorMessage(null);
    setSaveSuccess(false);

    try {
      const updated = await adminApi.updateRolePermissions(selectedRole, activePermissions);
      onMatrixUpdated(updated);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to update role permissions.');
    } finally {
      setIsSaving(false);
    }
  };

  // Group permissions by module
  const filteredCatalog = MODULE_PERMISSIONS_CATALOG.filter((perm) => {
    const matchesSearch =
      perm.moduleLabel.toLowerCase().includes(searchFilter.toLowerCase()) ||
      perm.description.toLowerCase().includes(searchFilter.toLowerCase()) ||
      perm.id.toLowerCase().includes(searchFilter.toLowerCase());
    const matchesAction = actionFilter === 'ALL' || perm.action === actionFilter;
    return matchesSearch && matchesAction;
  });

  const modulesGrouped = Array.from(new Set(filteredCatalog.map((p) => p.module))).map((mod) => {
    const perms = filteredCatalog.filter((p) => p.module === mod);
    return {
      moduleKey: mod,
      moduleLabel: perms[0]?.moduleLabel || mod,
      permissions: perms,
    };
  });

  const getActionBadgeColor = (action: PermissionAction) => {
    switch (action) {
      case 'READ':
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'WRITE':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'APPROVE':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      case 'DELETE_SOFT':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'ADMIN_OVERRIDE':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      default:
        return 'bg-slate-700 text-slate-300 border-slate-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* Role Selector Carousel / Pill Tabs */}
      <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-indigo-400" />
              Role-Based Access Control (RBAC) Matrix
            </h2>
            <p className="text-xs text-slate-400">
              Select an institutional role to review and adjust granular module privileges across the hospital
            </p>
          </div>

          <div className="flex items-center gap-2">
            {saveSuccess && (
              <span className="text-xs text-emerald-400 font-medium flex items-center gap-1.5 animate-fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Privileges Saved
              </span>
            )}
            <button
              type="button"
              onClick={handleResetToDefault}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium flex items-center gap-1.5 transition border border-slate-700"
              title="Reset to factory role configuration"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Defaults</span>
            </button>
            <button
              type="button"
              disabled={isSaving}
              onClick={handleSaveMatrix}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-indigo-900/30 transition disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Updating...' : 'Save Privileges'}</span>
            </button>
          </div>
        </div>

        {/* Roles list buttons */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-700">
          {matrices.map((m) => {
            const isSelected = m.role === selectedRole;
            return (
              <button
                key={m.role}
                type="button"
                onClick={() => setSelectedRole(m.role)}
                className={`px-3.5 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition flex items-center gap-2 border ${
                  isSelected
                    ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/50 shadow-sm'
                    : 'bg-slate-800/60 text-slate-400 border-slate-700/60 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <span>{m.roleLabel}</span>
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${
                  isSelected ? 'bg-indigo-500 text-white' : 'bg-slate-700 text-slate-400'
                }`}>
                  {m.permissions.length}
                </span>
              </button>
            );
          })}
        </div>

        {/* Active Role Meta Card */}
        {currentRoleMatrix && (
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3.5 bg-indigo-950/20 border border-indigo-900/30 rounded-xl">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-white">
                  {currentRoleMatrix.roleLabel}
                </span>
                <span className="text-xs text-indigo-400 font-mono">
                  ({currentRoleMatrix.role})
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                {currentRoleMatrix.description}
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs text-slate-400 shrink-0">
              <div className="flex items-center gap-1.5">
                <Users className="w-4 h-4 text-slate-400" />
                <span>{currentRoleMatrix.userCount} Active Users</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-indigo-400" />
                <span className="text-indigo-300 font-semibold">
                  {activePermissions.length} / {MODULE_PERMISSIONS_CATALOG.length} Permissions Active
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {errorMessage && (
        <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search permissions by module, action or purpose..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="w-full bg-slate-900/80 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs text-slate-400">Action:</span>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 text-xs text-slate-300 rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500"
          >
            <option value="ALL">All Actions (5)</option>
            <option value="READ">READ</option>
            <option value="WRITE">WRITE</option>
            <option value="APPROVE">APPROVE</option>
            <option value="DELETE_SOFT">DELETE_SOFT</option>
            <option value="ADMIN_OVERRIDE">ADMIN_OVERRIDE</option>
          </select>
        </div>
      </div>

      {/* Permissions Grid Grouped by Module */}
      <div className="space-y-4">
        {modulesGrouped.length === 0 ? (
          <div className="text-center py-12 bg-slate-900/40 rounded-2xl border border-slate-800 text-slate-400 text-xs">
            No permissions matching your filter criteria.
          </div>
        ) : (
          modulesGrouped.map((grp) => {
            const modulePermIds = grp.permissions.map((p) => p.id);
            const activeInGroup = modulePermIds.filter((id) => activePermissions.includes(id));
            const allActive = activeInGroup.length === modulePermIds.length;

            return (
              <div
                key={grp.moduleKey}
                className="bg-slate-900/60 rounded-2xl border border-slate-800/80 overflow-hidden"
              >
                {/* Module Group Header */}
                <div className="p-3.5 bg-slate-800/40 border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs font-semibold text-white">
                      {grp.moduleLabel}
                    </span>
                    <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full border border-slate-700">
                      {activeInGroup.length} of {grp.permissions.length} granted
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleToggleModuleGroup(grp.moduleKey, !allActive)}
                      className="text-[11px] text-indigo-400 hover:text-indigo-300 font-medium transition"
                    >
                      {allActive ? 'Deselect All' : 'Select All in Module'}
                    </button>
                  </div>
                </div>

                {/* Permissions Table / Rows */}
                <div className="divide-y divide-slate-800/50">
                  {grp.permissions.map((perm) => {
                    const isGranted = activePermissions.includes(perm.id);
                    const isHighPrivilege =
                      perm.action === 'ADMIN_OVERRIDE' || perm.action === 'DELETE_SOFT';

                    return (
                      <div
                        key={perm.id}
                        onClick={() => handleTogglePermission(perm.id)}
                        className={`p-3.5 flex items-start sm:items-center justify-between gap-4 cursor-pointer transition ${
                          isGranted
                            ? 'bg-indigo-950/10 hover:bg-indigo-950/20'
                            : 'hover:bg-slate-800/30'
                        }`}
                      >
                        <div className="flex items-start gap-3 min-w-0">
                          {/* Custom Checkbox */}
                          <div
                            className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 mt-0.5 sm:mt-0 transition ${
                              isGranted
                                ? 'bg-indigo-600 border-indigo-500 text-white'
                                : 'border-slate-700 bg-slate-800/50 text-transparent'
                            }`}
                          >
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </div>

                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-xs font-medium text-slate-200">
                                {perm.id}
                              </span>
                              <span
                                className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${getActionBadgeColor(
                                  perm.action
                                )}`}
                              >
                                {perm.action}
                              </span>
                              {isHighPrivilege && (
                                <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded flex items-center gap-1 font-medium">
                                  High Privilege
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              {perm.description}
                            </p>
                          </div>
                        </div>

                        <div className="shrink-0 text-right">
                          <span
                            className={`text-xs font-semibold ${
                              isGranted ? 'text-emerald-400' : 'text-slate-500'
                            }`}
                          >
                            {isGranted ? 'Granted' : 'Denied'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
