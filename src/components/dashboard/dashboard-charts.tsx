"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import {
  Area,
  AreaChart,
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
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatCurrencyCompact } from "@/lib/format";
import { labelEntrada } from "@/lib/movimento-labels";
import { SAIDA_CATEGORIA_LABELS, type Entrada, type Saida } from "@/types";

interface DashboardChartsProps {
  totalEntradas: number;
  totalSaidas: number;
  entradas: Entrada[];
  saidas: Saida[];
  loading: boolean;
}

const COLORS = ["#fbbf24", "#34d399", "#60a5fa", "#f472b6", "#a78bfa", "#fb923c"];

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
  fontSize: 11,
  fontWeight: 600,
} as const;

interface ServicoAgg {
  name: string;
  quantidade: number;
  valor: number;
}

function nomeServicoLavagem(entrada: Entrada): string {
  return labelEntrada(entrada).replace(/^Lavagem\s+/i, "").trim() || "Lavagem";
}

function agregarServicos(entradas: Entrada[]): ServicoAgg[] {
  const map = new Map<string, ServicoAgg>();

  for (const entrada of entradas) {
    const name =
      entrada.tipo === "lavagem"
        ? nomeServicoLavagem(entrada)
        : "Restaurante";

    const atual = map.get(name) ?? { name, quantidade: 0, valor: 0 };
    atual.quantidade += 1;
    atual.valor += Number(entrada.valor);
    map.set(name, atual);
  }

  return Array.from(map.values()).sort((a, b) => b.valor - a.valor);
}

function agregarOrigem(entradas: Entrada[]) {
  let lavagem = 0;
  let restaurante = 0;
  let qLavagem = 0;
  let qRestaurante = 0;

  for (const e of entradas) {
    const v = Number(e.valor);
    if (e.tipo === "lavagem") {
      lavagem += v;
      qLavagem += 1;
    } else {
      restaurante += v;
      qRestaurante += 1;
    }
  }

  return [
    { name: "Lavagem", valor: lavagem, quantidade: qLavagem, fill: "#fbbf24" },
    {
      name: "Restaurante",
      valor: restaurante,
      quantidade: qRestaurante,
      fill: "#34d399",
    },
  ].filter((i) => i.valor > 0);
}

function agregarPorHora(entradas: Entrada[], saidas: Saida[]) {
  const hours = Array.from({ length: 24 }, (_, h) => ({
    hora: `${String(h).padStart(2, "0")}h`,
    h,
    entradas: 0,
    saidas: 0,
  }));

  for (const e of entradas) {
    const h = new Date(e.created_at).getHours();
    hours[h].entradas += Number(e.valor);
  }
  for (const s of saidas) {
    const h = new Date(s.created_at).getHours();
    hours[h].saidas += Number(s.valor);
  }

  const ativos = hours.filter((x) => x.entradas > 0 || x.saidas > 0);
  if (ativos.length === 0) return [];

  const minH = Math.max(0, Math.min(...ativos.map((x) => x.h)) - 1);
  const maxH = Math.min(23, Math.max(...ativos.map((x) => x.h)) + 1);
  return hours.slice(minH, maxH + 1);
}

function agregarSaidas(saidas: Saida[]) {
  const map = new Map<string, number>();
  for (const s of saidas) {
    const label = SAIDA_CATEGORIA_LABELS[s.categoria] ?? s.categoria;
    map.set(label, (map.get(label) ?? 0) + Number(s.valor));
  }
  return Array.from(map.entries())
    .map(([name, valor]) => ({ name, valor }))
    .sort((a, b) => b.valor - a.valor);
}

function formatBarLabel(value: unknown) {
  return formatCurrency(Number(value) || 0);
}

function ChartShell({
  title,
  subtitle,
  delay,
  children,
  className,
}: {
  title: string;
  subtitle?: string;
  delay: number;
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35 }}
      className={className}
    >
      <Card className="surface-premium h-full border-0 ring-0">
        <CardHeader className="pb-1 pt-5">
          <CardTitle className="text-display text-sm font-semibold text-zinc-200">
            {title}
          </CardTitle>
          {subtitle && (
            <p className="text-xs text-zinc-500">{subtitle}</p>
          )}
        </CardHeader>
        <CardContent className="pb-5">{children}</CardContent>
      </Card>
    </motion.div>
  );
}

