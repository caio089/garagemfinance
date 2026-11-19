"use client";

import { motion } from "framer-motion";
import {
  Bar,
  BarChart,
  Cell,
  LabelList,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatCurrencyCompact } from "@/lib/format";
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

const LABEL_STYLE = {
  fill: "#e4e4e7",
  fontSize: 10,
  fontWeight: 600,
} as const;

function formatDiaLabel(data: string) {
  const [, m, d] = data.split("-");
  return `${d}/${m}`;
}

function formatBarLabel(value: unknown) {
  const n = Number(value) || 0;
  if (n === 0) return "";
  return formatCurrencyCompact(n);
}

function ValorResumo({
  items,
}: {
  items: { label: string; value: string; tone?: string }[];
}) {
  return (
    <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-xl bg-white/[0.03] px-3 py-2"
        >
          <p className="truncate text-[10px] font-medium uppercase tracking-wider text-zinc-500">
            {item.label}
          </p>
          <p
            className={`text-display mt-0.5 truncate text-sm font-bold tabular-nums ${
              item.tone ?? "text-white"
            }`}
          >
            {item.value}
          </p>
        </div>
      ))}
    </div>
  );
}

export function RelatorioPeriodoCharts({
  resumo,
  dias,
}: RelatorioPeriodoChartsProps) {
  const fluxoData = [
    { name: "Entradas", valor: resumo.totalEntradas, fill: "#34d399" },
    { name: "Saídas", valor: resumo.totalSaidas, fill: "#fb7185" },
  ];

  const totalServicos =
    resumo.lavagens + resumo.polimentos + resumo.outros;

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
  const saldo = resumo.totalEntradas - resumo.totalSaidas;

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
              <>
                <div className="h-[240px] lg:h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={diasData}
                      margin={{ top: 24, right: 12, left: 4, bottom: 0 }}
                      barGap={2}
                    >
                      <XAxis
                        dataKey="dia"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "#71717a", fontSize: 11 }}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        width={64}
                        tick={{ fill: "#71717a", fontSize: 11 }}
                        tickFormatter={(v) => formatCurrencyCompact(Number(v))}
                      />
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
                        name="Entradas"
                        fill="#34d399"
                        radius={[6, 6, 0, 0]}
                        maxBarSize={28}
                      >
                        {diasData.length <= 10 && (
                          <LabelList
                            dataKey="entradas"
                            position="top"
                            formatter={formatBarLabel}
                            style={LABEL_STYLE}
                          />
                        )}
                      </Bar>
                      <Bar
                        dataKey="saidas"
                        name="Saídas"
                        fill="#fb7185"
                        radius={[6, 6, 0, 0]}
                        maxBarSize={28}
                      >
                        {diasData.length <= 10 && (
                          <LabelList
                            dataKey="saidas"
                            position="top"
                            formatter={formatBarLabel}
                            style={LABEL_STYLE}
                          />
                        )}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <ValorResumo
                  items={[
                    {
                      label: "Total entradas",
                      value: formatCurrency(resumo.totalEntradas),
                      tone: "text-emerald-400",
                    },
                    {
                      label: "Total saídas",
                      value: formatCurrency(resumo.totalSaidas),
                      tone: "text-rose-400",
                    },
                    {
                      label: "Saldo período",
                      value: formatCurrency(saldo),
                      tone: saldo >= 0 ? "text-amber-400" : "text-rose-400",
                    },
                  ]}
                />
              </>
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
            <p className="text-xs text-zinc-500">
              Entradas vs saídas com valores
            </p>
          </CardHeader>
          <CardContent className="pb-5">
            {hasFluxo ? (
              <>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={fluxoData}
                      barSize={56}
                      margin={{ top: 28, right: 8, left: 8, bottom: 4 }}
                    >
                      <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "#a1a1aa", fontSize: 12 }}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        width={64}
                        tick={{ fill: "#71717a", fontSize: 11 }}
                        tickFormatter={(v) => formatCurrencyCompact(Number(v))}
                      />
                      <Tooltip
                        formatter={(value) => formatCurrency(Number(value))}
                        contentStyle={TOOLTIP_STYLE}
                      />
                      <Bar dataKey="valor" radius={[10, 10, 4, 4]}>
                        {fluxoData.map((entry, index) => (
                          <Cell key={index} fill={entry.fill} />
                        ))}
                        <LabelList
                          dataKey="valor"
                          position="top"
                          formatter={(v: unknown) =>
                            formatCurrency(Number(v) || 0)
                          }
                          style={LABEL_STYLE}
                        />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <ValorResumo
                  items={[
                    {
                      label: "Entradas",
                      value: formatCurrency(resumo.totalEntradas),
                      tone: "text-emerald-400",
                    },
                    {
                      label: "Saídas",
                      value: formatCurrency(resumo.totalSaidas),
                      tone: "text-rose-400",
                    },
                  ]}
                />
              </>
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
            <p className="text-xs text-zinc-500">
              Quantidade por tipo no período
            </p>
          </CardHeader>
          <CardContent className="pb-5">
            {hasMix ? (
              <div className="flex items-center gap-3">
                <ResponsiveContainer width="45%" height={160}>
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
                      label={({ percent }) =>
                        percent && percent >= 0.08
                          ? `${Math.round(percent * 100)}%`
                          : ""
                      }
                      labelLine={false}
                    >
                      {mixData.map((entry, index) => (
                        <Cell key={index} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value, name) => [
                        `${Number(value)} un.`,
                        String(name),
                      ]}
                      contentStyle={TOOLTIP_STYLE}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex min-w-0 flex-1 flex-col gap-2">
                  {mixData.map((item) => {
                    const pct =
                      totalServicos > 0
                        ? Math.round((item.valor / totalServicos) * 100)
                        : 0;
                    return (
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
                            {item.valor} un. · {pct}%
                          </p>
                        </div>
                      </div>
                    );
                  })}
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
