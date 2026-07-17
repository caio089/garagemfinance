"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  formatCurrency,
  maskCurrencyInput,
  parseCurrencyInput,
} from "@/lib/format";
import {
  atualizarItemAlimentacao,
  criarItemAlimentacao,
  desativarItemAlimentacao,
  listarItensAlimentacao,
} from "@/services/alimentacao.service";
import {
  buscarPrecosLavagem,
  salvarPrecoLavagem,
} from "@/services/precos.service";
import {
  atualizarServicoLavagem,
  criarServicoLavagem,
  desativarServicoLavagem,
  listarServicosLavagem,
} from "@/services/servicos-lavagem.service";
import {
  ITEM_ALIMENTACAO_TIPO_LABELS,
  type ItemAlimentacao,
  type ItemAlimentacaoTipo,
  type ServicoLavagem,
} from "@/types";
import { toast } from "sonner";
import {
  Car,
  Check,
  Coffee,
  Pencil,
  Plus,
  Trash2,
  UtensilsCrossed,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface EdicaoItem {
  id: string;
  nome: string;
  tipo: ItemAlimentacaoTipo;
  valor: string;
}

interface EdicaoServico {
  id: string;
  nome: string;
  valor: string;
}

export function CadastroForm() {
  const [servicos, setServicos] = useState<ServicoLavagem[]>([]);
  const [polimentoInput, setPolimentoInput] = useState("10,00");
  const [itens, setItens] = useState<ItemAlimentacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [salvandoPolimento, setSalvandoPolimento] = useState(false);
  const [salvandoServico, setSalvandoServico] = useState(false);
  const [salvandoItem, setSalvandoItem] = useState(false);
  const [salvandoEdicao, setSalvandoEdicao] = useState(false);
  const [salvandoEdicaoServico, setSalvandoEdicaoServico] = useState(false);

  const [nomeServico, setNomeServico] = useState("");
  const [valorServico, setValorServico] = useState("");
  const [edicaoServico, setEdicaoServico] = useState<EdicaoServico | null>(null);

  const [nomeItem, setNomeItem] = useState("");
  const [tipoItem, setTipoItem] = useState<ItemAlimentacaoTipo>("comida");
  const [valorItem, setValorItem] = useState("");
  const [edicao, setEdicao] = useState<EdicaoItem | null>(null);

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const [servicosLista, precos, itensLista] = await Promise.all([
        listarServicosLavagem(false),
        buscarPrecosLavagem(),
        listarItensAlimentacao(false),
      ]);
      setServicos(servicosLista.filter((s) => s.ativo));
      setPolimentoInput(precos.polimento.toFixed(2).replace(".", ","));
      setItens(itensLista.filter((item) => item.ativo));
    } catch {
      toast.error("Erro ao carregar cadastros.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const salvarPolimento = async () => {
    setSalvandoPolimento(true);
    try {
      await salvarPrecoLavagem("polimento", parseCurrencyInput(polimentoInput));
      toast.success("Preço do polimento salvo!");
    } catch {
      toast.error("Erro ao salvar polimento.");
    } finally {
      setSalvandoPolimento(false);
    }
  };

  const adicionarServico = async () => {
    const valor = parseCurrencyInput(valorServico);
    if (!nomeServico.trim()) {
      toast.error("Informe o nome do serviço.");
      return;
    }
    if (valor <= 0) {
      toast.error("Informe um valor válido.");
      return;
    }

    setSalvandoServico(true);
    try {
      await criarServicoLavagem({ nome: nomeServico, valor });
      setNomeServico("");
      setValorServico("");
      toast.success("Serviço cadastrado!");
      await carregar();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao cadastrar.");
    } finally {
      setSalvandoServico(false);
    }
  };

  const iniciarEdicaoServico = (servico: ServicoLavagem) => {
    setEdicaoServico({
      id: servico.id,
      nome: servico.nome,
      valor: servico.valor.toFixed(2).replace(".", ","),
    });
  };

  const salvarEdicaoServico = async () => {
    if (!edicaoServico) return;
    const valor = parseCurrencyInput(edicaoServico.valor);
    if (!edicaoServico.nome.trim()) {
      toast.error("Informe o nome do serviço.");
      return;
    }
    if (valor <= 0) {
      toast.error("Informe um valor válido.");
      return;
    }

    setSalvandoEdicaoServico(true);
    try {
      await atualizarServicoLavagem(edicaoServico.id, {
        nome: edicaoServico.nome,
        valor,
      });
      toast.success("Serviço atualizado!");
      setEdicaoServico(null);
      await carregar();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Erro ao atualizar serviço."
      );
    } finally {
      setSalvandoEdicaoServico(false);
    }
  };

  const removerServico = async (id: string) => {
    try {
      await desativarServicoLavagem(id);
      if (edicaoServico?.id === id) setEdicaoServico(null);
      toast.success("Serviço removido.");
      await carregar();
    } catch {
      toast.error("Erro ao remover serviço.");
    }
  };

  const adicionarItem = async () => {
    const valor = parseCurrencyInput(valorItem);
    if (!nomeItem.trim()) {
      toast.error("Informe o nome do item.");
      return;
    }
    if (valor <= 0) {
      toast.error("Informe um valor válido.");
      return;
    }

    setSalvandoItem(true);
    try {
      await criarItemAlimentacao({
        nome: nomeItem,
        tipo: tipoItem,
        valor,
      });
      setNomeItem("");
      setValorItem("");
      toast.success("Item cadastrado!");
      await carregar();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao cadastrar.");
    } finally {
      setSalvandoItem(false);
    }
  };

  const iniciarEdicao = (item: ItemAlimentacao) => {
    setEdicao({
      id: item.id,
      nome: item.nome,
      tipo: item.tipo,
      valor: item.valor.toFixed(2).replace(".", ","),
    });
  };

  const salvarEdicao = async () => {
    if (!edicao) return;

    const valor = parseCurrencyInput(edicao.valor);
    if (!edicao.nome.trim()) {
      toast.error("Informe o nome do item.");
      return;
    }
    if (valor <= 0) {
      toast.error("Informe um valor válido.");
      return;
    }

    setSalvandoEdicao(true);
    try {
      await atualizarItemAlimentacao(edicao.id, {
        nome: edicao.nome,
        tipo: edicao.tipo,
        valor,
      });
      toast.success("Item atualizado!");
      setEdicao(null);
      await carregar();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Erro ao atualizar item."
      );
    } finally {
      setSalvandoEdicao(false);
    }
  };

  const removerItem = async (id: string) => {
    try {
      await desativarItemAlimentacao(id);
      if (edicao?.id === id) setEdicao(null);
      toast.success("Item removido do catálogo.");
      await carregar();
    } catch {
      toast.error("Erro ao remover item.");
    }
  };

  if (loading) {
    return (
      <p className="py-10 text-center text-sm text-zinc-500">Carregando...</p>
    );
  }

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <div className="text-center">
          <h2 className="text-lg font-bold text-white">Serviços de lavagem</h2>
          <p className="text-sm text-zinc-500">
            Cadastre tipos de serviço com nome e valor
          </p>
        </div>

        <div className="space-y-3 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
          <div className="space-y-1.5">
            <Label className="text-zinc-400">Nome do serviço</Label>
            <input
              type="text"
              placeholder="Ex: Hatch/Sedan, SUV, Completa"
              value={nomeServico}
              onChange={(e) => setNomeServico(e.target.value)}
              className="h-12 w-full rounded-xl border-2 border-zinc-800 bg-zinc-950 px-4 text-white placeholder:text-zinc-600 focus:border-amber-400 focus:outline-none"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-zinc-400">Valor</Label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-amber-400">
                R$
              </span>
              <input
                type="text"
                inputMode="decimal"
                placeholder="0,00"
                value={valorServico}
                onChange={(e) =>
                  setValorServico(maskCurrencyInput(e.target.value))
                }
                className="h-12 w-full rounded-xl border-2 border-zinc-800 bg-zinc-950 pl-12 pr-4 text-right text-lg font-bold text-white focus:border-amber-400 focus:outline-none"
              />
            </div>
          </div>
          <Button
            onClick={adicionarServico}
            disabled={salvandoServico}
            className="h-12 w-full rounded-xl bg-amber-400 font-bold text-black hover:bg-amber-300"
          >
            <Plus className="mr-1 h-4 w-4" />
            {salvandoServico ? "Salvando..." : "Adicionar serviço"}
          </Button>
        </div>

        <div className="space-y-2">
          {servicos.length === 0 ? (
            <p className="py-4 text-center text-sm text-zinc-600">
              Nenhum serviço cadastrado ainda
            </p>
          ) : (
            servicos.map((servico) => {
              const editando = edicaoServico?.id === servico.id;

              if (editando && edicaoServico) {
                return (
                  <div
                    key={servico.id}
                    className="space-y-3 rounded-xl border-2 border-amber-400/40 bg-zinc-900 p-3"
                  >
                    <div className="space-y-1.5">
                      <Label className="text-xs text-zinc-400">Nome</Label>
                      <input
                        type="text"
                        value={edicaoServico.nome}
                        onChange={(e) =>
                          setEdicaoServico((prev) =>
                            prev ? { ...prev, nome: e.target.value } : prev
                          )
                        }
                        className="h-11 w-full rounded-xl border-2 border-zinc-800 bg-zinc-950 px-3 text-white focus:border-amber-400 focus:outline-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-zinc-400">Preço</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-amber-400">
                          R$
                        </span>
                        <input
                          type="text"
                          inputMode="decimal"
                          value={edicaoServico.valor}
                          onChange={(e) =>
                            setEdicaoServico((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    valor: maskCurrencyInput(e.target.value),
                                  }
                                : prev
                            )
                          }
                          className="h-11 w-full rounded-xl border-2 border-zinc-800 bg-zinc-950 pl-10 pr-3 text-right font-bold text-white focus:border-amber-400 focus:outline-none"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setEdicaoServico(null)}
                        disabled={salvandoEdicaoServico}
                        className="h-11 rounded-xl border-zinc-700 bg-transparent text-zinc-300"
                      >
                        <X className="mr-1 h-4 w-4" />
                        Cancelar
                      </Button>
                      <Button
                        type="button"
                        onClick={salvarEdicaoServico}
                        disabled={salvandoEdicaoServico}
                        className="h-11 rounded-xl bg-amber-400 font-bold text-black hover:bg-amber-300"
                      >
                        <Check className="mr-1 h-4 w-4" />
                        {salvandoEdicaoServico ? "Salvando..." : "Salvar"}
                      </Button>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={servico.id}
                  className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-3"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-400/10 text-amber-400">
                    <Car className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-white">
                      {servico.nome}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {formatCurrency(servico.valor)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => iniciarEdicaoServico(servico)}
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-500 hover:bg-amber-400/10 hover:text-amber-400"
                    aria-label="Editar serviço"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => removerServico(servico.id)}
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-500 hover:bg-rose-500/10 hover:text-rose-400"
                    aria-label="Remover serviço"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        <div className="space-y-3 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
          <div className="text-center">
            <p className="text-sm font-semibold text-white">Polimento</p>
            <p className="text-xs text-zinc-500">Valor adicional opcional</p>
          </div>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-amber-400">
              R$
            </span>
            <input
              type="text"
              inputMode="decimal"
              value={polimentoInput}
              onChange={(e) =>
                setPolimentoInput(maskCurrencyInput(e.target.value))
              }
              className="h-12 w-full rounded-xl border-2 border-zinc-800 bg-zinc-950 pl-12 pr-4 text-right text-lg font-bold text-white focus:border-amber-400 focus:outline-none"
            />
          </div>
          <Button
            onClick={salvarPolimento}
            disabled={salvandoPolimento}
            className="h-11 w-full rounded-xl bg-zinc-100 font-bold text-black hover:bg-white"
          >
            {salvandoPolimento ? "Salvando..." : "Salvar polimento"}
          </Button>
        </div>
      </section>

      <section className="space-y-4 border-t border-zinc-800 pt-6">
        <div className="text-center">
          <h2 className="text-lg font-bold text-white">Cardápio</h2>
          <p className="text-sm text-zinc-500">
            Cadastre e edite nomes e preços dos itens
          </p>
        </div>

        <div className="space-y-3 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
          <div className="space-y-1.5">
            <Label className="text-zinc-400">Nome</Label>
            <input
              type="text"
              placeholder="Ex: Coca-Cola, Marmita, Café"
              value={nomeItem}
              onChange={(e) => setNomeItem(e.target.value)}
              className="h-12 w-full rounded-xl border-2 border-zinc-800 bg-zinc-950 px-4 text-white placeholder:text-zinc-600 focus:border-emerald-400 focus:outline-none"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-zinc-400">Tipo</Label>
            <div className="grid grid-cols-3 gap-2">
              {(
                Object.keys(ITEM_ALIMENTACAO_TIPO_LABELS) as ItemAlimentacaoTipo[]
              ).map((tipo) => (
                <button
                  key={tipo}
                  type="button"
                  onClick={() => setTipoItem(tipo)}
                  className={cn(
                    "rounded-xl border-2 py-2.5 text-xs font-bold transition-all",
                    tipoItem === tipo
                      ? "border-emerald-400 bg-emerald-500/15 text-emerald-400"
                      : "border-zinc-800 text-zinc-400"
                  )}
                >
                  {ITEM_ALIMENTACAO_TIPO_LABELS[tipo]}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-zinc-400">Valor</Label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-emerald-400">
                R$
              </span>
              <input
                type="text"
                inputMode="decimal"
                placeholder="0,00"
                value={valorItem}
                onChange={(e) =>
                  setValorItem(maskCurrencyInput(e.target.value))
                }
                className="h-12 w-full rounded-xl border-2 border-zinc-800 bg-zinc-950 pl-12 pr-4 text-right text-lg font-bold text-white focus:border-emerald-400 focus:outline-none"
              />
            </div>
          </div>

          <Button
            onClick={adicionarItem}
            disabled={salvandoItem}
            className="h-12 w-full rounded-xl bg-emerald-500 font-bold text-black hover:bg-emerald-400"
          >
            <Plus className="mr-1 h-4 w-4" />
            {salvandoItem ? "Salvando..." : "Adicionar item"}
          </Button>
        </div>

        <div className="space-y-2">
          {itens.length === 0 ? (
            <p className="py-6 text-center text-sm text-zinc-600">
              Nenhum item cadastrado ainda
            </p>
          ) : (
            itens.map((item) => {
              const editando = edicao?.id === item.id;

              if (editando && edicao) {
                return (
                  <div
                    key={item.id}
                    className="space-y-3 rounded-xl border-2 border-amber-400/40 bg-zinc-900 p-3"
                  >
                    <div className="space-y-1.5">
                      <Label className="text-xs text-zinc-400">Nome</Label>
                      <input
                        type="text"
                        value={edicao.nome}
                        onChange={(e) =>
                          setEdicao((prev) =>
                            prev ? { ...prev, nome: e.target.value } : prev
                          )
                        }
                        className="h-11 w-full rounded-xl border-2 border-zinc-800 bg-zinc-950 px-3 text-white focus:border-amber-400 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs text-zinc-400">Tipo</Label>
                      <div className="grid grid-cols-3 gap-1.5">
                        {(
                          Object.keys(
                            ITEM_ALIMENTACAO_TIPO_LABELS
                          ) as ItemAlimentacaoTipo[]
                        ).map((tipo) => (
                          <button
                            key={tipo}
                            type="button"
                            onClick={() =>
                              setEdicao((prev) =>
                                prev ? { ...prev, tipo } : prev
                              )
                            }
                            className={cn(
                              "rounded-lg border-2 py-2 text-[11px] font-bold",
                              edicao.tipo === tipo
                                ? "border-amber-400 bg-amber-400/15 text-amber-400"
                                : "border-zinc-800 text-zinc-400"
                            )}
                          >
                            {ITEM_ALIMENTACAO_TIPO_LABELS[tipo]}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs text-zinc-400">Preço</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-amber-400">
                          R$
                        </span>
                        <input
                          type="text"
                          inputMode="decimal"
                          value={edicao.valor}
                          onChange={(e) =>
                            setEdicao((prev) =>
                              prev
                                ? {
                                    ...prev,
                                    valor: maskCurrencyInput(e.target.value),
                                  }
                                : prev
                            )
                          }
                          className="h-11 w-full rounded-xl border-2 border-zinc-800 bg-zinc-950 pl-10 pr-3 text-right font-bold text-white focus:border-amber-400 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setEdicao(null)}
                        disabled={salvandoEdicao}
                        className="h-11 rounded-xl border-zinc-700 bg-transparent text-zinc-300"
                      >
                        <X className="mr-1 h-4 w-4" />
                        Cancelar
                      </Button>
                      <Button
                        type="button"
                        onClick={salvarEdicao}
                        disabled={salvandoEdicao}
                        className="h-11 rounded-xl bg-amber-400 font-bold text-black hover:bg-amber-300"
                      >
                        <Check className="mr-1 h-4 w-4" />
                        {salvandoEdicao ? "Salvando..." : "Salvar"}
                      </Button>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={item.id}
                  className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-3"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                    {item.tipo === "bebida" ? (
                      <Coffee className="h-5 w-5" />
                    ) : (
                      <UtensilsCrossed className="h-5 w-5" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-white">
                      {item.nome}
                    </p>
                    <p className="text-xs text-zinc-500">
                      {ITEM_ALIMENTACAO_TIPO_LABELS[item.tipo]} ·{" "}
                      {formatCurrency(item.valor)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => iniciarEdicao(item)}
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-500 hover:bg-amber-400/10 hover:text-amber-400"
                    aria-label="Editar item"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => removerItem(item.id)}
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-500 hover:bg-rose-500/10 hover:text-rose-400"
                    aria-label="Remover item"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}
