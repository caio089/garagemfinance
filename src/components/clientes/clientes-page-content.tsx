"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Clock3,
  Loader2,
  Phone,
  Search,
  Star,
  UserPlus,
  Users,
  UserX,
} from "lucide-react";
import { toast } from "sonner";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { isSupabaseConfigured } from "@/lib/supabase";
import { SupabaseWarning } from "@/components/shared/supabase-warning";
import {
  formatarWhatsappInput,
  listarClientesVeiculos,
  normalizarWhatsapp,
} from "@/services/fila.service";
import type { ClienteVeiculo } from "@/types";

/** Cliente agregado pelo WhatsApp (referência principal). */
interface ClientePorWhatsapp {
  whatsapp: string;
  nome: string;
  placas: string[];
  visitas: number;
  created_at: string;
  updated_at: string;
}

type FiltroCliente =
  | "todos"
  | "mais_vem"
  | "inativos_7"
  | "inativos_15"
  | "inativos_30"
  | "vieram_hoje"
  | "vieram_semana"
  | "novos"
  | "uma_visita";

const FILTROS: {
  id: FiltroCliente;
  label: string;
  icon: typeof Users;
}[] = [
  { id: "todos", label: "Todos", icon: Users },
  { id: "mais_vem", label: "Mais vêm", icon: Star },
  { id: "vieram_hoje", label: "Vieram hoje", icon: Clock3 },
  { id: "vieram_semana", label: "Esta semana", icon: Clock3 },
  { id: "inativos_7", label: "Sumiram 7d", icon: UserX },
  { id: "inativos_15", label: "Sumiram 15d", icon: UserX },
  { id: "inativos_30", label: "Sumiram 30d", icon: UserX },
  { id: "novos", label: "Novos", icon: UserPlus },
  { id: "uma_visita", label: "1 visita", icon: Users },
];

function diasDesde(iso: string): number {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return Number.POSITIVE_INFINITY;
  return (Date.now() - t) / (1000 * 60 * 60 * 24);
}

function mesmoDiaLocal(iso: string): boolean {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return false;
  const hoje = new Date();
  return (
    d.getFullYear() === hoje.getFullYear() &&
    d.getMonth() === hoje.getMonth() &&
    d.getDate() === hoje.getDate()
  );
}

/** Agrupa veículos pelo WhatsApp — uma pessoa, vários carros. */
function agruparPorWhatsapp(rows: ClienteVeiculo[]): ClientePorWhatsapp[] {
  const map = new Map<string, ClientePorWhatsapp>();

  for (const row of rows) {
    const whatsapp = normalizarWhatsapp(row.whatsapp);
    if (whatsapp.length < 10) continue;

    const existente = map.get(whatsapp);
    if (!existente) {
      map.set(whatsapp, {
        whatsapp,
        nome: row.nome_proprietario?.trim() || "Sem nome",
        placas: row.placa ? [row.placa] : [],
        visitas: Number(row.visitas) || 1,
        created_at: row.created_at,
        updated_at: row.updated_at,
      });
      continue;
    }

    existente.visitas += Number(row.visitas) || 0;
    if (row.placa && !existente.placas.includes(row.placa)) {
      existente.placas.push(row.placa);
    }
    // Nome mais recente (updated_at maior)
    if (new Date(row.updated_at) >= new Date(existente.updated_at)) {
      existente.nome = row.nome_proprietario?.trim() || existente.nome;
      existente.updated_at = row.updated_at;
    }
    if (new Date(row.created_at) < new Date(existente.created_at)) {
      existente.created_at = row.created_at;
    }
  }

  return Array.from(map.values());
}

function aplicarFiltro(
  lista: ClientePorWhatsapp[],
  filtro: FiltroCliente
): ClientePorWhatsapp[] {
  let result = [...lista];

  switch (filtro) {
    case "mais_vem":
      result = result
        .filter((c) => c.visitas >= 2)
        .sort((a, b) => b.visitas - a.visitas);
      break;
    case "inativos_7":
      result = result
        .filter((c) => diasDesde(c.updated_at) >= 7)
        .sort((a, b) => diasDesde(b.updated_at) - diasDesde(a.updated_at));
      break;
    case "inativos_15":
      result = result
        .filter((c) => diasDesde(c.updated_at) >= 15)
        .sort((a, b) => diasDesde(b.updated_at) - diasDesde(a.updated_at));
      break;
    case "inativos_30":
      result = result
        .filter((c) => diasDesde(c.updated_at) >= 30)
        .sort((a, b) => diasDesde(b.updated_at) - diasDesde(a.updated_at));
      break;
    case "vieram_hoje":
      result = result
        .filter((c) => mesmoDiaLocal(c.updated_at))
        .sort(
          (a, b) =>
            new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        );
      break;
    case "vieram_semana":
      result = result
        .filter((c) => diasDesde(c.updated_at) <= 7)
        .sort(
          (a, b) =>
            new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        );
      break;
    case "novos":
      result = result
        .filter((c) => diasDesde(c.created_at) <= 7)
        .sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      break;
    case "uma_visita":
      result = result
        .filter((c) => c.visitas === 1)
        .sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      break;
    default:
      result.sort(
        (a, b) =>
          new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      );
  }

  return result;
}

