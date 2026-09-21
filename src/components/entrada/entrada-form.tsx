"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  formatCurrency,
  maskCurrencyInput,
  parseCurrencyInput,
} from "@/lib/format";
import { obterOuCriarDiaPorData } from "@/services/dias.service";
import { calcularValorLavagem, criarEntrada } from "@/services/entradas.service";
import { buscarPrecosLavagem } from "@/services/precos.service";
import { listarServicosLavagem } from "@/services/servicos-lavagem.service";
import type { ServicoLavagem } from "@/types";
import { toast } from "sonner";
import { Car, CircleDollarSign, Settings, UtensilsCrossed } from "lucide-react";
import { cn } from "@/lib/utils";
import { RestauranteMesas } from "@/components/entrada/restaurante-mesas";

type TipoServico = "lavagem" | "restaurante" | "avulsa";

export function EntradaForm() {
  const router = useRouter();
  const [tipoServico, setTipoServico] = useState<TipoServico>("lavagem");
  const [servicoId, setServicoId] = useState<string>("");
  const [servicos, setServicos] = useState<ServicoLavagem[]>([]);
  const [precoPolimento, setPrecoPolimento] = useState(10);
  const [polimento, setPolimento] = useState(false);
  const [descontoInput, setDescontoInput] = useState("");
  const [placa, setPlaca] = useState("");
  const [modelo, setModelo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [valorAvulsaInput, setValorAvulsaInput] = useState("");
  const [servicoExtraInput, setServicoExtraInput] = useState("");
  const [descricaoExtra, setDescricaoExtra] = useState("");
  const [loading, setLoading] = useState(false);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    Promise.all([listarServicosLavagem(true), buscarPrecosLavagem()])
      .then(([lista, precos]) => {
        setServicos(lista);
        setPrecoPolimento(precos.polimento);
        if (lista.length > 0) setServicoId(lista[0].id);
      })
      .catch(() => toast.error("Erro ao carregar serviços."))
      .finally(() => setCarregando(false));
  }, []);

  const servicoSelecionado = useMemo(
    () => servicos.find((s) => s.id === servicoId) ?? null,
    [servicos, servicoId]
  );

  const desconto =
    tipoServico === "lavagem" ? parseCurrencyInput(descontoInput) : 0;

  const valorAvulsa = parseCurrencyInput(valorAvulsaInput);
  const servicoExtra =
    tipoServico === "lavagem" ? parseCurrencyInput(servicoExtraInput) : 0;

  const { base: valorBase, total: valor } = useMemo(() => {
    if (tipoServico === "avulsa") {
      return { base: valorAvulsa, total: valorAvulsa };
    }
    if (tipoServico !== "lavagem" || !servicoSelecionado) {
      return { base: 0, total: 0 };
    }
    return calcularValorLavagem(
      servicoSelecionado.valor,
      polimento,
      precoPolimento,
      desconto,
      servicoExtra
    );
  }, [
    tipoServico,
    servicoSelecionado,
    polimento,
    precoPolimento,
    desconto,
    valorAvulsa,
    servicoExtra,
  ]);

  const handleSubmit = async () => {
    if (tipoServico === "restaurante") return;

    if (tipoServico === "avulsa") {
      if (valorAvulsa <= 0) {
        toast.error("Informe um valor válido para a entrada avulsa.");
        return;
      }

      setLoading(true);
      try {
        const dia = await obterOuCriarDiaPorData();

        await criarEntrada({
          diaId: dia.id,
          tipo: "avulsa",
          polimento: false,
          descricao: descricao || undefined,
          valorPersonalizado: valorAvulsa,
        });
        toast.success("Entrada avulsa registrada!");
        router.push("/");
      } catch {
        toast.error("Erro ao registrar entrada.");
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!servicoSelecionado) {
      toast.error("Cadastre um tipo de serviço em Cadastro.");
      return;
    }
    if (!placa.trim()) {
      toast.error("Informe a placa do carro.");
      return;
    }
    if (!modelo.trim()) {
      toast.error("Informe o modelo do carro.");
      return;
    }
    if (desconto > valorBase) {
      toast.error("O desconto não pode ser maior que o valor da lavagem.");
      return;
    }
    if (servicoExtra > 0 && !descricaoExtra.trim()) {
      toast.error("Descreva o serviço extra.");
      return;
    }

    setLoading(true);
    try {
      const dia = await obterOuCriarDiaPorData();

      await criarEntrada({
        diaId: dia.id,
        tipo: "lavagem",
        polimento,
        desconto,
        placa,
        modelo,
        descricao: descricao || undefined,
        servicoLavagemId: servicoSelecionado.id,
        nomeServico: servicoSelecionado.nome,
        valorPersonalizado: servicoSelecionado.valor,
        servicoExtraValor: servicoExtra > 0 ? servicoExtra : undefined,
        servicoExtraDescricao:
          servicoExtra > 0 ? descricaoExtra.trim() : undefined,
      });
      toast.success("Entrada registrada!");
      router.push("/");
    } catch {
      toast.error("Erro ao registrar entrada.");
    } finally {
      setLoading(false);
    }
  };

  if (carregando) {
    return (
      <p className="py-10 text-center text-sm text-zinc-500">Carregando...</p>
    );
  }

  return (
    <div className="space-y-5">
      <div className="space-y-3">
        <Label className="block text-center text-zinc-400">Tipo de serviço</Label>
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => setTipoServico("lavagem")}
            className={cn(
              "flex min-h-[5.5rem] flex-col items-center justify-center gap-2 rounded-2xl border-2 p-3 transition-all active:scale-[0.98] sm:p-4",
              tipoServico === "lavagem"
                ? "border-emerald-400 bg-emerald-500/15 text-emerald-400 shadow-[0_0_20px_-8px_rgba(52,211,153,0.5)]"
                : "border-zinc-800 bg-zinc-900 text-zinc-400"
            )}
          >
            <Car className="h-6 w-6 sm:h-7 sm:w-7" />
            <span className="text-xs font-bold sm:text-sm">Lavagem</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setTipoServico("restaurante");
              setPolimento(false);
              setDescontoInput("");
              setPlaca("");
              setModelo("");
              setValorAvulsaInput("");
            }}
            className={cn(
              "flex min-h-[5.5rem] flex-col items-center justify-center gap-1 rounded-2xl border-2 p-3 transition-all active:scale-[0.98] sm:p-4",
              tipoServico === "restaurante"
                ? "border-emerald-400 bg-emerald-500/15 text-emerald-400 shadow-[0_0_20px_-8px_rgba(52,211,153,0.5)]"
                : "border-zinc-800 bg-zinc-900 text-zinc-400"
            )}
          >
            <UtensilsCrossed className="h-6 w-6 sm:h-7 sm:w-7" />
            <span className="text-xs font-bold sm:text-sm">Restaurante</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setTipoServico("avulsa");
              setPolimento(false);
              setDescontoInput("");
              setPlaca("");
              setModelo("");
            }}
            className={cn(
              "flex min-h-[5.5rem] flex-col items-center justify-center gap-1 rounded-2xl border-2 p-3 transition-all active:scale-[0.98] sm:p-4",
              tipoServico === "avulsa"
                ? "border-emerald-400 bg-emerald-500/15 text-emerald-400 shadow-[0_0_20px_-8px_rgba(52,211,153,0.5)]"
                : "border-zinc-800 bg-zinc-900 text-zinc-400"
            )}
          >
            <CircleDollarSign className="h-6 w-6 sm:h-7 sm:w-7" />
            <span className="text-xs font-bold sm:text-sm">Avulsa</span>
          </button>
        </div>
      </div>

      {tipoServico === "restaurante" && (
        <RestauranteMesas />
      )}

      {tipoServico === "avulsa" && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="space-y-3"
        >
          <div className="space-y-2">
            <Label
              htmlFor="valor-avulsa"
              className="block text-center text-zinc-400"
            >
              Valor da entrada
            </Label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-base font-bold text-amber-400">
                R$
              </span>
              <input
                id="valor-avulsa"
                type="text"
                inputMode="decimal"
                placeholder="0,00"
                value={valorAvulsaInput}
                onChange={(e) =>
                  setValorAvulsaInput(maskCurrencyInput(e.target.value))
                }
                className="h-14 w-full rounded-2xl border-2 border-zinc-800 bg-zinc-900 pl-12 pr-4 text-center text-2xl font-bold text-white placeholder:text-zinc-600 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/20"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="descricao-avulsa"
              className="block text-center text-zinc-400"
            >
              Descrição (opcional)
            </Label>
            <input
              id="descricao-avulsa"
              type="text"
              placeholder="Ex: Venda de produto, serviço extra..."
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              className="h-14 w-full rounded-2xl border-2 border-zinc-800 bg-zinc-900 px-4 text-center text-base text-white placeholder:text-zinc-600 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/20"
            />
          </div>

          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-center">
            <p className="text-sm text-zinc-400">Total a receber</p>
            <p className="mt-1 text-3xl font-bold text-emerald-400">
              {formatCurrency(valorAvulsa)}
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              Soma no total de entradas do dia
            </p>
          </div>

          <motion.div whileTap={{ scale: 0.98 }}>
            <Button
              onClick={handleSubmit}
              disabled={loading || valorAvulsa <= 0}
              className="h-14 w-full rounded-2xl bg-emerald-500 text-base font-bold text-black shadow-lg shadow-emerald-500/25 hover:bg-emerald-400"
            >
              {loading ? "Salvando..." : "Registrar entrada avulsa"}
            </Button>
          </motion.div>
        </motion.div>
      )}

      {tipoServico === "lavagem" && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="space-y-3"
        >
          <Label className="block text-center text-zinc-400">
            Tipo de serviço
          </Label>

          {servicos.length === 0 ? (
            <div className="space-y-3 rounded-2xl border border-dashed border-zinc-700 bg-zinc-900/50 p-5 text-center">
              <p className="text-sm text-zinc-400">
                Nenhum serviço cadastrado. Cadastre os tipos de lavagem
                primeiro.
              </p>
              <Link
                href="/cadastro"
                className="inline-flex items-center gap-2 rounded-xl bg-amber-400 px-4 py-2.5 text-sm font-bold text-black"
              >
                <Settings className="h-4 w-4" />
                Ir para Cadastro
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {servicos.map((servico) => (
                <button
                  key={servico.id}
                  type="button"
                  onClick={() => setServicoId(servico.id)}
                  className={cn(
                    "flex min-h-14 w-full items-center justify-between rounded-2xl border-2 px-4 py-3.5 transition-all active:scale-[0.99]",
                    servicoId === servico.id
                      ? "border-emerald-400 bg-emerald-500/15"
                      : "border-zinc-800 bg-zinc-900"
                  )}
                >
                  <span
                    className={cn(
                      "font-semibold",
                      servicoId === servico.id
                        ? "text-emerald-400"
                        : "text-white"
                    )}
                  >
                    {servico.nome}
                  </span>
                  <span
                    className={cn(
                      "text-base font-bold",
                      servicoId === servico.id
                        ? "text-emerald-300"
                        : "text-zinc-400"
                    )}
                  >
                    {formatCurrency(servico.valor)}
                  </span>
                </button>
              ))}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="desconto" className="block text-center text-zinc-400">
              Desconto (opcional)
            </Label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-base font-bold text-amber-400">
                R$
              </span>
              <input
                id="desconto"
                type="text"
                inputMode="decimal"
                placeholder="0,00"
                value={descontoInput}
                onChange={(e) =>
                  setDescontoInput(maskCurrencyInput(e.target.value))
                }
                className="h-14 w-full rounded-2xl border-2 border-zinc-800 bg-zinc-900 pl-12 pr-4 text-center text-base font-bold text-white placeholder:text-zinc-600 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/20"
              />
            </div>
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
                  label: `Sim (+${formatCurrency(precoPolimento)})`,
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

          <div className="space-y-3 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
            <p className="text-center text-sm font-semibold text-zinc-300">
              Serviço extra{" "}
              <span className="font-normal text-zinc-500">(opcional)</span>
            </p>
            <div className="space-y-2">
              <Label
                htmlFor="servico-extra-valor"
                className="block text-center text-zinc-400"
              >
                Valor do extra
              </Label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-base font-bold text-amber-400">
                  R$
                </span>
                <input
                  id="servico-extra-valor"
                  type="text"
                  inputMode="decimal"
                  placeholder="0,00"
                  value={servicoExtraInput}
                  onChange={(e) =>
                    setServicoExtraInput(maskCurrencyInput(e.target.value))
                  }
                  className="h-14 w-full rounded-2xl border-2 border-zinc-800 bg-zinc-950 pl-12 pr-4 text-center text-base font-bold text-white placeholder:text-zinc-600 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/20"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label
                htmlFor="servico-extra-desc"
                className="block text-center text-zinc-400"
              >
                O que foi o serviço extra?
              </Label>
              <input
                id="servico-extra-desc"
                type="text"
                placeholder="Ex: Engraxamento, limpeza de motor..."
                value={descricaoExtra}
                onChange={(e) => setDescricaoExtra(e.target.value)}
                className="h-14 w-full rounded-2xl border-2 border-zinc-800 bg-zinc-950 px-4 text-center text-base text-white placeholder:text-zinc-600 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/20"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="placa" className="block text-center text-zinc-400">
              Placa do carro
            </Label>
            <input
              id="placa"
              type="text"
              autoCapitalize="characters"
              placeholder="ABC1D23"
              value={placa}
              onChange={(e) =>
                setPlaca(
                  e.target.value
                    .toUpperCase()
                    .replace(/[^A-Z0-9]/g, "")
                    .slice(0, 7)
                )
              }
              className="h-14 w-full rounded-2xl border-2 border-zinc-800 bg-zinc-900 px-4 text-center text-base font-bold tracking-widest text-white placeholder:text-zinc-600 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/20"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="modelo" className="block text-center text-zinc-400">
              Modelo do carro
            </Label>
            <input
              id="modelo"
              type="text"
              placeholder="Ex: Gol, Onix, Hilux"
              value={modelo}
              onChange={(e) => setModelo(e.target.value)}
              className="h-14 w-full rounded-2xl border-2 border-zinc-800 bg-zinc-900 px-4 text-center text-base text-white placeholder:text-zinc-600 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/20"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao" className="block text-center text-zinc-400">
              Observação (opcional)
            </Label>
            <input
              id="descricao"
              type="text"
              placeholder="Ex: Cliente João"
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
            <p className="mt-1 text-xs text-zinc-500">
              {servicoSelecionado?.nome ?? "—"}
              {polimento ? " + Polimento" : ""}
              {servicoExtra > 0
                ? ` + Extra ${formatCurrency(servicoExtra)}`
                : ""}
              {desconto > 0 ? ` − Desconto ${formatCurrency(desconto)}` : ""}
            </p>
          </div>

          <motion.div whileTap={{ scale: 0.98 }}>
            <Button
              onClick={handleSubmit}
              disabled={loading || servicos.length === 0}
              className="h-14 w-full rounded-2xl bg-emerald-500 text-base font-bold text-black shadow-lg shadow-emerald-500/25 hover:bg-emerald-400"
            >
              {loading ? "Salvando..." : "Registrar entrada"}
            </Button>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
