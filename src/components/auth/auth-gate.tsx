"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/auth-provider";

function isLoginPath(pathname: string) {
  return pathname === "/login" || pathname === "/login/";
}

/** Rotas operacionais: sem login e sem painel financeiro. */
function isPublicPath(pathname: string) {
  return (
    isLoginPath(pathname) ||
    pathname === "/fila" ||
    pathname === "/fila/" ||
    pathname.startsWith("/fila/") ||
    pathname === "/filagaragem" ||
    pathname === "/filagaragem/" ||
    pathname.startsWith("/filagaragem/")
  );
}

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { session, ready } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const onLogin = isLoginPath(pathname);
  const onPublic = isPublicPath(pathname);

  useEffect(() => {
    if (!ready) return;

    if (!session && !onPublic) {
      router.replace("/login/");
      return;
    }

    if (session && onLogin) {
      router.replace("/");
    }
  }, [ready, session, onLogin, onPublic, router]);

  if (!ready) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-sm text-zinc-500">Carregando...</p>
      </div>
    );
  }

  if (!session && !onPublic) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-sm text-zinc-500">Redirecionando para o login...</p>
      </div>
    );
  }

  if (session && onLogin) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-sm text-zinc-500">Entrando no sistema...</p>
      </div>
    );
  }

  return <>{children}</>;
}
