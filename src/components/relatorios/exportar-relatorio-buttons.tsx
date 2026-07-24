"use client";

import { useState } from "react";
import { FileDown, FileSpreadsheet, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { exportarRelatorioExcel } from "@/lib/export/export-excel";
import { exportarRelatorioPdf } from "@/lib/export/export-pdf";
import type { RelatorioExportData } from "@/lib/export/relatorio-export-shared";
import { cn } from "@/lib/utils";

interface ExportarRelatorioButtonsProps {
  data: RelatorioExportData | null;
  disabled?: boolean;
  className?: string;
  compact?: boolean;
}

export function ExportarRelatorioButtons({
  data,
  disabled = false,
  className,
  compact = false,
}: ExportarRelatorioButtonsProps) {
  const [exporting, setExporting] = useState<"pdf" | "excel" | null>(null);

  const podeExportar = !!data && !disabled && !exporting;

  const handleExport = async (formato: "pdf" | "excel") => {
    if (!data) {
      toast.error("Não há dados para exportar neste período.");
      return;
    }

    setExporting(formato);
    try {
      // Pequeno delay para o estado de loading aparecer antes do processamento
      await new Promise((r) => setTimeout(r, 50));
      if (formato === "pdf") exportarRelatorioPdf(data);
      else exportarRelatorioExcel(data);
      toast.success(
        formato === "pdf"
          ? "PDF gerado com sucesso."
          : "Planilha Excel gerada com sucesso."
      );
    } catch (err) {
      console.error(err);
      toast.error(
        formato === "pdf"
          ? "Não foi possível gerar o PDF."
          : "Não foi possível gerar o Excel."
      );
    } finally {
      setExporting(null);
    }
  };

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2",
        compact ? "justify-end" : "justify-stretch sm:justify-end",
        className
      )}
    >
      {!compact && (
        <p className="mr-auto w-full text-xs text-zinc-500 sm:w-auto">
          Exportar relatório
        </p>
      )}
      <Button
        type="button"
        variant="outline"
        size={compact ? "sm" : "default"}
        disabled={!podeExportar}
        onClick={() => void handleExport("excel")}
        className="min-w-0 flex-1 border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 hover:text-emerald-200 sm:flex-none"
      >
        {exporting === "excel" ? (
          <Loader2 className="animate-spin" data-icon="inline-start" />
        ) : (
          <FileSpreadsheet data-icon="inline-start" />
        )}
        Excel
      </Button>
      <Button
        type="button"
        variant="outline"
        size={compact ? "sm" : "default"}
        disabled={!podeExportar}
        onClick={() => void handleExport("pdf")}
        className="min-w-0 flex-1 border-amber-400/30 bg-amber-400/10 text-amber-300 hover:bg-amber-400/20 hover:text-amber-200 sm:flex-none"
      >
        {exporting === "pdf" ? (
          <Loader2 className="animate-spin" data-icon="inline-start" />
        ) : (
          <FileDown data-icon="inline-start" />
        )}
        PDF
      </Button>
    </div>
  );
}
