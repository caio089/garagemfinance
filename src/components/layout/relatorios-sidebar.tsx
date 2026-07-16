"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RelatorioDiaItem } from "@/components/relatorios/relatorio-dia-item";
import { RelatorioDiaModal } from "@/components/relatorios/relatorio-dia-modal";
import { ResumoPeriodoCard } from "@/components/relatorios/resumo-periodo-card";
import { Skeleton } from "@/components/ui/skeleton";
import { useSidebar } from "@/context/sidebar-context";
import {
  formatMonthYear,
  formatWeekRange,
  fimSemana,
  inicioMes,
  inicioSemana,
} from "@/lib/format";
import {
  buscarDiasComResumo,
  buscarDiasComResumoPorPeriodo,
  buscarResumoPeriodo,
} from "@/services/relatorios.service";
import type { DiaComResumo, FiltroRelatorio, ResumoPeriodo } from "@/types";
import { cn } from "@/lib/utils";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  FileBarChart,
  Inbox,
  Settings,
  X,
} from "lucide-react";
import Link from "next/link";

const filtros: { id: FiltroRelatorio; label: string; icon: typeof CalendarDays }[] = [
  { id: "dias", label: "Dias", icon: CalendarDays },
  { id: "semanal", label: "Semanal", icon: FileBarChart },
  { id: "mensal", label: "Mensal", icon: FileBarChart },
];

export function RelatoriosSidebar() {
  const { open, setOpen } = useSidebar();
  const [filtro, setFiltro] = useState<FiltroRelatorio>("dias");
  const [referencia, setReferencia] = useState(new Date());
  const [dias, setDias] = useState<DiaComResumo[]>([]);
  const [resumoPeriodo, setResumoPeriodo] = useState<ResumoPeriodo | null>(null);
  const [loading, setLoading] = useState(false);
  const [diaSelecionado, setDiaSelecionado] = useState<string | null>(null);

  const carregarDados = useCallback(async () => {
    setLoading(true);
    try {
      if (filtro === "dias") {
        const resultado = await buscarDiasComResumo();
        setDias(resultado);
        setResumoPeriodo(null);
      } else {
        const resumo = await buscarResumoPeriodo(filtro, referencia);
        const diasPeriodo = await buscarDiasComResumoPorPeriodo(
          resumo.periodoInicio,
          resumo.periodoFim
        );
        setResumoPeriodo(resumo);
        setDias(diasPeriodo);
      }
    } catch {
      setDias([]);
      setResumoPeriodo(null);
    } finally {
      setLoading(false);
    }
  }, [filtro, referencia]);

  useEffect(() => {
    if (open) carregarDados();
  }, [open, carregarDados]);

  const navegarPeriodo = (direcao: -1 | 1) => {
    setReferencia((prev) => {
      const d = new Date(prev);
      if (filtro === "semanal") d.setDate(d.getDate() + direcao * 7);
      else d.setMonth(d.getMonth() + direcao);
      return d;
    });
  };

  const tituloPeriodo =
    filtro === "semanal"
      ? `Semana ${formatWeekRange(inicioSemana(referencia), fimSemana(referencia))}`
      : formatMonthYear(inicioMes(referencia));

  return (
    <>
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            />

            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 32 }}
              className="fixed left-0 top-0 z-50 flex h-full w-[min(100%,320px)] flex-col border-r border-zinc-800 bg-zinc-950 shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-4">
                <div>
                  <h2 className="text-lg font-bold text-white">Relatórios</h2>
                  <p className="text-xs text-zinc-500">Histórico financeiro</p>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-800 text-zinc-400 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="flex gap-1 border-b border-zinc-800 p-2">
                {filtros.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => {
                      setFiltro(f.id);
                      setReferencia(new Date());
                    }}
                    className={cn(
                      "flex-1 rounded-lg py-2 text-xs font-semibold transition-colors",
                      filtro === f.id
                        ? "bg-amber-400 text-black"
                        : "text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"
                    )}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {(filtro === "semanal" || filtro === "mensal") && (
                <div className="flex items-center justify-between border-b border-zinc-800 px-3 py-3">
                  <button
                    type="button"
                    onClick={() => navegarPeriodo(-1)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-800 text-zinc-400 hover:text-white"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="text-sm font-medium capitalize text-zinc-300">
                    {tituloPeriodo}
                  </span>
                  <button
                    type="button"
                    onClick={() => navegarPeriodo(1)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-800 text-zinc-400 hover:text-white"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              )}

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {loading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-40 rounded-xl bg-zinc-800" />
                    <Skeleton className="h-16 rounded-xl bg-zinc-800" />
                    <Skeleton className="h-16 rounded-xl bg-zinc-800" />
                  </div>
                ) : (
                  <>
                    {resumoPeriodo && (
                      <ResumoPeriodoCard
                        resumo={resumoPeriodo}
                        titulo={
                          filtro === "semanal"
                            ? "Resumo Semanal"
                            : "Resumo Mensal"
                        }
                      />
                    )}

                    {filtro !== "dias" && dias.length > 0 && (
                      <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                        Dias do período
                      </p>
                    )}

                    {filtro === "dias" && dias.length > 0 && (
                      <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                        Dias finalizados
                      </p>
                    )}

                    {dias.length === 0 ? (
                      <div className="flex flex-col items-center gap-3 py-12 text-zinc-600">
                        <Inbox className="h-10 w-10" />
                        <p className="text-center text-sm">
                          {filtro === "dias"
                            ? "Nenhum dia finalizado ainda"
                            : "Nenhum dado neste período"}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {dias.map((dia, i) => (
                          <RelatorioDiaItem
                            key={dia.id}
                            dia={dia}
                            index={i}
                            onClick={() => setDiaSelecionado(dia.id)}
                          />
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="border-t border-zinc-800 p-3">
                <Link
                  href="/cadastro"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-3 text-sm font-semibold text-zinc-200 transition-colors hover:border-amber-400/40 hover:text-amber-400"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-400/10 text-amber-400">
                    <Settings className="h-4 w-4" />
                  </div>
                  Cadastro de preços e itens
                </Link>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <RelatorioDiaModal
        diaId={diaSelecionado}
        onClose={() => setDiaSelecionado(null)}
      />
    </>
  );
}
