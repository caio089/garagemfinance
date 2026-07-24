"use client";

import { useEffect, useState } from "react";
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
import {
  currencyNumberToInput,
  formatCurrency,
  formatDate,
  maskCurrencyInput,
  parseCurrencyInput,
} from "@/lib/format";
import {
  buscarUltimoDiaFinalizado,
  iniciarDia,
} from "@/services/dias.service";
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
  const [carregandoSugestao, setCarregandoSugestao] = useState(false);
  const [sugestao, setSugestao] = useState<{
    valor: number;
    data: string;
  } | null>(null);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    setCarregandoSugestao(true);
    setSugestao(null);

    buscarUltimoDiaFinalizado()
      .then((dia) => {
        if (cancelled || !dia || dia.caixa_final == null) {
          if (!cancelled) setValor("");
          return;
        }

        const caixaFinal = Number(dia.caixa_final);
        setSugestao({ valor: caixaFinal, data: dia.data });
        setValor(currencyNumberToInput(caixaFinal));
      })
      .catch(() => {
        if (!cancelled) {
          setSugestao(null);
          setValor("");
        }
      })
      .finally(() => {
        if (!cancelled) setCarregandoSugestao(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open]);

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
      setSugestao(null);
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
            Qual o valor inicial do caixa? Confirme ou altere o valor
            sugerido.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {sugestao && (
            <div className="rounded-xl border border-amber-400/20 bg-amber-400/10 px-3 py-2.5 text-sm text-amber-200/90">
              Sugestão: caixa final de{" "}
              <span className="font-semibold text-amber-300">
                {formatDate(sugestao.data)}
              </span>
              {" · "}
              <span className="font-bold tabular-nums text-amber-300">
                {formatCurrency(sugestao.valor)}
              </span>
              . Confirme ou ajuste abaixo.
            </div>
          )}

          {!sugestao && !carregandoSugestao && (
            <p className="text-xs text-zinc-500">
              Nenhum dia finalizado anterior encontrado. Informe o caixa
              manualmente.
            </p>
          )}

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
                placeholder={carregandoSugestao ? "Carregando..." : "0,00"}
                value={valor}
                disabled={carregandoSugestao}
                onChange={(e) => setValor(maskCurrencyInput(e.target.value))}
                className="h-14 w-full rounded-xl border border-zinc-700 bg-zinc-800 pl-12 pr-4 text-center text-2xl font-bold text-white placeholder:text-zinc-600 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/20 disabled:opacity-60"
              />
            </div>
          </div>

          <motion.div whileTap={{ scale: 0.98 }}>
            <Button
              onClick={handleSubmit}
              disabled={loading || carregandoSugestao}
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
