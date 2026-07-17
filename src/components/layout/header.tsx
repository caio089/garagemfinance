"use client";

import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { LiveClock } from "@/components/layout/live-clock";
import type { Dia } from "@/types";

interface HeaderProps {
  diaAberto: Dia | null;
}

export function Header({ diaAberto }: HeaderProps) {
  return (
    <motion.header
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-1"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-1">
          <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
            Garagem <span className="text-amber-400">Finance</span>
          </h1>
          <LiveClock />
        </div>
        <Badge
          variant="outline"
          className={
            diaAberto
              ? "mt-1 shrink-0 border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
              : "mt-1 shrink-0 border-zinc-700 bg-zinc-800 text-zinc-400"
          }
        >
          <span
            className={`mr-1.5 inline-block h-2 w-2 rounded-full ${
              diaAberto ? "bg-emerald-400 animate-pulse" : "bg-zinc-500"
            }`}
          />
          {diaAberto ? "Aberto" : "Fechado"}
        </Badge>
      </div>
    </motion.header>
  );
}
