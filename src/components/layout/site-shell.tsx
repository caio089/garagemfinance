"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { AuthProvider, useAuth } from "@/components/auth/auth-provider";
import { AuthGate } from "@/components/auth/auth-gate";
import { BottomNav } from "@/components/layout/bottom-nav";
import { Toaster } from "@/components/ui/sonner";

function isLoginPath(pathname: string) {
  return pathname === "/login" || pathname === "/login/";
}

/** Rota só do funcionário — nunca mostra menu do financeiro. */
function isFilaGaragemPath(pathname: string) {
  return (
    pathname === "/filagaragem" ||
    pathname === "/filagaragem/" ||
    pathname.startsWith("/filagaragem/")
  );
}

function isFilaPainelPath(pathname: string) {
  return (
    pathname === "/fila" ||
    pathname === "/fila/" ||
    pathname.startsWith("/fila/")
  );
}

function ShellBody({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { session } = useAuth();
  const isLogin = isLoginPath(pathname);
  const isFilaGaragem = isFilaGaragemPath(pathname);
  const isFilaPainel = isFilaPainelPath(pathname);

  // /filagaragem: sempre sem chrome (funcionário operacional)
  // /fila: no painel com login mostra bottom nav; sem login fica limpa
  const hideChrome =
    isLogin || isFilaGaragem || (isFilaPainel && !session);
  const showFinanceNav = Boolean(session) && !isLogin && !isFilaGaragem;

  if (hideChrome) {
    return (
      <main className="mx-auto min-h-full w-full max-w-lg px-4 pt-[max(1.25rem,env(safe-area-inset-top))] pb-8 md:max-w-3xl">
        {children}
      </main>
    );
  }

  return (
    <>
      <main className="mx-auto min-h-full w-full max-w-lg px-4 pb-[calc(6.5rem+env(safe-area-inset-bottom))] pt-[max(1.25rem,env(safe-area-inset-top))] md:max-w-5xl md:px-8 lg:max-w-6xl lg:px-10 xl:max-w-7xl">
        {children}
      </main>
      {showFinanceNav ? <BottomNav /> : null}
    </>
  );
}

export function SiteShell({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <AuthGate>
        <ShellBody>{children}</ShellBody>
      </AuthGate>
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: "oklch(0.145 0.012 75)",
            border: "1px solid oklch(0.28 0.02 75)",
            color: "#fff",
          },
        }}
      />
    </AuthProvider>
  );
}
