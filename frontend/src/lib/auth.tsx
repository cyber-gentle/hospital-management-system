import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { DEMO_MODE } from './demo';

export type UserRole =
  | "DOCTOR"
  | "NURSE"
  | "PHARMACIST"
  | "ACCOUNTANT"
  | "CHIEF_ACCOUNTANT"
  | "NHIA_OFFICER"
  | "AUDITOR"
  | "ADMIN";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => {
    const saved = localStorage.getItem('hims_auth_token');
    return !DEMO_MODE && saved === 'mock-jwt-token' ? null : saved;
  });
  const [user, setUser] = useState<User | null>(() => {
    const cached = localStorage.getItem("hims_user");
    try { return cached ? (JSON.parse(cached) as User) : null; } catch { return null; }
  });

  useEffect(() => {
    if (token) {
      localStorage.setItem("hims_auth_token", token);
    } else {
      localStorage.removeItem("hims_auth_token");
    }
  }, [token]);

  useEffect(() => {
    if (user) {
      localStorage.setItem("hims_user", JSON.stringify(user));
    } else {
      localStorage.removeItem("hims_user");
    }
  }, [user]);

  const login = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("hims_auth_token");
    localStorage.removeItem("hims_user");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
