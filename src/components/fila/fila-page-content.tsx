"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Car,
  CheckCircle2,
  Clock3,
  Loader2,
  MessageCircle,
  Phone,
  Plus,
  Search,
  Trash2,
  User,
  X,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { LiveClock } from "@/components/layout/live-clock";
import {
  formatCurrency,
  formatTime,
  maskCurrencyInput,
  parseCurrencyInput,
} from "@/lib/format";
import { cn } from "@/lib/utils";
import { calcularValorLavagem } from "@/services/entradas.service";
import { buscarPrecosLavagem } from "@/services/precos.service";
import { listarServicosLavagem } from "@/services/servicos-lavagem.service";
import {
  adicionarNaFila,
  finalizarItemFila,
  excluirItemFilaFinalizado,
  atualizarStatusFila,
  buscarClientePorPlaca,
  formatarWhatsappInput,
  linkWhatsappCarroPronto,
  listarFilaAtiva,
  listarFilaFinalizadosHoje,
  normalizarPlaca,
} from "@/services/fila.service";
import type { FilaLavagemItem, ServicoLavagem } from "@/types";

type AbaFila = "lavando" | "finalizados";

export function FilaPageContent() {
  const [servicos, setServicos] = useState<ServicoLavagem[]>([]);
  const [precoPolimento, setPrecoPolimento] = useState(10);
  const [filaAtiva, setFilaAtiva] = useState<FilaLavagemItem[]>([]);
  const [finalizados, setFinalizados] = useState<FilaLavagemItem[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [buscandoPlaca, setBuscandoPlaca] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [clienteRecorrente, setClienteRecorrente] = useState(false);
  const [visitas, setVisitas] = useState(0);
  const [aba, setAba] = useState<AbaFila>("lavando");
  const [mostrarCadastro, setMostrarCadastro] = useState(false);

  const [placa, setPlaca] = useState("");
  const [nome, setNome] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [servicoId, setServicoId] = useState("");
  const [polimento, setPolimento] = useState(false);
  const [servicoExtraInput, setServicoExtraInput] = useState("");
  const [descricaoExtra, setDescricaoExtra] = useState("");

  const servicoSelecionado = useMemo(
    () => servicos.find((s) => s.id === servicoId) ?? null,
    [servicos, servicoId]
  );

  const servicoExtra = parseCurrencyInput(servicoExtraInput);

  const { total: valorTotal } = useMemo(() => {
    if (!servicoSelecionado) return { base: 0, total: 0, extra: 0 };
    return calcularValorLavagem(
      servicoSelecionado.valor,
      polimento,
      precoPolimento,
      0,
      servicoExtra
    );
  }, [servicoSelecionado, polimento, precoPolimento, servicoExtra]);

  const carregarListas = useCallback(async () => {
    const [listaAtiva, listaFinalizados] = await Promise.all([
      listarFilaAtiva(),
      listarFilaFinalizadosHoje(),
    ]);
    setFilaAtiva(listaAtiva);
    setFinalizados(listaFinalizados);
  }, []);

  const carregarBase = useCallback(async () => {
    setCarregando(true);
    try {
      const [listaServicos, precos] = await Promise.all([
        listarServicosLavagem(true),
        buscarPrecosLavagem(),
        carregarListas(),
      ]);
      setServicos(listaServicos);
      setPrecoPolimento(precos.polimento);
      setServicoId((atual) => atual || listaServicos[0]?.id || "");
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Erro ao carregar a fila.";
      toast.error(
        msg.includes("schema cache") || msg.includes("Could not find")
          ? "Tabelas da fila ainda não existem. Rode a migration 009 no Supabase."
          : msg
      );
    } finally {
      setCarregando(false);
    }
  }, [carregarListas]);

  useEffect(() => {
    void carregarBase();
  }, [carregarBase]);

  const buscarPorPlaca = async (placaDigitada: string) => {
    const placaNorm = normalizarPlaca(placaDigitada);
    if (placaNorm.length < 7) {
      setClienteRecorrente(false);
      setVisitas(0);
      return;
    }

    setBuscandoPlaca(true);
    try {
      const cliente = await buscarClientePorPlaca(placaNorm);
      if (cliente) {
        setNome(cliente.nome_proprietario);
        setWhatsapp(formatarWhatsappInput(cliente.whatsapp));
        if (cliente.servico_preferido_id) {
          setServicoId(cliente.servico_preferido_id);
        }
        setClienteRecorrente(true);
        setVisitas(cliente.visitas);
        toast.success("Cliente encontrado pelo histórico da placa.");
      } else {
        setClienteRecorrente(false);
        setVisitas(0);
      }
    } catch {
      // silencioso no blur
    } finally {
      setBuscandoPlaca(false);
    }
  };

  const limparFormulario = () => {
    setPlaca("");
    setNome("");
    setWhatsapp("");
    setClienteRecorrente(false);
    setVisitas(0);
    setPolimento(false);
    setServicoExtraInput("");
    setDescricaoExtra("");
    if (servicos[0]) setServicoId(servicos[0].id);
  };

  const handleSubmit = async () => {
    const placaNorm = normalizarPlaca(placa);
    const servico = servicoSelecionado;

    if (placaNorm.length < 7) {
      toast.error("Informe a placa completa do veículo.");
      return;
    }
    if (!nome.trim()) {
      toast.error("Informe o nome do proprietário.");
      return;
    }
    if (whatsapp.replace(/\D/g, "").length < 10) {
      toast.error("Informe um WhatsApp válido.");
      return;
    }
    if (!servico) {
      toast.error("Selecione o tipo de serviço.");
      return;
    }
    if (servicoExtra > 0 && !descricaoExtra.trim()) {
      toast.error("Descreva o serviço extra.");
      return;
    }

    setSalvando(true);
    try {
      await adicionarNaFila({
        placa: placaNorm,
        nomeProprietario: nome,
        whatsapp,
        servicoLavagemId: servico.id,
        servicoNome: servico.nome,
        servicoValorBase: servico.valor,
        servicoValor: valorTotal,
        polimento,
        servicoExtraValor: servicoExtra > 0 ? servicoExtra : undefined,
        servicoExtraDescricao:
          servicoExtra > 0 ? descricaoExtra.trim() : undefined,
      });
      toast.success("Carro cadastrado e em lavagem!");
      limparFormulario();
      setMostrarCadastro(false);
      setAba("lavando");
      await carregarListas();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Erro ao adicionar na fila."
      );
    } finally {
      setSalvando(false);
    }
  };

  const handleFinalizar = async (id: string) => {
    try {
      const { entrouNoRelatorio } = await finalizarItemFila(id);
      await carregarListas();
      setAba("finalizados");
      if (entrouNoRelatorio) {
        toast.success(
          "Lavagem finalizada e lançada no relatório do dia da compra."
        );
      } else {
        toast.success("Lavagem finalizada na fila.");
      }
    } catch {
      toast.error("Não foi possível finalizar.");
    }
  };

  const handleCancelar = async (id: string) => {
    try {
      await atualizarStatusFila(id, "cancelado");
      await carregarListas();
      toast.success("Item cancelado.");
    } catch {
      toast.error("Não foi possível cancelar.");
    }
  };

  const handleExcluirFinalizado = async (id: string) => {
    const ok = window.confirm(
      "Excluir este carro finalizado? Se já entrou no relatório do dia, também será removido de lá."
    );
    if (!ok) return;

    try {
      await excluirItemFilaFinalizado(id);
      await carregarListas();
      toast.success("Carro excluído.");
    } catch {
      toast.error("Não foi possível excluir.");
    }
  };

  if (carregando) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center gap-2 text-zinc-500">
        <Loader2 className="h-5 w-5 animate-spin" />
        Carregando fila...
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-lg space-y-5 pb-8 md:max-w-3xl">
      <div className="flex items-center justify-center rounded-2xl border border-amber-400/20 bg-amber-400/[0.07] px-4 py-3 sm:justify-start">
        <LiveClock />
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1 text-center sm:text-left">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-400/80">
            Atendimento
          </p>
          <h1 className="text-display text-3xl font-bold text-white">
            Fila de <span className="text-amber-400">Lavagem</span>
          </h1>
          <p className="text-sm text-zinc-400">
            Veja os carros em lavagem, finalize e avise o cliente no WhatsApp.
          </p>
        </div>

        <Button
          type="button"
          onClick={() => setMostrarCadastro(true)}
          className="h-12 shrink-0 rounded-xl bg-amber-400 px-5 text-base font-bold text-black hover:bg-amber-300"
        >
          <Plus className="mr-1.5 h-5 w-5" />
          Cadastrar carro
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-1 rounded-xl border border-white/[0.06] bg-zinc-900/80 p-1">
        <button
          type="button"
          onClick={() => setAba("lavando")}
          className={cn(
            "rounded-lg px-3 py-2.5 text-sm font-bold transition-colors",
            aba === "lavando"
              ? "bg-amber-400 text-black"
              : "text-zinc-400 hover:text-zinc-200"
          )}
        >
          Lavando ({filaAtiva.length})
        </button>
        <button
          type="button"
          onClick={() => setAba("finalizados")}
          className={cn(
            "rounded-lg px-3 py-2.5 text-sm font-bold transition-colors",
            aba === "finalizados"
              ? "bg-amber-400 text-black"
              : "text-zinc-400 hover:text-zinc-200"
          )}
        >
          Finalizados ({finalizados.length})
        </button>
      </div>

      {aba === "lavando" ? (
        <div className="space-y-3">
          {filaAtiva.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-800 py-12 text-center text-sm text-zinc-600">
              Nenhum carro lavando agora.
              <br />
              Toque em <span className="text-zinc-400">Cadastrar carro</span>{" "}
              para começar.
            </div>
          ) : (
            filaAtiva.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                className="rounded-2xl border border-white/[0.06] bg-zinc-900/70 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-lg font-bold tracking-wider text-white">
                      {item.placa}
                    </p>
                    <p className="truncate text-sm text-zinc-300">
                      {item.nome_proprietario}
                    </p>
                    <p className="mt-1 text-xs text-zinc-500">
                      {item.servico_nome} · {formatCurrency(item.servico_valor)}{" "}
                      · {formatTime(item.iniciado_at ?? item.created_at)}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-sky-500/15 px-2.5 py-1 text-[11px] font-semibold text-sky-400">
                    Lavando
                  </span>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => void handleFinalizar(item.id)}
                    className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-3 text-sm font-bold text-white sm:flex-none"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Finalizar
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleCancelar(item.id)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-rose-500/10 px-3 py-3 text-xs font-bold text-rose-300"
                  >
                    <XCircle className="h-3.5 w-3.5" />
                    Cancelar
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {finalizados.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-800 py-12 text-center text-sm text-zinc-600">
              Nenhum carro finalizado hoje.
            </div>
          ) : (
            finalizados.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                className="rounded-2xl border border-white/[0.06] bg-zinc-900/70 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-lg font-bold tracking-wider text-white">
                      {item.placa}
                    </p>
                    <p className="truncate text-sm text-zinc-300">
                      {item.nome_proprietario}
                    </p>
                    <p className="mt-1 text-xs text-zinc-500">
                      {item.servico_nome} · finalizado às{" "}
                      {formatTime(item.finalizado_at ?? item.created_at)}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-emerald-500/15 px-2.5 py-1 text-[11px] font-semibold text-emerald-400">
                    Pronto
                  </span>
                </div>

                <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                  <a
                    href={linkWhatsappCarroPronto(item)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 py-3 text-sm font-bold text-white hover:bg-[#1ebe57]"
                  >
                    <MessageCircle className="h-4 w-4" />
                    Enviar mensagem
                  </a>
                  <button
                    type="button"
                    onClick={() => void handleExcluirFinalizado(item.id)}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-rose-500/15 px-4 py-3 text-sm font-bold text-rose-300 hover:bg-rose-500/25"
                  >
                    <Trash2 className="h-4 w-4" />
                    Excluir
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </div>
      )}

      <p className="flex items-center justify-center gap-1.5 text-center text-[11px] text-zinc-600">
        <Clock3 className="h-3.5 w-3.5" />
        Só cadastro e fila · painel financeiro em outra rota
      </p>

      <AnimatePresence>
        {mostrarCadastro && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-4"
            onClick={() => setMostrarCadastro(false)}
          >
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              transition={{ type: "spring", damping: 26, stiffness: 320 }}
              onClick={(e) => e.stopPropagation()}
              className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-3xl border border-white/[0.08] bg-zinc-950 p-5 sm:rounded-3xl sm:p-6"
            >
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-white">
                    Cadastrar carro
                  </h2>
                  <p className="text-xs text-zinc-500">
                    Mesmas categorias do financeiro · placa busca cliente
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setMostrarCadastro(false)}
                  className="rounded-full bg-white/[0.06] p-2 text-zinc-400 hover:text-white"
                  aria-label="Fechar"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {clienteRecorrente && (
                <p className="mb-3 rounded-full bg-emerald-500/15 px-3 py-1.5 text-center text-[11px] font-semibold text-emerald-400">
                  Cliente recorrente · {visitas} visita(s)
                </p>
              )}

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="placa-fila" className="text-zinc-400">
                    Placa do carro
                  </Label>
                  <div className="relative">
                    <Car className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                    <input
                      id="placa-fila"
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
                      onBlur={() => void buscarPorPlaca(placa)}
                      className="h-14 w-full rounded-xl border border-zinc-700 bg-zinc-900 pl-10 pr-12 text-center text-lg font-bold tracking-[0.2em] text-white placeholder:text-zinc-600 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/20"
                    />
                    <button
                      type="button"
                      onClick={() => void buscarPorPlaca(placa)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-amber-400"
                      aria-label="Buscar placa"
                    >
                      {buscandoPlaca ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Search className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nome-fila" className="text-zinc-400">
                    Nome do proprietário
                  </Label>
                  <div className="relative">
                    <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                    <input
                      id="nome-fila"
                      type="text"
                      placeholder="Nome completo"
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                      className="h-12 w-full rounded-xl border border-zinc-700 bg-zinc-900 pl-10 pr-4 text-base text-white placeholder:text-zinc-600 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/20"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="whats-fila" className="text-zinc-400">
                    WhatsApp
                  </Label>
                  <div className="relative">
                    <Phone className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
                    <input
                      id="whats-fila"
                      type="tel"
                      inputMode="numeric"
                      placeholder="(00) 00000-0000"
                      value={whatsapp}
                      onChange={(e) =>
                        setWhatsapp(formatarWhatsappInput(e.target.value))
                      }
                      className="h-12 w-full rounded-xl border border-zinc-700 bg-zinc-900 pl-10 pr-4 text-base text-white placeholder:text-zinc-600 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/20"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-zinc-400">
                    Tipo de serviço (categorias cadastradas)
                  </Label>
                  {servicos.length === 0 ? (
                    <p className="rounded-xl border border-dashed border-zinc-700 p-4 text-center text-sm text-zinc-500">
                      Nenhum serviço cadastrado. Cadastre no financeiro →
                      Serviços de lavagem.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {servicos.map((servico) => (
                        <button
                          key={servico.id}
                          type="button"
                          onClick={() => setServicoId(servico.id)}
                          className={cn(
                            "flex min-h-12 w-full items-center justify-between rounded-xl border-2 px-4 py-3 transition-all",
                            servicoId === servico.id
                              ? "border-amber-400 bg-amber-400/10"
                              : "border-zinc-800 bg-zinc-900"
                          )}
                        >
                          <span
                            className={cn(
                              "font-semibold",
                              servicoId === servico.id
                                ? "text-amber-300"
                                : "text-white"
                            )}
                          >
                            {servico.nome}
                          </span>
                          <span className="text-sm font-bold text-zinc-400">
                            {formatCurrency(servico.valor)}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-zinc-400">Deseja polimento?</Label>
                  <div className="grid grid-cols-2 gap-2">
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
                          "min-h-12 rounded-xl border-2 py-3 text-sm font-bold transition-all",
                          polimento === opt.value
                            ? "border-amber-400 bg-amber-400/10 text-amber-300"
                            : "border-zinc-800 bg-zinc-900 text-zinc-400"
                        )}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3 rounded-xl border border-zinc-800 bg-zinc-900/60 p-4">
                  <p className="text-sm font-semibold text-zinc-300">
                    Serviço extra{" "}
                    <span className="font-normal text-zinc-500">(opcional)</span>
                  </p>
                  <div className="space-y-2">
                    <Label htmlFor="fila-extra-valor" className="text-zinc-400">
                      Valor do extra
                    </Label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-base font-bold text-amber-400">
                        R$
                      </span>
                      <input
                        id="fila-extra-valor"
                        type="text"
                        inputMode="decimal"
                        placeholder="0,00"
                        value={servicoExtraInput}
                        onChange={(e) =>
                          setServicoExtraInput(maskCurrencyInput(e.target.value))
                        }
                        className="h-12 w-full rounded-xl border border-zinc-700 bg-zinc-950 pl-12 pr-4 text-center text-base font-bold text-white placeholder:text-zinc-600 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/20"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fila-extra-desc" className="text-zinc-400">
                      O que foi o serviço extra?
                    </Label>
                    <input
                      id="fila-extra-desc"
                      type="text"
                      placeholder="Ex: Engraxamento, limpeza de motor..."
                      value={descricaoExtra}
                      onChange={(e) => setDescricaoExtra(e.target.value)}
                      className="h-12 w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 text-center text-base text-white placeholder:text-zinc-600 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/20"
                    />
                  </div>
                </div>

                <div className="rounded-xl border border-amber-400/20 bg-amber-400/10 p-4 text-center">
                  <p className="text-sm text-zinc-400">Total do serviço</p>
                  <p className="mt-1 text-2xl font-bold text-amber-300">
                    {formatCurrency(valorTotal)}
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">
                    {servicoSelecionado?.nome ?? "—"}
                    {polimento ? " + Polimento" : ""}
                    {servicoExtra > 0
                      ? ` + Extra ${formatCurrency(servicoExtra)}`
                      : ""}
                  </p>
                </div>

                <Button
                  type="button"
                  onClick={handleSubmit}
                  disabled={salvando || servicos.length === 0}
                  className="h-12 w-full rounded-xl bg-amber-400 text-base font-bold text-black hover:bg-amber-300"
                >
                  {salvando ? "Salvando..." : "Adicionar à lavagem"}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
