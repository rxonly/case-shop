import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { storage, authApi } from '../utils/api';

interface User {
  id: number;
  name: string;
  email: string;
  role: 'user' | 'admin';
  balance: number;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, age?: number) => Promise<void>;
  logout: () => void;
  updateBalance: (balance: number) => void;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(storage.getUser());
  const [token, setToken] = useState<string | null>(storage.getToken());

  const login = async (email: string, password: string) => {
    const data = await authApi.login(email, password);
    storage.setToken(data.access_token);
    storage.setUser(data.user);
    setToken(data.access_token);
    setUser(data.user);
  };

  const register = async (name: string, email: string, password: string, age?: number) => {
    await authApi.register(name, email, password, age);
    await login(email, password);
  };

  const logout = () => {
    storage.clear();
    setToken(null);
    setUser(null);
  };

  const updateBalance = (balance: number) => {
    if (!user) return;
    const updated = { ...user, balance };
    setUser(updated);
    storage.setUser(updated);
  };

  return (
    <AuthContext.Provider value={{
      user, token, login, register, logout, updateBalance,
      isAdmin: user?.role === 'admin',
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
