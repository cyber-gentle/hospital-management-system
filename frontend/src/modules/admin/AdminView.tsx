import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Building2,
  Users,
  Lock,
  KeyRound,
  RefreshCw,
  AlertTriangle,
  Sliders,
  ShieldCheck,
} from 'lucide-react';
import {
  GlobalSystemConfig,
  RolePermissionsMatrix,
  SecurityMetrics,
  UserAccount,
} from './types';
import { adminApi } from './api';
import { FacilityConfigView } from './components/FacilityConfigView';
import { RolePermissionMatrixView } from './components/RolePermissionMatrixView';
import { UserManagementView } from './components/UserManagementView';

export const AdminView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'facility' | 'rbac' | 'users'>('facility');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Core domain states
  const [config, setConfig] = useState<GlobalSystemConfig | null>(null);
  const [roleMatrices, setRoleMatrices] = useState<RolePermissionsMatrix[]>([]);
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [metrics, setMetrics] = useState<SecurityMetrics | null>(null);

  const loadAllData = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const [fetchedConfig, fetchedMatrices, fetchedUsers, fetchedMetrics] =
        await Promise.all([
          adminApi.getConfig(),
          adminApi.getRoleMatrices(),
          adminApi.getUsers(),
          adminApi.getSecurityMetrics(),
        ]);

      setConfig(fetchedConfig);
      setRoleMatrices(fetchedMatrices);
      setUsers(fetchedUsers);
      setMetrics(fetchedMetrics);
    } catch (err) {
      console.error('Failed to load admin dashboard data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  if (loading && !config) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[450px] space-y-3">
        <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin" />
        <p className="text-xs text-slate-400">Loading Security & System Administration Console...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Maintenance Mode Alert Banner if triggered */}
      {config?.security.maintenanceMode && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                Maintenance Mode Active
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                The hospital system is currently operating in restricted maintenance mode. Non-administrative clinical logins are limited.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setActiveTab('facility')}
            className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-medium transition shrink-0"
          >
            Review Policy
          </button>
        </div>
      )}

      {/* Top Banner & Command Center Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 p-5 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 rounded-2xl">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-white">Security & System Administration</h1>
              <span className="text-[10px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider">
                Module 20 • Governance
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {config?.facility.hospitalName} • Central Identity & Policy Control
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => loadAllData(true)}
            disabled={refreshing}
            className="p-2 text-slate-400 hover:text-white rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 transition"
            title="Refresh dashboard metrics"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-indigo-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Metric KPI Cards */}
      {metrics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Active Users */}
          <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 space-y-1">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Active Accounts</span>
              <Users className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-xl font-bold text-white">
              {metrics.activeUsers} <span className="text-xs font-normal text-slate-500">/ {metrics.totalUsers}</span>
            </div>
            <p className="text-[10px] text-slate-400">Total Provisioned Staff</p>
          </div>

          {/* Locked / Suspended Accounts */}
          <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 space-y-1">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Locked Accounts</span>
              <Lock className={`w-4 h-4 ${metrics.lockedUsers > 0 ? 'text-rose-400' : 'text-slate-500'}`} />
            </div>
            <div className="text-xl font-bold text-white">
              <span className={metrics.lockedUsers > 0 ? 'text-rose-400' : 'text-white'}>
                {metrics.lockedUsers}
              </span>
            </div>
            <p className="text-[10px] text-slate-400">Accounts Locked / Suspended</p>
          </div>

          {/* 2FA Enforcement */}
          <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 space-y-1">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>2FA Enforced</span>
              <ShieldCheck className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-xl font-bold text-white">
              {Math.round((metrics.twoFactorEnforcedCount / (metrics.totalUsers || 1)) * 100)}%
            </div>
            <p className="text-[10px] text-slate-400">
              {metrics.twoFactorEnforcedCount} of {metrics.totalUsers} Staff Protected
            </p>
          </div>

          {/* RBAC Roles */}
          <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800 space-y-1">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Configured Roles</span>
              <KeyRound className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-xl font-bold text-white">
              {metrics.totalRoles}
            </div>
            <p className="text-[10px] text-slate-400">Granular RBAC Profiles</p>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        <button
          type="button"
          onClick={() => setActiveTab('facility')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition ${
            activeTab === 'facility'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/30'
              : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Facility Profile & Policies (FR-SEC-01)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('rbac')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition ${
            activeTab === 'rbac'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/30'
              : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>RBAC & Permission Matrix (FR-SEC-02)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition ${
            activeTab === 'users'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/30'
              : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Staff Directory & Provisioning (FR-SEC-03)</span>
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'facility' && config && (
        <FacilityConfigView
          config={config}
          onConfigUpdated={(updated) => {
            setConfig(updated);
            adminApi.getSecurityMetrics().then(setMetrics);
          }}
        />
      )}

      {activeTab === 'rbac' && (
        <RolePermissionMatrixView
          matrices={roleMatrices}
          onMatrixUpdated={(updated) => {
            setRoleMatrices((prev) =>
              prev.map((m) => (m.role === updated.role ? updated : m))
            );
          }}
        />
      )}

      {activeTab === 'users' && (
        <UserManagementView
          users={users}
          onUsersUpdated={() => {
            loadAllData();
          }}
        />
      )}
    </div>
  );
};
