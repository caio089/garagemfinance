import { getSupabase } from "@/lib/supabase";
import {
  fimMes,
  fimSemana,
  inicioMes,
  inicioSemana,
  toDateString,
} from "@/lib/format";
import { calcularLucro } from "@/lib/financeiro";
import { labelEntrada } from "@/lib/movimento-labels";
import type {
  Dia,
  DiaComResumo,
  Entrada,
  ResumoPeriodo,
  ResumoPeriodoItem,
  Saida,
  SaidaCategoria,
} from "@/types";
import { SAIDA_CATEGORIA_LABELS } from "@/types";

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

export async function buscarEntradasPorDias(
  diaIds: string[]
): Promise<Entrada[]> {
  if (diaIds.length === 0) return [];

  const { data, error } = await getSupabase()
    .from("entradas")
    .select("*")
    .in("dia_id", diaIds);

  if (error) throw error;
  return data ?? [];
}

export async function buscarSaidasPorDias(diaIds: string[]): Promise<Saida[]> {
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

function agregarServicosLavagem(entradas: Entrada[]): ResumoPeriodoItem[] {
  const map = new Map<string, ResumoPeriodoItem>();

  for (const entrada of entradas) {
    if (entrada.tipo !== "lavagem") continue;
    const nome =
      labelEntrada(entrada).replace(/^Lavagem\s+/i, "").trim() || "Lavagem";
    const atual = map.get(nome) ?? { nome, quantidade: 0, valor: 0 };
    atual.quantidade += 1;
    atual.valor += Number(entrada.valor);
    map.set(nome, atual);
  }

  return Array.from(map.values()).sort((a, b) => b.quantidade - a.quantidade);
}

function agregarGastosPorCategoria(saidas: Saida[]): ResumoPeriodoItem[] {
  const map = new Map<string, ResumoPeriodoItem>();

  for (const saida of saidas) {
    const nome =
      SAIDA_CATEGORIA_LABELS[saida.categoria as SaidaCategoria] ??
      saida.categoria;
    const atual = map.get(nome) ?? { nome, quantidade: 0, valor: 0 };
    atual.quantidade += 1;
    atual.valor += Number(saida.valor);
    map.set(nome, atual);
  }

  return Array.from(map.values()).sort((a, b) => b.valor - a.valor);
}

function montarDetalheFinanceiro(entradas: Entrada[], saidas: Saida[]) {
  let valorLavagens = 0;
  let valorRestaurante = 0;
  let valorAvulsa = 0;

  for (const e of entradas) {
    const v = Number(e.valor);
    if (e.tipo === "lavagem") valorLavagens += v;
    else if (e.tipo === "avulsa" || e.categoria === "avulsa") valorAvulsa += v;
    else valorRestaurante += v;
  }

  return {
    valorLavagens,
    valorRestaurante,
    valorAvulsa,
    servicosLavagem: agregarServicosLavagem(entradas),
    gastosPorCategoria: agregarGastosPorCategoria(saidas),
  };
}

/** Monta o mesmo resumo detalhado do semanal/mensal a partir de movimentos. */
export function montarResumoDeMovimentos(
  entradas: Entrada[],
  saidas: Saida[],
  meta: {
    tipo: ResumoPeriodo["tipo"];
    periodoInicio: string;
    periodoFim: string;
    diasOperados: number;
  }
): ResumoPeriodo {
  const detalhe = montarDetalheFinanceiro(entradas, saidas);
  const totalEntradas = entradas.reduce((s, e) => s + Number(e.valor), 0);
  const totalSaidas = saidas.reduce((s, e) => s + Number(e.valor), 0);

  return {
    tipo: meta.tipo,
    periodoInicio: meta.periodoInicio,
    periodoFim: meta.periodoFim,
    totalEntradas,
    totalSaidas,
    faturamento: totalEntradas,
    lucro: calcularLucro(totalEntradas, totalSaidas),
    diasOperados: meta.diasOperados,
    lavagens: entradas.filter((e) => e.tipo === "lavagem").length,
    polimentos: entradas.filter((e) => e.polimento).length,
    outros: entradas.filter((e) => e.tipo === "outro").length,
    ...detalhe,
  };
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

/** Movimentos consolidados do período (para gráficos iguais ao diário). */
export async function buscarMovimentosPorPeriodo(
  inicio: string,
  fim: string
): Promise<{ entradas: Entrada[]; saidas: Saida[] }> {
  const dias = await buscarDiasFinalizadosPorPeriodo(inicio, fim);
  const ids = dias.map((d) => d.id);
  const [entradas, saidas] = await Promise.all([
    buscarEntradasPorDias(ids),
    buscarSaidasPorDias(ids),
  ]);
  return { entradas, saidas };
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

  const dias = await buscarDiasFinalizadosPorPeriodo(inicioNorm, fimNorm);
  const ids = dias.map((d) => d.id);
  const [entradas, saidas] = await Promise.all([
    buscarEntradasPorDias(ids),
    buscarSaidasPorDias(ids),
  ]);

  const diasComResumo = agregarResumos(dias, entradas, saidas);
  const detalhe = montarDetalheFinanceiro(entradas, saidas);

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
    ...detalhe,
  };
}
