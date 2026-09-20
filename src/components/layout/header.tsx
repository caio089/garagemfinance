"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { LogOut } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/components/auth/auth-provider";
import { Badge } from "@/components/ui/badge";
import { LiveClock } from "@/components/layout/live-clock";
import type { Dia } from "@/types";

interface HeaderProps {
  diaAberto: Dia | null;
}

export function Header({ diaAberto }: HeaderProps) {
  const { logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    toast.success("Sessão encerrada.");
    router.replace("/login/");
  };

  return (
    <motion.header
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-2"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-400/70">
            Garagem Federal
          </p>
          <h1 className="text-display text-2xl font-bold text-white sm:text-3xl lg:text-4xl">
            Garagem <span className="text-amber-400">Finance</span>
          </h1>
          <LiveClock />
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <Badge
            variant="outline"
            className={
              diaAberto
                ? "border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-emerald-400"
                : "border-zinc-700/80 bg-zinc-800/60 px-2.5 py-1 text-zinc-400"
            }
          >
            <span
              className={`mr-1.5 inline-block h-2 w-2 rounded-full ${
                diaAberto ? "bg-emerald-400 animate-pulse" : "bg-zinc-500"
              }`}
            />
            {diaAberto ? "Aberto" : "Fechado"}
          </Badge>
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] px-2.5 py-1.5 text-xs font-medium text-zinc-400 transition hover:border-rose-400/30 hover:bg-rose-500/10 hover:text-rose-300"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sair
          </button>
        </div>
      </div>
    </motion.header>
  );
}
