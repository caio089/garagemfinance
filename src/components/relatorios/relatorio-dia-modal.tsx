"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardCharts } from "@/components/dashboard/dashboard-charts";
import { ExportarRelatorioButtons } from "@/components/relatorios/exportar-relatorio-buttons";
import { ListaMovimentosDia } from "@/components/relatorios/lista-movimentos-dia";
import { ResumoPeriodoCard } from "@/components/relatorios/resumo-periodo-card";
import type { RelatorioExportData } from "@/lib/export/relatorio-export-shared";
import { formatDate, formatDateLong } from "@/lib/format";
import { calcularResumoDia } from "@/services/dias.service";
import { buscarEntradasDoDia } from "@/services/entradas.service";
import { montarResumoDeMovimentos } from "@/services/relatorios.service";
import { buscarSaidasDoDia } from "@/services/saidas.service";
import type { Dia, Entrada, ResumoDia, Saida } from "@/types";
import { FileText } from "lucide-react";

interface RelatorioDiaModalProps {
  diaId: string | null;
  onClose: () => void;
}

export function RelatorioDiaModal({ diaId, onClose }: RelatorioDiaModalProps) {
  const [resumo, setResumo] = useState<ResumoDia | null>(null);
  const [entradas, setEntradas] = useState<Entrada[]>([]);
  const [saidas, setSaidas] = useState<Saida[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!diaId) {
      setResumo(null);
      setEntradas([]);
      setSaidas([]);
      return;
    }

    setLoading(true);
    Promise.all([
      calcularResumoDia(diaId),
      buscarEntradasDoDia(diaId),
      buscarSaidasDoDia(diaId),
    ])
      .then(([r, e, s]) => {
        setResumo(r);
        setEntradas(e);
        setSaidas(s);
      })
      .catch(() => {
        setResumo(null);
        setEntradas([]);
        setSaidas([]);
      })
      .finally(() => setLoading(false));
  }, [diaId]);

  const resumoDetalhado = useMemo(() => {
    if (!resumo) return null;
    return montarResumoDeMovimentos(entradas, saidas, {
      tipo: "periodo",
      periodoInicio: resumo.data,
      periodoFim: resumo.data,
      diasOperados: 1,
    });
  }, [resumo, entradas, saidas]);

  let exportData: RelatorioExportData | null = null;
  if (diaId && resumo) {
    const dia: Dia = {
      id: diaId,
      data: resumo.data,
      caixa_inicial: resumo.caixaInicial,
      caixa_final: resumo.caixaFinal,
      status: "finalizado",
      created_at: "",
    };
    exportData = {
      tipo: "diario",
      dia,
      entradas,
      saidas,
      tituloPeriodo: formatDateLong(resumo.data),
    };
  }

  return (
    <Dialog open={!!diaId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto border-zinc-800 bg-zinc-900 text-white sm:max-w-2xl lg:max-w-4xl">
        <DialogHeader>
          <div className="flex flex-col items-center gap-2 text-center">
            <FileText className="h-10 w-10 text-amber-400" />
            <DialogTitle className="text-xl font-bold text-white">
              Relatório do Dia
            </DialogTitle>
            {resumo && (
              <p className="text-sm text-zinc-400">{formatDate(resumo.data)}</p>
            )}
          </div>
        </DialogHeader>

        {loading ? (
          <div className="space-y-3 py-4">
            <Skeleton className="h-32 rounded-xl bg-zinc-800" />
            <Skeleton className="h-24 rounded-xl bg-zinc-800" />
          </div>
        ) : resumo && resumoDetalhado ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-5"
          >
            <ExportarRelatorioButtons data={exportData} />
            <ResumoPeriodoCard
              resumo={resumoDetalhado}
              titulo="Resumo do Dia"
              caixaInicial={resumo.caixaInicial}
              caixaFinal={resumo.caixaFinal}
            />
            <DashboardCharts
              totalEntradas={resumo.totalEntradas}
              totalSaidas={resumo.totalSaidas}
              entradas={entradas}
              saidas={saidas}
              loading={false}
              tituloFluxo="Fluxo do dia"
            />
            <ListaMovimentosDia
              entradas={entradas}
              saidas={saidas}
              permitirExcluir={false}
            />
          </motion.div>
        ) : (
          <p className="py-8 text-center text-sm text-zinc-500">
            Não foi possível carregar o relatório.
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
