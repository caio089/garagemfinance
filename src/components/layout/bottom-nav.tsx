"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Home, Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  {
    href: "/entrada",
    label: "Entrada",
    icon: Plus,
    activeBg: "bg-emerald-500",
    activeText: "text-emerald-400",
    idleBg: "bg-emerald-500/15",
    idleText: "text-emerald-400",
    ring: "ring-emerald-500/40",
  },
  {
    href: "/",
    label: "Início",
    icon: Home,
    activeBg: "bg-amber-400",
    activeText: "text-amber-400",
    idleBg: "bg-zinc-800",
    idleText: "text-zinc-300",
    ring: "ring-amber-400/40",
  },
  {
    href: "/saida",
    label: "Saída",
    icon: Minus,
    activeBg: "bg-rose-500",
    activeText: "text-rose-400",
    idleBg: "bg-rose-500/15",
    idleText: "text-rose-400",
    ring: "ring-rose-500/40",
  },
];

export function BottomNav() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/" || pathname === "";
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-zinc-800/80 bg-zinc-950/95 backdrop-blur-lg">
      <div className="mx-auto flex max-w-lg items-end justify-around gap-2 px-3 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        {navItems.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;
          const isHome = item.href === "/";

          return (
            <Link
              key={item.href}
              href={item.href}
              className="relative flex flex-1 flex-col items-center gap-1.5 py-1"
            >
              {active && (
                <motion.div
                  layoutId="nav-indicator"
                  className={cn(
                    "absolute -top-2 h-1 w-10 rounded-full",
                    isHome ? "bg-amber-400" : item.href === "/entrada" ? "bg-emerald-400" : "bg-rose-400"
                  )}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <div
                className={cn(
                  "flex items-center justify-center rounded-2xl transition-all",
                  isHome ? "h-12 w-12" : "h-14 w-14",
                  active
                    ? cn(item.activeBg, "text-black shadow-lg ring-2", item.ring)
                    : cn(item.idleBg, item.idleText)
                )}
              >
                <Icon
                  className={cn(isHome ? "h-5 w-5" : "h-6 w-6")}
                  strokeWidth={active ? 2.75 : 2.5}
                />
              </div>
              <span
                className={cn(
                  "text-[11px] font-bold tracking-wide",
                  active ? item.activeText : item.idleText
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
