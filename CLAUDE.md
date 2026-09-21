# Fisioterapia UNIP — Guia para Claude Code

> Carregado automaticamente em toda sessão. Leia antes de alterar qualquer coisa.

---

## O que é este projeto

Portal da turma de Fisioterapia da UNIP. Os alunos entram com e-mail e senha e veem
um mural com os trabalhos, eventos e avisos publicados pelo administrador, com as
matérias do semestre e os materiais dos professores para baixar.

**Stack:** Next.js 16.0.10 (App Router) + TypeScript + MySQL (Prisma 5.17) + NextAuth v5 (JWT)
+ Tailwind v4 + Cloudinary + Vercel
**Produção:** [fisioterapiaunip.vercel.app](https://fisioterapiaunip.vercel.app)

> Este projeto nasceu de uma cópia do **Courtesyfy** (SaaS de cupons). Todo aquele
> domínio foi removido. Se encontrar qualquer resquício — `loja`, `campanha`, `chave`,
> `resgate`, Stripe — é lixo, pode apagar.

---

## Documentação

A documentação geral **não fica neste repositório**. Ela vive na pasta base, um nível acima:

```
fisioterapiaunip/                     <- pasta base: documentacao geral
├── DESIGN.md                         <- paleta e tokens (base: dub.co)
├── spec/07-portal-spec.md            <- ESPECIFICACAO DESTE PORTAL
├── spec/00-constitution.md           <- principios: SOLID, Arquitetura Limpa, Clean Code
└── workspace/fisioterapiaunip/       <- VOCE ESTA AQUI (o projeto)
```

Leia `spec/07-portal-spec.md` antes de implementar qualquer funcionalidade.

---

## Regras críticas — nunca ignore

1. **Nunca coloque `prisma db push --accept-data-loss` no script de build.** Ele já esteve
   lá e teria destruído dados em produção a cada deploy. Migração é passo deliberado.
2. **`ativo: false` é o portão de segurança.** Toda conta nova nasce inativa; só o ADMIN
   libera. Nunca crie usuário já ativo fora do seed.
2b. **O RA identifica o aluno.** É único e obrigatório — é por ele que o ADMIN confere quem é
   da turma. Nome e e-mail qualquer um inventa.
2c. **Só o ADMIN escreve.** Criar, editar, arquivar, clonar e excluir trabalho e matéria são
   exclusivos do ADMIN. Aluno só lê e baixa.
3. **A sessão é JWT**, sem tabela de sessão. Não reintroduza adapter de banco sem discutir:
   a MySQL é compartilhada e conexão é recurso escasso.
4. **Toda rota sob `/painel` valida no servidor.** O middleware só confere o cookie —
   ele roda no edge e não consulta o banco. Papel de ADMIN se verifica na página.
5. **Não revele se um e-mail existe.** O login recusa senha errada e conta inativa com a
   mesma mensagem, de propósito.
6. **Sempre validar entrada com Zod** em Server Actions e API Routes.
7. **Anexo guarda `publicId`** do Cloudinary — sem ele não há como apagar o arquivo remoto.
8. **Limite de anexo: 4 MB.** Função serverless da Vercel não aceita corpo maior que ~4,5 MB.
9. **Vocabulário cresce por dado**, em `src/lib/dominio.ts` — nunca por `if/else` nas telas.
9b. **Data de encontro grava meio-dia UTC** (`T12:00:00.000Z`) e é lida com `timeZone: "UTC"`.
   Meia-noite UTC vira o dia anterior no Brasil — 17/10 apareceria como 16/10.
9c. **Cronograma é da turma, estudo é de cada um.** Conteúdo do encontro só o ADMIN edita;
   status e anotações de estudo são por usuário (`Estudo`, único por aula+usuário).
10. **Visual segue o `DESIGN.md`** (referência Discord): tema escuro `#0e0f2d`, display SEMPRE
    em caixa alta peso 800, blurple `#5865F2` só em ação primária, raios 12/16/24/9999px,
    um acento cromático por componente, zero box-shadow.

---

## Importações

```typescript
import prisma from "@/lib/prisma"      // sempre assim
import { auth } from "@/lib/auth"      // sessão
import { cn } from "@/lib/utils"       // classnames
import { CORES_MATERIA } from "@/lib/dominio"  // vocabulários
```

---

## Mapa de rotas

| Rota | Acesso | Descrição |
|------|--------|-----------|
| `/` | Público | Apresentação + entrada |
| `/login` | Público | Entrar |
| `/register` | Público | Criar conta (nasce inativa) |
| `/painel` | Logado | Mural da turma |
| `/painel/materias` | Logado | Matérias do semestre |
| `/painel/cronograma` | Logado | Encontros do semestre + acompanhamento pessoal de estudo |
| `/painel/trabalhos` | Logado | Trabalhos e eventos |
| `/painel/usuarios` | **ADMIN** | Liberar e gerenciar contas |
| `/api/register` | Público | Cadastro (rate limit por IP) |
| `/api/upload` | Logado | Upload para o Cloudinary |
| `/api/auth/[...nextauth]` | — | Handlers do NextAuth |

---

## Banco

MySQL em hospedagem compartilhada (Hostinger). Duas implicações:

- A `DATABASE_URL` **precisa** de `?connection_limit=1&pool_timeout=20`, senão o número de
  conexões das funções serverless estoura o limite do plano.
- O acesso remoto tem que estar liberado no hPanel. Como a Vercel tem IP dinâmico, é `%`.

Alterar schema:

```bash
npm run db:push     # desenvolvimento
npm run db:studio   # inspecionar dados
ADMIN_EMAIL="..." ADMIN_SENHA="..." npm run db:seed        # criar/recuperar admin
npm run db:cronograma  # cronograma fixo do semestre (idempotente)
```

---

## Estado atual

**Pronto:** CRUD de matérias, cronograma com acompanhamento de estudo, limpeza do Courtesyfy, schema (com RA e arquivamento), login JWT testado
ponta a ponta, identidade visual Discord aplicada no sistema todo, menu lateral responsivo,
mural, listagens de matérias, trabalhos (com aba Arquivados) e usuários.

**Próximo:** cadastro de trabalhos com upload de anexos, ações de arquivar/clonar trabalho
e de liberar/desativar usuário. Ver `spec/07-portal-spec.md` §11.

---

## Definição de pronto

- [ ] `npm run build` passa
- [ ] Funciona em 360px e no desktop
- [ ] Rota protegida valida papel no servidor, não só no menu
- [ ] Entrada validada com Zod
- [ ] Sem resquício de Courtesyfy

---

*Atualizado em: 2026-09-21*
