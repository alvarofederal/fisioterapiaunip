# Courtesyfy — Regras e Convenções de Desenvolvimento

## Regras Fundamentais

### NUNCA fazer sem confirmar com o usuário:
- Alterar schema do banco de dados (Prisma)
- Mudar o sistema de autenticação (NextAuth)
- Alterar lógica de cobrança/Stripe
- Renomear modelos Prisma existentes
- Remover campos de modelos existentes (pode quebrar dados em produção)
- Alterar o status de uma chave RESGATADA (é imutável)

### SEMPRE fazer:
- Usar TypeScript strict (sem `any` desnecessário)
- Validar inputs do usuário com Zod
- Usar Server Actions para mutações internas
- Usar `src/lib/prisma.ts` (singleton) — nunca instanciar Prisma diretamente
- Verificar permissões por plano da loja antes de criar recursos
- Usar `date-fns` para manipulação de datas
- Registrar `LogEvento` em toda ação relevante sobre chaves
- Verificar unicidade do código antes de persistir qualquer chave

---

## Regras de Negócio Invioláveis

1. **Toda chave é única no banco** — verificar antes de salvar
2. **Toda chave pertence a uma única campanha** — sem reatribuição
3. **Uma chave só pode ser vinculada a um único cliente** — no momento da ativação
4. **Uma chave RESGATADA nunca muda de estado**
5. **O QR code deve apontar para `/c/[codigo]`** — não para o painel
6. **Todo evento relevante deve gerar um LogEvento**
7. **Chaves expiram automaticamente** pela data `expiraEm` da campanha

---

## Convenções de Código

### Nomenclatura
- Componentes React: PascalCase (`CampanhaCard.tsx`)
- Funções/variáveis: camelCase (`gerarLoteChaves`)
- Constantes: UPPER_SNAKE_CASE (`MAX_CHAVES_ESSENCIAL`)
- Tipos/Interfaces: PascalCase (`ChaveStatus`)
- Arquivos de componentes: kebab-case (`campanha-card.tsx`)
- Server Actions: verbos descritivos (`criarCampanha`, `resgatarChave`)

### Estrutura de Feature
```
campanhas/
├── page.tsx              # Página (Server Component por padrão)
├── _components/          # Componentes desta feature
│   ├── campanha-form.tsx # Formulário client-side
│   └── campanha-table.tsx
├── _actions/             # Server Actions
│   └── index.ts
└── _data_access/         # Queries Prisma
    └── index.ts
```

### Server vs Client Components
- Páginas são Server Components por padrão
- Componentes com estado, eventos, hooks → `"use client"`
- Formulários com React Hook Form → sempre `"use client"`
- Busca de dados → preferencialmente no Server Component
- Mutações → Server Actions

### Importações
- Alias `@/` para `src/` sempre (nunca `../../`)
- Importar Prisma: `import { db } from "@/lib/prisma"`
- Importar Auth: `import { auth } from "@/lib/auth"`

---

## Padrão de Server Action

```typescript
"use server"

import { z } from "zod"
import { db } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { revalidatePath } from "next/cache"

const schema = z.object({ /* ... */ })

export async function criarCampanha(data: unknown) {
  const session = await auth()
  if (!session?.user?.lojaId) return { error: "Não autorizado" }

  const parsed = schema.safeParse(data)
  if (!parsed.success) return { error: "Dados inválidos" }

  // verificar limites de plano da loja
  // executar lógica de negócio
  // registrar LogEvento

  revalidatePath("/campanhas")
  return { success: true }
}
```

---

## Padrão de Data Access Layer

```typescript
// _data_access/campanhas/index.ts
import { db } from "@/lib/prisma"

export async function getCampanhasByLoja(lojaId: string) {
  return db.campanha.findMany({
    where: { lojaId },
    select: { id: true, nome: true, status: true, expiraEm: true },
    orderBy: { criadoEm: "desc" },
  })
}
```

---

## UI e Componentes

### Shadcn/UI disponível em `src/components/ui/`:
accordion, alert-dialog, badge, button, card, checkbox, dialog, dropdown-menu,
form, input, label, pagination, radio-group, scroll-area, select, sheet, switch,
table, tabs, textarea, tooltip

### Adicionar novos:
```bash
npx shadcn@latest add [component-name]
```

### Toast
```typescript
import { toast } from "sonner"
toast.success("Campanha criada!")
toast.error("Erro ao gerar chaves")
```

---

## Git Workflow

- `main` → produção
- `develop` → desenvolvimento ativo
- `feature/nome-da-feature` → novas funcionalidades
- `hotfix/descricao` → correções urgentes

**Commits em português** com descrição clara.

---

## Checklist antes de commitar

- [ ] Sem erros de TypeScript (`tsc --noEmit`)
- [ ] Sem `console.log` desnecessários
- [ ] Inputs validados com Zod
- [ ] Permissões de plano verificadas nas actions
- [ ] `LogEvento` registrado em ações sobre chaves
- [ ] Componentes com hooks têm `"use client"`
- [ ] Unicidade de código verificada antes de salvar chave

---

*Criado em: 2026-05-02 | Migrado de Basemedical para Courtesyfy*
