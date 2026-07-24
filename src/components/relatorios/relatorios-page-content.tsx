"use client";

import { useCallback, useEffect, useState } from "react";
import { DashboardCharts } from "@/components/dashboard/dashboard-charts";
import { ExportarRelatorioButtons } from "@/components/relatorios/exportar-relatorio-buttons";
import { ListaMovimentosDia } from "@/components/relatorios/lista-movimentos-dia";
import { RelatorioDiaItem } from "@/components/relatorios/relatorio-dia-item";
import { RelatorioDiaModal } from "@/components/relatorios/relatorio-dia-modal";
import { RelatorioPeriodoCharts } from "@/components/relatorios/relatorio-periodo-charts";
import { ResumoPeriodoCard } from "@/components/relatorios/resumo-periodo-card";
import { Skeleton } from "@/components/ui/skeleton";
import { SupabaseWarning } from "@/components/shared/supabase-warning";
import type { RelatorioExportData } from "@/lib/export/relatorio-export-shared";
import {
  formatDate,
  formatDateLong,
  formatMonthYear,
  formatWeekRange,
  fimSemana,
  inicioMes,
  inicioSemana,
} from "@/lib/format";
import { isSupabaseConfigured } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { buscarDiaAberto } from "@/services/dias.service";
import { buscarEntradasDoDia } from "@/services/entradas.service";
import { buscarSaidasDoDia } from "@/services/saidas.service";
import {
  buscarDiasComResumo,
  buscarDiasComResumoPorPeriodo,
  buscarResumoPeriodo,
} from "@/services/relatorios.service";
import type {
  Dia,
  DiaComResumo,
  Entrada,
  FiltroRelatorio,
  ResumoPeriodo,
  Saida,
} from "@/types";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  FileBarChart,
  Inbox,
} from "lucide-react";

const abas: { id: FiltroRelatorio; label: string }[] = [
  { id: "dias", label: "Dia" },
  { id: "semanal", label: "Semanal" },
  { id: "mensal", label: "Mensal" },
];

