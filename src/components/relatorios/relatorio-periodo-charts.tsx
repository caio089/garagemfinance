"use client";

import { motion } from "framer-motion";
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";
import type { DiaComResumo, ResumoPeriodo } from "@/types";

interface RelatorioPeriodoChartsProps {
  resumo: ResumoPeriodo;
  dias: DiaComResumo[];
}

const TOOLTIP_STYLE = {
  backgroundColor: "oklch(0.16 0.015 75)",
  border: "1px solid oklch(0.3 0.02 75)",
  borderRadius: "12px",
  color: "#fff",
  boxShadow: "0 12px 40px rgba(0,0,0,0.45)",
  fontSize: 12,
};

function formatDiaLabel(data: string) {
  const [, m, d] = data.split("-");
  return `${d}/${m}`;
}

export function RelatorioPeriodoCharts({
  resumo,
  dias,
}: RelatorioPeriodoChartsProps) {
  const fluxoData = [
    { name: "Entradas", valor: resumo.totalEntradas, fill: "#34d399" },
    { name: "Saídas", valor: resumo.totalSaidas, fill: "#fb7185" },
  ];

  const mixData = [
    { name: "Lavagens", valor: resumo.lavagens, fill: "#fbbf24" },
    { name: "Polimentos", valor: resumo.polimentos, fill: "#60a5fa" },
    { name: "Restaurante", valor: resumo.outros, fill: "#34d399" },
  ].filter((i) => i.valor > 0);

  const diasOrdenados = [...dias].sort((a, b) => a.data.localeCompare(b.data));
  const diasData = diasOrdenados.map((d) => ({
    dia: formatDiaLabel(d.data),
    entradas: d.totalEntradas,
    saidas: d.totalSaidas,
    saldo: d.totalEntradas - d.totalSaidas,
  }));

  const hasFluxo = resumo.totalEntradas > 0 || resumo.totalSaidas > 0;
  const hasMix = mixData.length > 0;
  const hasDias = diasData.length > 0;

  return (
    <div className="grid gap-4 lg:grid-cols-2 lg:gap-5">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        className="lg:col-span-2"
      >
        <Card className="surface-premium border-0 ring-0">
          <CardHeader className="pb-1 pt-5">
            <CardTitle className="text-display text-sm font-semibold text-zinc-200">
              Evolução diária
            </CardTitle>
            <p className="text-xs text-zinc-500">
              Entradas e saídas por dia no período
            </p>
          </CardHeader>
          <CardContent className="pb-5">
            {hasDias ? (
              <div className="h-[220px] lg:h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={diasData}
                    margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                    barGap={2}
                  >
                    <XAxis
                      dataKey="dia"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#71717a", fontSize: 11 }}
                    />
                    <YAxis hide />
                    <Tooltip
                      formatter={(value, name) => [
                        formatCurrency(Number(value)),
                        name === "entradas"
                          ? "Entradas"
                          : name === "saidas"
                            ? "Saídas"
                            : "Saldo",
                      ]}
                      contentStyle={TOOLTIP_STYLE}
                      cursor={{ fill: "rgba(255,255,255,0.03)" }}
                    />
                    <Bar
                      dataKey="entradas"
                      fill="#34d399"
                      radius={[6, 6, 0, 0]}
                      maxBarSize={28}
                    />
                    <Bar
                      dataKey="saidas"
                      fill="#fb7185"
                      radius={[6, 6, 0, 0]}
                      maxBarSize={28}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="py-10 text-center text-sm text-zinc-600">
                Sem dias no período
              </p>
            )}
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.06 }}
      >
        <Card className="surface-premium h-full border-0 ring-0">
          <CardHeader className="pb-1 pt-5">
            <CardTitle className="text-display text-sm font-semibold text-zinc-200">
              Fluxo do período
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-5">
            {hasFluxo ? (
              <div className="h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={fluxoData} barSize={48}>
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#a1a1aa", fontSize: 12 }}
                    />
                    <YAxis hide />
                    <Tooltip
                      formatter={(value) => formatCurrency(Number(value))}
                      contentStyle={TOOLTIP_STYLE}
                    />
                    <Bar dataKey="valor" radius={[10, 10, 4, 4]}>
                      {fluxoData.map((entry, index) => (
                        <Cell key={index} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="py-10 text-center text-sm text-zinc-600">
                Sem movimentações
              </p>
            )}
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="surface-premium h-full border-0 ring-0">
          <CardHeader className="pb-1 pt-5">
            <CardTitle className="text-display text-sm font-semibold text-zinc-200">
              Mix de serviços
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-5">
            {hasMix ? (
              <div className="flex items-center gap-3">
                <ResponsiveContainer width="45%" height={150}>
                  <PieChart>
                    <Pie
                      data={mixData}
                      cx="50%"
                      cy="50%"
                      innerRadius={36}
                      outerRadius={60}
                      paddingAngle={3}
                      dataKey="valor"
                      nameKey="name"
                      stroke="none"
                    >
                      {mixData.map((entry, index) => (
                        <Cell key={index} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={TOOLTIP_STYLE} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                  {mixData.map((item) => (
                    <div key={item.name} className="flex items-center gap-2">
                      <div
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: item.fill }}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-white">
                          {item.name}
                        </p>
                        <p className="text-xs tabular-nums text-zinc-400">
                          {item.valor}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="py-10 text-center text-sm text-zinc-600">
                Sem serviços no período
              </p>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
