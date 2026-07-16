"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  formatCurrency,
  maskCurrencyInput,
  parseCurrencyInput,
} from "@/lib/format";
import { buscarDiaAberto } from "@/services/dias.service";
import { listarItensAlimentacao } from "@/services/alimentacao.service";
import {
  calcularValorBaseComPrecos,
  calcularValorEntradaComPrecos,
  criarEntrada,
} from "@/services/entradas.service";
import {
  buscarPrecosLavagem,
  type PrecosLavagemMap,
} from "@/services/precos.service";
import { CATEGORIA_LABELS, ITEM_ALIMENTACAO_TIPO_LABELS } from "@/types";
import type { EntradaCategoria, ItemAlimentacao } from "@/types";
import { toast } from "sonner";
import {
  AlertCircle,
  Car,
  Check,
  Coffee,
  Minus,
  Plus,
  Settings,
  UtensilsCrossed,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

type TipoServico = "lavagem" | "alimentacao";

export function EntradaForm() {
  const router = useRouter();
  const [tipoServico, setTipoServico] = useState<TipoServico>("lavagem");
  const [categoria, setCategoria] = useState<EntradaCategoria>("hatch");
  const [polimento, setPolimento] = useState(false);
  const [descontoInput, setDescontoInput] = useState("");
  const [placa, setPlaca] = useState("");
  const [modelo, setModelo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [itensSelecionados, setItensSelecionados] = useState<
    Record<string, number>
  >({});
  const [precos, setPrecos] = useState<PrecosLavagemMap | null>(null);
  const [itens, setItens] = useState<ItemAlimentacao[]>([]);
  const [loading, setLoading] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [semDia, setSemDia] = useState(false);

  useEffect(() => {
    Promise.all([buscarPrecosLavagem(), listarItensAlimentacao(true)])
      .then(([p, i]) => {
        setPrecos(p);
        setItens(i);
      })
      .catch(() => toast.error("Erro ao carregar preços e itens."))
      .finally(() => setCarregando(false));
  }, []);

  const categoriasLavagem = useMemo(() => {
    if (!precos) return [];
    return [
      { value: "hatch" as const, label: "Hatch/Sedan", preco: precos.hatch },
      { value: "suv" as const, label: "SUV", preco: precos.suv },
      {
        value: "camionete" as const,
        label: "Camionete",
        preco: precos.camionete,
      },
    ];
  }, [precos]);

  const itensEscolhidos = useMemo(
    () =>
      itens
        .filter((item) => (itensSelecionados[item.id] ?? 0) > 0)
        .map((item) => ({
          item,
          quantidade: itensSelecionados[item.id],
          subtotal: item.valor * itensSelecionados[item.id],
        })),
    [itens, itensSelecionados]
  );

  const desconto =
    tipoServico === "lavagem" ? parseCurrencyInput(descontoInput) : 0;

  const valorAlimentacao = itensEscolhidos.reduce(
    (sum, row) => sum + row.subtotal,
    0
  );

  const valorBase =
    !precos
      ? 0
      : tipoServico === "alimentacao"
        ? valorAlimentacao
        : calcularValorBaseComPrecos("lavagem", categoria, polimento, precos);

  const valor =
    !precos
      ? 0
      : tipoServico === "alimentacao"
        ? valorAlimentacao
        : calcularValorEntradaComPrecos(
            "lavagem",
            categoria,
            polimento,
            precos,
            desconto
          );

  const alterarQuantidade = (id: string, delta: number) => {
    setItensSelecionados((prev) => {
      const atual = prev[id] ?? 0;
      const proximo = Math.max(0, Math.min(99, atual + delta));
      if (proximo === 0) {
        const { [id]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [id]: proximo };
    });
  };

  const toggleItem = (id: string) => {
    setItensSelecionados((prev) => {
      if ((prev[id] ?? 0) > 0) {
        const { [id]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [id]: 1 };
    });
  };

  const handleSubmit = async () => {
    if (!precos) return;

    if (tipoServico === "lavagem") {
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
    }

    if (tipoServico === "alimentacao" && itensEscolhidos.length === 0) {
      toast.error("Selecione pelo menos um item de alimentação.");
      return;
    }

    setLoading(true);
    try {
      const dia = await buscarDiaAberto();
      if (!dia) {
        setSemDia(true);
        toast.error("Inicie o dia antes de registrar entradas.");
        return;
      }

      if (tipoServico === "alimentacao") {
        const notaExtra = descricao.trim();
        await Promise.all(
          itensEscolhidos.map(({ item, quantidade, subtotal }) => {
            const baseDesc = `${ITEM_ALIMENTACAO_TIPO_LABELS[item.tipo]}: ${item.nome}${
              quantidade > 1 ? ` (x${quantidade})` : ""
            }`;
            return criarEntrada({
              diaId: dia.id,
              tipo: "outro",
              categoria: "outro",
              polimento: false,
              valorPersonalizado: subtotal,
              itemAlimentacaoId: item.id,
              descricao: notaExtra ? `${baseDesc} · ${notaExtra}` : baseDesc,
            });
          })
        );
        toast.success(
          itensEscolhidos.length === 1
            ? "Entrada registrada!"
            : `${itensEscolhidos.length} itens registrados!`
        );
      } else {
        await criarEntrada({
          diaId: dia.id,
          tipo: "lavagem",
          categoria,
          polimento,
          desconto,
          placa,
          modelo,
          descricao: descricao || undefined,
        });
        toast.success("Entrada registrada!");
      }

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

  if (carregando || !precos) {
    return (
      <p className="py-10 text-center text-sm text-zinc-500">Carregando...</p>
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
              setTipoServico("alimentacao");
              setPolimento(false);
              setDescontoInput("");
              setPlaca("");
              setModelo("");
            }}
            className={cn(
              "flex min-h-[5.5rem] flex-col items-center justify-center gap-1 rounded-2xl border-2 p-4 transition-all active:scale-[0.98]",
              tipoServico === "alimentacao"
                ? "border-emerald-400 bg-emerald-500/15 text-emerald-400 shadow-[0_0_20px_-8px_rgba(52,211,153,0.5)]"
                : "border-zinc-800 bg-zinc-900 text-zinc-400"
            )}
          >
            <UtensilsCrossed className="h-7 w-7" />
            <span className="text-sm font-bold">Alimentação</span>
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
                    categoria === cat.value
                      ? "text-emerald-300"
                      : "text-zinc-400"
                  )}
                >
                  {formatCurrency(cat.preco)}
                </span>
              </button>
            ))}
          </div>

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
                  label: `Sim (+${formatCurrency(precos.polimento)})`,
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
        </motion.div>
      )}

      {tipoServico === "alimentacao" && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="space-y-3"
        >
          <Label className="block text-center text-zinc-400">
            Escolha um ou mais itens
          </Label>

          {itens.length === 0 ? (
            <div className="space-y-3 rounded-2xl border border-dashed border-zinc-700 bg-zinc-900/50 p-5 text-center">
              <p className="text-sm text-zinc-400">
                Nenhum item cadastrado. Cadastre bebidas e comidas primeiro.
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
              {itens.map((item) => {
                const qtd = itensSelecionados[item.id] ?? 0;
                const selecionado = qtd > 0;

                return (
                  <div
                    key={item.id}
                    className={cn(
                      "rounded-2xl border-2 px-3 py-3 transition-all",
                      selecionado
                        ? "border-emerald-400 bg-emerald-500/15"
                        : "border-zinc-800 bg-zinc-900"
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => toggleItem(item.id)}
                      className="flex w-full items-center gap-3 text-left"
                    >
                      <div
                        className={cn(
                          "flex h-10 w-10 items-center justify-center rounded-lg",
                          selecionado
                            ? "bg-emerald-500/20 text-emerald-400"
                            : "bg-zinc-800 text-zinc-500"
                        )}
                      >
                        {selecionado ? (
                          <Check className="h-5 w-5" />
                        ) : item.tipo === "bebida" ? (
                          <Coffee className="h-5 w-5" />
                        ) : (
                          <UtensilsCrossed className="h-5 w-5" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p
                          className={cn(
                            "font-semibold",
                            selecionado ? "text-emerald-400" : "text-white"
                          )}
                        >
                          {item.nome}
                        </p>
                        <p className="text-xs text-zinc-500">
                          {ITEM_ALIMENTACAO_TIPO_LABELS[item.tipo]} ·{" "}
                          {formatCurrency(item.valor)}
                        </p>
                      </div>
                    </button>

                    {selecionado && (
                      <div className="mt-3 flex items-center justify-between border-t border-emerald-400/20 pt-3">
                        <span className="text-xs text-zinc-400">Quantidade</span>
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => alterarQuantidade(item.id, -1)}
                            className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-800 text-white active:scale-95"
                            aria-label="Diminuir"
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <span className="w-6 text-center text-lg font-bold text-emerald-400">
                            {qtd}
                          </span>
                          <button
                            type="button"
                            onClick={() => alterarQuantidade(item.id, 1)}
                            className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500 text-black active:scale-95"
                            aria-label="Aumentar"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                          <span className="min-w-16 text-right text-sm font-bold text-emerald-300">
                            {formatCurrency(item.valor * qtd)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>
      )}

      <div className="space-y-2">
        <Label htmlFor="descricao" className="block text-center text-zinc-400">
          Descrição (opcional)
        </Label>
        <input
          id="descricao"
          type="text"
          placeholder={
            tipoServico === "alimentacao"
              ? "Ex: Cliente João"
              : "Ex: Cliente João lavagem completa"
          }
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
        {tipoServico === "lavagem" && (
          <p className="mt-1 text-xs text-zinc-500">
            {CATEGORIA_LABELS[categoria]}
            {polimento ? " + Polimento" : ""}
            {desconto > 0 ? ` − Desconto ${formatCurrency(desconto)}` : ""}
          </p>
        )}
        {tipoServico === "alimentacao" && itensEscolhidos.length > 0 && (
          <p className="mt-1 text-xs text-zinc-500">
            {itensEscolhidos
              .map(
                ({ item, quantidade }) =>
                  `${quantidade > 1 ? `${quantidade}x ` : ""}${item.nome}`
              )
              .join(" · ")}
          </p>
        )}
      </div>

      <motion.div whileTap={{ scale: 0.98 }}>
        <Button
          onClick={handleSubmit}
          disabled={
            loading ||
            (tipoServico === "alimentacao" &&
              (itens.length === 0 || itensEscolhidos.length === 0))
          }
          className="h-14 w-full rounded-2xl bg-emerald-500 text-base font-bold text-black shadow-lg shadow-emerald-500/25 hover:bg-emerald-400"
        >
          {loading ? "Salvando..." : "Registrar entrada"}
        </Button>
      </motion.div>
    </div>
  );
}
