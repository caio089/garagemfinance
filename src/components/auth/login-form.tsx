"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const result = login(email, senha);
    if (!result.ok) {
      toast.error(result.error);
      setLoading(false);
      return;
    }

    toast.success("Login realizado!");
    router.replace("/");
    setLoading(false);
  };

  return (
    <motion.form
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      onSubmit={handleSubmit}
      className="w-full max-w-md space-y-5"
    >
      <div className="space-y-2 text-center">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-400/80">
          Garagem Federal
        </p>
        <h1 className="text-display text-3xl font-bold text-white">
          Garagem <span className="text-amber-400">Finance</span>
        </h1>
        <p className="text-sm text-zinc-400">
          Entre com seu e-mail e senha para acessar o sistema.
        </p>
      </div>

      <div className="space-y-4 rounded-2xl border border-white/[0.06] bg-card/80 p-5 backdrop-blur-sm">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-zinc-300">
            E-mail
          </Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input
              id="email"
              type="email"
              autoComplete="username"
              inputMode="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 w-full rounded-xl border border-zinc-700 bg-zinc-900 pl-10 pr-4 text-base text-white placeholder:text-zinc-600 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/20"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="senha" className="text-zinc-300">
            Senha
          </Label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input
              id="senha"
              type={mostrarSenha ? "text" : "password"}
              autoComplete="current-password"
              placeholder="••••••••"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className="h-12 w-full rounded-xl border border-zinc-700 bg-zinc-900 pl-10 pr-12 text-base text-white placeholder:text-zinc-600 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/20"
            />
            <button
              type="button"
              onClick={() => setMostrarSenha((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
              aria-label={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
            >
              {mostrarSenha ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="h-12 w-full rounded-xl bg-amber-400 text-base font-bold text-black hover:bg-amber-300"
        >
          {loading ? "Entrando..." : "Entrar"}
        </Button>
      </div>
    </motion.form>
  );
}
