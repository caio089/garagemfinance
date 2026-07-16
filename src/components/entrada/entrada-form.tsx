"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/format";
import { buscarDiaAberto } from "@/services/dias.service";
import {
  calcularValorEntrada,
  criarEntrada,
} from "@/services/entradas.service";
import {
  CATEGORIA_LABELS,
  PRECO_PF,
  PRECO_POLIMENTO,
  PRECOS_LAVAGEM,
} from "@/types";
import type { EntradaCategoria } from "@/types";
import { toast } from "sonner";
import { AlertCircle, Car, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

type TipoServico = "lavagem" | "pf";

const categoriasLavagem: {
  value: EntradaCategoria;
  label: string;
  preco: number;
}[] = [
  { value: "hatch", label: "Hatch/Sedan", preco: PRECOS_LAVAGEM.hatch },
  { value: "suv", label: "SUV", preco: PRECOS_LAVAGEM.suv },
  { value: "camionete", label: "Camionete", preco: PRECOS_LAVAGEM.camionete },
];

export function EntradaForm() {
  const router = useRouter();
  const [tipoServico, setTipoServico] = useState<TipoServico>("lavagem");
  const [categoria, setCategoria] = useState<EntradaCategoria>("hatch");
  const [polimento, setPolimento] = useState(false);
  const [descricao, setDescricao] = useState("");
  const [loading, setLoading] = useState(false);
  const [semDia, setSemDia] = useState(false);

  const valor =
    tipoServico === "pf"
      ? PRECO_PF
      : calcularValorEntrada("lavagem", categoria, polimento);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const dia = await buscarDiaAberto();
      if (!dia) {
        setSemDia(true);
        toast.error("Inicie o dia antes de registrar entradas.");
        return;
      }

      await criarEntrada({
        diaId: dia.id,
        tipo: tipoServico === "pf" ? "outro" : "lavagem",
        categoria: tipoServico === "pf" ? "outro" : categoria,
        polimento: tipoServico === "lavagem" ? polimento : false,
        descricao: descricao || undefined,
      });

      toast.success("Entrada registrada!");
      router.push("/");
    } catch {
      toast.error("Erro ao registrar entrada.");
    } finally {
      setLoading(false);
    }
  };

  if (semDia) {
    return (
      <div className="flex flex-col items-center gap-4 py-12 text-center">
        <AlertCircle className="h-12 w-12 text-amber-400" />
        <div>
          <p className="text-lg font-semibold text-white">Dia não iniciado</p>
          <p className="mt-1 text-sm text-zinc-500">
            Vá ao início e clique em &quot;Iniciar Dia&quot; para começar.
          </p>
        </div>
        <Button
          onClick={() => router.push("/")}
          className="mt-2 rounded-xl bg-amber-400 font-bold text-black hover:bg-amber-300"
        >
          Ir para o início
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="space-y-3">
        <Label className="block text-center text-zinc-400">Tipo de serviço</Label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setTipoServico("lavagem")}
            className={cn(
              "flex min-h-[5.5rem] flex-col items-center justify-center gap-2 rounded-2xl border-2 p-4 transition-all active:scale-[0.98]",
              tipoServico === "lavagem"
                ? "border-emerald-400 bg-emerald-500/15 text-emerald-400 shadow-[0_0_20px_-8px_rgba(52,211,153,0.5)]"
                : "border-zinc-800 bg-zinc-900 text-zinc-400"
            )}
          >
            <Car className="h-7 w-7" />
            <span className="text-sm font-bold">Lavagem</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setTipoServico("pf");
              setPolimento(false);
            }}
            className={cn(
              "flex min-h-[5.5rem] flex-col items-center justify-center gap-1 rounded-2xl border-2 p-4 transition-all active:scale-[0.98]",
              tipoServico === "pf"
                ? "border-emerald-400 bg-emerald-500/15 text-emerald-400 shadow-[0_0_20px_-8px_rgba(52,211,153,0.5)]"
                : "border-zinc-800 bg-zinc-900 text-zinc-400"
            )}
          >
            <Sparkles className="h-7 w-7" />
            <span className="text-sm font-bold">PF</span>
            <span className="text-xs opacity-70">{formatCurrency(PRECO_PF)}</span>
          </button>
        </div>
      </div>

      {tipoServico === "lavagem" && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="space-y-3"
        >
          <Label className="block text-center text-zinc-400">
            Categoria do veículo
          </Label>
          <div className="space-y-2">
            {categoriasLavagem.map((cat) => (
              <button
                key={cat.value}
                type="button"
                onClick={() => setCategoria(cat.value)}
                className={cn(
                  "flex min-h-14 w-full items-center justify-between rounded-2xl border-2 px-4 py-3.5 transition-all active:scale-[0.99]",
                  categoria === cat.value
                    ? "border-emerald-400 bg-emerald-500/15"
                    : "border-zinc-800 bg-zinc-900"
                )}
              >
                <span
                  className={cn(
                    "font-semibold",
                    categoria === cat.value ? "text-emerald-400" : "text-white"
                  )}
                >
                  {cat.label}
                </span>
                <span
                  className={cn(
                    "text-base font-bold",
                    categoria === cat.value ? "text-emerald-300" : "text-zinc-400"
                  )}
                >
                  {formatCurrency(cat.preco)}
                </span>
              </button>
            ))}
          </div>

          <div className="space-y-2 pt-1">
            <Label className="block text-center text-zinc-400">
              Deseja polimento?
            </Label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: false, label: "Não" },
                {
                  value: true,
                  label: `Sim (+${formatCurrency(PRECO_POLIMENTO)})`,
                },
              ].map((opt) => (
                <button
                  key={String(opt.value)}
                  type="button"
                  onClick={() => setPolimento(opt.value)}
                  className={cn(
                    "min-h-12 rounded-2xl border-2 py-3 text-sm font-bold transition-all active:scale-[0.98]",
                    polimento === opt.value
                      ? "border-emerald-400 bg-emerald-500/15 text-emerald-400"
                      : "border-zinc-800 bg-zinc-900 text-zinc-400"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      <div className="space-y-2">
        <Label htmlFor="descricao" className="block text-center text-zinc-400">
          Descrição (opcional)
        </Label>
        <input
          id="descricao"
          type="text"
          placeholder="Ex: Cliente João lavagem completa"
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          className="h-14 w-full rounded-2xl border-2 border-zinc-800 bg-zinc-900 px-4 text-center text-base text-white placeholder:text-zinc-600 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/20"
        />
      </div>

      <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-center">
        <p className="text-sm text-zinc-400">Total a receber</p>
        <p className="mt-1 text-3xl font-bold text-emerald-400">
          {formatCurrency(valor)}
        </p>
        {tipoServico === "lavagem" && polimento && (
          <p className="mt-1 text-xs text-zinc-500">
            {CATEGORIA_LABELS[categoria]} + Polimento
          </p>
        )}
      </div>

      <motion.div whileTap={{ scale: 0.98 }}>
        <Button
          onClick={handleSubmit}
          disabled={loading}
          className="h-14 w-full rounded-2xl bg-emerald-500 text-base font-bold text-black shadow-lg shadow-emerald-500/25 hover:bg-emerald-400"
        >
          {loading ? "Salvando..." : "Registrar entrada"}
        </Button>
      </motion.div>
    </div>
  );
}
