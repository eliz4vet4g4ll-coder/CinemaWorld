import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { api } from '../api';
import { setUnauthorizedHandler, tokenStore } from '../api/client';
import type { LoginResponse, RegisterInput, Role, User } from '../api/types';

interface AuthValue {
  user: User | null;
  ready: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (input: RegisterInput) => Promise<User>;
  logout: () => void;
}

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(!tokenStore.get());

  const logout = useCallback(() => {
    tokenStore.clear();
    setUser(null);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(logout);
    if (!tokenStore.get()) return;
    api.me().then(setUser).catch(() => {}).finally(() => setReady(true));
  }, [logout]);

  const value = useMemo<AuthValue>(() => {
    const enter = ({ token, user: logged }: LoginResponse) => {
      tokenStore.set(token);
      setUser(logged);
      return logged;
    };
    return {
      user,
      ready,
      logout,
      login: async (email, password) => enter(await api.login(email, password)),
      register: async (input) => enter(await api.register(input)),
    };
  }, [user, ready, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth вне AuthProvider');
  return value;
}

/** Закрывает маршрут в интерфейсе. Настоящую проверку прав всегда выполняет сервер. */
export function RequireAuth({ role, children }: { role?: Role; children: ReactNode }) {
  const { user, ready } = useAuth();
  const location = useLocation();
  if (!ready) return null;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  if (role && user.role !== role) return <Navigate to="/" replace />;
  return <>{children}</>;
}
