// src/app/layout.tsx
import type { Metadata } from "next";
import { Inter, Poppins } from "next/font/google";
import "./globals.css";
import { SessionAuthProvider } from "@/components/session-auth";
import { QueryClientContext } from "@/providers/queryclient";
import { Toaster } from "sonner";

// Corpo e UI. Substituto de ABC Ginto conforme DESIGN.md.
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

// Display. Substituto de ABC Ginto Nord: peso 800, sempre em caixa alta.
const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["700", "800"],
});

const URL_BASE = process.env.NEXT_PUBLIC_URL ?? "https://fisioterapiaunip.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(URL_BASE),
  title: {
    default: "Fisioterapia UNIP",
    template: "%s | Fisioterapia UNIP",
  },
  description:
    "O portal da turma, sem ninguém se perder. Matérias, trabalhos, datas de entrega e o material dos professores — tudo num lugar só.",
  keywords: ["fisioterapia", "UNIP", "portal da turma", "trabalhos", "matérias"],
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: URL_BASE,
    siteName: "Fisioterapia UNIP",
    title: "Fisioterapia UNIP — Portal da Turma",
    description:
      "Matérias, trabalhos, datas de entrega e o material dos professores — tudo num lugar só.",
  },
  robots: { index: false, follow: false },
};

export const viewport = {
  themeColor: "#0e0f2d",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${poppins.variable} antialiased`}
        suppressHydrationWarning
      >
        <SessionAuthProvider>
          <QueryClientContext>
            {children}
            <Toaster position="top-right" theme="dark" richColors duration={2800} />
          </QueryClientContext>
        </SessionAuthProvider>
      </body>
    </html>
  );
}
