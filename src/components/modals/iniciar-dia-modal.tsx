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
import { Label } from "@/components/ui/label";
import { maskCurrencyInput, parseCurrencyInput } from "@/lib/format";
import { iniciarDia } from "@/services/dias.service";
import { toast } from "sonner";

interface IniciarDiaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function IniciarDiaModal({
  open,
  onOpenChange,
  onSuccess,
}: IniciarDiaModalProps) {
  const [valor, setValor] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    const caixaInicial = parseCurrencyInput(valor);
    if (caixaInicial < 0) {
      toast.error("Informe um valor válido para o caixa inicial.");
      return;
    }

    setLoading(true);
    try {
      await iniciarDia(caixaInicial);
      toast.success("Dia iniciado com sucesso!");
      setValor("");
      onOpenChange(false);
      onSuccess();
    } catch {
      toast.error("Erro ao iniciar o dia. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-zinc-800 bg-zinc-900 text-white sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-white">
            Iniciar novo dia
          </DialogTitle>
          <DialogDescription className="text-zinc-400">
            Qual o valor inicial do caixa?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="caixa-inicial" className="text-zinc-300">
              Valor do caixa
            </Label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-semibold text-amber-400">
                R$
              </span>
              <input
                id="caixa-inicial"
                type="text"
                inputMode="numeric"
                placeholder="0,00"
                value={valor}
                onChange={(e) => setValor(maskCurrencyInput(e.target.value))}
                className="h-14 w-full rounded-xl border border-zinc-700 bg-zinc-800 pl-12 pr-4 text-2xl font-bold text-white placeholder:text-zinc-600 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/20"
              />
            </div>
          </div>

          <motion.div whileTap={{ scale: 0.98 }}>
            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="h-14 w-full rounded-xl bg-amber-400 text-base font-bold text-black hover:bg-amber-300"
            >
              {loading ? "Iniciando..." : "Começar operação"}
            </Button>
          </motion.div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
