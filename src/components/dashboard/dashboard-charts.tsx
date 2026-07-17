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
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/format";
import { labelEntrada } from "@/lib/movimento-labels";
import type { Entrada } from "@/types";

interface DashboardChartsProps {
  totalEntradas: number;
  totalSaidas: number;
  entradas: Entrada[];
  loading: boolean;
}

const COLORS = ["#fbbf24", "#34d399", "#f87171", "#a78bfa", "#60a5fa"];

export function DashboardCharts({
  totalEntradas,
  totalSaidas,
  entradas,
  loading,
}: DashboardChartsProps) {
  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-52 rounded-2xl bg-zinc-800" />
        <Skeleton className="h-52 rounded-2xl bg-zinc-800" />
      </div>
    );
  }

  const fluxoData = [
    { name: "Entradas", valor: totalEntradas, fill: "#34d399" },
    { name: "Saídas", valor: totalSaidas, fill: "#f87171" },
  ];

  const servicosMap: Record<string, number> = {};
  entradas
    .filter((e) => e.tipo === "lavagem")
    .forEach((e) => {
      const label = labelEntrada(e).replace(/^Lavagem\s+/i, "") || "Lavagem";
      servicosMap[label] = (servicosMap[label] ?? 0) + 1;
    });

  if (entradas.some((e) => e.polimento)) {
    servicosMap["Polimento"] = entradas.filter((e) => e.polimento).length;
  }
  if (entradas.some((e) => e.tipo === "outro")) {
    servicosMap["Restaurante"] = entradas.filter((e) => e.tipo === "outro").length;
  }

  const servicosData = Object.entries(servicosMap).map(([name, value]) => ({
    name,
    value,
  }));

  const hasFluxo = totalEntradas > 0 || totalSaidas > 0;
  const hasServicos = servicosData.length > 0;

  return (
    <div className="space-y-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <Card className="border-zinc-800 bg-zinc-900">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-zinc-400">
              Entradas x Saídas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {hasFluxo ? (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={fluxoData} barSize={48}>
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#71717a", fontSize: 12 }}
                  />
                  <YAxis hide />
                  <Tooltip
                    formatter={(value) => formatCurrency(Number(value))}
                    contentStyle={{
                      backgroundColor: "#18181b",
                      border: "1px solid #3f3f46",
                      borderRadius: "8px",
                      color: "#fff",
                    }}
                  />
                  <Bar dataKey="valor" radius={[8, 8, 0, 0]}>
                    {fluxoData.map((entry, index) => (
                      <Cell key={index} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="py-8 text-center text-sm text-zinc-600">
                Sem movimentações para exibir
              </p>
            )}
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
      >
        <Card className="border-zinc-800 bg-zinc-900">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-zinc-400">
              Serviços mais realizados
            </CardTitle>
          </CardHeader>
          <CardContent>
            {hasServicos ? (
              <div className="flex items-center gap-4">
                <ResponsiveContainer width="50%" height={160}>
                  <PieChart>
                    <Pie
                      data={servicosData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {servicosData.map((_, index) => (
                        <Cell
                          key={index}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#18181b",
                        border: "1px solid #3f3f46",
                        borderRadius: "8px",
                        color: "#fff",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-1 flex-col gap-2">
                  {servicosData.map((item, index) => (
                    <div
                      key={item.name}
                      className="flex items-center justify-between text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="h-2.5 w-2.5 rounded-full"
                          style={{
                            backgroundColor: COLORS[index % COLORS.length],
                          }}
                        />
                        <span className="text-zinc-400">{item.name}</span>
                      </div>
                      <span className="font-semibold text-white">
                        {item.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="py-8 text-center text-sm text-zinc-600">
                Nenhum serviço registrado
              </p>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
