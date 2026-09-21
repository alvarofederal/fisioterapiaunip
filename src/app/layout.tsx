// src/app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SessionAuthProvider } from "@/components/session-auth";
import { QueryClientContext } from "@/providers/queryclient";
import { Toaster } from "sonner";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const URL_BASE = process.env.NEXT_PUBLIC_URL ?? "https://fisioterapiaunip.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(URL_BASE),
  title: {
    default: "Fisioterapia UNIP",
    template: "%s | Fisioterapia UNIP",
  },
  description:
    "Portal da turma de Fisioterapia da UNIP: matérias, trabalhos, eventos e materiais de aula em um lugar só.",
  keywords: ["fisioterapia", "UNIP", "portal da turma", "trabalhos", "matérias"],
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: URL_BASE,
    siteName: "Fisioterapia UNIP",
    title: "Fisioterapia UNIP — Portal da Turma",
    description:
      "Matérias, trabalhos, eventos e materiais de aula em um lugar só.",
  },
  robots: {
    // Portal fechado: não faz sentido indexar.
    index: false,
    follow: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={`${inter.variable} antialiased`} suppressHydrationWarning>
        <SessionAuthProvider>
          <QueryClientContext>
            {children}
            <Toaster position="top-right" richColors duration={2500} />
          </QueryClientContext>
        </SessionAuthProvider>
      </body>
    </html>
  );
}
