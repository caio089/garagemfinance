import * as XLSX from "xlsx";
import {
  calcularCaixaFinal,
  calcularSaldoDiario,
} from "@/lib/financeiro";
import { formatDate, formatDateLong } from "@/lib/format";
import {
  contarServicos,
  linhaDiaPeriodoExcel,
  linhaEntradaExcel,
  linhaSaidaExcel,
  nomeArquivoRelatorio,
  totalEntradas,
  totalSaidas,
  type RelatorioExportData,
} from "@/lib/export/relatorio-export-shared";

function baixarWorkbook(wb: XLSX.WorkBook, filename: string) {
  XLSX.writeFile(wb, filename);
}

function sheetFromRows(rows: Record<string, string | number>[]) {
  return XLSX.utils.json_to_sheet(
    rows.length > 0 ? rows : [{ Info: "Sem dados" }]
  );
}

export function exportarRelatorioExcel(data: RelatorioExportData) {
  const wb = XLSX.utils.book_new();

  if (data.tipo === "diario") {
    const entradasTotal = totalEntradas(data.entradas);
    const saidasTotal = totalSaidas(data.saidas);
    const saldo = calcularSaldoDiario(entradasTotal, saidasTotal);
    const caixaFinal = calcularCaixaFinal(
      Number(data.dia.caixa_inicial),
      entradasTotal,
      saidasTotal
    );
    const servicos = contarServicos(data.entradas);

    const resumo = [
      { Campo: "Empresa", Valor: "Garagem Federal" },
      { Campo: "Tipo de relatório", Valor: "Diário" },
      { Campo: "Data", Valor: formatDateLong(data.dia.data) },
      {
        Campo: "Status",
        Valor:
          data.dia.status === "finalizado" ? "Finalizado" : "Em andamento",
      },
      { Campo: "Caixa inicial", Valor: Number(data.dia.caixa_inicial) },
      { Campo: "Total de entradas", Valor: entradasTotal },
      { Campo: "Total de saídas", Valor: saidasTotal },
      { Campo: "Saldo diário", Valor: saldo },
      { Campo: "Valor em caixa", Valor: caixaFinal },
      { Campo: "Lavagens", Valor: servicos.lavagens },
      { Campo: "Polimentos", Valor: servicos.polimentos },
      { Campo: "Restaurante", Valor: servicos.restaurante },
      { Campo: "Qtd. entradas", Valor: data.entradas.length },
      { Campo: "Qtd. saídas", Valor: data.saidas.length },
      {
        Campo: "Gerado em",
        Valor: new Date().toLocaleString("pt-BR"),
      },
    ];

    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(resumo),
      "Resumo"
    );
    XLSX.utils.book_append_sheet(
      wb,
      sheetFromRows(data.entradas.map(linhaEntradaExcel)),
      "Entradas"
    );
    XLSX.utils.book_append_sheet(
      wb,
      sheetFromRows(data.saidas.map(linhaSaidaExcel)),
      "Saídas"
    );
  } else {
    const titulo =
      data.tipo === "semanal" ? "Relatório Semanal" : "Relatório Mensal";

    const resumo = [
      { Campo: "Empresa", Valor: "Garagem Federal" },
      { Campo: "Tipo de relatório", Valor: titulo },
      { Campo: "Período", Valor: data.tituloPeriodo },
      {
        Campo: "Início",
        Valor: formatDate(data.resumo.periodoInicio),
      },
      { Campo: "Fim", Valor: formatDate(data.resumo.periodoFim) },
      { Campo: "Dias operados", Valor: data.resumo.diasOperados },
      { Campo: "Total de entradas", Valor: data.resumo.totalEntradas },
      { Campo: "Total de saídas", Valor: data.resumo.totalSaidas },
      { Campo: "Faturamento", Valor: data.resumo.faturamento },
      { Campo: "Lucro do período", Valor: data.resumo.lucro },
      { Campo: "Lavagens", Valor: data.resumo.lavagens },
      { Campo: "Polimentos", Valor: data.resumo.polimentos },
      { Campo: "Restaurante", Valor: data.resumo.outros },
      {
        Campo: "Gerado em",
        Valor: new Date().toLocaleString("pt-BR"),
      },
    ];

    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(resumo),
      "Resumo"
    );
    XLSX.utils.book_append_sheet(
      wb,
      sheetFromRows(data.dias.map(linhaDiaPeriodoExcel)),
      "Dias"
    );
  }

  baixarWorkbook(wb, nomeArquivoRelatorio(data, "xlsx"));
}
