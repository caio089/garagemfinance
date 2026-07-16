"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { formatCurrency, formatDate, formatTime } from "@/lib/format";
import {
  CATEGORIA_LABELS,
  PRECO_POLIMENTO,
  PRECOS_LAVAGEM,
  SAIDA_CATEGORIA_LABELS,
} from "@/types";
import type { Entrada, Saida } from "@/types";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";

interface DetalheMovimentoModalProps {
  entrada: Entrada | null;
  saida: Saida | null;
  onClose: () => void;
}

function Row({
  label,
  value,
  valueClassName,
}: {
  label: string;
  value: string;
  valueClassName?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 text-sm">
      <span className="shrink-0 text-zinc-500">{label}</span>
      <span className={`text-right font-medium text-white ${valueClassName ?? ""}`}>
        {value}
      </span>
    </div>
  );
}

export function DetalheMovimentoModal({
  entrada,
  saida,
  onClose,
}: DetalheMovimentoModalProps) {
  const open = !!(entrada || saida);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="border-zinc-800 bg-zinc-900 text-white sm:max-w-md">
        {entrada && (
          <>
            <DialogHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/15">
                  <ArrowUpRight className="h-5 w-5 text-emerald-400" />
                </div>
                <div>
                  <DialogTitle className="text-lg font-bold text-white">
                    {entrada.tipo === "outro"
                      ? entrada.descricao?.includes(":")
                        ? entrada.descricao.split(":").slice(1).join(":").trim() ||
                          "Alimentação"
                        : entrada.descricao || "Alimentação"
                      : `Lavagem ${CATEGORIA_LABELS[entrada.categoria]}`}
                  </DialogTitle>
                  <p className="text-sm text-zinc-500">
                    {formatDate(entrada.created_at.slice(0, 10))} ·{" "}
                    {formatTime(entrada.created_at)}
                  </p>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-3 rounded-xl bg-zinc-800/50 p-4">
              {entrada.tipo === "lavagem" && (
                <>
                  <Row
                    label="Categoria"
                    value={CATEGORIA_LABELS[entrada.categoria]}
                  />
                  <Row
                    label="Valor base"
                    value={formatCurrency(
                      entrada.categoria === "outro"
                        ? Number(entrada.valor)
                        : (PRECOS_LAVAGEM[
                            entrada.categoria as keyof typeof PRECOS_LAVAGEM
                          ] ?? Number(entrada.valor))
                    )}
                  />
                  <Row
                    label="Polimento"
                    value={
                      entrada.polimento
                        ? `Sim (+${formatCurrency(PRECO_POLIMENTO)})`
                        : "Não"
                    }
                  />
                  {Number(entrada.desconto) > 0 && (
                    <Row
                      label="Desconto"
                      value={`- ${formatCurrency(Number(entrada.desconto))}`}
                      valueClassName="text-amber-400"
                    />
                  )}
                  {entrada.placa && <Row label="Placa" value={entrada.placa} />}
                  {entrada.modelo && (
                    <Row label="Modelo" value={entrada.modelo} />
                  )}
                </>
              )}

              {entrada.descricao && (
                <>
                  <Separator className="bg-zinc-700" />
                  <div className="space-y-1">
                    <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                      Descrição
                    </p>
                    <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-zinc-200">
                      {entrada.descricao}
                    </p>
                  </div>
                </>
              )}

              <Separator className="bg-zinc-700" />
              <div className="flex items-center justify-between">
                <span className="font-semibold text-zinc-300">Total</span>
                <span className="text-xl font-bold text-emerald-400">
                  + {formatCurrency(Number(entrada.valor))}
                </span>
              </div>
            </div>
          </>
        )}

        {saida && (
          <>
            <DialogHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-500/15">
                  <ArrowDownLeft className="h-5 w-5 text-rose-400" />
                </div>
                <div>
                  <DialogTitle className="text-lg font-bold text-white">
                    {SAIDA_CATEGORIA_LABELS[saida.categoria]}
                  </DialogTitle>
                  <p className="text-sm text-zinc-500">
                    {formatDate(saida.created_at.slice(0, 10))} ·{" "}
                    {formatTime(saida.created_at)}
                  </p>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-3 rounded-xl bg-zinc-800/50 p-4">
              <Row
                label="Categoria"
                value={SAIDA_CATEGORIA_LABELS[saida.categoria]}
              />

              {saida.descricao && (
                <>
                  <Separator className="bg-zinc-700" />
                  <div className="space-y-1">
                    <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                      Descrição
                    </p>
                    <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-zinc-200">
                      {saida.descricao}
                    </p>
                  </div>
                </>
              )}

              <Separator className="bg-zinc-700" />
              <div className="flex items-center justify-between">
                <span className="font-semibold text-zinc-300">Valor</span>
                <span className="text-xl font-bold text-rose-400">
                  - {formatCurrency(Number(saida.valor))}
                </span>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
