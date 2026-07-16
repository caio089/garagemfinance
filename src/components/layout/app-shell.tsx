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
      className="fixed left-4 top-4 z-40 flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900/90 text-zinc-400 shadow-lg backdrop-blur-sm transition-colors hover:border-amber-400/30 hover:text-amber-400"
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
