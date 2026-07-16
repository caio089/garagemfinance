"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { maskCurrencyInput, parseCurrencyInput } from "@/lib/format";
import { buscarDiaAberto } from "@/services/dias.service";
import { criarSaida } from "@/services/saidas.service";
import { SAIDA_CATEGORIA_LABELS } from "@/types";
import type { SaidaCategoria } from "@/types";
import { toast } from "sonner";
import { AlertCircle, ChefHat, Droplets, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const categorias: {
  value: SaidaCategoria;
  label: string;
  icon: typeof ChefHat;
}[] = [
  { value: "cozinha", label: "Cozinha", icon: ChefHat },
  { value: "funcionario", label: "Funcionário", icon: Users },
  { value: "lava_jato", label: "Lava-jato", icon: Droplets },
];

export function SaidaForm() {
  const router = useRouter();
  const [categoria, setCategoria] = useState<SaidaCategoria>("funcionario");
  const [valor, setValor] = useState("");
  const [descricao, setDescricao] = useState("");
  const [loading, setLoading] = useState(false);
  const [semDia, setSemDia] = useState(false);

  const handleSubmit = async () => {
    const valorNumerico = parseCurrencyInput(valor);
    if (valorNumerico <= 0) {
      toast.error("Informe um valor válido.");
      return;
    }

    setLoading(true);
    try {
      const dia = await buscarDiaAberto();
      if (!dia) {
        setSemDia(true);
        toast.error("Inicie o dia antes de registrar saídas.");
        return;
      }

      await criarSaida({
        diaId: dia.id,
        categoria,
        valor: valorNumerico,
        descricao: descricao || undefined,
      });

      toast.success("Saída registrada!");
      router.push("/");
    } catch (err) {
      const message =
        err instanceof Error && err.message
          ? err.message
          : "Erro ao registrar saída.";
      console.error("Erro ao registrar saída:", err);
      toast.error(message);
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
        <Label className="block text-center text-zinc-400">Categoria</Label>
        <div className="space-y-2">
          {categorias.map((cat) => {
            const Icon = cat.icon;
            return (
              <button
                key={cat.value}
                type="button"
                onClick={() => setCategoria(cat.value)}
                className={cn(
                  "flex min-h-14 w-full items-center gap-3 rounded-2xl border-2 px-4 py-3.5 transition-all active:scale-[0.99]",
                  categoria === cat.value
                    ? "border-rose-400 bg-rose-500/15"
                    : "border-zinc-800 bg-zinc-900"
                )}
              >
                <div
                  className={cn(
                    "flex h-11 w-11 items-center justify-center rounded-xl",
                    categoria === cat.value
                      ? "bg-rose-500/25 text-rose-400"
                      : "bg-zinc-800 text-zinc-500"
                  )}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <span
                  className={cn(
                    "text-base font-semibold",
                    categoria === cat.value ? "text-rose-400" : "text-white"
                  )}
                >
                  {SAIDA_CATEGORIA_LABELS[cat.value]}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="valor" className="block text-center text-zinc-400">
          Valor
        </Label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-rose-400">
            R$
          </span>
          <input
            id="valor"
            type="text"
            inputMode="decimal"
            placeholder="0,00"
            value={valor}
            onChange={(e) => setValor(maskCurrencyInput(e.target.value))}
            className="h-16 w-full rounded-2xl border-2 border-zinc-800 bg-zinc-900 pl-12 pr-4 text-center text-2xl font-bold text-white placeholder:text-zinc-600 focus:border-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-400/20"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label
          htmlFor="descricao-saida"
          className="block text-center text-zinc-400"
        >
          Descrição
        </Label>
        <input
          id="descricao-saida"
          type="text"
          placeholder="Ex: Pagamento auxiliar"
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          className="h-14 w-full rounded-2xl border-2 border-zinc-800 bg-zinc-900 px-4 text-center text-base text-white placeholder:text-zinc-600 focus:border-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-400/20"
        />
      </div>

      <motion.div whileTap={{ scale: 0.98 }}>
        <Button
          onClick={handleSubmit}
          disabled={loading}
          className="h-14 w-full rounded-2xl bg-rose-500 text-base font-bold text-white shadow-lg shadow-rose-500/25 hover:bg-rose-400"
        >
          {loading ? "Salvando..." : "Registrar saída"}
        </Button>
      </motion.div>
    </div>
  );
}
