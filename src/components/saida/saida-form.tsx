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
    } catch {
      toast.error("Erro ao registrar saída.");
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
    <div className="space-y-6">
      <div className="space-y-3">
        <Label className="text-zinc-400">Categoria</Label>
        <div className="space-y-2">
          {categorias.map((cat) => {
            const Icon = cat.icon;
            return (
              <button
                key={cat.value}
                type="button"
                onClick={() => setCategoria(cat.value)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl border px-4 py-3.5 transition-all",
                  categoria === cat.value
                    ? "border-red-400 bg-red-400/10"
                    : "border-zinc-800 bg-zinc-900 hover:border-zinc-700"
                )}
              >
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-lg",
                    categoria === cat.value
                      ? "bg-red-400/20 text-red-400"
                      : "bg-zinc-800 text-zinc-500"
                  )}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <span
                  className={cn(
                    "font-medium",
                    categoria === cat.value ? "text-red-400" : "text-white"
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
        <Label htmlFor="valor" className="text-zinc-400">
          Valor
        </Label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-semibold text-red-400">
            R$
          </span>
          <input
            id="valor"
            type="text"
            inputMode="numeric"
            placeholder="0,00"
            value={valor}
            onChange={(e) => setValor(maskCurrencyInput(e.target.value))}
            className="h-14 w-full rounded-xl border border-zinc-800 bg-zinc-900 pl-12 pr-4 text-2xl font-bold text-white placeholder:text-zinc-600 focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-400/20"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="descricao-saida" className="text-zinc-400">
          Descrição
        </Label>
        <input
          id="descricao-saida"
          type="text"
          placeholder="Ex: Pagamento auxiliar"
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          className="h-12 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 text-white placeholder:text-zinc-600 focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-400/20"
        />
      </div>

      <motion.div whileTap={{ scale: 0.98 }}>
        <Button
          onClick={handleSubmit}
          disabled={loading}
          className="h-14 w-full rounded-xl bg-red-500 text-base font-bold text-white hover:bg-red-400"
        >
          {loading ? "Salvando..." : "Registrar saída"}
        </Button>
      </motion.div>
    </div>
  );
}
