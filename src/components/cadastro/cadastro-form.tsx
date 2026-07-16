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
  criarItemAlimentacao,
  desativarItemAlimentacao,
  listarItensAlimentacao,
} from "@/services/alimentacao.service";
import {
  buscarPrecosLavagem,
  salvarPrecosLavagem,
  type PrecosLavagemMap,
} from "@/services/precos.service";
import {
  ITEM_ALIMENTACAO_TIPO_LABELS,
  PRECO_CHAVES_LABELS,
  type ItemAlimentacao,
  type ItemAlimentacaoTipo,
  type PrecoLavagemChave,
} from "@/types";
import { toast } from "sonner";
import { Coffee, Plus, Trash2, UtensilsCrossed } from "lucide-react";
import { cn } from "@/lib/utils";

const CHAVES_EDITAVEIS: PrecoLavagemChave[] = [
  "hatch",
  "suv",
  "camionete",
  "polimento",
];

export function CadastroForm() {
  const [precos, setPrecos] = useState<PrecosLavagemMap | null>(null);
  const [precosInput, setPrecosInput] = useState<Record<string, string>>({});
  const [itens, setItens] = useState<ItemAlimentacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [salvandoPrecos, setSalvandoPrecos] = useState(false);
  const [salvandoItem, setSalvandoItem] = useState(false);

  const [nomeItem, setNomeItem] = useState("");
  const [tipoItem, setTipoItem] = useState<ItemAlimentacaoTipo>("comida");
  const [valorItem, setValorItem] = useState("");

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const [p, i] = await Promise.all([
        buscarPrecosLavagem(),
        listarItensAlimentacao(false),
      ]);
      setPrecos(p);
      setPrecosInput({
        hatch: p.hatch.toFixed(2).replace(".", ","),
        suv: p.suv.toFixed(2).replace(".", ","),
        camionete: p.camionete.toFixed(2).replace(".", ","),
        polimento: p.polimento.toFixed(2).replace(".", ","),
      });
      setItens(i.filter((item) => item.ativo));
    } catch {
      toast.error("Erro ao carregar cadastros.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const salvarPrecos = async () => {
    setSalvandoPrecos(true);
    try {
      const payload: Partial<PrecosLavagemMap> = {};
      for (const chave of CHAVES_EDITAVEIS) {
        payload[chave] = parseCurrencyInput(precosInput[chave] ?? "0");
      }
      const atualizados = await salvarPrecosLavagem(payload);
      setPrecos(atualizados);
      toast.success("Preços de lavagem salvos!");
    } catch {
      toast.error("Erro ao salvar preços.");
    } finally {
      setSalvandoPrecos(false);
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

  const removerItem = async (id: string) => {
    try {
      await desativarItemAlimentacao(id);
      toast.success("Item removido do catálogo.");
      await carregar();
    } catch {
      toast.error("Erro ao remover item.");
    }
  };

  if (loading || !precos) {
    return (
      <p className="py-10 text-center text-sm text-zinc-500">Carregando...</p>
    );
  }

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <div className="text-center">
          <h2 className="text-lg font-bold text-white">Preços da lavagem</h2>
          <p className="text-sm text-zinc-500">
            Altere os valores usados nas entradas
          </p>
        </div>

        <div className="space-y-3">
          {CHAVES_EDITAVEIS.map((chave) => (
            <div key={chave} className="space-y-1.5">
              <Label className="text-zinc-400">
                {PRECO_CHAVES_LABELS[chave]}
              </Label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-amber-400">
                  R$
                </span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={precosInput[chave] ?? ""}
                  onChange={(e) =>
                    setPrecosInput((prev) => ({
                      ...prev,
                      [chave]: maskCurrencyInput(e.target.value),
                    }))
                  }
                  className="h-12 w-full rounded-xl border-2 border-zinc-800 bg-zinc-900 pl-12 pr-4 text-right text-lg font-bold text-white focus:border-amber-400 focus:outline-none"
                />
              </div>
            </div>
          ))}
        </div>

        <Button
          onClick={salvarPrecos}
          disabled={salvandoPrecos}
          className="h-12 w-full rounded-xl bg-amber-400 font-bold text-black hover:bg-amber-300"
        >
          {salvandoPrecos ? "Salvando..." : "Salvar preços"}
        </Button>
      </section>

      <section className="space-y-4 border-t border-zinc-800 pt-6">
        <div className="text-center">
          <h2 className="text-lg font-bold text-white">Alimentação</h2>
          <p className="text-sm text-zinc-500">
            Cadastre bebidas, comidas e outros itens
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
              {(Object.keys(ITEM_ALIMENTACAO_TIPO_LABELS) as ItemAlimentacaoTipo[]).map(
                (tipo) => (
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
                )
              )}
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
                onChange={(e) => setValorItem(maskCurrencyInput(e.target.value))}
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
            itens.map((item) => (
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
                  <p className="truncate font-semibold text-white">{item.nome}</p>
                  <p className="text-xs text-zinc-500">
                    {ITEM_ALIMENTACAO_TIPO_LABELS[item.tipo]} ·{" "}
                    {formatCurrency(item.valor)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => removerItem(item.id)}
                  className="flex h-9 w-9 items-center justify-center rounded-lg text-zinc-500 hover:bg-rose-500/10 hover:text-rose-400"
                  aria-label="Remover item"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
