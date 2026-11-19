import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import {
  calcularCaixaFinal,
  calcularSaldoDiario,
} from "@/lib/financeiro";
import { formatCurrency, formatDate, formatDateLong, formatTime } from "@/lib/format";
import { labelEntrada } from "@/lib/movimento-labels";
import {
  contarServicos,
  labelTipoEntradaExport,
  nomeArquivoRelatorio,
  textoExplicativo,
  totalEntradas,
  totalSaidas,
  type RelatorioExportData,
} from "@/lib/export/relatorio-export-shared";
import { SAIDA_CATEGORIA_LABELS } from "@/types";

type JsPdfWithAutoTable = jsPDF & {
  lastAutoTable?: { finalY: number };
};

const MARGIN = 16;
const PAGE_WIDTH = 210;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

const COLORS = {
  brand: [180, 120, 20] as [number, number, number],
  dark: [24, 24, 27] as [number, number, number],
  muted: [82, 82, 91] as [number, number, number],
  line: [228, 228, 231] as [number, number, number],
  soft: [250, 250, 250] as [number, number, number],
  emerald: [16, 185, 129] as [number, number, number],
  rose: [244, 63, 94] as [number, number, number],
  amber: [245, 158, 11] as [number, number, number],
};

function ensureSpace(doc: JsPdfWithAutoTable, y: number, needed = 40) {
  if (y + needed > 280) {
    doc.addPage();
    return MARGIN + 8;
  }
  return y;
}

function drawHeader(
  doc: JsPdfWithAutoTable,
  titulo: string,
  subtitulo: string
) {
  doc.setFillColor(...COLORS.dark);
  doc.rect(0, 0, PAGE_WIDTH, 36, "F");

  doc.setFillColor(...COLORS.brand);
  doc.rect(0, 36, PAGE_WIDTH, 2.5, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("GARAGEM FEDERAL", MARGIN, 16);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(212, 212, 216);
  doc.text("Relatório financeiro operacional", MARGIN, 23);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(251, 191, 36);
  doc.text(titulo, MARGIN, 31);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(161, 161, 170);
  doc.text(subtitulo, PAGE_WIDTH - MARGIN, 31, { align: "right" });

  return 46;
}

function drawSectionTitle(doc: JsPdfWithAutoTable, title: string, y: number) {
  y = ensureSpace(doc, y, 18);
  doc.setFillColor(...COLORS.brand);
  doc.roundedRect(MARGIN, y, 3, 8, 1, 1, "F");
  doc.setTextColor(...COLORS.dark);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(title, MARGIN + 7, y + 6);
  return y + 12;
}

function drawParagraph(doc: JsPdfWithAutoTable, text: string, y: number) {
  y = ensureSpace(doc, y, 28);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...COLORS.muted);
  const lines = doc.splitTextToSize(text, CONTENT_WIDTH);
  doc.text(lines, MARGIN, y);
  return y + lines.length * 4.2 + 6;
}

function drawMetricCards(
  doc: JsPdfWithAutoTable,
  y: number,
  cards: { label: string; value: string; color?: [number, number, number] }[]
) {
  y = ensureSpace(doc, y, 28);
  const gap = 4;
  const cols = Math.min(cards.length, 4);
  const cardW = (CONTENT_WIDTH - gap * (cols - 1)) / cols;

  cards.forEach((card, i) => {
    const x = MARGIN + (i % cols) * (cardW + gap);
    const row = Math.floor(i / cols);
    const cy = y + row * 26;

    doc.setFillColor(...COLORS.soft);
    doc.setDrawColor(...COLORS.line);
    doc.roundedRect(x, cy, cardW, 22, 2, 2, "FD");

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(...COLORS.muted);
    doc.text(card.label.toUpperCase(), x + 4, cy + 7);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...(card.color ?? COLORS.dark));
    doc.text(card.value, x + 4, cy + 16);
  });

  const rows = Math.ceil(cards.length / cols);
  return y + rows * 26 + 6;
}

function drawFooter(doc: JsPdfWithAutoTable) {
  const pageCount = doc.getNumberOfPages();
  const gerado = new Date().toLocaleString("pt-BR");

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setDrawColor(...COLORS.line);
    doc.line(MARGIN, 287, PAGE_WIDTH - MARGIN, 287);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(...COLORS.muted);
    doc.text(
      `Garagem Federal · Documento gerado em ${gerado}`,
      MARGIN,
      292
    );
    doc.text(`Página ${i} de ${pageCount}`, PAGE_WIDTH - MARGIN, 292, {
      align: "right",
    });
  }
}

function tableHeadStyles() {
  return {
    fillColor: COLORS.dark as [number, number, number],
    textColor: [255, 255, 255] as [number, number, number],
    fontStyle: "bold" as const,
    fontSize: 8,
    halign: "left" as const,
  };
}

function tableBodyStyles() {
  return {
    fontSize: 8,
    textColor: COLORS.dark as [number, number, number],
    cellPadding: 2.5,
  };
}

