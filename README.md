# Fisioterapia UNIP — Portal da Turma

Matérias, trabalhos, eventos e materiais de aula em um lugar só, para a turma inteira.

**Produção:** [fisioterapiaunip.vercel.app](https://fisioterapiaunip.vercel.app)

---

## Como funciona

- O aluno cria a conta, que nasce **inativa**
- O **administrador** libera o acesso na tela de Usuários
- Depois disso ele vê o mural com trabalhos, eventos e avisos, e baixa os materiais

---

## Stack

Next.js 16 (App Router) · TypeScript · Prisma 5 / MySQL · NextAuth v5 com sessão JWT ·
Tailwind v4 · Cloudinary · Vercel

---

## Rodar localmente

```bash
npm install
npm run db:push
ADMIN_EMAIL="voce@exemplo.com" ADMIN_SENHA="SuaSenha123" npm run db:seed
npm run dev
```

Abra `http://localhost:3000` e entre com o e-mail e a senha do seed.

---

## Variáveis de ambiente

| Variável | Para quê |
|----------|----------|
| `DATABASE_URL` | MySQL. Em serverless, acrescente `?connection_limit=1&pool_timeout=20` |
| `AUTH_SECRET` | Assinatura do JWT. Gere com `npx auth secret` |
| `AUTH_URL` | URL pública do site |
| `NEXT_PUBLIC_URL` | Mesma URL, exposta ao navegador |
| `CLOUDINARY_NAME` / `CLOUDINARY_KEY` / `CLOUDINARY_SECRET` | Upload de anexos |

---

## Scripts

| Comando | O que faz |
|---------|-----------|
| `npm run dev` | Desenvolvimento |
| `npm run build` | Build de produção |
| `npm run db:push` | Aplica o schema no banco |
| `npm run db:studio` | Inspeciona os dados |
| `npm run db:seed` | Cria ou recupera a conta de administrador |

> O build **não** aplica migração. Isso é deliberado: `prisma db push --accept-data-loss`
> rodando a cada deploy já foi a causa de risco real de perda de dados neste projeto.

---

## Documentação

A documentação geral fica na pasta base, um nível acima deste repositório:
`DESIGN.md` (paleta) e `spec/07-portal-spec.md` (especificação do portal).
