import { calcularCaixaFinal, calcularLucro } from "@/lib/financeiro";
import { getSupabase } from "@/lib/supabase";
import type { Dia, ResumoDia } from "@/types";

export async function buscarDiaAberto(): Promise<Dia | null> {
  const { data, error } = await getSupabase()
    .from("dias")
    .select("*")
    .eq("status", "iniciado")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function iniciarDia(caixaInicial: number): Promise<Dia> {
  const diaAberto = await buscarDiaAberto();
  if (diaAberto) {
    throw new Error("Já existe um dia em aberto.");
  }

  const { data, error } = await getSupabase()
    .from("dias")
    .insert({
      data: new Date().toISOString().split("T")[0],
      caixa_inicial: caixaInicial,
      status: "iniciado",
    })
    .select()
    .single();

  if (error) {
    // Índice único: evita 2 dias abertos ao mesmo tempo
    if (error.code === "23505") {
      throw new Error("Já existe um dia em aberto.");
    }
    throw error;
  }
  return data;
}

export async function calcularResumoDia(diaId: string): Promise<ResumoDia> {
  const { data: dia, error: diaError } = await getSupabase()
    .from("dias")
    .select("*")
    .eq("id", diaId)
    .single();

  if (diaError) throw diaError;

  const { data: entradas, error: entradasError } = await getSupabase()
    .from("entradas")
    .select("*")
    .eq("dia_id", diaId);

  if (entradasError) throw entradasError;

  const { data: saidas, error: saidasError } = await getSupabase()
    .from("saidas")
    .select("*")
    .eq("dia_id", diaId);

  if (saidasError) throw saidasError;

  const totalEntradas = entradas?.reduce((sum, e) => sum + Number(e.valor), 0) ?? 0;
  const totalSaidas = saidas?.reduce((sum, s) => sum + Number(s.valor), 0) ?? 0;
  const caixaInicial = Number(dia.caixa_inicial);
  const lucro = calcularLucro(totalEntradas, totalSaidas);
  const caixaFinal = calcularCaixaFinal(caixaInicial, totalEntradas, totalSaidas);

  const lavagens = entradas?.filter((e) => e.tipo === "lavagem").length ?? 0;
  const polimentos = entradas?.filter((e) => e.polimento).length ?? 0;
  const outros = entradas?.filter((e) => e.tipo === "outro").length ?? 0;

  return {
    data: dia.data,
    caixaInicial,
    totalEntradas,
    totalSaidas,
    lucro,
    caixaFinal,
    lavagens,
    polimentos,
    outros,
  };
}

export async function finalizarDia(diaId: string): Promise<ResumoDia> {
  const resumo = await calcularResumoDia(diaId);

  const { error } = await getSupabase()
    .from("dias")
    .update({
      caixa_final: resumo.caixaFinal,
      status: "finalizado",
    })
    .eq("id", diaId);

  if (error) throw error;
  return resumo;
}

export async function buscarUltimosDias(limit = 7): Promise<Dia[]> {
  const { data, error } = await getSupabase()
    .from("dias")
    .select("*")
    .order("data", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data ?? [];
}

/** Último dia finalizado (com caixa_final), para sugerir o caixa inicial. */
export async function buscarUltimoDiaFinalizado(): Promise<Dia | null> {
  const { data, error } = await getSupabase()
    .from("dias")
    .select("*")
    .eq("status", "finalizado")
    .not("caixa_final", "is", null)
    .order("data", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data;
}
