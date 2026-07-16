"use client";

import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { formatDateLong } from "@/lib/format";
import type { Dia } from "@/types";

interface HeaderProps {
  diaAberto: Dia | null;
}

export function Header({ diaAberto }: HeaderProps) {
  const hoje = formatDateLong(new Date());

  return (
    <motion.header
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-1 pl-12"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
            Garagem <span className="text-amber-400">Finance</span>
          </h1>
          <p className="truncate text-xs capitalize text-zinc-500 sm:text-sm">{hoje}</p>
        </div>
        <Badge
          variant="outline"
          className={
            diaAberto
              ? "shrink-0 border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
              : "shrink-0 border-zinc-700 bg-zinc-800 text-zinc-400"
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
