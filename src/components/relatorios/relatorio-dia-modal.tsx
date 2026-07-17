"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { RelatorioResumo } from "@/components/relatorios/relatorio-resumo";
import { ListaMovimentosDia } from "@/components/relatorios/lista-movimentos-dia";
import { formatDate } from "@/lib/format";
import { calcularResumoDia } from "@/services/dias.service";
import { buscarEntradasDoDia } from "@/services/entradas.service";
import { buscarSaidasDoDia } from "@/services/saidas.service";
import type { Entrada, ResumoDia, Saida } from "@/types";
import { FileText } from "lucide-react";

interface RelatorioDiaModalProps {
  diaId: string | null;
  onClose: () => void;
}

export function RelatorioDiaModal({ diaId, onClose }: RelatorioDiaModalProps) {
  const [resumo, setResumo] = useState<ResumoDia | null>(null);
  const [entradas, setEntradas] = useState<Entrada[]>([]);
  const [saidas, setSaidas] = useState<Saida[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!diaId) {
      setResumo(null);
      setEntradas([]);
      setSaidas([]);
      return;
    }

    setLoading(true);
    Promise.all([
      calcularResumoDia(diaId),
      buscarEntradasDoDia(diaId),
      buscarSaidasDoDia(diaId),
    ])
      .then(([r, e, s]) => {
        setResumo(r);
        setEntradas(e);
        setSaidas(s);
      })
      .catch(() => {
        setResumo(null);
        setEntradas([]);
        setSaidas([]);
      })
      .finally(() => setLoading(false));
  }, [diaId]);

  return (
    <Dialog open={!!diaId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto border-zinc-800 bg-zinc-900 text-white sm:max-w-md">
        <DialogHeader>
          <div className="flex flex-col items-center gap-2 text-center">
            <FileText className="h-10 w-10 text-amber-400" />
            <DialogTitle className="text-xl font-bold text-white">
              Relatório do Dia
            </DialogTitle>
            {resumo && (
              <p className="text-sm text-zinc-400">{formatDate(resumo.data)}</p>
            )}
          </div>
        </DialogHeader>

        {loading ? (
          <div className="space-y-3 py-4">
            <Skeleton className="h-32 rounded-xl bg-zinc-800" />
            <Skeleton className="h-24 rounded-xl bg-zinc-800" />
          </div>
        ) : resumo ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-5"
          >
            <RelatorioResumo resumo={resumo} />
            <ListaMovimentosDia
              entradas={entradas}
              saidas={saidas}
              permitirExcluir={false}
            />
          </motion.div>
        ) : (
          <p className="py-8 text-center text-sm text-zinc-500">
            Não foi possível carregar o relatório.
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
