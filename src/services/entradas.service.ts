import { getSupabase } from "@/lib/supabase";
import type { Entrada, EntradaCategoria, EntradaTipo } from "@/types";
import {
  buscarPrecosLavagem,
  type PrecosLavagemMap,
} from "@/services/precos.service";

export function calcularValorLavagem(
  valorServico: number,
  polimento: boolean,
  precoPolimento: number,
  desconto = 0
): { base: number; total: number } {
  const base = Math.max(0, valorServico) + (polimento ? Math.max(0, precoPolimento) : 0);
  const descontoAplicado = Math.max(0, Math.min(desconto, base));
  return { base, total: Math.max(0, base - descontoAplicado) };
}

/** @deprecated prefer calcularValorLavagem com serviço cadastrado */
export function calcularValorBaseComPrecos(
  tipo: EntradaTipo,
  categoria: EntradaCategoria,
  polimento: boolean,
  precos: PrecosLavagemMap,
  valorPersonalizado?: number
): number {
  if (tipo === "outro" || tipo === "avulsa") return Math.max(0, valorPersonalizado ?? 0);

  const base =
    categoria === "outro"
      ? Math.max(0, valorPersonalizado ?? 0)
      : precos[categoria as keyof PrecosLavagemMap] ?? 0;

  return polimento ? base + precos.polimento : base;
}

export function calcularValorEntradaComPrecos(
  tipo: EntradaTipo,
  categoria: EntradaCategoria,
  polimento: boolean,
  precos: PrecosLavagemMap,
  desconto = 0,
  valorPersonalizado?: number
): number {
  const base = calcularValorBaseComPrecos(
    tipo,
    categoria,
    polimento,
    precos,
    valorPersonalizado
  );
  const descontoAplicado = Math.max(0, Math.min(desconto, base));
  return Math.max(0, base - descontoAplicado);
}

export async function calcularValorBase(
  tipo: EntradaTipo,
  categoria: EntradaCategoria,
  polimento: boolean,
  valorPersonalizado?: number
): Promise<number> {
  const precos = await buscarPrecosLavagem();
  return calcularValorBaseComPrecos(
    tipo,
    categoria,
    polimento,
    precos,
    valorPersonalizado
  );
}

export async function calcularValorEntrada(
  tipo: EntradaTipo,
  categoria: EntradaCategoria,
  polimento: boolean,
  desconto = 0,
  valorPersonalizado?: number
): Promise<number> {
  const precos = await buscarPrecosLavagem();
  return calcularValorEntradaComPrecos(
    tipo,
    categoria,
    polimento,
    precos,
    desconto,
    valorPersonalizado
  );
}

export async function criarEntrada(params: {
  diaId: string;
  tipo: EntradaTipo;
  categoria?: EntradaCategoria | string;
  polimento: boolean;
  desconto?: number;
  placa?: string;
  modelo?: string;
  descricao?: string;
  valorPersonalizado?: number;
  itemAlimentacaoId?: string;
  servicoLavagemId?: string;
  nomeServico?: string;
}): Promise<Entrada> {
  const desconto =
    params.tipo === "lavagem" ? Math.max(0, params.desconto ?? 0) : 0;

  let valor: number;
  let categoria: string = params.categoria ?? "outro";

  if (params.tipo === "lavagem" && params.servicoLavagemId) {
    const precos = await buscarPrecosLavagem();
    const { total } = calcularValorLavagem(
      params.valorPersonalizado ?? 0,
      params.polimento,
      precos.polimento,
      desconto
    );
    valor = total;
    categoria = "outro";
  } else if (params.tipo === "avulsa") {
    valor = Math.max(0, params.valorPersonalizado ?? 0);
    categoria = "avulsa";
  } else if (params.tipo === "outro") {
    valor = Math.max(0, params.valorPersonalizado ?? 0);
    categoria = "outro";
  } else {
    valor = await calcularValorEntrada(
      params.tipo,
      (params.categoria as EntradaCategoria) ?? "hatch",
      params.polimento,
      desconto,
      params.valorPersonalizado
    );
  }

  const descricaoBase =
    params.tipo === "lavagem" && params.nomeServico
      ? `Lavagem: ${params.nomeServico}`
      : params.tipo === "avulsa"
        ? params.descricao?.trim()
          ? `Avulsa: ${params.descricao.trim()}`
          : "Entrada avulsa"
        : null;
  const observacao =
    params.tipo === "avulsa" ? undefined : params.descricao?.trim();
  const descricao =
    descricaoBase && observacao
      ? `${descricaoBase} · ${observacao}`
      : observacao || descricaoBase;

  const { data, error } = await getSupabase()
    .from("entradas")
    .insert({
      dia_id: params.diaId,
      tipo: params.tipo,
      categoria,
      polimento: params.polimento,
      valor,
      desconto,
      placa:
        params.tipo === "lavagem"
          ? params.placa?.trim().toUpperCase() || null
          : null,
      modelo:
        params.tipo === "lavagem" ? params.modelo?.trim() || null : null,
      descricao,
      item_alimentacao_id:
        params.tipo === "outro" ? params.itemAlimentacaoId || null : null,
      servico_lavagem_id:
        params.tipo === "lavagem" ? params.servicoLavagemId || null : null,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function buscarEntradasDoDia(diaId: string): Promise<Entrada[]> {
  const { data, error } = await getSupabase()
    .from("entradas")
    .select("*")
    .eq("dia_id", diaId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function buscarEntradasRecentes(
  diaId: string,
  limit = 5
): Promise<Entrada[]> {
  const { data, error } = await getSupabase()
    .from("entradas")
    .select("*")
    .eq("dia_id", diaId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data ?? [];
}

export async function totalEntradasDoDia(diaId: string): Promise<number> {
  const entradas = await buscarEntradasDoDia(diaId);
  return entradas.reduce((sum, e) => sum + Number(e.valor), 0);
}

export async function excluirEntrada(id: string): Promise<void> {
  const { error } = await getSupabase().from("entradas").delete().eq("id", id);
  if (error) throw error;
}

export async function contarServicosDoDia(diaId: string) {
  const entradas = await buscarEntradasDoDia(diaId);

  const porCategoria: Record<string, number> = {};
  entradas
    .filter((e) => e.tipo === "lavagem")
    .forEach((e) => {
      const key = e.categoria;
      porCategoria[key] = (porCategoria[key] ?? 0) + 1;
    });

  return porCategoria;
}
