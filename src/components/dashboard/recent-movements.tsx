"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DetalheMovimentoModal } from "@/components/dashboard/detalhe-movimento-modal";
import { formatCurrency, formatTime } from "@/lib/format";
import { labelEntrada } from "@/lib/movimento-labels";
import { SAIDA_CATEGORIA_LABELS } from "@/types";
import type { Entrada, Saida } from "@/types";
import { ArrowDownLeft, ArrowUpRight, ChevronRight, Inbox } from "lucide-react";

interface RecentMovementsProps {
  entradas: Entrada[];
  saidas: Saida[];
  loading: boolean;
  onChanged?: () => void;
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center gap-2 py-8 text-zinc-600">
      <Inbox className="h-8 w-8 opacity-60" />
      <p className="text-sm">{message}</p>
    </div>
  );
}

function EntradaItem({
  entrada,
  onClick,
}: {
  entrada: Entrada;
  onClick: () => void;
}) {
  const desconto = Number(entrada.desconto ?? 0);
  const label = labelEntrada(entrada);

  const detalhes = [
    formatTime(entrada.created_at),
    entrada.placa,
    entrada.modelo,
    desconto > 0 ? `Desc. ${formatCurrency(desconto)}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-between gap-2 rounded-xl px-2 py-2.5 text-left transition-colors hover:bg-white/[0.04] active:bg-white/[0.06] sm:px-3"
    >
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15">
          <ArrowUpRight className="h-4 w-4 text-emerald-400" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-white">{label}</p>
          <p className="truncate text-xs text-zinc-500">{detalhes}</p>
          {entrada.descricao && (
            <p className="mt-0.5 truncate text-xs text-zinc-400">
              {entrada.descricao}
            </p>
          )}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <span className="text-sm font-bold tabular-nums text-emerald-400">
          + {formatCurrency(Number(entrada.valor))}
        </span>
        <ChevronRight className="h-4 w-4 text-zinc-600" />
      </div>
    </button>
  );
}

function SaidaItem({
  saida,
  onClick,
}: {
  saida: Saida;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-between gap-2 rounded-xl px-2 py-2.5 text-left transition-colors hover:bg-white/[0.04] active:bg-white/[0.06] sm:px-3"
    >
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-500/15">
          <ArrowDownLeft className="h-4 w-4 text-rose-400" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-white">
            {SAIDA_CATEGORIA_LABELS[saida.categoria]}
          </p>
          <p className="truncate text-xs text-zinc-500">
            {formatTime(saida.created_at)}
          </p>
          {saida.descricao && (
            <p className="mt-0.5 truncate text-xs text-zinc-400">
              {saida.descricao}
            </p>
          )}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <span className="text-sm font-bold tabular-nums text-rose-400">
          - {formatCurrency(Number(saida.valor))}
        </span>
        <ChevronRight className="h-4 w-4 text-zinc-600" />
      </div>
    </button>
  );
}

export function RecentMovements({
  entradas,
  saidas,
  loading,
  onChanged,
}: RecentMovementsProps) {
  const [entradaSelecionada, setEntradaSelecionada] = useState<Entrada | null>(
    null
  );
  const [saidaSelecionada, setSaidaSelecionada] = useState<Saida | null>(null);

  if (loading) {
    return (
      <div className="grid gap-4 lg:grid-cols-2 lg:gap-5">
        <Skeleton className="h-52 rounded-2xl bg-zinc-800/80" />
        <Skeleton className="h-52 rounded-2xl bg-zinc-800/80" />
      </div>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2 lg:gap-5">
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="min-w-0"
      >
        <Card className="surface-premium border-0 ring-0">
          <CardHeader className="pb-2 pt-5">
            <CardTitle className="text-display text-sm font-semibold text-zinc-200">
              Últimas entradas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-0.5 px-2 pb-4 sm:px-3">
            {entradas.length === 0 ? (
              <EmptyState message="Nenhuma entrada registrada" />
            ) : (
              entradas.map((entrada) => (
                <EntradaItem
                  key={entrada.id}
                  entrada={entrada}
                  onClick={() => setEntradaSelecionada(entrada)}
                />
              ))
            )}
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.28 }}
        className="min-w-0"
      >
        <Card className="surface-premium border-0 ring-0">
          <CardHeader className="pb-2 pt-5">
            <CardTitle className="text-display text-sm font-semibold text-zinc-200">
              Últimas saídas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-0.5 px-2 pb-4 sm:px-3">
            {saidas.length === 0 ? (
              <EmptyState message="Nenhuma saída registrada" />
            ) : (
              saidas.map((saida) => (
                <SaidaItem
                  key={saida.id}
                  saida={saida}
                  onClick={() => setSaidaSelecionada(saida)}
                />
              ))
            )}
          </CardContent>
        </Card>
      </motion.div>

      <DetalheMovimentoModal
        entrada={entradaSelecionada}
        saida={saidaSelecionada}
        onClose={() => {
          setEntradaSelecionada(null);
          setSaidaSelecionada(null);
        }}
        onDeleted={onChanged}
      />
    </div>
  );
}
