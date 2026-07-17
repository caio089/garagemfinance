"use client";

import { useMemo, useState } from "react";
import { DetalheMovimentoModal } from "@/components/dashboard/detalhe-movimento-modal";
import { formatCurrency, formatTime } from "@/lib/format";
import { labelEntrada } from "@/lib/movimento-labels";
import { calcularLucro } from "@/lib/financeiro";
import { SAIDA_CATEGORIA_LABELS } from "@/types";
import type { Entrada, Saida } from "@/types";
import {
  ArrowDownLeft,
  ArrowUpRight,
  ChevronRight,
  Inbox,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Movimento =
  | { kind: "entrada"; data: Entrada; at: number }
  | { kind: "saida"; data: Saida; at: number };

interface ListaMovimentosDiaProps {
  entradas: Entrada[];
  saidas: Saida[];
  onChanged?: () => void;
  /** Se true, permite exclusão no detalhe (só dia aberto). */
  permitirExcluir?: boolean;
}

export function ListaMovimentosDia({
  entradas,
  saidas,
  onChanged,
  permitirExcluir = true,
}: ListaMovimentosDiaProps) {
  const [entradaSel, setEntradaSel] = useState<Entrada | null>(null);
  const [saidaSel, setSaidaSel] = useState<Saida | null>(null);

  const movimentos = useMemo<Movimento[]>(() => {
    const lista: Movimento[] = [
      ...entradas.map((e) => ({
        kind: "entrada" as const,
        data: e,
        at: new Date(e.created_at).getTime(),
      })),
      ...saidas.map((s) => ({
        kind: "saida" as const,
        data: s,
        at: new Date(s.created_at).getTime(),
      })),
    ];
    return lista.sort((a, b) => b.at - a.at);
  }, [entradas, saidas]);

  const totalEntradas = entradas.reduce((s, e) => s + Number(e.valor), 0);
  const totalSaidas = saidas.reduce((s, e) => s + Number(e.valor), 0);
  const lucro = calcularLucro(totalEntradas, totalSaidas);

  if (movimentos.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-12 text-zinc-600">
        <Inbox className="h-10 w-10" />
        <p className="text-center text-sm">Nenhuma movimentação neste dia</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2 rounded-2xl border border-zinc-800 bg-zinc-900/80 p-3 text-center">
        <div>
          <p className="text-[10px] uppercase tracking-wide text-zinc-500">
            Entradas
          </p>
          <p className="mt-0.5 text-sm font-bold text-emerald-400">
            {formatCurrency(totalEntradas)}
          </p>
          <p className="text-[10px] text-zinc-600">{entradas.length}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wide text-zinc-500">
            Saídas
          </p>
          <p className="mt-0.5 text-sm font-bold text-red-400">
            {formatCurrency(totalSaidas)}
          </p>
          <p className="text-[10px] text-zinc-600">{saidas.length}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wide text-zinc-500">
            Lucro
          </p>
          <p
            className={cn(
              "mt-0.5 text-sm font-bold",
              lucro >= 0 ? "text-amber-400" : "text-red-400"
            )}
          >
            {formatCurrency(lucro)}
          </p>
          <p className="text-[10px] text-zinc-600">{movimentos.length} mov.</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900">
        <div className="border-b border-zinc-800 px-4 py-3">
          <p className="text-sm font-semibold text-zinc-300">
            Lista completa
          </p>
          <p className="text-xs text-zinc-500">
            Tudo que entrou e saiu neste dia
          </p>
        </div>
        <div className="divide-y divide-zinc-800">
          {movimentos.map((mov) => {
            if (mov.kind === "entrada") {
              const e = mov.data;
              return (
                <button
                  key={`e-${e.id}`}
                  type="button"
                  onClick={() => setEntradaSel(e)}
                  className="flex w-full items-center gap-3 px-3 py-3 text-left transition-colors hover:bg-zinc-800/50 active:bg-zinc-800/70"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10">
                    <ArrowUpRight className="h-4 w-4 text-emerald-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-white">
                      {labelEntrada(e)}
                    </p>
                    <p className="truncate text-xs text-zinc-500">
                      {formatTime(e.created_at)}
                      {e.placa ? ` · ${e.placa}` : ""}
                      {e.modelo ? ` · ${e.modelo}` : ""}
                    </p>
                    {e.descricao && (
                      <p className="mt-0.5 line-clamp-2 text-xs text-zinc-400">
                        {e.descricao}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <span className="text-sm font-bold text-emerald-400">
                      +{formatCurrency(Number(e.valor))}
                    </span>
                    <ChevronRight className="h-4 w-4 text-zinc-600" />
                  </div>
                </button>
              );
            }

            const s = mov.data;
            return (
              <button
                key={`s-${s.id}`}
                type="button"
                onClick={() => setSaidaSel(s)}
                className="flex w-full items-center gap-3 px-3 py-3 text-left transition-colors hover:bg-zinc-800/50 active:bg-zinc-800/70"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-500/10">
                  <ArrowDownLeft className="h-4 w-4 text-red-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-white">
                    {SAIDA_CATEGORIA_LABELS[s.categoria]}
                  </p>
                  <p className="truncate text-xs text-zinc-500">
                    {formatTime(s.created_at)}
                  </p>
                  {s.descricao && (
                    <p className="mt-0.5 line-clamp-2 text-xs text-zinc-400">
                      {s.descricao}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <span className="text-sm font-bold text-red-400">
                    -{formatCurrency(Number(s.valor))}
                  </span>
                  <ChevronRight className="h-4 w-4 text-zinc-600" />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <DetalheMovimentoModal
        entrada={entradaSel}
        saida={saidaSel}
        onClose={() => {
          setEntradaSel(null);
          setSaidaSel(null);
        }}
        onDeleted={permitirExcluir ? onChanged : undefined}
      />
    </div>
  );
}
