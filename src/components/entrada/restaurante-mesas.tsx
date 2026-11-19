"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import { listarItensAlimentacao } from "@/services/alimentacao.service";
import { obterOuCriarDiaPorData } from "@/services/dias.service";
import {
  adicionarItemNaMesa,
  adicionarMesa,
  alterarQuantidadeItem,
  finalizarServicoMesa,
  iniciarServicoMesa,
  listarConsumoDoServico,
  listarMesasComStatus,
  retirarMesa,
} from "@/services/mesas.service";
import { ITEM_ALIMENTACAO_TIPO_LABELS } from "@/types";
import type { ItemAlimentacao, MesaComStatus, MesaConsumo } from "@/types";
import { toast } from "sonner";
import {
  ArrowLeft,
  CheckCircle2,
  Coffee,
  Minus,
  Plus,
  Settings,
  Trash2,
  UtensilsCrossed,
} from "lucide-react";

type ConsumoComItem = MesaConsumo & { item: ItemAlimentacao };

export function RestauranteMesas() {
  const [mesas, setMesas] = useState<MesaComStatus[]>([]);
  const [itens, setItens] = useState<ItemAlimentacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [mesaAtivaId, setMesaAtivaId] = useState<string | null>(null);
  const [consumo, setConsumo] = useState<ConsumoComItem[]>([]);
  const [modoRetirar, setModoRetirar] = useState(false);

  const carregar = useCallback(async () => {
    const [listaMesas, listaItens] = await Promise.all([
      listarMesasComStatus(),
      listarItensAlimentacao(true),
    ]);
    setMesas(listaMesas);
    setItens(listaItens);
  }, []);

  useEffect(() => {
    carregar()
      .catch(() => toast.error("Erro ao carregar mesas."))
      .finally(() => setLoading(false));
  }, [carregar]);

  const mesaAtiva = mesas.find((m) => m.id === mesaAtivaId) ?? null;

  const carregarConsumo = useCallback(async (servicoId: string) => {
    const rows = await listarConsumoDoServico(servicoId);
    setConsumo(rows);
  }, []);

  useEffect(() => {
    if (mesaAtiva?.servico) {
      carregarConsumo(mesaAtiva.servico.id).catch(() =>
        toast.error("Erro ao carregar consumo da mesa.")
      );
    } else {
      setConsumo([]);
    }
  }, [mesaAtiva?.servico?.id, carregarConsumo, mesaAtiva?.servico]);

  const totalMesa = consumo.reduce(
    (sum, c) => sum + c.quantidade * c.valor_unitario,
    0
  );

  const handleAdicionarMesa = async () => {
    setBusy(true);
    try {
      await adicionarMesa();
      await carregar();
      toast.success("Mesa adicionada!");
    } catch {
      toast.error("Não foi possível adicionar a mesa.");
    } finally {
      setBusy(false);
    }
  };

  const handleRetirarMesa = async (mesa: MesaComStatus) => {
    if (mesa.servico) {
      toast.error("Finalize o serviço antes de retirar a mesa.");
      return;
    }
    setBusy(true);
    try {
      await retirarMesa(mesa.id);
      await carregar();
      toast.success(`Mesa ${mesa.numero} removida.`);
      if (mesas.filter((m) => m.id !== mesa.id).length === 0) {
        setModoRetirar(false);
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Erro ao retirar mesa."
      );
    } finally {
      setBusy(false);
    }
  };

  const abrirMesa = (mesa: MesaComStatus) => {
    if (modoRetirar) {
      void handleRetirarMesa(mesa);
      return;
    }
    setMesaAtivaId(mesa.id);
  };

  const handleIniciar = async () => {
    if (!mesaAtiva) return;
    setBusy(true);
    try {
      const dia = await obterOuCriarDiaPorData();
      await iniciarServicoMesa(mesaAtiva.id, dia.id);
      await carregar();
      toast.success(`Serviço da mesa ${mesaAtiva.numero} iniciado.`);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Erro ao iniciar serviço."
      );
    } finally {
      setBusy(false);
    }
  };

  const handleAddItem = async (item: ItemAlimentacao) => {
    if (!mesaAtiva?.servico) return;
    setBusy(true);
    try {
      await adicionarItemNaMesa({
        servicoId: mesaAtiva.servico.id,
        item,
      });
      await Promise.all([carregar(), carregarConsumo(mesaAtiva.servico.id)]);
    } catch {
      toast.error("Erro ao adicionar item.");
    } finally {
      setBusy(false);
    }
  };

  const handleQtd = async (consumoId: string, delta: number) => {
    if (!mesaAtiva?.servico) return;
    setBusy(true);
    try {
      await alterarQuantidadeItem(consumoId, delta);
      await Promise.all([carregar(), carregarConsumo(mesaAtiva.servico.id)]);
    } catch {
      toast.error("Erro ao atualizar quantidade.");
    } finally {
      setBusy(false);
    }
  };

  const handleFinalizar = async () => {
    if (!mesaAtiva?.servico) return;
    setBusy(true);
    try {
      const dia = await obterOuCriarDiaPorData();

      // Recarrega status atual da mesa
      const lista = await listarMesasComStatus();
      const atual = lista.find((m) => m.id === mesaAtiva.id);
      if (!atual?.servico) {
        toast.error("Serviço da mesa não encontrado.");
        return;
      }

      const { total } = await finalizarServicoMesa({
        mesa: atual,
        diaId: dia.id,
      });

      toast.success(
        `Mesa ${atual.numero} finalizada · ${formatCurrency(total)} nas entradas`
      );
      setMesaAtivaId(null);
      setConsumo([]);
      await carregar();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Erro ao finalizar mesa."
      );
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <p className="py-10 text-center text-sm text-zinc-500">
        Carregando mesas...
      </p>
    );
  }

  // Detalhe da mesa
  if (mesaAtiva) {
    const ocupada = !!mesaAtiva.servico;

    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        <button
          type="button"
          onClick={() => setMesaAtivaId(null)}
          className="flex items-center gap-2 text-sm font-medium text-zinc-400 active:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar às mesas
        </button>

        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4 text-center">
          <p className="text-xs uppercase tracking-wider text-zinc-500">
            Mesa
          </p>
          <p className="text-3xl font-bold text-white">{mesaAtiva.numero}</p>
          <p
            className={cn(
              "mt-1 text-sm font-semibold",
              ocupada ? "text-amber-400" : "text-emerald-400"
            )}
          >
            {ocupada ? "Em atendimento" : "Livre"}
          </p>
        </div>

        {!ocupada ? (
          <Button
            onClick={handleIniciar}
            disabled={busy}
            className="h-14 w-full rounded-2xl bg-amber-400 text-base font-bold text-black hover:bg-amber-300"
          >
            {busy ? "Abrindo..." : "Iniciar serviço"}
          </Button>
        ) : (
          <>
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-center">
              <p className="text-sm text-zinc-400">Total da mesa</p>
              <p className="mt-1 text-3xl font-bold text-emerald-400">
                {formatCurrency(totalMesa)}
              </p>
              <p className="mt-1 text-xs text-zinc-500">
                {consumo.reduce((s, c) => s + c.quantidade, 0)} item(ns)
              </p>
            </div>

            {consumo.length > 0 && (
              <div className="space-y-2">
                <p className="text-center text-xs font-medium uppercase tracking-wider text-zinc-500">
                  Consumo
                </p>
                {consumo.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2.5"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-white">
                        {c.item.nome}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {formatCurrency(c.valor_unitario)} un.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => handleQtd(c.id, -1)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-800 text-white active:scale-95"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="w-5 text-center text-sm font-bold text-emerald-400">
                        {c.quantidade}
                      </span>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => handleQtd(c.id, 1)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500 text-black active:scale-95"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                      <span className="min-w-14 text-right text-sm font-bold text-emerald-300">
                        {formatCurrency(c.quantidade * c.valor_unitario)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-2">
              <p className="text-center text-xs font-medium uppercase tracking-wider text-zinc-500">
                Adicionar ao pedido
              </p>
              {itens.length === 0 ? (
                <div className="space-y-3 rounded-2xl border border-dashed border-zinc-700 bg-zinc-900/50 p-5 text-center">
                  <p className="text-sm text-zinc-400">
                    Cadastre itens no cardápio primeiro.
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
                  {itens.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      disabled={busy}
                      onClick={() => handleAddItem(item)}
                      className="flex w-full items-center gap-3 rounded-2xl border-2 border-zinc-800 bg-zinc-900 px-3 py-3 text-left transition-all active:scale-[0.99] active:border-emerald-400/50"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-800 text-zinc-400">
                        {item.tipo === "bebida" ? (
                          <Coffee className="h-5 w-5" />
                        ) : (
                          <UtensilsCrossed className="h-5 w-5" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-white">{item.nome}</p>
                        <p className="text-xs text-zinc-500">
                          {ITEM_ALIMENTACAO_TIPO_LABELS[item.tipo]} ·{" "}
                          {formatCurrency(item.valor)}
                        </p>
                      </div>
                      <Plus className="h-5 w-5 text-emerald-400" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <Button
              onClick={handleFinalizar}
              disabled={busy || consumo.length === 0}
              className="h-14 w-full rounded-2xl bg-emerald-500 text-base font-bold text-black shadow-lg shadow-emerald-500/25 hover:bg-emerald-400"
            >
              <CheckCircle2 className="mr-2 h-5 w-5" />
              {busy ? "Finalizando..." : "Finalizar mesa"}
            </Button>
          </>
        )}
      </motion.div>
    );
  }

  // Grade de mesas
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      className="space-y-4"
    >
      <div className="grid grid-cols-2 gap-2">
        <Button
          type="button"
          disabled={busy}
          onClick={handleAdicionarMesa}
          className="h-12 rounded-xl bg-amber-400 font-bold text-black hover:bg-amber-300"
        >
          <Plus className="mr-1.5 h-4 w-4" />
          Adicionar mesa
        </Button>
        <Button
          type="button"
          disabled={busy || mesas.length === 0}
          variant="outline"
          onClick={() => setModoRetirar((v) => !v)}
          className={cn(
            "h-12 rounded-xl border-2 font-bold",
            modoRetirar
              ? "border-red-400 bg-red-500/15 text-red-400"
              : "border-zinc-700 bg-transparent text-zinc-300 hover:bg-zinc-800"
          )}
        >
          <Trash2 className="mr-1.5 h-4 w-4" />
          {modoRetirar ? "Cancelar" : "Retirar mesa"}
        </Button>
      </div>

      {modoRetirar && (
        <p className="text-center text-xs text-red-400">
          Toque em uma mesa livre para removê-la
        </p>
      )}

      {mesas.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-700 p-8 text-center">
          <p className="text-sm text-zinc-400">
            Nenhuma mesa. Toque em &quot;Adicionar mesa&quot; para começar.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {mesas.map((mesa, index) => {
            const ocupada = !!mesa.servico;
            return (
              <motion.button
                key={mesa.id}
                type="button"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                disabled={busy || (modoRetirar && ocupada)}
                onClick={() => abrirMesa(mesa)}
                className={cn(
                  "flex min-h-[7.5rem] flex-col items-center justify-center gap-1 rounded-2xl border-2 p-4 transition-all active:scale-[0.98]",
                  modoRetirar && !ocupada
                    ? "border-red-400/60 bg-red-500/10"
                    : ocupada
                      ? "border-amber-400 bg-amber-400/10"
                      : "border-zinc-800 bg-zinc-900"
                )}
              >
                <span className="text-xs uppercase tracking-wider text-zinc-500">
                  Mesa
                </span>
                <span className="text-3xl font-bold text-white">
                  {mesa.numero}
                </span>
                {ocupada ? (
                  <>
                    <span className="text-xs font-semibold text-amber-400">
                      Ocupada
                    </span>
                    <span className="text-sm font-bold text-emerald-400">
                      {formatCurrency(mesa.total)}
                    </span>
                  </>
                ) : (
                  <span className="text-xs font-semibold text-emerald-400">
                    Livre
                  </span>
                )}
              </motion.button>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