function exportarPdfDiario(data: Extract<RelatorioExportData, { tipo: "diario" }>) {
  const doc = new jsPDF({ unit: "mm", format: "a4" }) as JsPdfWithAutoTable;
  const entradasTotal = totalEntradas(data.entradas);
  const saidasTotal = totalSaidas(data.saidas);
  const saldo = calcularSaldoDiario(entradasTotal, saidasTotal);
  const caixaFinal = calcularCaixaFinal(
    Number(data.dia.caixa_inicial),
    entradasTotal,
    saidasTotal
  );
  const servicos = contarServicos(data.entradas);
  const status = "Agrupado por data";

  let y = drawHeader(
    doc,
    "Relatório Diário",
    formatDateLong(data.dia.data)
  );

  y = drawSectionTitle(doc, "Sobre este relatório", y);
  y = drawParagraph(doc, textoExplicativo(data), y);

  y = drawSectionTitle(doc, "Identificação do dia", y);
  y = drawParagraph(
    doc,
    `Data: ${formatDateLong(data.dia.data)}  ·  Status: ${status}  ·  ` +
      `Caixa inicial: ${formatCurrency(Number(data.dia.caixa_inicial))}`,
    y
  );

  y = drawSectionTitle(doc, "Resumo financeiro", y);
  y = drawMetricCards(doc, y, [
    {
      label: "Entradas",
      value: formatCurrency(entradasTotal),
      color: COLORS.emerald,
    },
    {
      label: "Saídas",
      value: formatCurrency(saidasTotal),
      color: COLORS.rose,
    },
    {
      label: "Saldo diário",
      value: formatCurrency(saldo),
      color: COLORS.amber,
    },
    {
      label: "Valor em caixa",
      value: formatCurrency(caixaFinal),
      color: COLORS.dark,
    },
  ]);

  y = drawSectionTitle(doc, "Serviços realizados", y);
  y = drawMetricCards(doc, y, [
    { label: "Lavagens", value: String(servicos.lavagens) },
    { label: "Polimentos", value: String(servicos.polimentos) },
    { label: "Restaurante", value: String(servicos.restaurante) },
    {
      label: "Movimentos",
      value: String(data.entradas.length + data.saidas.length),
    },
  ]);
  y = drawParagraph(
    doc,
    "Lavagens e restaurante contabilizam cada entrada registrada. Polimentos são serviços adicionais vinculados a lavagens. " +
      "Movimentos é a soma de todas as entradas e saídas do dia.",
    y
  );

  y = drawSectionTitle(doc, "Entradas do dia", y);
  y = drawParagraph(
    doc,
    "Lista completa das receitas do dia, com horário, tipo de serviço, identificação e valor.",
    y
  );

  autoTable(doc, {
    startY: y,
    margin: { left: MARGIN, right: MARGIN },
    head: [["Horário", "Tipo", "Descrição", "Placa", "Valor"]],
    body:
      data.entradas.length > 0
        ? data.entradas.map((e) => [
            formatTime(e.created_at),
            labelTipoEntradaExport(e.tipo),
            labelEntrada(e) + (e.polimento ? " + polimento" : ""),
            e.placa ?? "—",
            formatCurrency(Number(e.valor)),
          ])
        : [["—", "—", "Nenhuma entrada registrada", "—", "—"]],
    headStyles: tableHeadStyles(),
    bodyStyles: tableBodyStyles(),
    alternateRowStyles: { fillColor: [250, 250, 250] },
    columnStyles: {
      0: { cellWidth: 22 },
      1: { cellWidth: 28 },
      4: { halign: "right", cellWidth: 30 },
    },
  });

  y = (doc.lastAutoTable?.finalY ?? y) + 10;

  y = drawSectionTitle(doc, "Saídas do dia", y);
  y = drawParagraph(
    doc,
    "Lista completa das despesas do dia por categoria (cozinha, funcionários ou lava-jato).",
    y
  );

  autoTable(doc, {
    startY: y,
    margin: { left: MARGIN, right: MARGIN },
    head: [["Horário", "Categoria", "Descrição", "Valor"]],
    body:
      data.saidas.length > 0
        ? data.saidas.map((s) => [
            formatTime(s.created_at),
            SAIDA_CATEGORIA_LABELS[s.categoria] ?? s.categoria,
            s.descricao?.trim() || "—",
            formatCurrency(Number(s.valor)),
          ])
        : [["—", "—", "Nenhuma saída registrada", "—"]],
    headStyles: tableHeadStyles(),
    bodyStyles: tableBodyStyles(),
    alternateRowStyles: { fillColor: [250, 250, 250] },
    columnStyles: {
      0: { cellWidth: 22 },
      1: { cellWidth: 36 },
      3: { halign: "right", cellWidth: 30 },
    },
  });

  y = (doc.lastAutoTable?.finalY ?? y) + 10;
  y = drawSectionTitle(doc, "Como interpretar os números", y);
  y = drawParagraph(
    doc,
    "• Entradas: dinheiro que entrou no caixa (lavagens e restaurante).\n" +
      "• Saídas: dinheiro que saiu do caixa (despesas operacionais).\n" +
      "• Saldo diário: Entradas − Saídas (resultado do dia, sem o caixa inicial).\n" +
      "• Valor em caixa: Caixa inicial + Saldo diário (quanto deve haver no caixa ao final).",
    y
  );

  drawFooter(doc);
  doc.save(nomeArquivoRelatorio(data, "pdf"));
}

