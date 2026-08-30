import type { NextConfig } from "next";
import path from "path";

// Em git worktree, node_modules fica na raiz do projeto (3 níveis acima de .claude/worktrees/<name>)
const projectRoot = __dirname.includes(".claude") && __dirname.includes("worktrees")
  ? path.resolve(__dirname, "../../..")
  : __dirname

const nextConfig: NextConfig = {
  outputFileTracingRoot: projectRoot,
  output: 'standalone',

  // jsPDF precisa rodar no servidor sem bundling do Next.js
  serverExternalPackages: ['jspdf', 'html2canvas'],

  // ✅ Headers de segurança HTTP (OWASP A05)
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // Impede clickjacking — bloqueia iframe por domínios externos
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          // Impede MIME-type sniffing
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Limita informação de referência enviada a terceiros
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Restringe acesso a APIs sensíveis do navegador
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          // Content Security Policy — permite Stripe, Cloudinary, Google (OAuth) e Vercel Analytics
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              // Scripts: próprios + Stripe + Google (OAuth popup)
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://accounts.google.com",
              // Estilos: próprios + inline (Tailwind/shadcn gerado)
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              // Fontes
              "font-src 'self' https://fonts.gstatic.com",
              // Imagens: próprios + Cloudinary + Google avatars + GitHub avatars + data URIs (QR Code)
              "img-src 'self' data: blob: https://res.cloudinary.com https://lh3.googleusercontent.com https://avatars.githubusercontent.com",
              // Frames: Stripe (checkout embutido)
              "frame-src https://js.stripe.com https://hooks.stripe.com",
              // Conexões de API: próprios + Stripe + Cloudinary + Resend
              "connect-src 'self' https://api.stripe.com https://api.cloudinary.com https://api.resend.com",
              // Bloqueia tudo que não se enquadrar acima
              "base-uri 'self'",
              "form-action 'self'",
              "upgrade-insecure-requests",
            ].join("; "),
          },
        ],
      },
    ]
  },

  turbopack: {
    root: projectRoot,
  },

  images: {
    unoptimized: false,
    qualities: [25, 50, 75, 100],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'avatars.githubusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
    ],
  },

  webpack: (config, { dev }) => {
    if (dev) {
      config.devtool = 'cheap-module-source-map';
    }
    return config;
  },
};

export default nextConfig;
