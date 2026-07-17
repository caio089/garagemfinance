import { calcularCaixaFinal } from "@/lib/financeiro";
import { formatCurrency } from "@/lib/format";
import type { ResumoDia } from "@/types";
import { Separator } from "@/components/ui/separator";

interface RelatorioResumoProps {
  resumo: Pick<
    ResumoDia,
    | "caixaInicial"
    | "totalEntradas"
    | "totalSaidas"
    | "lucro"
    | "lavagens"
    | "polimentos"
    | "outros"
  > &
    Partial<Pick<ResumoDia, "caixaFinal">>;
  showCaixaInicial?: boolean;
  lucroLabel?: string;
}

export function RelatorioResumo({
  resumo,
  showCaixaInicial = true,
  lucroLabel = "Lucro do dia",
}: RelatorioResumoProps) {
  const caixaFinal =
    resumo.caixaFinal ??
    calcularCaixaFinal(
      resumo.caixaInicial,
      resumo.totalEntradas,
      resumo.totalSaidas
    );

  return (
    <div className="space-y-4">
      <div className="space-y-3 rounded-xl bg-zinc-800/50 p-4">
        {showCaixaInicial && (
          <div className="flex justify-between text-sm">
            <span className="text-zinc-400">Caixa inicial</span>
            <span className="font-medium">
              {formatCurrency(resumo.caixaInicial)}
            </span>
          </div>
        )}
        <div className="flex justify-between text-sm">
          <span className="text-zinc-400">Entradas</span>
          <span className="font-medium text-emerald-400">
            + {formatCurrency(resumo.totalEntradas)}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-zinc-400">Saídas</span>
          <span className="font-medium text-red-400">
            - {formatCurrency(resumo.totalSaidas)}
          </span>
        </div>
        <Separator className="bg-zinc-700" />
        <div className="flex justify-between">
          <span className="font-semibold text-zinc-300">{lucroLabel}</span>
          <span className="text-lg font-bold text-amber-400">
            {formatCurrency(resumo.lucro)}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-zinc-400">Caixa final</span>
          <span className="font-medium text-white">
            {formatCurrency(caixaFinal)}
          </span>
        </div>
      </div>

      <div className="rounded-xl bg-zinc-800/50 p-4">
        <p className="mb-3 text-sm font-semibold text-zinc-300">
          Serviços realizados
        </p>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="text-2xl font-bold text-white">{resumo.lavagens}</p>
            <p className="text-xs text-zinc-500">Lavagens</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-white">{resumo.polimentos}</p>
            <p className="text-xs text-zinc-500">Polimentos</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-white">{resumo.outros}</p>
            <p className="text-xs text-zinc-500">Restaurante</p>
          </div>
        </div>
      </div>
    </div>
  );
}
