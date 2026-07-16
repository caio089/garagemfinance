"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatTime } from "@/lib/format";
import {
  CATEGORIA_LABELS,
  SAIDA_CATEGORIA_LABELS,
} from "@/types";
import type { Entrada, Saida } from "@/types";
import { ArrowDownLeft, ArrowUpRight, Inbox } from "lucide-react";

interface RecentMovementsProps {
  entradas: Entrada[];
  saidas: Saida[];
  loading: boolean;
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center gap-2 py-6 text-zinc-600">
      <Inbox className="h-8 w-8" />
      <p className="text-sm">{message}</p>
    </div>
  );
}

function EntradaItem({ entrada }: { entrada: Entrada }) {
  const desconto = Number(entrada.desconto ?? 0);
  const label =
    entrada.tipo === "outro"
      ? "PF"
      : `Lavagem ${CATEGORIA_LABELS[entrada.categoria]}`;

  const detalhes = [
    formatTime(entrada.created_at),
    entrada.placa,
    entrada.modelo,
    entrada.descricao,
    desconto > 0 ? `Desc. ${formatCurrency(desconto)}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <>
      <div className="flex items-center justify-between py-2">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10">
            <ArrowUpRight className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-white">{label}</p>
            <p className="truncate text-xs text-zinc-500">{detalhes}</p>
          </div>
        </div>
        <span className="shrink-0 text-sm font-semibold text-emerald-400">
          + {formatCurrency(Number(entrada.valor))}
        </span>
      </div>
      {entrada.polimento && (
        <div className="flex items-center justify-between py-2 pl-11">
          <div>
            <p className="text-sm font-medium text-white">Polimento</p>
            <p className="text-xs text-zinc-500">
              {formatTime(entrada.created_at)}
            </p>
          </div>
          <span className="text-sm font-semibold text-emerald-400">
            incluso
          </span>
        </div>
      )}
    </>
  );
}

export function RecentMovements({
  entradas,
  saidas,
  loading,
}: RecentMovementsProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-48 rounded-2xl bg-zinc-800" />
        <Skeleton className="h-48 rounded-2xl bg-zinc-800" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="border-zinc-800 bg-zinc-900">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-zinc-400">
              Últimas entradas
            </CardTitle>
          </CardHeader>
          <CardContent className="divide-y divide-zinc-800">
            {entradas.length === 0 ? (
              <EmptyState message="Nenhuma entrada registrada" />
            ) : (
              entradas.map((entrada) => (
                <EntradaItem key={entrada.id} entrada={entrada} />
              ))
            )}
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card className="border-zinc-800 bg-zinc-900">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-zinc-400">
              Últimas saídas
            </CardTitle>
          </CardHeader>
          <CardContent className="divide-y divide-zinc-800">
            {saidas.length === 0 ? (
              <EmptyState message="Nenhuma saída registrada" />
            ) : (
              saidas.map((saida) => (
                <div
                  key={saida.id}
                  className="flex items-center justify-between py-2"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/10">
                      <ArrowDownLeft className="h-4 w-4 text-red-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">
                        {SAIDA_CATEGORIA_LABELS[saida.categoria]}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {formatTime(saida.created_at)}
                        {saida.descricao && ` · ${saida.descricao}`}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-red-400">
                    - {formatCurrency(Number(saida.valor))}
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
