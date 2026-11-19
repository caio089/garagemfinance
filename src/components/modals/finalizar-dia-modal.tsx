"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { formatCurrency, formatDate } from "@/lib/format";
import { finalizarDia } from "@/services/dias.service";
import type { ResumoDia } from "@/types";
import { toast } from "sonner";
import { CheckCircle2 } from "lucide-react";

interface FinalizarDiaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  diaId: string;
  onSuccess: () => void;
}

export function FinalizarDiaModal({
  open,
  onOpenChange,
  diaId,
  onSuccess,
}: FinalizarDiaModalProps) {
  const [loading, setLoading] = useState(false);
  const [resumo, setResumo] = useState<ResumoDia | null>(null);
  const [step, setStep] = useState<"confirm" | "report">("confirm");

  const handleConfirm = async () => {
    setLoading(true);
    try {
      const resultado = await finalizarDia(diaId);
      setResumo(resultado);
      setStep("report");
      toast.success("Dia finalizado com sucesso!");
    } catch {
      toast.error("Erro ao finalizar o dia. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    if (step === "report") {
      onSuccess();
    }
    setTimeout(() => {
      setStep("confirm");
      setResumo(null);
    }, 300);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="border-zinc-800 bg-zinc-900 text-white sm:max-w-md">
        {step === "confirm" ? (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-white">
                Finalizar dia
              </DialogTitle>
              <DialogDescription className="text-zinc-400">
                Tem certeza que deseja encerrar o dia?
              </DialogDescription>
            </DialogHeader>

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={handleClose}
                className="h-12 flex-1 rounded-xl border-zinc-700 bg-transparent text-white hover:bg-zinc-800"
              >
                Cancelar
              </Button>
              <motion.div className="flex-1" whileTap={{ scale: 0.98 }}>
                <Button
                  onClick={handleConfirm}
                  disabled={loading}
                  className="h-12 w-full rounded-xl bg-red-500 font-bold text-white hover:bg-red-400"
                >
                  {loading ? "Finalizando..." : "Confirmar"}
                </Button>
              </motion.div>
            </div>
          </>
        ) : (
          resumo && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="flex flex-col items-center gap-2 text-center">
                <CheckCircle2 className="h-12 w-12 text-amber-400" />
                <DialogTitle className="text-xl font-bold text-white">
                  Relatório do Dia
                </DialogTitle>
                <p className="text-sm text-zinc-400">
                  {formatDate(resumo.data)}
                </p>
              </div>

              <div className="space-y-3 rounded-xl bg-zinc-800/50 p-4">
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">Caixa inicial</span>
                  <span className="font-medium">
                    {formatCurrency(resumo.caixaInicial)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">Entradas</span>
                  <span className="font-medium text-emerald-400">
                    + {formatCurrency(resumo.totalEntradas)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-400">Saídas</span>
                  <span className="font-medium text-red-400">
                    - {formatCurrency(resumo.totalSaidas)}
                  </span>
                </div>
                <Separator className="bg-zinc-700" />
                <div className="flex justify-between">
                  <span className="font-semibold text-zinc-300">
                    Saldo diário
                  </span>
                  <span className="text-lg font-bold text-amber-400">
                    {formatCurrency(resumo.lucro)}
                  </span>
                </div>
                <Separator className="bg-zinc-700" />
                <div className="flex justify-between">
                  <div>
                    <span className="font-semibold text-zinc-300">
                      Caixa final
                    </span>
                    <p className="text-[11px] text-zinc-500">
                      Sugestão para o próximo dia
                    </p>
                  </div>
                  <span className="text-lg font-bold tabular-nums text-white">
                    {formatCurrency(resumo.caixaFinal)}
                  </span>
                </div>
              </div>

              <div className="rounded-xl bg-zinc-800/50 p-4">
                <p className="mb-3 text-sm font-semibold text-zinc-300">
                  Serviços realizados
                </p>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <p className="text-2xl font-bold text-white">
                      {resumo.lavagens}
                    </p>
                    <p className="text-xs text-zinc-500">Lavagens</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">
                      {resumo.polimentos}
                    </p>
                    <p className="text-xs text-zinc-500">Polimentos</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-white">
                      {resumo.outros}
                    </p>
                    <p className="text-xs text-zinc-500">Restaurante</p>
                  </div>
                </div>
              </div>

              <Button
                onClick={handleClose}
                className="h-12 w-full rounded-xl bg-amber-400 font-bold text-black hover:bg-amber-300"
              >
                Fechar
              </Button>
            </motion.div>
          )
        )}
      </DialogContent>
    </Dialog>
  );
}
