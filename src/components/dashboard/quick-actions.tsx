"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Minus, Plus } from "lucide-react";

interface QuickActionsProps {
  disabled?: boolean;
}

export function QuickActions({ disabled = false }: QuickActionsProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <motion.div whileTap={{ scale: disabled ? 1 : 0.97 }}>
        <Link
          href={disabled ? "#" : "/entrada"}
          aria-disabled={disabled}
          onClick={(e) => {
            if (disabled) e.preventDefault();
          }}
          className={`flex h-14 items-center justify-center gap-2 rounded-2xl text-base font-bold transition-all ${
            disabled
              ? "cursor-not-allowed bg-zinc-800/80 text-zinc-600"
              : "bg-emerald-500 text-black shadow-lg shadow-emerald-500/25 hover:bg-emerald-400 hover:shadow-emerald-400/30"
          }`}
        >
          <Plus className="h-5 w-5" strokeWidth={2.75} />
          Entrada
        </Link>
      </motion.div>

      <motion.div whileTap={{ scale: disabled ? 1 : 0.97 }}>
        <Link
          href={disabled ? "#" : "/saida"}
          aria-disabled={disabled}
          onClick={(e) => {
            if (disabled) e.preventDefault();
          }}
          className={`flex h-14 items-center justify-center gap-2 rounded-2xl text-base font-bold transition-all ${
            disabled
              ? "cursor-not-allowed bg-zinc-800/80 text-zinc-600"
              : "bg-rose-500 text-white shadow-lg shadow-rose-500/25 hover:bg-rose-400 hover:shadow-rose-400/30"
          }`}
        >
          <Minus className="h-5 w-5" strokeWidth={2.75} />
          Saída
        </Link>
      </motion.div>
    </div>
  );
}
