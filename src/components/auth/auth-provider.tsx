"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  limparSessao,
  lerSessao,
  salvarSessao,
  validarCredenciais,
  type AuthSession,
} from "@/lib/auth";

interface AuthContextValue {
  session: AuthSession | null;
  ready: boolean;
  login: (email: string, senha: string) => { ok: true } | { ok: false; error: string };
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setSession(lerSessao());
    setReady(true);
  }, []);

  const login = useCallback((email: string, senha: string) => {
    if (!email.trim() || !senha) {
      return { ok: false as const, error: "Informe e-mail e senha." };
    }
    if (!validarCredenciais(email, senha)) {
      return { ok: false as const, error: "E-mail ou senha incorretos." };
    }
    const next = salvarSessao(email);
    setSession(next);
    return { ok: true as const };
  }, []);

  const logout = useCallback(() => {
    limparSessao();
    setSession(null);
  }, []);

  const value = useMemo(
    () => ({ session, ready, login, logout }),
    [session, ready, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth deve ser usado dentro de AuthProvider");
  }
  return ctx;
}
