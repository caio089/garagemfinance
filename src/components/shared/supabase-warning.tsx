import { AlertTriangle } from "lucide-react";

export function SupabaseWarning() {
  return (
    <div className="flex flex-col items-center gap-4 py-16 text-center">
      <AlertTriangle className="h-12 w-12 text-amber-400" />
      <div>
        <p className="text-lg font-semibold text-white">
          Supabase não configurado
        </p>
        <p className="mt-2 max-w-sm text-sm text-zinc-500">
          Configure as variáveis{" "}
          <code className="text-amber-400">NEXT_PUBLIC_SUPABASE_URL</code> e{" "}
          <code className="text-amber-400">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>{" "}
          no arquivo <code className="text-amber-400">.env.local</code>
        </p>
      </div>
    </div>
  );
}
