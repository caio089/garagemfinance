"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Login removido — redireciona para o painel. */
export default function LoginPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/");
  }, [router]);

  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <p className="text-sm text-zinc-500">Redirecionando...</p>
    </div>
  );
}
