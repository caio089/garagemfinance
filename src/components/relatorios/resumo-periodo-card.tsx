"use client";

import { motion } from "framer-motion";
import { formatCurrency } from "@/lib/format";
import type { ResumoPeriodo } from "@/types";
import { ArrowDownLeft, ArrowUpRight, Calendar, PiggyBank, Wallet } from "lucide-react";

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
      bg: "bg-amber-400/10",
    },
    {
      label: "Entradas",
      value: resumo.totalEntradas,
      icon: ArrowUpRight,
      color: "text-emerald-400",
      bg: "bg-emerald-500/10",
    },
    {
      label: "Saídas",
      value: resumo.totalSaidas,
      icon: ArrowDownLeft,
      color: "text-red-400",
      bg: "bg-red-500/10",
    },
    {
      label: "Lucro",
      value: resumo.lucro,
      icon: PiggyBank,
      color: "text-amber-400",
      bg: "bg-amber-400/10",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4 rounded-xl border border-amber-400/20 bg-gradient-to-b from-amber-400/5 to-transparent p-4"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-amber-400/80">
            {titulo}
          </p>
          <p className="mt-0.5 text-sm text-zinc-400">{resumo.diasOperados} dia(s) operado(s)</p>
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-400/10">
          <Calendar className="h-4 w-4 text-amber-400" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {metrics.map((m) => {
          const Icon = m.icon;
          return (
            <div
              key={m.label}
              className="rounded-lg bg-zinc-800/60 p-3"
            >
              <div className="mb-1 flex items-center gap-1.5">
                <div className={`flex h-6 w-6 items-center justify-center rounded-md ${m.bg}`}>
                  <Icon className={`h-3 w-3 ${m.color}`} />
                </div>
                <span className="text-xs text-zinc-500">{m.label}</span>
              </div>
              <p className={`text-base font-bold ${m.color}`}>
                {formatCurrency(m.value)}
              </p>
            </div>
          );
        })}
      </div>

      <div className="flex justify-around rounded-lg bg-zinc-800/40 py-2 text-center">
        <div>
          <p className="text-lg font-bold text-white">{resumo.lavagens}</p>
          <p className="text-xs text-zinc-500">Lavagens</p>
        </div>
        <div>
          <p className="text-lg font-bold text-white">{resumo.polimentos}</p>
          <p className="text-xs text-zinc-500">Polimentos</p>
        </div>
        <div>
          <p className="text-lg font-bold text-white">{resumo.outros}</p>
          <p className="text-xs text-zinc-500">Alimentação</p>
        </div>
      </div>
    </motion.div>
  );
}