function EmptyChart({ message }: { message: string }) {
  return (
    <div className="flex h-[160px] items-center justify-center lg:h-[180px]">
      <p className="text-sm text-zinc-600">{message}</p>
    </div>
  );
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

export function DashboardCharts({
  totalEntradas,
  totalSaidas,
  entradas,
  saidas,
  loading,
}: DashboardChartsProps) {
  if (loading) {
    return (
      <div className="grid gap-4 lg:grid-cols-2 lg:gap-5">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton
            key={i}
            className={`h-56 rounded-2xl bg-zinc-800/80 ${i === 0 ? "lg:col-span-2" : ""}`}
          />
        ))}
      </div>
    );
  }

  const fluxoData = [
    { name: "Entradas", valor: totalEntradas, fill: "#34d399" },
    { name: "Saídas", valor: totalSaidas, fill: "#fb7185" },
  ];

  const servicosData = agregarServicos(entradas);
  const origemData = agregarOrigem(entradas);
  const horaData = agregarPorHora(entradas, saidas);
  const saidasCat = agregarSaidas(saidas);
  const totalServicos = servicosData.reduce((acc, s) => acc + s.valor, 0);

  const hasFluxo = totalEntradas > 0 || totalSaidas > 0;
  const hasServicos = servicosData.length > 0;
  const hasOrigem = origemData.length > 0;
  const hasHora = horaData.length > 0;
  const hasSaidasCat = saidasCat.length > 0;

  const ticketMedio =
    entradas.length > 0 ? totalEntradas / entradas.length : 0;
  const polimentos = entradas.filter((e) => e.polimento).length;
  const saldo = totalEntradas - totalSaidas;

  return (
    <div className="space-y-4 lg:space-y-5">
      <div className="grid grid-cols-3 gap-3">
        {[
          {
            label: "Movimentos",
            value: String(entradas.length + saidas.length),
          },
          {
            label: "Ticket médio",
            value: formatCurrency(ticketMedio),
          },
          {
            label: "Polimentos",
            value: String(polimentos),
          },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 + i * 0.04 }}
            className="surface-premium rounded-2xl px-3 py-3 text-center sm:px-4"
          >
            <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-500 sm:text-[11px]">
              {stat.label}
            </p>
            <p className="text-display mt-1 truncate text-sm font-bold tabular-nums text-white sm:text-base">
              {stat.value}
            </p>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2 lg:gap-5">
        <ChartShell
          title="Fluxo do dia"
          subtitle="Comparativo de entradas e saídas"
          delay={0.12}
          className="lg:col-span-2"
        >
          {hasFluxo ? (
            <>
              <div className="h-[220px] lg:h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={fluxoData}
                    barSize={72}
                    margin={{ top: 28, right: 12, left: 8, bottom: 4 }}
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
                      cursor={{ fill: "rgba(255,255,255,0.03)" }}
                    />
                    <Bar dataKey="valor" radius={[12, 12, 4, 4]}>
                      {fluxoData.map((entry, index) => (
                        <Cell key={index} fill={entry.fill} />
                      ))}
                      <LabelList
                        dataKey="valor"
                        position="top"
                        formatter={formatBarLabel}
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
                    value: formatCurrency(totalEntradas),
                    tone: "text-emerald-400",
                  },
                  {
                    label: "Saídas",
                    value: formatCurrency(totalSaidas),
                    tone: "text-rose-400",
                  },
                  {
                    label: "Saldo",
                    value: formatCurrency(saldo),
                    tone: saldo >= 0 ? "text-amber-400" : "text-rose-400",
                  },
                ]}
              />
            </>
          ) : (
            <EmptyChart message="Sem movimentações para exibir" />
          )}
        </ChartShell>

        <ChartShell
          title="Evolução por horário"
          subtitle="Volume financeiro ao longo do dia"
          delay={0.16}
          className="lg:col-span-2"
        >
          {hasHora ? (
            <div className="h-[220px] lg:h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={horaData}
                  margin={{ top: 12, right: 12, left: 4, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="gradEntradas" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#34d399" stopOpacity={0.45} />
                      <stop offset="100%" stopColor="#34d399" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradSaidas" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#fb7185" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#fb7185" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="hora"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#71717a", fontSize: 11 }}
                    interval="preserveStartEnd"
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
                      name === "entradas" ? "Entradas" : "Saídas",
                    ]}
                    contentStyle={TOOLTIP_STYLE}
                  />
                  <Area
                    type="monotone"
                    dataKey="entradas"
                    name="Entradas"
                    stroke="#34d399"
                    strokeWidth={2.5}
                    fill="url(#gradEntradas)"
                  />
                  <Area
                    type="monotone"
                    dataKey="saidas"
                    name="Saídas"
                    stroke="#fb7185"
                    strokeWidth={2}
                    fill="url(#gradSaidas)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyChart message="Sem dados horários ainda" />
          )}
        </ChartShell>

        <ChartShell
          title="Serviços do dia"
          subtitle="Quantidade e valor por serviço"
          delay={0.2}
        >
          {hasServicos ? (
            <div className="flex items-center gap-3">
              <ResponsiveContainer width="44%" height={180}>
                <PieChart>
                  <Pie
                    data={servicosData}
                    cx="50%"
                    cy="50%"
                    innerRadius={42}
                    outerRadius={68}
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
                    {servicosData.map((_, index) => (
                      <Cell
                        key={index}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(_value, _name, item) => {
                      const payload = item?.payload as ServicoAgg | undefined;
                      if (!payload) return "";
                      return [
                        `${payload.quantidade} · ${formatCurrency(payload.valor)}`,
                        payload.name,
                      ];
                    }}
                    contentStyle={TOOLTIP_STYLE}
                  />
                </PieChart>
              </ResponsiveContainer>

              <div className="flex min-w-0 flex-1 flex-col gap-2.5">
                {servicosData.slice(0, 5).map((item, index) => {
                  const pct =
                    totalServicos > 0
                      ? Math.round((item.valor / totalServicos) * 100)
                      : 0;
                  return (
                    <div
                      key={item.name}
                      className="flex min-w-0 items-start gap-2.5"
                    >
                      <div
                        className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{
                          backgroundColor: COLORS[index % COLORS.length],
                        }}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-white">
                          {item.name}
                        </p>
                        <p className="text-xs tabular-nums text-zinc-400">
                          {item.quantidade} un. · {formatCurrency(item.valor)} ·{" "}
                          {pct}%
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <EmptyChart message="Nenhum serviço registrado" />
          )}
        </ChartShell>

        <ChartShell
          title="Origem da receita"
          subtitle="Lavagem vs restaurante"
          delay={0.24}
        >
          {hasOrigem ? (
            <>
              <div className="h-[190px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={origemData}
                    layout="vertical"
                    margin={{ top: 4, right: 72, left: 8, bottom: 4 }}
                    barSize={28}
                  >
                    <XAxis
                      type="number"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#71717a", fontSize: 11 }}
                      tickFormatter={(v) => formatCurrencyCompact(Number(v))}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      width={88}
                      tick={{ fill: "#a1a1aa", fontSize: 12 }}
                    />
                    <Tooltip
                      formatter={(value, _name, item) => {
                        const q = (item?.payload as { quantidade?: number })
                          ?.quantidade;
                        return [
                          `${formatCurrency(Number(value))}${
                            q != null ? ` · ${q} mov.` : ""
                          }`,
                          "Valor",
                        ];
                      }}
                      contentStyle={TOOLTIP_STYLE}
                      cursor={{ fill: "rgba(255,255,255,0.03)" }}
                    />
                    <Bar dataKey="valor" radius={[0, 10, 10, 0]}>
                      {origemData.map((entry, index) => (
                        <Cell key={index} fill={entry.fill} />
                      ))}
                      <LabelList
                        dataKey="valor"
                        position="right"
                        formatter={formatBarLabel}
                        style={LABEL_STYLE}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <ValorResumo
                items={origemData.map((o) => ({
                  label: `${o.name} (${o.quantidade})`,
                  value: formatCurrency(o.valor),
                  tone: o.name === "Lavagem" ? "text-amber-400" : "text-emerald-400",
                }))}
              />
            </>
          ) : (
            <EmptyChart message="Sem receita registrada" />
          )}
        </ChartShell>

        <ChartShell
          title="Saídas por categoria"
          subtitle="Onde o dinheiro saiu"
          delay={0.28}
          className="lg:col-span-2"
        >
          {hasSaidasCat ? (
            <>
              <div className="h-[200px] lg:h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={saidasCat}
                    layout="vertical"
                    margin={{ top: 4, right: 80, left: 8, bottom: 4 }}
                    barSize={22}
                  >
                    <XAxis
                      type="number"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#71717a", fontSize: 11 }}
                      tickFormatter={(v) => formatCurrencyCompact(Number(v))}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      width={100}
                      tick={{ fill: "#a1a1aa", fontSize: 12 }}
                    />
                    <Tooltip
                      formatter={(value) => formatCurrency(Number(value))}
                      contentStyle={TOOLTIP_STYLE}
                      cursor={{ fill: "rgba(255,255,255,0.03)" }}
                    />
                    <Bar dataKey="valor" fill="#fb7185" radius={[0, 10, 10, 0]}>
                      <LabelList
                        dataKey="valor"
                        position="right"
                        formatter={formatBarLabel}
                        style={LABEL_STYLE}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <ValorResumo
                items={saidasCat.slice(0, 3).map((s) => ({
                  label: s.name,
                  value: formatCurrency(s.valor),
                  tone: "text-rose-400",
                }))}
              />
            </>
          ) : (
            <EmptyChart message="Nenhuma saída registrada" />
          )}
        </ChartShell>
      </div>
    </div>
  );
}
