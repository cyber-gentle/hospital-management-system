import { rethrowBackendRejection } from "../../lib/fallback";
import { strictModuleFetch } from "../../lib/moduleFetch";
import { requireDemoMode } from "../../lib/demo";
import {
  GlobalSystemConfig,
  RolePermissionsMatrix,
  SecurityMetrics,
  UserAccount,
  UserRole,
} from './types';
import {
  INITIAL_ROLE_MATRICES,
  INITIAL_SYSTEM_CONFIG,
  INITIAL_USER_ACCOUNTS,
} from './mockData';

const STORAGE_KEY_CONFIG = 'hims_admin_config_v1';
const STORAGE_KEY_ROLES = 'hims_admin_roles_v1';
const STORAGE_KEY_USERS = 'hims_admin_users_v1';

class AdminApi {
  private initStorage(): void {
    requireDemoMode();
    if (!localStorage.getItem(STORAGE_KEY_CONFIG)) {
      localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(INITIAL_SYSTEM_CONFIG));
    }
    if (!localStorage.getItem(STORAGE_KEY_ROLES)) {
      localStorage.setItem(STORAGE_KEY_ROLES, JSON.stringify(INITIAL_ROLE_MATRICES));
    }
    if (!localStorage.getItem(STORAGE_KEY_USERS)) {
      localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(INITIAL_USER_ACCOUNTS));
    }
  }

  // --- Configuration ---

  async getConfig(): Promise<GlobalSystemConfig> {
    requireDemoMode();
    this.initStorage();
    try {
      const res = await strictModuleFetch('/api/v1/admin/config');
      if (res.ok) return await res.json();
    } catch (error) {
      rethrowBackendRejection(error);
      // Fallback
    }

    const data = localStorage.getItem(STORAGE_KEY_CONFIG);
    return data ? JSON.parse(data) : INITIAL_SYSTEM_CONFIG;
  }

  async updateConfig(updates: Partial<GlobalSystemConfig>): Promise<GlobalSystemConfig> {
    requireDemoMode();
    this.initStorage();
    try {
      const res = await strictModuleFetch('/api/v1/admin/config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (res.ok) return await res.json();
    } catch (error) {
      rethrowBackendRejection(error);
      // Fallback
    }

    const current = await this.getConfig();
    const updated: GlobalSystemConfig = {
      ...current,
      ...updates,
      facility: {
        ...current.facility,
        ...(updates.facility || {}),
      },
      security: {
        ...current.security,
        ...(updates.security || {}),
      },
      lastUpdatedAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(updated));
    return updated;
  }

  // --- RBAC Roles & Permissions ---

  async getRoleMatrices(): Promise<RolePermissionsMatrix[]> {
    requireDemoMode();
    this.initStorage();
    try {
      const res = await strictModuleFetch('/api/v1/admin/roles');
      if (res.ok) return await res.json();
    } catch (error) {
      rethrowBackendRejection(error);
      // Fallback
    }

    const data = localStorage.getItem(STORAGE_KEY_ROLES);
    return data ? JSON.parse(data) : INITIAL_ROLE_MATRICES;
  }

  async updateRolePermissions(
    role: UserRole,
    permissions: string[]
  ): Promise<RolePermissionsMatrix> {
    requireDemoMode();
    this.initStorage();
    try {
      const res = await strictModuleFetch(`/api/v1/admin/roles/${role}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permissions }),
      });
      if (res.ok) return await res.json();
    } catch (error) {
      rethrowBackendRejection(error);
      // Fallback
    }

    const matrices = await this.getRoleMatrices();
    const idx = matrices.findIndex((m) => m.role === role);
    if (idx === -1) throw new Error(`Role ${role} not found in matrix`);

    matrices[idx]!.permissions = permissions;
    localStorage.setItem(STORAGE_KEY_ROLES, JSON.stringify(matrices));
    return matrices[idx]!;
  }

  // --- User Provisioning ---

  async getUsers(params?: {
    role?: string;
    department?: string;
    search?: string;
  }): Promise<UserAccount[]> {
    requireDemoMode();
    this.initStorage();
    try {
      const q = new URLSearchParams();
      if (params?.role && params.role !== 'ALL') q.append('role', params.role);
      if (params?.search) q.append('search', params.search);

      const res = await strictModuleFetch(`/api/v1/admin/users?${q.toString()}`);
      if (res.ok) return await res.json();
    } catch (error) {
      rethrowBackendRejection(error);
      // Fallback
    }

    const data = localStorage.getItem(STORAGE_KEY_USERS);
    let users: UserAccount[] = data ? JSON.parse(data) : INITIAL_USER_ACCOUNTS;

    if (params) {
      if (params.role && params.role !== 'ALL') {
        users = users.filter((u) => u.role === params.role);
      }
      if (params.department && params.department !== 'ALL') {
        users = users.filter((u) => u.department === params.department);
      }
      if (params.search) {
        const query = params.search.toLowerCase();
        users = users.filter(
          (u) =>
            u.username.toLowerCase().includes(query) ||
            u.email.toLowerCase().includes(query) ||
            u.firstName.toLowerCase().includes(query) ||
            u.lastName.toLowerCase().includes(query) ||
            u.department.toLowerCase().includes(query)
        );
      }
    }
    return users;
  }

  async createUser(
    user: Omit<UserAccount, 'id' | 'failedLoginAttempts' | 'createdAt' | 'updatedAt'>
  ): Promise<UserAccount> {
    requireDemoMode();
    this.initStorage();
    try {
      const res = await strictModuleFetch('/api/v1/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user),
      });
      if (res.ok) return await res.json();
    } catch (error) {
      rethrowBackendRejection(error);
      // Fallback
    }

    const data = localStorage.getItem(STORAGE_KEY_USERS);
    const users: UserAccount[] = data ? JSON.parse(data) : INITIAL_USER_ACCOUNTS;

    const newUser: UserAccount = {
      ...user,
      id: `USR-2026-${String(users.length + 11).padStart(3, '0')}`,
      failedLoginAttempts: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    users.unshift(newUser);
    localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
    return newUser;
  }

  async updateUser(id: string, updates: Partial<UserAccount>): Promise<UserAccount> {
    requireDemoMode();
    this.initStorage();
    const data = localStorage.getItem(STORAGE_KEY_USERS);
    const users: UserAccount[] = data ? JSON.parse(data) : INITIAL_USER_ACCOUNTS;
    const index = users.findIndex((u) => u.id === id);
    if (index === -1) throw new Error(`User ${id} not found`);

    const updated: UserAccount = {
      ...users[index]!,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    users[index] = updated;
    localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
    return updated;
  }

  async toggleUserLock(id: string, newStatus: 'ACTIVE' | 'LOCKED'): Promise<UserAccount> {
    requireDemoMode();
    return this.updateUser(id, {
      status: newStatus,
      failedLoginAttempts: newStatus === 'ACTIVE' ? 0 : 5,
    });
  }

  async resetPassword(id: string): Promise<{ temporaryPassword: string }> {
    requireDemoMode();
    this.initStorage();
    const tempPass = `NSTH-${Math.floor(100000 + Math.random() * 900000)}#`;
    await this.updateUser(id, {
      failedLoginAttempts: 0,
      status: 'ACTIVE',
    });
    return { temporaryPassword: tempPass };
  }

  // --- Metrics ---

  async getSecurityMetrics(): Promise<SecurityMetrics> {
    requireDemoMode();
    const users = await this.getUsers();
    const roles = await this.getRoleMatrices();

    const activeUsers = users.filter((u) => u.status === 'ACTIVE').length;
    const lockedUsers = users.filter((u) => u.status === 'LOCKED' || u.status === 'SUSPENDED').length;
    const twoFactorEnforcedCount = users.filter((u) => u.twoFactorEnabled).length;
    const failedLoginsPast24h = users.reduce((acc, u) => acc + u.failedLoginAttempts, 0);

    return {
      totalUsers: users.length,
      activeUsers,
      lockedUsers,
      totalRoles: roles.length,
      twoFactorEnforcedCount,
      failedLoginsPast24h,
    };
  }
}

export const adminApi = new AdminApi();
