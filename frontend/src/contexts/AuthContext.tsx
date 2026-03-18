import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { authApi, adminApi } from '../services/api';
import type { User } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  impersonatedBy: number | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  impersonate: (userId: number) => Promise<void>;
  stopImpersonation: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [impersonatedBy, setImpersonatedBy] = useState<number | null>(null);

  const refreshUser = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }

      const { data } = await authApi.me();
      setUser(data.user);
      setImpersonatedBy(data.impersonatedBy || null);
    } catch {
      setUser(null);
      localStorage.removeItem('accessToken');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (username: string, password: string) => {
    const { data } = await authApi.login(username, password);
    localStorage.setItem('accessToken', data.accessToken);
    setUser(data.user);
    setImpersonatedBy(null);
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {
      // ignore
    }
    localStorage.removeItem('accessToken');
    localStorage.removeItem('adminToken');
    setUser(null);
    setImpersonatedBy(null);
  };

  const impersonate = async (userId: number) => {
    const currentToken = localStorage.getItem('accessToken');
    if (currentToken) {
      localStorage.setItem('adminToken', currentToken);
    }

    const { data } = await adminApi.impersonate(userId);
    localStorage.setItem('accessToken', data.accessToken);
    setUser(data.user);
    setImpersonatedBy(data.impersonatedBy);
  };

  const stopImpersonation = async () => {
    const { data } = await adminApi.stopImpersonation();
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.removeItem('adminToken');
    setUser(data.user);
    setImpersonatedBy(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, impersonatedBy, login, logout, impersonate, stopImpersonation, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
