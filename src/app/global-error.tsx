"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="pt-BR">
      <body className="flex min-h-screen flex-col items-center justify-center gap-4 bg-zinc-950 px-4 text-white">
        <h2 className="text-xl font-bold">Algo deu errado</h2>
        <p className="text-center text-sm text-zinc-400">
          Recarregue a página ou tente novamente.
        </p>
        <button
          type="button"
          onClick={() => reset()}
          className="rounded-xl bg-amber-400 px-5 py-3 font-bold text-black"
        >
          Tentar de novo
        </button>
      </body>
    </html>
  );
}
