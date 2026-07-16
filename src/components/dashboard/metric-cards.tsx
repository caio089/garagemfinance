"use client";

import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/format";
import type { DashboardMetrics } from "@/types";
import { ArrowDownLeft, ArrowUpRight, PiggyBank, Wallet } from "lucide-react";

interface MetricCardsProps {
  metrics: DashboardMetrics | null;
  loading: boolean;
}

const cards = [
  {
    key: "caixaInicial" as const,
    label: "Caixa inicial",
    icon: Wallet,
    color: "text-zinc-300",
    bg: "bg-zinc-800/50",
  },
  {
    key: "totalEntradas" as const,
    label: "Entradas do dia",
    icon: ArrowUpRight,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
  },
  {
    key: "totalSaidas" as const,
    label: "Saídas do dia",
    icon: ArrowDownLeft,
    color: "text-red-400",
    bg: "bg-red-500/10",
  },
  {
    key: "lucro" as const,
    label: "Lucro do dia",
    icon: PiggyBank,
    color: "text-amber-400",
    bg: "bg-amber-400/10",
  },
];

export function MetricCards({ metrics, loading }: MetricCardsProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-2xl bg-zinc-800" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      {cards.map((card, index) => {
        const Icon = card.icon;
        const value = metrics?.[card.key] ?? 0;

        return (
          <motion.div
            key={card.key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card className="border-zinc-800 bg-zinc-900">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="text-xs text-zinc-500">{card.label}</p>
                    <p className={`text-lg font-bold ${card.color}`}>
                      {formatCurrency(value)}
                    </p>
                  </div>
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-lg ${card.bg}`}
                  >
                    <Icon className={`h-4 w-4 ${card.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}
