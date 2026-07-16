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
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileTap={{ scale: 0.97 }}
    >
      {diaAberto ? (
        <Button
          onClick={onFinalizar}
          className="h-16 w-full rounded-2xl bg-red-500 text-lg font-bold text-white shadow-lg shadow-red-500/20 hover:bg-red-400"
        >
          <Square className="mr-2 h-5 w-5 fill-current" />
          FINALIZAR DIA
        </Button>
      ) : (
        <Button
          onClick={onIniciar}
          className="h-16 w-full rounded-2xl bg-amber-400 text-lg font-bold text-black shadow-lg shadow-amber-400/20 hover:bg-amber-300"
        >
          <Play className="mr-2 h-5 w-5 fill-current" />
          INICIAR DIA
        </Button>
      )}
    </motion.div>
  );
}
