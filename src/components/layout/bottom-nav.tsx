"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Home, Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/entrada", label: "Entrada", icon: Plus },
  { href: "/", label: "Início", icon: Home },
  { href: "/saida", label: "Saída", icon: Minus },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-zinc-800 bg-zinc-950/95 backdrop-blur-lg">
      <div className="mx-auto flex max-w-lg items-center justify-around px-4 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className="relative flex flex-1 flex-col items-center gap-1 py-2"
            >
              {isActive && (
                <motion.div
                  layoutId="nav-indicator"
                  className="absolute -top-2 h-1 w-8 rounded-full bg-amber-400"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-xl transition-colors",
                  isActive
                    ? "bg-amber-400 text-black"
                    : "text-zinc-500 hover:text-zinc-300"
                )}
              >
                <Icon className="h-5 w-5" strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span
                className={cn(
                  "text-xs font-medium",
                  isActive ? "text-amber-400" : "text-zinc-500"
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
