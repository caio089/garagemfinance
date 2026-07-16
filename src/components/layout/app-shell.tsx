"use client";

import { SidebarProvider, useSidebar } from "@/context/sidebar-context";
import { RelatoriosSidebar } from "@/components/layout/relatorios-sidebar";
import { Menu } from "lucide-react";

function SidebarTrigger() {
  const { toggle, open } = useSidebar();

  if (open) return null;

  return (
    <button
      type="button"
      onClick={toggle}
      className="fixed left-3 top-[max(0.75rem,env(safe-area-inset-top))] z-40 flex h-11 w-11 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900/95 text-zinc-400 shadow-lg backdrop-blur-sm transition-colors active:scale-95 hover:border-amber-400/30 hover:text-amber-400"
      aria-label="Abrir relatórios"
    >
      <Menu className="h-5 w-5" />
    </button>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <SidebarTrigger />
      {children}
      <RelatoriosSidebar />
    </SidebarProvider>
  );
}
