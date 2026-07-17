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
    <div className="flex flex-col items-center gap-2 py-6 text-zinc-600">
      <Inbox className="h-8 w-8" />
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
      className="flex w-full items-center justify-between gap-2 py-2.5 text-left transition-colors hover:bg-zinc-800/40 active:bg-zinc-800/60"
    >
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10">
          <ArrowUpRight className="h-4 w-4 text-emerald-400" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-white">{label}</p>
          <p className="truncate text-xs text-zinc-500">{detalhes}</p>
          {entrada.descricao && (
            <p className="mt-0.5 truncate text-xs text-zinc-400">
              {entrada.descricao}
            </p>
          )}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <span className="text-sm font-semibold text-emerald-400">
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
      className="flex w-full items-center justify-between gap-2 py-2.5 text-left transition-colors hover:bg-zinc-800/40 active:bg-zinc-800/60"
    >
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-500/10">
          <ArrowDownLeft className="h-4 w-4 text-red-400" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-white">
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
        <span className="text-sm font-semibold text-red-400">
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
          <CardContent className="divide-y divide-zinc-800 px-2 sm:px-4">
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
          <CardContent className="divide-y divide-zinc-800 px-2 sm:px-4">
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
