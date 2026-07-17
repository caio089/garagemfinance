"use client";

import { useCallback, useEffect, useState } from "react";
import { Header } from "@/components/layout/header";
import { DayActionButton } from "@/components/dashboard/day-action-button";
import { MetricCards } from "@/components/dashboard/metric-cards";
import { RecentMovements } from "@/components/dashboard/recent-movements";
import { DashboardCharts } from "@/components/dashboard/dashboard-charts";
import { IniciarDiaModal } from "@/components/modals/iniciar-dia-modal";
import { FinalizarDiaModal } from "@/components/modals/finalizar-dia-modal";
import { buscarDiaAberto } from "@/services/dias.service";
import {
  buscarEntradasDoDia,
  buscarEntradasRecentes,
  totalEntradasDoDia,
} from "@/services/entradas.service";
import { buscarSaidasRecentes, totalSaidasDoDia } from "@/services/saidas.service";
import type { Dia, DashboardMetrics, Entrada, Saida } from "@/types";
import { calcularLucro } from "@/lib/financeiro";
import { isSupabaseConfigured } from "@/lib/supabase";
import { SupabaseWarning } from "@/components/shared/supabase-warning";

export function Dashboard() {
  const [diaAberto, setDiaAberto] = useState<Dia | null>(null);
  const [entradas, setEntradas] = useState<Entrada[]>([]);
  const [saidas, setSaidas] = useState<Saida[]>([]);
  const [todasEntradas, setTodasEntradas] = useState<Entrada[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [iniciarOpen, setIniciarOpen] = useState(false);
  const [finalizarOpen, setFinalizarOpen] = useState(false);

  const carregarDados = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const dia = await buscarDiaAberto();
      setDiaAberto(dia);

      if (dia) {
        const [entradasRecentes, saidasRecentes, totalE, totalS, todasE] =
          await Promise.all([
            buscarEntradasRecentes(dia.id),
            buscarSaidasRecentes(dia.id),
            totalEntradasDoDia(dia.id),
            totalSaidasDoDia(dia.id),
            buscarEntradasDoDia(dia.id),
          ]);

        setEntradas(entradasRecentes);
        setSaidas(saidasRecentes);
        setTodasEntradas(todasE);

        setMetrics({
          caixaInicial: Number(dia.caixa_inicial),
          totalEntradas: totalE,
          totalSaidas: totalS,
          lucro: calcularLucro(totalE, totalS),
        });
      } else {
        setEntradas([]);
        setSaidas([]);
        setTodasEntradas([]);
        setMetrics({
          caixaInicial: 0,
          totalEntradas: 0,
          totalSaidas: 0,
          lucro: 0,
        });
      }
    } catch {
      setDiaAberto(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  if (!isSupabaseConfigured()) {
    return <SupabaseWarning />;
  }

  return (
    <div className="space-y-6">
      <Header diaAberto={diaAberto} />

      <DayActionButton
        diaAberto={!!diaAberto}
        onIniciar={() => setIniciarOpen(true)}
        onFinalizar={() => setFinalizarOpen(true)}
      />

      <MetricCards metrics={metrics} loading={loading} />

      {diaAberto && (
        <DashboardCharts
          totalEntradas={metrics?.totalEntradas ?? 0}
          totalSaidas={metrics?.totalSaidas ?? 0}
          entradas={todasEntradas}
          loading={loading}
        />
      )}

      {diaAberto && (
        <RecentMovements
          entradas={entradas}
          saidas={saidas}
          loading={loading}
        />
      )}

      <IniciarDiaModal
        open={iniciarOpen}
        onOpenChange={setIniciarOpen}
        onSuccess={carregarDados}
      />

      {diaAberto && (
        <FinalizarDiaModal
          open={finalizarOpen}
          onOpenChange={setFinalizarOpen}
          diaId={diaAberto.id}
          onSuccess={carregarDados}
        />
      )}
    </div>
  );
}
