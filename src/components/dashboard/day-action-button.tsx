"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Play, Square } from "lucide-react";

interface DayActionButtonProps {
  diaAberto: boolean;
  onIniciar: () => void;
  onFinalizar: () => void;
}

export function DayActionButton({
  diaAberto,
  onIniciar,
  onFinalizar,
}: DayActionButtonProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      whileTap={{ scale: 0.98 }}
    >
      {diaAberto ? (
        <Button
          onClick={onFinalizar}
          className="h-14 w-full rounded-2xl bg-rose-500/90 text-base font-bold tracking-wide text-white shadow-lg shadow-rose-500/20 hover:bg-rose-400 sm:h-16 sm:text-lg"
        >
          <Square className="mr-2 h-4 w-4 fill-current sm:h-5 sm:w-5" />
          Finalizar dia
        </Button>
      ) : (
        <Button
          onClick={onIniciar}
          className="h-14 w-full rounded-2xl bg-amber-400 text-base font-bold tracking-wide text-black shadow-lg shadow-amber-400/25 hover:bg-amber-300 sm:h-16 sm:text-lg"
        >
          <Play className="mr-2 h-4 w-4 fill-current sm:h-5 sm:w-5" />
          Iniciar dia
        </Button>
      )}
    </motion.div>
  );
}