function labelUltimaVisita(iso: string): string {
  const dias = Math.floor(diasDesde(iso));
  if (dias <= 0) return "hoje";
  if (dias === 1) return "há 1 dia";
  if (dias < 30) return `há ${dias} dias`;
  const meses = Math.floor(dias / 30);
  if (meses === 1) return "há 1 mês";
  return `há ${meses} meses`;
}

export function ClientesPageContent() {
  const [clientesRaw, setClientesRaw] = useState<ClienteVeiculo[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState<FiltroCliente>("todos");

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      const lista = await listarClientesVeiculos();
      setClientesRaw(lista);
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : "Não foi possível carregar os clientes.";
      toast.error(msg);
      setClientesRaw([]);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const agrupados = useMemo(
    () => agruparPorWhatsapp(clientesRaw),
    [clientesRaw]
  );

  const filtrados = useMemo(() => {
    let lista = aplicarFiltro(agrupados, filtro);
    const q = busca.trim().toLowerCase();
    if (!q) return lista;

    const digitos = q.replace(/\D/g, "");
    return lista.filter(
      (c) =>
        c.nome.toLowerCase().includes(q) ||
        c.placas.some((p) => p.toLowerCase().includes(q)) ||
        (digitos.length > 0 && c.whatsapp.includes(digitos))
    );
  }, [agrupados, filtro, busca]);

  const contagens = useMemo(() => {
    const map = {} as Record<FiltroCliente, number>;
    for (const f of FILTROS) {
      map[f.id] = aplicarFiltro(agrupados, f.id).length;
    }
    return map;
  }, [agrupados]);

  if (!isSupabaseConfigured()) {
    return <SupabaseWarning />;
  }

  return (
    <div className="mx-auto w-full max-w-md space-y-5 md:max-w-3xl lg:max-w-5xl">
      <div className="flex flex-col items-center gap-2 pt-2 text-center lg:items-start lg:text-left">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-400/15 text-amber-400">
          <Users className="h-6 w-6" strokeWidth={2.5} />
        </div>
        <h1 className="text-2xl font-bold text-white lg:text-3xl">Clientes</h1>
        <p className="text-sm text-zinc-500">
          Agrupados pelo WhatsApp · um número, todos os carros
        </p>
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
        <input
          type="search"
          placeholder="Buscar nome, WhatsApp ou placa..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="h-12 w-full rounded-xl border border-zinc-700 bg-zinc-900 pl-10 pr-4 text-sm text-white placeholder:text-zinc-600 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/20"
        />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {FILTROS.map((item) => {
          const Icon = item.icon;
          const ativo = filtro === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setFiltro(item.id)}
              className={cn(
                "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-2 text-xs font-bold transition-colors",
                ativo
                  ? "border-amber-400/50 bg-amber-400 text-black"
                  : "border-white/[0.08] bg-zinc-900/80 text-zinc-400 hover:text-zinc-200"
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {item.label}
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[10px] tabular-nums",
                  ativo ? "bg-black/15" : "bg-white/[0.06]"
                )}
              >
                {contagens[item.id] ?? 0}
              </span>
            </button>
          );
        })}
      </div>

      <p className="text-center text-xs text-zinc-500 lg:text-left">
        {carregando
          ? "Carregando..."
          : `${filtrados.length} cliente(s) · referência: WhatsApp`}
      </p>

      {carregando ? (
        <div className="flex items-center justify-center gap-2 py-16 text-zinc-500">
          <Loader2 className="h-5 w-5 animate-spin" />
          Carregando clientes...
        </div>
      ) : filtrados.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-800 py-14 text-center text-sm text-zinc-600">
          {agrupados.length === 0
            ? "Nenhum cliente cadastrado ainda."
            : "Nenhum cliente neste filtro."}
        </div>
      ) : (
        <div className="space-y-2">
          {filtrados.map((cliente, index) => {
            const whatsLink = cliente.whatsapp.startsWith("55")
              ? cliente.whatsapp
              : `55${cliente.whatsapp}`;

            return (
              <motion.div
                key={cliente.whatsapp}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(index * 0.02, 0.3) }}
                className="rounded-2xl border border-white/[0.06] bg-zinc-900/70 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-base font-bold text-white">
                      {cliente.nome}
                    </p>
                    <a
                      href={`https://wa.me/${whatsLink}`}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 inline-flex items-center gap-2 text-sm font-semibold text-emerald-400 hover:text-emerald-300"
                    >
                      <Phone className="h-3.5 w-3.5" />
                      {formatarWhatsappInput(cliente.whatsapp)}
                    </a>
                  </div>
                  <div className="shrink-0 text-right">
                    <span className="rounded-full bg-amber-400/15 px-2.5 py-1 text-[11px] font-semibold text-amber-300">
                      {cliente.visitas} visita
                      {cliente.visitas === 1 ? "" : "s"}
                    </span>
                    <p className="mt-1.5 text-[10px] text-zinc-500">
                      {labelUltimaVisita(cliente.updated_at)}
                    </p>
                  </div>
                </div>

                <div className="mt-3 space-y-1.5">
                  <p className="text-xs text-zinc-500">
                    Placa
                    {cliente.placas.length === 1 ? "" : "s"}:{" "}
                    <span className="font-semibold tracking-wider text-zinc-300">
                      {cliente.placas.join(" · ") || "—"}
                    </span>
                  </p>
                  <p className="text-xs text-zinc-500">
                    Cadastro: {formatDate(cliente.created_at)} · Última visita:{" "}
                    {formatDate(cliente.updated_at)}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
