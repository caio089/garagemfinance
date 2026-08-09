import { getSupabase } from "@/lib/supabase";
import {
  fimMes,
  fimSemana,
  inicioMes,
  inicioSemana,
  toDateString,
} from "@/lib/format";
import { calcularLucro } from "@/lib/financeiro";
import type { Dia, DiaComResumo, Entrada, ResumoPeriodo } from "@/types";

export async function buscarDiasFinalizados(): Promise<Dia[]> {
  const { data, error } = await getSupabase()
    .from("dias")
    .select("*")
    .eq("status", "finalizado")
    .order("data", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function buscarDiasFinalizadosPorPeriodo(
  inicio: string,
  fim: string
): Promise<Dia[]> {
  const { data, error } = await getSupabase()
    .from("dias")
    .select("*")
    .eq("status", "finalizado")
    .gte("data", inicio)
    .lte("data", fim)
    .order("data", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

async function buscarEntradasPorDias(diaIds: string[]): Promise<Entrada[]> {
  if (diaIds.length === 0) return [];

  const { data, error } = await getSupabase()
    .from("entradas")
    .select("*")
    .in("dia_id", diaIds);

  if (error) throw error;
  return data ?? [];
}

async function buscarSaidasPorDias(diaIds: string[]) {
  if (diaIds.length === 0) return [];

  const { data, error } = await getSupabase()
    .from("saidas")
    .select("*")
    .in("dia_id", diaIds);

  if (error) throw error;
  return data ?? [];
}

function agregarResumos(
  dias: Dia[],
  entradas: Entrada[],
  saidas: { dia_id: string; valor: number }[]
): DiaComResumo[] {
  return dias.map((dia) => {
    const entradasDia = entradas.filter((e) => e.dia_id === dia.id);
    const saidasDia = saidas.filter((s) => s.dia_id === dia.id);

    return {
      ...dia,
      totalEntradas: entradasDia.reduce((s, e) => s + Number(e.valor), 0),
      totalSaidas: saidasDia.reduce((s, e) => s + Number(e.valor), 0),
      lavagens: entradasDia.filter((e) => e.tipo === "lavagem").length,
      polimentos: entradasDia.filter((e) => e.polimento).length,
      outros: entradasDia.filter((e) => e.tipo === "outro").length,
    };
  });
}

export async function buscarDiasComResumo(): Promise<DiaComResumo[]> {
  const dias = await buscarDiasFinalizados();
  const ids = dias.map((d) => d.id);
  const [entradas, saidas] = await Promise.all([
    buscarEntradasPorDias(ids),
    buscarSaidasPorDias(ids),
  ]);
  return agregarResumos(dias, entradas, saidas);
}

export async function buscarDiasComResumoPorPeriodo(
  inicio: string,
  fim: string
): Promise<DiaComResumo[]> {
  const dias = await buscarDiasFinalizadosPorPeriodo(inicio, fim);
  const ids = dias.map((d) => d.id);
  const [entradas, saidas] = await Promise.all([
    buscarEntradasPorDias(ids),
    buscarSaidasPorDias(ids),
  ]);
  return agregarResumos(dias, entradas, saidas);
}

export async function buscarResumoPeriodo(
  tipo: "semanal" | "mensal",
  referencia: Date = new Date()
): Promise<ResumoPeriodo> {
  const inicio =
    tipo === "semanal" ? inicioSemana(referencia) : inicioMes(referencia);
  const fim = tipo === "semanal" ? fimSemana(referencia) : fimMes(referencia);

  const inicioStr = toDateString(inicio);
  const fimStr = toDateString(fim);

  return buscarResumoPorIntervalo(inicioStr, fimStr, tipo);
}

/** Resumo consolidado entre duas datas (inclusive). */
export async function buscarResumoPorIntervalo(
  inicio: string,
  fim: string,
  tipo: ResumoPeriodo["tipo"] = "periodo"
): Promise<ResumoPeriodo> {
  const [inicioNorm, fimNorm] =
    inicio <= fim ? [inicio, fim] : [fim, inicio];

  const diasComResumo = await buscarDiasComResumoPorPeriodo(
    inicioNorm,
    fimNorm
  );

  const totalEntradas = diasComResumo.reduce((s, d) => s + d.totalEntradas, 0);
  const totalSaidas = diasComResumo.reduce((s, d) => s + d.totalSaidas, 0);

  return {
    tipo,
    periodoInicio: inicioNorm,
    periodoFim: fimNorm,
    totalEntradas,
    totalSaidas,
    faturamento: totalEntradas,
    lucro: calcularLucro(totalEntradas, totalSaidas),
    diasOperados: diasComResumo.length,
    lavagens: diasComResumo.reduce((s, d) => s + d.lavagens, 0),
    polimentos: diasComResumo.reduce((s, d) => s + d.polimentos, 0),
    outros: diasComResumo.reduce((s, d) => s + d.outros, 0),
  };
}
