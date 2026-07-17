"use client";

import { useEffect, useState } from "react";
import { formatLiveClock } from "@/lib/format";
import { Clock } from "lucide-react";

export function LiveClock() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());

    // Alinha o tick no próximo segundo exato
    const delay = 1000 - (Date.now() % 1000);
    let intervalId: ReturnType<typeof setInterval> | undefined;

    const timeoutId = setTimeout(() => {
      setNow(new Date());
      intervalId = setInterval(() => setNow(new Date()), 1000);
    }, delay);

    return () => {
      clearTimeout(timeoutId);
      if (intervalId) clearInterval(intervalId);
    };
  }, []);

  // Evita hydration mismatch: servidor e 1º paint do cliente ficam iguais
  if (!now) {
    return (
      <div className="flex min-w-0 items-center gap-2 text-zinc-400">
        <Clock className="h-3.5 w-3.5 shrink-0 text-amber-400/80" />
        <div className="min-w-0">
          <p className="truncate text-xs capitalize text-zinc-600 sm:text-sm">
            —
          </p>
          <p className="font-mono text-sm font-semibold tabular-nums tracking-wide text-amber-400/40">
            --:--:--
          </p>
        </div>
      </div>
    );
  }

  const { data, hora, weekday } = formatLiveClock(now);

  return (
    <div className="flex min-w-0 items-center gap-2 text-zinc-400">
      <Clock className="h-3.5 w-3.5 shrink-0 text-amber-400/80" />
      <div className="min-w-0">
        <p className="truncate text-xs capitalize sm:text-sm">
          <span className="text-zinc-300">{weekday}</span>
          <span className="mx-1.5 text-zinc-600">·</span>
          <span>{data}</span>
        </p>
        <p className="font-mono text-sm font-semibold tabular-nums tracking-wide text-amber-400">
          {hora}
        </p>
      </div>
    </div>
  );
}
