import { getSupabase } from "@/lib/supabase";
import type { Entrada, EntradaCategoria, EntradaTipo } from "@/types";
import {
  PRECO_PF,
  PRECO_POLIMENTO,
  PRECOS_LAVAGEM,
} from "@/types";

export function calcularValorEntrada(
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

export async function criarEntrada(params: {
  diaId: string;
  tipo: EntradaTipo;
  categoria: EntradaCategoria;
  polimento: boolean;
  descricao?: string;
}): Promise<Entrada> {
  const valor = calcularValorEntrada(
    params.tipo,
    params.categoria,
    params.polimento
  );

  const { data, error } = await getSupabase()
    .from("entradas")
    .insert({
      dia_id: params.diaId,
      tipo: params.tipo,
      categoria: params.categoria,
      polimento: params.polimento,
      valor,
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
