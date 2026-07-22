"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { FileBarChart, Home, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  {
    href: "/",
    label: "Início",
    icon: Home,
  },
  {
    href: "/relatorios",
    label: "Relatórios",
    icon: FileBarChart,
  },
  {
    href: "/cadastro",
    label: "Cadastro",
    icon: Settings,
  },
];

export function BottomNav() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/" || pathname === "";
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/[0.06] bg-zinc-950/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-lg items-end justify-around gap-1 px-3 pt-2.5 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:max-w-5xl lg:max-w-6xl xl:max-w-7xl">
        {navItems.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className="relative flex flex-1 flex-col items-center gap-1.5 py-1"
            >
              {active && (
                <motion.div
                  layoutId="nav-indicator"
                  className="absolute -top-2.5 h-1 w-10 rounded-full bg-amber-400"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <div
                className={cn(
                  "flex h-11 w-11 items-center justify-center rounded-2xl transition-all",
                  active
                    ? "bg-amber-400 text-black shadow-lg shadow-amber-400/25"
                    : "bg-white/[0.04] text-zinc-400 hover:bg-white/[0.07] hover:text-zinc-200"
                )}
              >
                <Icon className="h-5 w-5" strokeWidth={active ? 2.5 : 2} />
              </div>
              <span
                className={cn(
                  "text-[10px] font-semibold tracking-wide",
                  active ? "text-amber-400" : "text-zinc-500"
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
