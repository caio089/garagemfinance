"use client";

import { SaidaForm } from "@/components/saida/saida-form";
import { SupabaseWarning } from "@/components/shared/supabase-warning";
import { isSupabaseConfigured } from "@/lib/supabase";

export default function SaidaPage() {
  if (!isSupabaseConfigured()) {
    return <SupabaseWarning />;
  }

  return (
    <div className="space-y-6 pl-12">
      <div>
        <h1 className="text-2xl font-bold text-white">Adicionar Saída</h1>
        <p className="text-sm text-zinc-500">Registre um novo gasto</p>
      </div>
      <SaidaForm />
    </div>
  );
}
