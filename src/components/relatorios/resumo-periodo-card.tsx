"use client";

import { motion } from "framer-motion";
import { formatCurrency } from "@/lib/format";
import type { ResumoPeriodo } from "@/types";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Calendar,
  PiggyBank,
  Wallet,
} from "lucide-react";

interface ResumoPeriodoCardProps {
  resumo: ResumoPeriodo;
  titulo: string;
}

export function ResumoPeriodoCard({ resumo, titulo }: ResumoPeriodoCardProps) {
  const metrics = [
    {
      label: "Faturamento",
      value: resumo.faturamento,
      icon: Wallet,
      color: "text-amber-400",
      bg: "bg-amber-400/15",
    },
    {
      label: "Entradas",
      value: resumo.totalEntradas,
      icon: ArrowUpRight,
      color: "text-emerald-400",
      bg: "bg-emerald-500/15",
    },
    {
      label: "Saídas",
      value: resumo.totalSaidas,
      icon: ArrowDownLeft,
      color: "text-rose-400",
      bg: "bg-rose-500/15",
    },
    {
      label: "Saldo",
      value: resumo.lucro,
      icon: PiggyBank,
      color: "text-amber-400",
      bg: "bg-amber-400/15",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="surface-hero space-y-4 p-5"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-amber-400/80">
            {titulo}
          </p>
          <p className="mt-1 text-sm text-zinc-400">
            {resumo.diasOperados} dia(s) operado(s)
          </p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-400/15">
          <Calendar className="h-4 w-4 text-amber-400" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {metrics.map((m) => {
          const Icon = m.icon;
          return (
            <div
              key={m.label}
              className="rounded-xl border border-white/[0.04] bg-black/20 p-3.5"
            >
              <div className="mb-1.5 flex items-center gap-1.5">
                <div
                  className={`flex h-6 w-6 items-center justify-center rounded-md ${m.bg}`}
                >
                  <Icon className={`h-3 w-3 ${m.color}`} />
                </div>
                <span className="text-xs text-zinc-500">{m.label}</span>
              </div>
              <p className={`text-display text-base font-bold tabular-nums ${m.color}`}>
                {formatCurrency(m.value)}
              </p>
            </div>
          );
        })}
      </div>

      <div className="flex justify-around rounded-xl border border-white/[0.04] bg-black/20 py-3 text-center">
        <div>
          <p className="text-display text-lg font-bold text-white">
            {resumo.lavagens}
          </p>
          <p className="text-xs text-zinc-500">Lavagens</p>
        </div>
        <div>
          <p className="text-display text-lg font-bold text-white">
            {resumo.polimentos}
          </p>
          <p className="text-xs text-zinc-500">Polimentos</p>
        </div>
        <div>
          <p className="text-display text-lg font-bold text-white">
            {resumo.outros}
          </p>
          <p className="text-xs text-zinc-500">Restaurante</p>
        </div>
      </div>
    </motion.div>
  );
}
