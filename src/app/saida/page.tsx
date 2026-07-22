"use client";

import { SaidaForm } from "@/components/saida/saida-form";
import { SupabaseWarning } from "@/components/shared/supabase-warning";
import { isSupabaseConfigured } from "@/lib/supabase";
import { ArrowDownLeft } from "lucide-react";

export default function SaidaPage() {
  if (!isSupabaseConfigured()) {
    return <SupabaseWarning />;
  }

  return (
    <div className="mx-auto w-full max-w-md space-y-5 md:max-w-2xl lg:max-w-3xl">
      <div className="flex flex-col items-center gap-2 pt-2 text-center lg:items-start lg:text-left">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-500/15 text-rose-400">
          <ArrowDownLeft className="h-6 w-6" strokeWidth={2.5} />
        </div>
        <h1 className="text-2xl font-bold text-white lg:text-3xl">Nova Saída</h1>
        <p className="text-sm text-zinc-500">Registre um gasto do dia</p>
      </div>
      <SaidaForm />
    </div>
  );
}
