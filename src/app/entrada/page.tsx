"use client";

import { EntradaForm } from "@/components/entrada/entrada-form";
import { SupabaseWarning } from "@/components/shared/supabase-warning";
import { isSupabaseConfigured } from "@/lib/supabase";
import { ArrowUpRight } from "lucide-react";

export default function EntradaPage() {
  if (!isSupabaseConfigured()) {
    return <SupabaseWarning />;
  }

  return (
    <div className="mx-auto w-full max-w-md space-y-5 md:max-w-2xl lg:max-w-3xl">
      <div className="flex flex-col items-center gap-2 pt-2 text-center lg:items-start lg:text-left">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-400">
          <ArrowUpRight className="h-6 w-6" strokeWidth={2.5} />
        </div>
        <h1 className="text-2xl font-bold text-white lg:text-3xl">Nova Entrada</h1>
        <p className="text-sm text-zinc-500">Registre um serviço recebido</p>
      </div>
      <EntradaForm />
    </div>
  );
}
