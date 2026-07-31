import { formatCurrency, formatDate, formatTime } from "@/lib/format";
import { labelEntrada } from "@/lib/movimento-labels";
import {
  SAIDA_CATEGORIA_LABELS,
  type Dia,
  type DiaComResumo,
  type Entrada,
  type ResumoPeriodo,
  type Saida,
} from "@/types";

export type TipoRelatorioExport = "diario" | "semanal" | "mensal";

export interface RelatorioDiaExportData {
  tipo: "diario";
  dia: Dia | DiaComResumo;
  entradas: Entrada[];
  saidas: Saida[];
  tituloPeriodo: string;
}

export interface RelatorioPeriodoExportData {
  tipo: "semanal" | "mensal";
  resumo: ResumoPeriodo;
  dias: DiaComResumo[];
  tituloPeriodo: string;
}

export type RelatorioExportData =
  | RelatorioDiaExportData
  | RelatorioPeriodoExportData;

export function totalEntradas(entradas: Entrada[]) {
  return entradas.reduce((acc, e) => acc + Number(e.valor), 0);
}

export function totalSaidas(saidas: Saida[]) {
  return saidas.reduce((acc, s) => acc + Number(s.valor), 0);
}

export function contarServicos(entradas: Entrada[]) {
  return {
    lavagens: entradas.filter((e) => e.tipo === "lavagem").length,
    polimentos: entradas.filter((e) => e.polimento).length,
    restaurante: entradas.filter((e) => e.tipo === "outro").length,
    avulsas: entradas.filter((e) => e.tipo === "avulsa").length,
  };
}

export function labelTipoEntradaExport(tipo: Entrada["tipo"]): string {
  if (tipo === "lavagem") return "Lavagem";
  if (tipo === "avulsa") return "Avulsa";
  return "Restaurante";
}

export function nomeArquivoRelatorio(
  data: RelatorioExportData,
  extensao: "pdf" | "xlsx"
) {
  const stamp = new Date().toISOString().slice(0, 10);
  if (data.tipo === "diario") {
    return `garagem-federal-diario-${data.dia.data}.${extensao}`;
  }
  const tipo = data.tipo === "semanal" ? "semanal" : "mensal";
  return `garagem-federal-${tipo}-${data.resumo.periodoInicio}_${data.resumo.periodoFim}-${stamp}.${extensao}`;
}

export function linhaEntradaExcel(e: Entrada) {
  return {
    Horário: formatTime(e.created_at),
    Tipo: labelTipoEntradaExport(e.tipo),
    Descrição: labelEntrada(e),
    Placa: e.placa ?? "",
    Modelo: e.modelo ?? "",
    Polimento: e.polimento ? "Sim" : "Não",
    Valor: Number(e.valor),
    Observação: e.descricao ?? "",
  };
}

export function linhaSaidaExcel(s: Saida) {
  return {
    Horário: formatTime(s.created_at),
    Categoria: SAIDA_CATEGORIA_LABELS[s.categoria] ?? s.categoria,
    Descrição: s.descricao ?? "",
    Valor: Number(s.valor),
  };
}

export function linhaDiaPeriodoExcel(d: DiaComResumo) {
  return {
    Data: formatDate(d.data),
    Status: d.status === "finalizado" ? "Finalizado" : "Em andamento",
    Entradas: Number(d.totalEntradas),
    Saídas: Number(d.totalSaidas),
    Saldo: Number(d.totalEntradas) - Number(d.totalSaidas),
    Lavagens: d.lavagens,
    Polimentos: d.polimentos,
    Restaurante: d.outros,
    "Caixa inicial": Number(d.caixa_inicial),
  };
}

export function textoExplicativo(data: RelatorioExportData): string {
  if (data.tipo === "diario") {
    return (
      "Este relatório apresenta o fechamento financeiro de um dia de operação da Garagem Federal. " +
      "Inclui o resumo de caixa, a quantidade de serviços realizados, todas as entradas (lavagens e restaurante) " +
      "e todas as saídas (cozinha, funcionários e lava-jato). O saldo diário é a diferença entre entradas e saídas; " +
      "o valor em caixa considera também o caixa inicial do dia."
    );
  }

  if (data.tipo === "semanal") {
    return (
      "Este relatório semanal consolida os dias operados no período selecionado. " +
      "Mostra o faturamento total (entradas), o total de saídas, o lucro do período e a composição dos serviços. " +
      "A tabela por dia permite comparar o desempenho diário e identificar variações ao longo da semana."
    );
  }

  return (
    "Este relatório mensal consolida a operação financeira do mês selecionado. " +
    "Apresenta totais de entradas e saídas, lucro, dias operados e mix de serviços. " +
    "Use a tabela diária para acompanhar a evolução ao longo do mês e apoiar decisões de caixa e equipe."
  );
}

export function formatMoneyCell(value: number) {
  return formatCurrency(value);
}