function exportarPdfPeriodo(
  data: Extract<RelatorioExportData, { tipo: "semanal" | "mensal" | "periodo" }>
) {
  const doc = new jsPDF({ unit: "mm", format: "a4" }) as JsPdfWithAutoTable;
  const titulo =
    data.tipo === "semanal"
      ? "Relatório Semanal"
      : data.tipo === "periodo"
        ? "Relatório por Período"
        : "Relatório Mensal";
  const periodoLabel = `${formatDate(data.resumo.periodoInicio)} a ${formatDate(data.resumo.periodoFim)}`;

  let y = drawHeader(doc, titulo, data.tituloPeriodo);

  y = drawSectionTitle(doc, "Sobre este relatório", y);
  y = drawParagraph(doc, textoExplicativo(data), y);

  y = drawSectionTitle(doc, "Período analisado", y);
  y = drawParagraph(
    doc,
    `Intervalo: ${periodoLabel}  ·  Dias operados: ${data.resumo.diasOperados}  ·  ` +
      `Referência: ${data.tituloPeriodo}`,
    y
  );

  y = drawSectionTitle(doc, "Resumo financeiro do período", y);
  y = drawMetricCards(doc, y, [
    {
      label: "Entradas",
      value: formatCurrency(data.resumo.totalEntradas),
      color: COLORS.emerald,
    },
    {
      label: "Saídas",
      value: formatCurrency(data.resumo.totalSaidas),
      color: COLORS.rose,
    },
    {
      label: "Faturamento",
      value: formatCurrency(data.resumo.faturamento),
      color: COLORS.dark,
    },
    {
      label: "Lucro",
      value: formatCurrency(data.resumo.lucro),
      color: COLORS.amber,
    },
  ]);
  y = drawParagraph(
    doc,
    "Faturamento corresponde ao total de entradas do período. Lucro é o resultado consolidado " +
      "(entradas menos saídas) considerando os dias operados listados abaixo.",
    y
  );

  y = drawSectionTitle(doc, "Mix de serviços", y);
  y = drawMetricCards(doc, y, [
    { label: "Lavagens", value: String(data.resumo.lavagens) },
    { label: "Polimentos", value: String(data.resumo.polimentos) },
    { label: "Restaurante", value: String(data.resumo.outros) },
    {
      label: "Total serviços",
      value: String(
        data.resumo.lavagens + data.resumo.polimentos + data.resumo.outros
      ),
    },
  ]);

  y = drawSectionTitle(doc, "Desempenho por dia", y);
  y = drawParagraph(
    doc,
    "Cada linha representa um dia operado no período: entradas, saídas, saldo do dia e quantidade de serviços.",
    y
  );

  const diasOrdenados = [...data.dias].sort((a, b) =>
    a.data.localeCompare(b.data)
  );

  autoTable(doc, {
    startY: y,
    margin: { left: MARGIN, right: MARGIN },
    head: [
      [
        "Data",
        "Entradas",
        "Saídas",
        "Saldo",
        "Lavagens",
        "Polim.",
        "Rest.",
      ],
    ],
    body:
      diasOrdenados.length > 0
        ? diasOrdenados.map((d) => {
            const saldo = Number(d.totalEntradas) - Number(d.totalSaidas);
            return [
              formatDate(d.data),
              formatCurrency(Number(d.totalEntradas)),
              formatCurrency(Number(d.totalSaidas)),
              formatCurrency(saldo),
              String(d.lavagens),
              String(d.polimentos),
              String(d.outros),
            ];
          })
        : [["—", "—", "—", "Sem dias no período", "—", "—", "—"]],
    headStyles: tableHeadStyles(),
    bodyStyles: tableBodyStyles(),
    alternateRowStyles: { fillColor: [250, 250, 250] },
    columnStyles: {
      1: { halign: "right" },
      2: { halign: "right" },
      3: { halign: "right" },
      4: { halign: "center", cellWidth: 18 },
      5: { halign: "center", cellWidth: 16 },
      6: { halign: "center", cellWidth: 16 },
    },
  });

  y = (doc.lastAutoTable?.finalY ?? y) + 10;
  y = drawSectionTitle(doc, "Como usar este relatório", y);
  y = drawParagraph(
    doc,
    "1. Compare o lucro do período com períodos anteriores para avaliar tendência.\n" +
      "2. Observe dias com saldo negativo ou saídas elevadas para revisar custos.\n" +
      "3. Use o mix de serviços para entender a composição da receita (lavagem vs restaurante).\n" +
      "4. A planilha Excel complementar traz os mesmos números em formato editável para análises próprias.",
    y
  );

  drawFooter(doc);
  doc.save(nomeArquivoRelatorio(data, "pdf"));
}

export function exportarRelatorioPdf(data: RelatorioExportData) {
  if (data.tipo === "diario") {
    exportarPdfDiario(data);
    return;
  }
  exportarPdfPeriodo(data);
}
