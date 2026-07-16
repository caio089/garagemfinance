import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { BottomNav } from "@/components/layout/bottom-nav";
import { AppShell } from "@/components/layout/app-shell";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Garagem Finance",
  description:
    "Sistema financeiro para controle de caixa do lava-jato Garagem Federal",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#09090b",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={`${inter.variable} dark h-full`}>
      <body className="min-h-full bg-zinc-950 font-sans text-white antialiased">
        <AppShell>
          <main className="mx-auto min-h-full max-w-lg px-4 pb-28 pt-6">
            {children}
          </main>
        </AppShell>
        <BottomNav />
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: "#18181b",
              border: "1px solid #3f3f46",
              color: "#fff",
            },
          }}
        />
      </body>
    </html>
  );
}
