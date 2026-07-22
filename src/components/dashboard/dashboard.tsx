"use client";

import { useCallback, useEffect, useState } from "react";
import { Header } from "@/components/layout/header";
import { DayActionButton } from "@/components/dashboard/day-action-button";
import { QuickActions } from "@/components/dashboard/quick-actions";
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
import {
  buscarSaidasDoDia,
  buscarSaidasRecentes,
  totalSaidasDoDia,
} from "@/services/saidas.service";
import type { Dia, DashboardMetrics, Entrada, Saida } from "@/types";
import {
  calcularSaldoDiario,
  calcularValorEmCaixa,
} from "@/lib/financeiro";
import { isSupabaseConfigured } from "@/lib/supabase";
import { SupabaseWarning } from "@/components/shared/supabase-warning";
import {
  USE_MOCK_DASHBOARD,
  mockDiaAberto,
  mockEntradas,
  mockMetrics,
  mockSaidas,
} from "@/lib/mock-dashboard";

export function Dashboard() {
  const [diaAberto, setDiaAberto] = useState<Dia | null>(null);
  const [entradas, setEntradas] = useState<Entrada[]>([]);
  const [saidas, setSaidas] = useState<Saida[]>([]);
  const [todasEntradas, setTodasEntradas] = useState<Entrada[]>([]);
  const [todasSaidas, setTodasSaidas] = useState<Saida[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [iniciarOpen, setIniciarOpen] = useState(false);
  const [finalizarOpen, setFinalizarOpen] = useState(false);

  const aplicarMock = useCallback(() => {
    setDiaAberto(mockDiaAberto);
    setTodasEntradas(mockEntradas);
    setTodasSaidas(mockSaidas);
    setEntradas(mockEntradas.slice(0, 5));
    setSaidas(mockSaidas.slice(0, 5));
    setMetrics(mockMetrics());
    setLoading(false);
  }, []);

  const carregarDados = useCallback(async () => {
    if (USE_MOCK_DASHBOARD) {
      aplicarMock();
      return;
    }

    if (!isSupabaseConfigured()) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const dia = await buscarDiaAberto();
      setDiaAberto(dia);

      if (dia) {
        const [
          entradasRecentes,
          saidasRecentes,
          totalE,
          totalS,
          todasE,
          todasS,
        ] = await Promise.all([
          buscarEntradasRecentes(dia.id),
          buscarSaidasRecentes(dia.id),
          totalEntradasDoDia(dia.id),
          totalSaidasDoDia(dia.id),
          buscarEntradasDoDia(dia.id),
          buscarSaidasDoDia(dia.id),
        ]);

        setEntradas(entradasRecentes);
        setSaidas(saidasRecentes);
        setTodasEntradas(todasE);
        setTodasSaidas(todasS);

        const caixaInicial = Number(dia.caixa_inicial);
        const saldoDiario = calcularSaldoDiario(totalE, totalS);
        setMetrics({
          caixaInicial,
          totalEntradas: totalE,
          totalSaidas: totalS,
          saldoDiario,
          valorEmCaixa: calcularValorEmCaixa(caixaInicial, totalE, totalS),
        });
      } else {
        setEntradas([]);
        setSaidas([]);
        setTodasEntradas([]);
        setTodasSaidas([]);
        setMetrics({
          caixaInicial: 0,
          totalEntradas: 0,
          totalSaidas: 0,
          saldoDiario: 0,
          valorEmCaixa: 0,
        });
      }
    } catch {
      setDiaAberto(null);
    } finally {
      setLoading(false);
    }
  }, [aplicarMock]);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  if (!USE_MOCK_DASHBOARD && !isSupabaseConfigured()) {
    return <SupabaseWarning />;
  }

  return (
    <div className="space-y-5 lg:space-y-7">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between lg:gap-8">
        <div className="min-w-0 flex-1">
          <Header diaAberto={diaAberto} />
        </div>
        <div className="w-full lg:w-[28rem] lg:shrink-0">
          <QuickActions disabled={!diaAberto || USE_MOCK_DASHBOARD} />
        </div>
      </div>

      <DayActionButton
        diaAberto={!!diaAberto}
        onIniciar={() => {
          if (!USE_MOCK_DASHBOARD) setIniciarOpen(true);
        }}
        onFinalizar={() => {
          if (!USE_MOCK_DASHBOARD) setFinalizarOpen(true);
        }}
      />

      <MetricCards metrics={metrics} loading={loading} />

      {diaAberto && (
        <>
          <DashboardCharts
            totalEntradas={metrics?.totalEntradas ?? 0}
            totalSaidas={metrics?.totalSaidas ?? 0}
            entradas={todasEntradas}
            saidas={todasSaidas}
            loading={loading}
          />
          <RecentMovements
            entradas={entradas}
            saidas={saidas}
            loading={loading}
            onChanged={USE_MOCK_DASHBOARD ? undefined : carregarDados}
          />
        </>
      )}

      {!USE_MOCK_DASHBOARD && (
        <>
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
        </>
      )}
    </div>
  );
}
