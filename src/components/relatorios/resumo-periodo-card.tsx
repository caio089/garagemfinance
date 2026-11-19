"use client";

import { motion } from "framer-motion";
import { formatCurrency } from "@/lib/format";
import type { ResumoPeriodo } from "@/types";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Calendar,
  Car,
  PiggyBank,
  UtensilsCrossed,
  Wallet,
} from "lucide-react";

interface ResumoPeriodoCardProps {
  resumo: ResumoPeriodo;
  titulo: string;
  /** Extras do relatório diário (mesmo layout do semanal/mensal). */
  caixaInicial?: number;
  caixaFinal?: number;
  caixaFinalLabel?: string;
}

function LinhaDetalhe({
  nome,
  quantidade,
  valor,
  tom = "text-white",
}: {
  nome: string;
  quantidade?: number;
  valor: number;
  tom?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-white/[0.04] py-2.5 last:border-0">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-zinc-200">{nome}</p>
        {quantidade != null && (
          <p className="text-xs text-zinc-500">
            {quantidade} {quantidade === 1 ? "registro" : "registros"}
          </p>
        )}
      </div>
      <p className={`shrink-0 text-sm font-bold tabular-nums ${tom}`}>
        {formatCurrency(valor)}
      </p>
    </div>
  );
}

export function ResumoPeriodoCard({
  resumo,
  titulo,
  caixaInicial,
  caixaFinal,
  caixaFinalLabel = "Caixa final",
}: ResumoPeriodoCardProps) {
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

  const valorLavagens = resumo.valorLavagens ?? 0;
  const valorRestaurante = resumo.valorRestaurante ?? 0;
  const valorAvulsa = resumo.valorAvulsa ?? 0;
  const servicos = resumo.servicosLavagem ?? [];
  const gastos = resumo.gastosPorCategoria ?? [];
  const mostrarCaixa = caixaInicial != null || caixaFinal != null;

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

      {mostrarCaixa && (
        <div className="grid grid-cols-2 gap-2">
          {caixaInicial != null && (
            <div className="rounded-xl border border-white/[0.04] bg-black/20 px-3 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                Caixa inicial
              </p>
              <p className="text-display mt-1 text-base font-bold tabular-nums text-zinc-200">
                {formatCurrency(caixaInicial)}
              </p>
            </div>
          )}
          {caixaFinal != null && (
            <div className="rounded-xl border border-amber-400/20 bg-amber-400/[0.06] px-3 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-400/80">
                {caixaFinalLabel}
              </p>
              <p className="text-display mt-1 text-base font-bold tabular-nums text-amber-300">
                {formatCurrency(caixaFinal)}
              </p>
            </div>
          )}
        </div>
      )}

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
              <p
                className={`text-display text-base font-bold tabular-nums ${m.color}`}
              >
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

      <div className="rounded-xl border border-white/[0.04] bg-black/20 p-4">
        <p className="mb-3 text-sm font-semibold text-zinc-200">
          Entradas por origem
        </p>
        <div className="grid gap-2 sm:grid-cols-3">
          <div className="rounded-lg bg-amber-400/10 px-3 py-3">
            <div className="mb-1 flex items-center gap-1.5 text-amber-400">
              <Car className="h-3.5 w-3.5" />
              <span className="text-[10px] font-semibold uppercase tracking-wider">
                Só lavagem
              </span>
            </div>
            <p className="text-display text-base font-bold tabular-nums text-amber-300">
              {formatCurrency(valorLavagens)}
            </p>
            <p className="mt-0.5 text-xs text-zinc-500">
              {resumo.lavagens} carro(s)
            </p>
          </div>
          <div className="rounded-lg bg-emerald-500/10 px-3 py-3">
            <div className="mb-1 flex items-center gap-1.5 text-emerald-400">
              <UtensilsCrossed className="h-3.5 w-3.5" />
              <span className="text-[10px] font-semibold uppercase tracking-wider">
                Só cozinha
              </span>
            </div>
            <p className="text-display text-base font-bold tabular-nums text-emerald-300">
              {formatCurrency(valorRestaurante)}
            </p>
            <p className="mt-0.5 text-xs text-zinc-500">
              {resumo.outros} pedido(s)
            </p>
          </div>
          <div className="rounded-lg bg-sky-500/10 px-3 py-3">
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-sky-400">
              Entrada avulsa
            </p>
            <p className="text-display text-base font-bold tabular-nums text-sky-300">
              {formatCurrency(valorAvulsa)}
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-white/[0.04] bg-black/20 p-4">
        <p className="mb-1 text-sm font-semibold text-zinc-200">
          Lavagens por tipo
        </p>
        <p className="mb-2 text-xs text-zinc-500">
          Quantos hatch, SUV, sedan… e quanto cada um gerou
        </p>
        {servicos.length === 0 ? (
          <p className="py-3 text-center text-sm text-zinc-600">
            Nenhuma lavagem no período
          </p>
        ) : (
          servicos.map((item) => (
            <LinhaDetalhe
              key={item.nome}
              nome={item.nome}
              quantidade={item.quantidade}
              valor={item.valor}
              tom="text-amber-300"
            />
          ))
        )}
      </div>

      <div className="rounded-xl border border-white/[0.04] bg-black/20 p-4">
        <p className="mb-1 text-sm font-semibold text-zinc-200">
          Gastos por categoria
        </p>
        <p className="mb-2 text-xs text-zinc-500">
          Cozinha, funcionários, lava-jato e demais saídas
        </p>
        {gastos.length === 0 ? (
          <p className="py-3 text-center text-sm text-zinc-600">
            Nenhum gasto no período
          </p>
        ) : (
          gastos.map((item) => (
            <LinhaDetalhe
              key={item.nome}
              nome={item.nome}
              quantidade={item.quantidade}
              valor={item.valor}
              tom="text-rose-300"
            />
          ))
        )}
      </div>
    </motion.div>
  );
}
