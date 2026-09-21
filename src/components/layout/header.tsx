"use client";

import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { LiveClock } from "@/components/layout/live-clock";

export function Header() {
  return (
    <motion.header
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-2"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-400/70">
            Garagem Federal
          </p>
          <h1 className="text-display text-2xl font-bold text-white sm:text-3xl lg:text-4xl">
            Garagem <span className="text-amber-400">Finance</span>
          </h1>
          <LiveClock />
        </div>
        <Badge
          variant="outline"
          className="border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-emerald-400"
        >
          <span className="mr-1.5 inline-block h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
          Por data
        </Badge>
      </div>
    </motion.header>
  );
}
