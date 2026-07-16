import { getSupabase } from "@/lib/supabase";
import type { Saida, SaidaCategoria } from "@/types";

export async function criarSaida(params: {
  diaId: string;
  categoria: SaidaCategoria;
  valor: number;
  descricao?: string;
}): Promise<Saida> {
  const { data, error } = await getSupabase()
    .from("saidas")
    .insert({
      dia_id: params.diaId,
      categoria: params.categoria,
      valor: params.valor,
      descricao: params.descricao || null,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function buscarSaidasDoDia(diaId: string): Promise<Saida[]> {
  const { data, error } = await getSupabase()
    .from("saidas")
    .select("*")
    .eq("dia_id", diaId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function buscarSaidasRecentes(
  diaId: string,
  limit = 5
): Promise<Saida[]> {
  const { data, error } = await getSupabase()
    .from("saidas")
    .select("*")
    .eq("dia_id", diaId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data ?? [];
}

export async function totalSaidasDoDia(diaId: string): Promise<number> {
  const saidas = await buscarSaidasDoDia(diaId);
  return saidas.reduce((sum, s) => sum + Number(s.valor), 0);
}
