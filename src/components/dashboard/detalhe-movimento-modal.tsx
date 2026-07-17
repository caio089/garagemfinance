"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { formatCurrency, formatDate, formatTime } from "@/lib/format";
import { labelEntrada } from "@/lib/movimento-labels";
import { excluirEntrada } from "@/services/entradas.service";
import { excluirSaida } from "@/services/saidas.service";
import {
  CATEGORIA_LABELS,
  PRECO_POLIMENTO,
  PRECOS_LAVAGEM,
  SAIDA_CATEGORIA_LABELS,
  type EntradaCategoria,
} from "@/types";
import type { Entrada, Saida } from "@/types";
import { toast } from "sonner";
import { ArrowDownLeft, ArrowUpRight, Trash2 } from "lucide-react";

function labelCategoria(categoria: string): string {
  if (categoria in CATEGORIA_LABELS) {
    return CATEGORIA_LABELS[categoria as EntradaCategoria];
  }
  return categoria || "Lavagem";
}

function valorBaseLavagem(entrada: Entrada): number {
  const cat = entrada.categoria;
  if (cat === "outro" || !(cat in PRECOS_LAVAGEM)) {
    return Number(entrada.valor) + Number(entrada.desconto ?? 0);
  }
  return Number(
    PRECOS_LAVAGEM[cat as keyof typeof PRECOS_LAVAGEM] ?? entrada.valor
  );
}

interface DetalheMovimentoModalProps {
  entrada: Entrada | null;
  saida: Saida | null;
  onClose: () => void;
  onDeleted?: () => void;
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
      <span
        className={`text-right font-medium text-white ${valueClassName ?? ""}`}
      >
        {value}
      </span>
    </div>
  );
}

export function DetalheMovimentoModal({
  entrada,
  saida,
  onClose,
  onDeleted,
}: DetalheMovimentoModalProps) {
  const open = !!(entrada || saida);
  const [confirmando, setConfirmando] = useState(false);
  const [excluindo, setExcluindo] = useState(false);

  const handleClose = () => {
    setConfirmando(false);
    onClose();
  };

  const handleExcluir = async () => {
    setExcluindo(true);
    try {
      if (entrada) {
        await excluirEntrada(entrada.id);
        toast.success("Entrada apagada.");
      } else if (saida) {
        await excluirSaida(saida.id);
        toast.success("Saída apagada.");
      }
      setConfirmando(false);
      onClose();
      onDeleted?.();
    } catch {
      toast.error("Não foi possível apagar. Tente novamente.");
    } finally {
      setExcluindo(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
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
                    {labelEntrada(entrada)}
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
                    value={labelCategoria(entrada.categoria)}
                  />
                  <Row
                    label="Valor base"
                    value={formatCurrency(valorBaseLavagem(entrada))}
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

        {(entrada || saida) && onDeleted && (
          <div className="pt-1">
            {confirmando ? (
              <div className="space-y-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3">
                <p className="text-center text-sm text-rose-200">
                  Apagar este registro? Essa ação não pode ser desfeita.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={excluindo}
                    onClick={() => setConfirmando(false)}
                    className="h-11 rounded-xl border-zinc-700 bg-transparent text-white"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="button"
                    disabled={excluindo}
                    onClick={handleExcluir}
                    className="h-11 rounded-xl bg-rose-500 font-bold text-white hover:bg-rose-400"
                  >
                    {excluindo ? "Apagando..." : "Confirmar"}
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                onClick={() => setConfirmando(true)}
                className="h-11 w-full rounded-xl border-rose-500/40 bg-transparent font-semibold text-rose-400 hover:bg-rose-500/10 hover:text-rose-300"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Apagar {entrada ? "entrada" : "saída"}
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
