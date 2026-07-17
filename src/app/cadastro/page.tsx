"use client";

import { CadastroForm } from "@/components/cadastro/cadastro-form";
import { SupabaseWarning } from "@/components/shared/supabase-warning";
import { isSupabaseConfigured } from "@/lib/supabase";
import { Settings } from "lucide-react";

export default function CadastroPage() {
  if (!isSupabaseConfigured()) {
    return <SupabaseWarning />;
  }

  return (
    <div className="mx-auto w-full max-w-md space-y-5">
      <div className="flex flex-col items-center gap-2 pt-2 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-400/15 text-amber-400">
          <Settings className="h-6 w-6" strokeWidth={2.5} />
        </div>
        <h1 className="text-2xl font-bold text-white">Cadastro</h1>
        <p className="text-sm text-zinc-500">
          Preços e tipos de serviço da lavagem e cardápio
        </p>
      </div>
      <CadastroForm />
    </div>
  );
}