export function RelatoriosPageContent() {
  const [aba, setAba] = useState<FiltroRelatorio>("dias");
  const [referencia, setReferencia] = useState(new Date());

  const [diaAtivo, setDiaAtivo] = useState<Dia | DiaComResumo | null>(null);
  const [diasHistorico, setDiasHistorico] = useState<DiaComResumo[]>([]);
  const [diasPeriodo, setDiasPeriodo] = useState<DiaComResumo[]>([]);
  const [resumoPeriodo, setResumoPeriodo] = useState<ResumoPeriodo | null>(null);
  const [entradas, setEntradas] = useState<Entrada[]>([]);
  const [saidas, setSaidas] = useState<Saida[]>([]);
  const [diaAbertoId, setDiaAbertoId] = useState<string | null>(null);
  const [diaModalId, setDiaModalId] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [loadingLista, setLoadingLista] = useState(false);

  const carregarMovimentos = useCallback(async (diaId: string) => {
    setLoadingLista(true);
    try {
      const [e, s] = await Promise.all([
        buscarEntradasDoDia(diaId),
        buscarSaidasDoDia(diaId),
      ]);
      setEntradas(e);
      setSaidas(s);
    } catch {
      setEntradas([]);
      setSaidas([]);
    } finally {
      setLoadingLista(false);
    }
  }, []);

  const carregarAbaDia = useCallback(async () => {
    setLoading(true);
    try {
      const [aberto, historico] = await Promise.all([
        buscarDiaAberto(),
        buscarDiasComResumo(),
      ]);
      setDiaAbertoId(aberto?.id ?? null);
      setDiasHistorico(historico);

      const inicial = aberto ?? historico[0] ?? null;
      setDiaAtivo(inicial);
      if (inicial) await carregarMovimentos(inicial.id);
      else {
        setEntradas([]);
        setSaidas([]);
      }
    } catch {
      setDiaAtivo(null);
      setEntradas([]);
      setSaidas([]);
    } finally {
      setLoading(false);
    }
  }, [carregarMovimentos]);

  const carregarAbaPeriodo = useCallback(async () => {
    if (aba !== "semanal" && aba !== "mensal") return;
    setLoading(true);
    try {
      const resumo = await buscarResumoPeriodo(aba, referencia);
      const dias = await buscarDiasComResumoPorPeriodo(
        resumo.periodoInicio,
        resumo.periodoFim
      );
      setResumoPeriodo(resumo);
      setDiasPeriodo(dias);
    } catch {
      setResumoPeriodo(null);
      setDiasPeriodo([]);
    } finally {
      setLoading(false);
    }
  }, [aba, referencia]);

  useEffect(() => {
    if (aba === "dias") void carregarAbaDia();
    else void carregarAbaPeriodo();
  }, [aba, carregarAbaDia, carregarAbaPeriodo]);

  const selecionarDia = async (dia: Dia | DiaComResumo) => {
    setDiaAtivo(dia);
    await carregarMovimentos(dia.id);
  };

  const navegarPeriodo = (direcao: -1 | 1) => {
    setReferencia((prev) => {
      const d = new Date(prev);
      if (aba === "semanal") d.setDate(d.getDate() + direcao * 7);
      else d.setMonth(d.getMonth() + direcao);
      return d;
    });
  };

  const tituloPeriodo =
    aba === "semanal"
      ? `Semana ${formatWeekRange(inicioSemana(referencia), fimSemana(referencia))}`
      : formatMonthYear(inicioMes(referencia));

  const podeExcluir = !!diaAtivo && diaAtivo.id === diaAbertoId;

  const exportDataDia: RelatorioExportData | null = diaAtivo
    ? {
        tipo: "diario",
        dia: diaAtivo,
        entradas,
        saidas,
        tituloPeriodo: formatDateLong(diaAtivo.data),
      }
    : null;

  const exportDataPeriodo: RelatorioExportData | null =
    resumoPeriodo && (aba === "semanal" || aba === "mensal")
      ? {
          tipo: aba,
          resumo: resumoPeriodo,
          dias: diasPeriodo,
          tituloPeriodo,
        }
      : null;

  if (!isSupabaseConfigured()) {
    return <SupabaseWarning />;
  }

  return (
    <div className="mx-auto w-full max-w-md space-y-5 md:max-w-3xl lg:max-w-5xl">
      <div className="flex flex-col items-center gap-2 pt-1 text-center lg:items-start lg:text-left">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-400/15 text-amber-400">
          <FileBarChart className="h-6 w-6" strokeWidth={2.25} />
        </div>
        <h1 className="text-display text-2xl font-bold text-white lg:text-3xl">
          Relatórios
        </h1>
        <p className="text-sm text-zinc-500">
          Movimentações do dia, semana e mês
        </p>
      </div>

      <div className="grid grid-cols-3 gap-1 rounded-2xl border border-white/[0.06] bg-card/80 p-1 backdrop-blur-sm">
        {abas.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              setAba(item.id);
              setReferencia(new Date());
            }}
            className={cn(
              "rounded-xl py-2.5 text-sm font-bold transition-all",
              aba === item.id
                ? "bg-amber-400 text-black shadow-md shadow-amber-400/20"
                : "text-zinc-500 hover:text-zinc-300"
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-24 rounded-2xl bg-zinc-800/80" />
          <Skeleton className="h-48 rounded-2xl bg-zinc-800/80" />
        </div>
      ) : aba === "dias" ? (
        !diaAtivo ? (
          <div className="flex flex-col items-center gap-3 py-12 text-zinc-600">
            <Inbox className="h-10 w-10" />
            <p className="text-center text-sm">
              Nenhum dia registrado ainda. Inicie o dia no início para começar.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="surface-premium rounded-2xl p-4 text-center">
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
                Dia selecionado
              </p>
              <p className="text-display mt-1 text-lg font-bold capitalize text-white">
                {formatDateLong(diaAtivo.data)}
              </p>
              <p className="mt-1 text-xs text-zinc-500">
                {diaAtivo.id === diaAbertoId
                  ? "Em andamento"
                  : `Finalizado · ${formatDate(diaAtivo.data)}`}
              </p>
            </div>

            <div className="surface-premium rounded-2xl p-3">
              <ExportarRelatorioButtons
                data={exportDataDia}
                disabled={loadingLista}
              />
            </div>

            {(diaAbertoId || diasHistorico.length > 0) && (
              <div className="space-y-2">
                <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  <CalendarDays className="h-3.5 w-3.5" />
                  Escolher dia
                </p>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {diaAbertoId && (
                    <button
                      type="button"
                      onClick={async () => {
                        const aberto = await buscarDiaAberto();
                        if (aberto) await selecionarDia(aberto);
                      }}
                      className={cn(
                        "shrink-0 rounded-xl border px-3 py-2 text-xs font-bold transition-colors",
                        diaAtivo.id === diaAbertoId
                          ? "border-emerald-400/40 bg-emerald-500/15 text-emerald-400"
                          : "border-white/[0.06] bg-card/80 text-zinc-400"
                      )}
                    >
                      Hoje (aberto)
                    </button>
                  )}
                  {diasHistorico.slice(0, 20).map((dia) => (
                    <button
                      key={dia.id}
                      type="button"
                      onClick={() => selecionarDia(dia)}
                      className={cn(
                        "shrink-0 rounded-xl border px-3 py-2 text-xs font-bold transition-colors",
                        diaAtivo.id === dia.id
                          ? "border-amber-400/40 bg-amber-400/15 text-amber-400"
                          : "border-white/[0.06] bg-card/80 text-zinc-400"
                      )}
                    >
                      {formatDate(dia.data)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {loadingLista ? (
              <Skeleton className="h-64 rounded-2xl bg-zinc-800/80" />
            ) : (
              <>
                <DashboardCharts
                  totalEntradas={entradas.reduce(
                    (acc, e) => acc + Number(e.valor),
                    0
                  )}
                  totalSaidas={saidas.reduce(
                    (acc, s) => acc + Number(s.valor),
                    0
                  )}
                  entradas={entradas}
                  saidas={saidas}
                  loading={false}
                />
                <ListaMovimentosDia
                  entradas={entradas}
                  saidas={saidas}
                  permitirExcluir={podeExcluir}
                  onChanged={() => {
                    if (diaAtivo) void carregarMovimentos(diaAtivo.id);
                  }}
                />
              </>
            )}
          </div>
        )
      ) : (
        <div className="space-y-4">
          <div className="surface-premium flex items-center justify-between rounded-2xl px-3 py-3">
            <button
              type="button"
              onClick={() => navegarPeriodo(-1)}
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.04] text-zinc-400 hover:text-white"
              aria-label="Período anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm font-semibold capitalize text-zinc-200">
              {tituloPeriodo}
            </span>
            <button
              type="button"
              onClick={() => navegarPeriodo(1)}
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.04] text-zinc-400 hover:text-white"
              aria-label="Próximo período"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {resumoPeriodo && (
            <>
              <div className="surface-premium rounded-2xl p-3">
                <ExportarRelatorioButtons data={exportDataPeriodo} />
              </div>
              <ResumoPeriodoCard
                resumo={resumoPeriodo}
                titulo={aba === "semanal" ? "Resumo Semanal" : "Resumo Mensal"}
              />
              <RelatorioPeriodoCharts
                resumo={resumoPeriodo}
                dias={diasPeriodo}
              />
            </>
          )}

          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Dias do período
            </p>
            {diasPeriodo.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-10 text-zinc-600">
                <Inbox className="h-9 w-9" />
                <p className="text-center text-sm">Nenhum dado neste período</p>
              </div>
            ) : (
              <div className="space-y-2">
                {diasPeriodo.map((dia, i) => (
                  <RelatorioDiaItem
                    key={dia.id}
                    dia={dia}
                    index={i}
                    onClick={() => setDiaModalId(dia.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <RelatorioDiaModal
        diaId={diaModalId}
        onClose={() => setDiaModalId(null)}
      />
    </div>
  );
}
