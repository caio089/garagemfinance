import type { Metadata, Viewport } from "next";
import { Outfit, JetBrains_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { BottomNav } from "@/components/layout/bottom-nav";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-sans",
  subsets: ["latin"],
});

const outfitHeading = Outfit({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
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
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#1a1612",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${outfit.variable} ${outfitHeading.variable} ${jetbrainsMono.variable} dark h-full`}
    >
      <body className="ambient-bg min-h-full font-sans text-foreground antialiased">
        <main className="mx-auto min-h-full w-full max-w-lg px-4 pb-[calc(6.5rem+env(safe-area-inset-bottom))] pt-[max(1.25rem,env(safe-area-inset-top))] md:max-w-5xl md:px-8 lg:max-w-6xl lg:px-10 xl:max-w-7xl">
          {children}
        </main>
        <BottomNav />
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: "oklch(0.145 0.012 75)",
              border: "1px solid oklch(0.28 0.02 75)",
              color: "#fff",
            },
          }}
        />
      </body>
    </html>
  );
}
