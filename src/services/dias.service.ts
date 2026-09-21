import { calcularCaixaFinal, calcularLucro } from "@/lib/financeiro";
import { toDateString } from "@/lib/format";
import { getSupabase } from "@/lib/supabase";
import type { Dia, ResumoDia } from "@/types";

/** Data civil local no formato YYYY-MM-DD. */
export function dataCivilLocal(ref: Date = new Date()): string {
  return toDateString(ref);
}

export async function buscarDiaPorData(data: string): Promise<Dia | null> {
  const { data: dia, error } = await getSupabase()
    .from("dias")
    .select("*")
    .eq("data", data)
    .maybeSingle();

  if (error) throw error;
  return dia;
}

/** Dia de hoje (calendário local), se já existir movimento/registro. */
export async function buscarDiaDeHoje(): Promise<Dia | null> {
  return buscarDiaPorData(dataCivilLocal());
}

/**
 * @deprecated Use buscarDiaDeHoje / obterOuCriarDiaPorData.
 * Mantido para compatibilidade: retorna o dia civil de hoje.
 */
export async function buscarDiaAberto(): Promise<Dia | null> {
  return buscarDiaDeHoje();
}

/**
 * Garante um dia para a data informada (padrão: hoje).
 * Não exige abrir/fechar caixa — cria sob demanda na primeira compra.
 */
export async function obterOuCriarDiaPorData(
  data?: string,
  caixaInicial?: number
): Promise<Dia> {
  const dataAlvo = data ?? dataCivilLocal();
  const existente = await buscarDiaPorData(dataAlvo);
  if (existente) return existente;

  let caixa = caixaInicial;
  if (caixa === undefined) {
    const anterior = await buscarUltimoDiaComCaixa(dataAlvo);
    caixa =
      anterior?.caixa_final != null
        ? Number(anterior.caixa_final)
        : Number(anterior?.caixa_inicial ?? 0);
  }

  const { data: criado, error } = await getSupabase()
    .from("dias")
    .insert({
      data: dataAlvo,
      caixa_inicial: Math.max(0, Number(caixa) || 0),
      status: "iniciado",
    })
    .select()
    .single();

  if (error) {
    // Corrida: outro insert na mesma data
    if (error.code === "23505") {
      const deNovo = await buscarDiaPorData(dataAlvo);
      if (deNovo) return deNovo;
    }
    throw error;
  }

  return criado;
}

/** @deprecated Abrir caixa não é mais necessário. */
export async function iniciarDia(caixaInicial: number): Promise<Dia> {
  return obterOuCriarDiaPorData(dataCivilLocal(), caixaInicial);
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

/**
 * Atualiza o caixa previsto do dia (sem “fechar” operação).
 * Mantido para relatórios/exportação.
 */
export async function atualizarCaixaPrevisto(diaId: string): Promise<ResumoDia> {
  const resumo = await calcularResumoDia(diaId);

  const { error } = await getSupabase()
    .from("dias")
    .update({
      caixa_final: resumo.caixaFinal,
    })
    .eq("id", diaId);

  if (error) throw error;
  return resumo;
}

/** @deprecated Fechar caixa não é mais necessário. */
export async function finalizarDia(diaId: string): Promise<ResumoDia> {
  return atualizarCaixaPrevisto(diaId);
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

async function buscarUltimoDiaComCaixa(antesDeData: string): Promise<Dia | null> {
  const { data, error } = await getSupabase()
    .from("dias")
    .select("*")
    .lt("data", antesDeData)
    .order("data", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data;
}

/** Último dia com caixa_final, para sugerir saldo inicial (legado). */
export async function buscarUltimoDiaFinalizado(): Promise<Dia | null> {
  const { data, error } = await getSupabase()
    .from("dias")
    .select("*")
    .not("caixa_final", "is", null)
    .order("data", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data;
}
