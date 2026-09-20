const AUTH_STORAGE_KEY = "garagem_finance_session";

export const AUTH_EMAIL =
  process.env.NEXT_PUBLIC_AUTH_EMAIL ?? "garagemfederal@gmail.com";

export const AUTH_PASSWORD =
  process.env.NEXT_PUBLIC_AUTH_PASSWORD ?? "garagem@2026";

export interface AuthSession {
  email: string;
  loggedAt: string;
}

export function validarCredenciais(email: string, senha: string): boolean {
  const emailNorm = email.trim().toLowerCase();
  const senhaNorm = senha;
  return (
    emailNorm === AUTH_EMAIL.trim().toLowerCase() &&
    senhaNorm === AUTH_PASSWORD
  );
}

export function lerSessao(): AuthSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AuthSession;
    if (!parsed?.email || typeof parsed.email !== "string") return null;
    if (parsed.email.trim().toLowerCase() !== AUTH_EMAIL.trim().toLowerCase()) {
      limparSessao();
      return null;
    }
    return parsed;
  } catch {
    limparSessao();
    return null;
  }
}

export function salvarSessao(email: string): AuthSession {
  const session: AuthSession = {
    email: email.trim().toLowerCase(),
    loggedAt: new Date().toISOString(),
  };
  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
  return session;
}

export function limparSessao(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(AUTH_STORAGE_KEY);
}
