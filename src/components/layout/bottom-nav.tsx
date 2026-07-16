"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Home, Minus, Plus, Settings } from "lucide-react";
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
    bar: "bg-emerald-400",
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
    bar: "bg-amber-400",
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
    bar: "bg-rose-400",
  },
  {
    href: "/cadastro",
    label: "Cadastro",
    icon: Settings,
    activeBg: "bg-sky-400",
    activeText: "text-sky-400",
    idleBg: "bg-sky-500/15",
    idleText: "text-sky-400",
    ring: "ring-sky-400/40",
    bar: "bg-sky-400",
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
      <div className="mx-auto flex max-w-lg items-end justify-around gap-1 px-2 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        {navItems.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className="relative flex flex-1 flex-col items-center gap-1 py-1"
            >
              {active && (
                <motion.div
                  layoutId="nav-indicator"
                  className={cn("absolute -top-2 h-1 w-8 rounded-full", item.bar)}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <div
                className={cn(
                  "flex h-12 w-12 items-center justify-center rounded-2xl transition-all",
                  active
                    ? cn(item.activeBg, "text-black shadow-lg ring-2", item.ring)
                    : cn(item.idleBg, item.idleText)
                )}
              >
                <Icon className="h-5 w-5" strokeWidth={active ? 2.75 : 2.5} />
              </div>
              <span
                className={cn(
                  "text-[10px] font-bold tracking-wide",
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
