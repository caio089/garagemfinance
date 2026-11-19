"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { BottomNav } from "@/components/layout/bottom-nav";
import { Toaster } from "@/components/ui/sonner";

/** Rota só do funcionário — sem menu do financeiro. */
function isFilaGaragemPath(pathname: string) {
  return (
    pathname === "/filagaragem" ||
    pathname === "/filagaragem/" ||
    pathname.startsWith("/filagaragem/")
  );
}

function isLoginPath(pathname: string) {
  return pathname === "/login" || pathname === "/login/";
}

export function SiteShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isFilaGaragem = isFilaGaragemPath(pathname);
  const isLogin = isLoginPath(pathname);
  const hideChrome = isFilaGaragem || isLogin;

  return (
    <>
      {hideChrome ? (
        <main className="mx-auto min-h-full w-full max-w-lg px-4 pt-[max(1.25rem,env(safe-area-inset-top))] pb-8 md:max-w-3xl">
          {children}
        </main>
      ) : (
        <>
          <main className="mx-auto min-h-full w-full max-w-lg px-4 pb-[calc(6.5rem+env(safe-area-inset-bottom))] pt-[max(1.25rem,env(safe-area-inset-top))] md:max-w-5xl md:px-8 lg:max-w-6xl lg:px-10 xl:max-w-7xl">
            {children}
          </main>
          <BottomNav />
        </>
      )}
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
    </>
  );
}
