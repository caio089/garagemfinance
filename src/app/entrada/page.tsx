"use client";

import { EntradaForm } from "@/components/entrada/entrada-form";
import { SupabaseWarning } from "@/components/shared/supabase-warning";
import { isSupabaseConfigured } from "@/lib/supabase";

export default function EntradaPage() {
  if (!isSupabaseConfigured()) {
    return <SupabaseWarning />;
  }

  return (
    <div className="space-y-6 pl-12">
      <div>
        <h1 className="text-2xl font-bold text-white">Adicionar Entrada</h1>
        <p className="text-sm text-zinc-500">Registre um novo serviço</p>
      </div>
      <EntradaForm />
    </div>
  );
}
