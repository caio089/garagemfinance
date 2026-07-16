import { getSupabase } from "@/lib/supabase";
import type { Entrada, EntradaCategoria, EntradaTipo } from "@/types";
import {
  PRECO_PF,
  PRECO_POLIMENTO,
  PRECOS_LAVAGEM,
} from "@/types";

export function calcularValorBase(
  tipo: EntradaTipo,
  categoria: EntradaCategoria,
  polimento: boolean
): number {
  if (tipo === "outro") return PRECO_PF;

  const base =
    categoria === "outro"
      ? PRECO_PF
      : PRECOS_LAVAGEM[categoria as keyof typeof PRECOS_LAVAGEM] ?? 0;

  return polimento ? base + PRECO_POLIMENTO : base;
}

/** Valor final = base (lavagem + polimento) - desconto, nunca negativo */
export function calcularValorEntrada(
  tipo: EntradaTipo,
  categoria: EntradaCategoria,
  polimento: boolean,
  desconto = 0
): number {
  const base = calcularValorBase(tipo, categoria, polimento);
  const descontoAplicado = Math.max(0, Math.min(desconto, base));
  return Math.max(0, base - descontoAplicado);
}

export async function criarEntrada(params: {
  diaId: string;
  tipo: EntradaTipo;
  categoria: EntradaCategoria;
  polimento: boolean;
  desconto?: number;
  placa?: string;
  modelo?: string;
  descricao?: string;
}): Promise<Entrada> {
  const desconto = params.tipo === "lavagem" ? Math.max(0, params.desconto ?? 0) : 0;
  const valor = calcularValorEntrada(
    params.tipo,
    params.categoria,
    params.polimento,
    desconto
  );

  const { data, error } = await getSupabase()
    .from("entradas")
    .insert({
      dia_id: params.diaId,
      tipo: params.tipo,
      categoria: params.categoria,
      polimento: params.polimento,
      valor,
      desconto,
      placa: params.tipo === "lavagem" ? params.placa?.trim().toUpperCase() || null : null,
      modelo: params.tipo === "lavagem" ? params.modelo?.trim() || null : null,
      descricao: params.descricao || null,
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
