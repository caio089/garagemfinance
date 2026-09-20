"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Loader2, Phone, Search, Users } from "lucide-react";
import { toast } from "sonner";
import { formatDate } from "@/lib/format";
import { isSupabaseConfigured } from "@/lib/supabase";
import { SupabaseWarning } from "@/components/shared/supabase-warning";
import {
  formatarWhatsappInput,
  listarClientesVeiculos,
  normalizarWhatsapp,
} from "@/services/fila.service";
import type { ClienteVeiculo } from "@/types";

export function ClientesPageContent() {
  const [clientes, setClientes] = useState<ClienteVeiculo[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState("");

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      const lista = await listarClientesVeiculos();
      setClientes(lista);
    } catch {
      toast.error("Não foi possível carregar os clientes.");
      setClientes([]);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase();
    if (!q) return clientes;
    const digitos = q.replace(/\D/g, "");
    return clientes.filter(
      (c) =>
        c.nome_proprietario.toLowerCase().includes(q) ||
        c.placa.toLowerCase().includes(q) ||
        (digitos.length > 0 && c.whatsapp.includes(digitos))
    );
  }, [clientes, busca]);

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
          Todos os clientes da fila · nome, placa, número e datas
        </p>
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
        <input
          type="search"
          placeholder="Buscar nome, placa ou número..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="h-12 w-full rounded-xl border border-zinc-700 bg-zinc-900 pl-10 pr-4 text-sm text-white placeholder:text-zinc-600 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/20"
        />
      </div>

      <p className="text-center text-xs text-zinc-500 lg:text-left">
        {carregando
          ? "Carregando..."
          : `${filtrados.length} de ${clientes.length} cliente(s)`}
      </p>

      {carregando ? (
        <div className="flex items-center justify-center gap-2 py-16 text-zinc-500">
          <Loader2 className="h-5 w-5 animate-spin" />
          Carregando clientes...
        </div>
      ) : filtrados.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-800 py-14 text-center text-sm text-zinc-600">
          {clientes.length === 0
            ? "Nenhum cliente cadastrado ainda."
            : "Nenhum resultado para a busca."}
        </div>
      ) : (
        <div className="space-y-2">
          {filtrados.map((cliente, index) => {
            const whatsDigits = normalizarWhatsapp(cliente.whatsapp);
            const whatsLink = whatsDigits.startsWith("55")
              ? whatsDigits
              : `55${whatsDigits}`;

            return (
              <motion.div
                key={cliente.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(index * 0.02, 0.3) }}
                className="rounded-2xl border border-white/[0.06] bg-zinc-900/70 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-base font-bold text-white">
                      {cliente.nome_proprietario}
                    </p>
                    <p className="mt-0.5 text-sm font-semibold tracking-wider text-amber-300">
                      {cliente.placa}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-white/[0.06] px-2.5 py-1 text-[11px] font-semibold text-zinc-400">
                    {cliente.visitas} visita
                    {cliente.visitas === 1 ? "" : "s"}
                  </span>
                </div>

                <div className="mt-3 space-y-1.5 text-sm">
                  <a
                    href={`https://wa.me/${whatsLink}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 font-medium text-emerald-400 hover:text-emerald-300"
                  >
                    <Phone className="h-3.5 w-3.5" />
                    {formatarWhatsappInput(cliente.whatsapp)}
                  </a>
                  <p className="text-xs text-zinc-500">
                    Cadastro: {formatDate(cliente.created_at)}
                    {cliente.updated_at !== cliente.created_at && (
                      <> · Última visita: {formatDate(cliente.updated_at)}</>
                    )}
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
