"use client";

import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { DashboardMetrics } from "@/types";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Banknote,
  PiggyBank,
  Wallet,
} from "lucide-react";

interface MetricCardsProps {
  metrics: DashboardMetrics | null;
  loading: boolean;
}

const secondaryCards = [
  {
    key: "caixaInicial" as const,
    label: "Caixa inicial",
    icon: Wallet,
    color: "text-zinc-200",
    bg: "bg-zinc-700/40",
  },
  {
    key: "totalEntradas" as const,
    label: "Entradas",
    icon: ArrowUpRight,
    color: "text-emerald-400",
    bg: "bg-emerald-500/15",
  },
  {
    key: "totalSaidas" as const,
    label: "Saídas",
    icon: ArrowDownLeft,
    color: "text-rose-400",
    bg: "bg-rose-500/15",
  },
  {
    key: "saldoDiario" as const,
    label: "Saldo diário",
    icon: PiggyBank,
    color: "text-amber-400",
    bg: "bg-amber-400/15",
  },
];

export function MetricCards({ metrics, loading }: MetricCardsProps) {
  if (loading) {
    return (
      <div className="space-y-3 lg:space-y-4">
        <Skeleton className="h-32 rounded-2xl bg-zinc-800/80 lg:h-36" />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-2xl bg-zinc-800/80" />
          ))}
        </div>
      </div>
    );
  }

  const valorEmCaixa = metrics?.valorEmCaixa ?? 0;
  const saldoDiario = metrics?.saldoDiario ?? 0;

  return (
    <div className="space-y-3 lg:space-y-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <Card className="surface-hero border-0 ring-0">
          <CardContent className="relative overflow-hidden p-5 sm:p-6 lg:p-7">
            <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-amber-400/10 blur-3xl" />
            <div className="relative flex items-start justify-between gap-4">
              <div className="min-w-0 space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-amber-400/80">
                  Valor em caixa
                </p>
                <p className="text-display text-3xl font-bold tabular-nums text-white sm:text-4xl lg:text-5xl">
                  {formatCurrency(valorEmCaixa)}
                </p>
                <p className="text-sm text-zinc-400">
                  Saldo do dia{" "}
                  <span
                    className={cn(
                      "font-semibold tabular-nums",
                      saldoDiario >= 0 ? "text-emerald-400" : "text-rose-400"
                    )}
                  >
                    {saldoDiario >= 0 ? "+" : ""}
                    {formatCurrency(saldoDiario)}
                  </span>
                  <span className="text-zinc-600"> · </span>
                  caixa inicial + saldo
                </p>
              </div>
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-400/15 sm:h-14 sm:w-14">
                <Banknote className="h-6 w-6 text-amber-400 sm:h-7 sm:w-7" />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        {secondaryCards.map((card, index) => {
          const Icon = card.icon;
          const value = metrics?.[card.key] ?? 0;

          return (
            <motion.div
              key={card.key}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 + index * 0.04 }}
            >
              <Card className="surface-premium h-full border-0 ring-0">
                <CardContent className="p-4 sm:p-5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 space-y-1.5">
                      <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">
                        {card.label}
                      </p>
                      <p
                        className={cn(
                          "text-display truncate text-lg font-bold tabular-nums sm:text-xl",
                          card.color
                        )}
                      >
                        {formatCurrency(value)}
                      </p>
                    </div>
                    <div
                      className={cn(
                        "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
                        card.bg
                      )}
                    >
                      <Icon className={cn("h-4 w-4", card.color)} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
