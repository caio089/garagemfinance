"use client";

import { motion } from "framer-motion";
import { formatCurrency, formatDate } from "@/lib/format";
import type { DiaComResumo } from "@/types";
import { ChevronRight, TrendingUp } from "lucide-react";

interface RelatorioDiaItemProps {
  dia: DiaComResumo;
  onClick: () => void;
  index: number;
}

export function RelatorioDiaItem({ dia, onClick, index }: RelatorioDiaItemProps) {
  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03 }}
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/80 p-3 text-left transition-colors hover:border-zinc-700 hover:bg-zinc-800/60"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-400/10">
        <TrendingUp className="h-5 w-5 text-amber-400" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-white">
          {formatDate(dia.data)}
        </p>
        <p className="text-xs text-zinc-500">
          Entradas {formatCurrency(dia.totalEntradas)} · Saídas{" "}
          {formatCurrency(dia.totalSaidas)}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <span className="text-sm font-bold text-emerald-400">
          {formatCurrency(dia.totalEntradas - dia.totalSaidas)}
        </span>
        <ChevronRight className="h-4 w-4 text-zinc-600" />
      </div>
    </motion.button>
  );
}
