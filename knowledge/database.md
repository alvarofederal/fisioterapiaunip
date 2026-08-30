# Courtesyfy — Conhecimento do Banco de Dados

## Configuração

- **Banco:** MySQL
- **ORM:** Prisma 5
- **Schema:** `prisma/schema.prisma`
- **Import no código:** `import { db } from "@/lib/prisma"`
- **Relation mode:** `prisma` (sem FK nativas no MySQL)

---

## Modelos e Relacionamentos

### Autenticação (herdado, manter intacto)

```
User (1) ──< Account (N)           # OAuth providers vinculados
User (1) ──< Session (N)           # Sessões ativas
VerificationToken                  # Tokens de verificação de email
```

### Domínio Courtesyfy

```
Loja (1) ──< User (N)              # Operadores da loja
Loja (1) ──< Campanha (N)          # Campanhas da loja
Campanha (1) ──< LoteChave (N)     # Lotes de chaves gerados
LoteChave (1) ──< Chave (N)        # Chaves individuais
Chave (N) ──> Cliente (1)          # Portador da chave (após ativação)
Chave (1) ──< Resgate (0..1)       # Registro de resgate (imutável)
Loja/Campanha/Chave ──< LogEvento  # Auditoria de todos os eventos
```

---

## Schema Prisma Completo (Domínio Courtesyfy)

```prisma
model User {
  id            String    @id @default(cuid())
  name          String?
  email         String    @unique
  emailVerified DateTime?
  image         String?
  password      String?
  role          Role      @default(OPERADOR)
  ativo         Boolean   @default(true)
  ultimoAcesso  DateTime?
  loja          Loja?     @relation(fields: [lojaId], references: [id])
  lojaId        String?
  accounts      Account[]
  sessions      Session[]
  resgates      Resgate[]
  logsEventos   LogEvento[]
  chavesCancel  Chave[]   @relation("CanceladoPor")
  campanhasCria Campanha[] @relation("CriadoPor")
  lotesGerados  LoteChave[] @relation("GeradoPor")
  criadoEm     DateTime  @default(now())
  atualizadoEm DateTime  @updatedAt
  @@map("usuarios")
}

model Loja {
  id            String      @id @default(cuid())
  nome          String
  razaoSocial   String?
  cnpjCpf       String?     @unique
  email         String      @unique
  telefone      String?
  logradouro    String?
  numero        String?
  complemento   String?
  bairro        String?
  cidade        String?
  estado        String?     @db.Char(2)
  cep           String?
  logoUrl       String?     @db.Text
  corPrimaria   String      @default("#c8a96e")
  nomeExibicao  String?
  siteUrl       String?     @db.Text
  status        LojaStatus  @default(ATIVA)
  plano         Plano       @default(ESSENCIAL)
  usuarios      User[]
  campanhas     Campanha[]
  lotes         LoteChave[]
  chaves        Chave[]
  resgates      Resgate[]
  logsEventos   LogEvento[]
  stripeCustomerId     String? @unique
  stripeSubscriptionId String? @unique
  stripePriceId        String?
  stripeCurrentPeriodEnd DateTime?
  criadoEm     DateTime    @default(now())
  atualizadoEm DateTime    @updatedAt
  @@map("lojas")
}

model Campanha {
  id                String          @id @default(cuid())
  lojaId            String
  nome              String
  descricao         String?         @db.Text
  tipoBeneficio     TipoBeneficio
  valorBeneficio    Decimal?        @db.Decimal(10, 2)
  descricaoPremio   String?         @db.Text
  regrasUso         String?         @db.Text
  quantidadeChaves  Int
  inicioEm          DateTime
  expiraEm          DateTime
  status            CampanhaStatus  @default(RASCUNHO)
  landingPageSlug   String?         @unique
  criadoPorId       String?
  loja              Loja            @relation(fields: [lojaId], references: [id])
  criadoPor         User?           @relation("CriadoPor", fields: [criadoPorId], references: [id])
  lotes             LoteChave[]
  chaves            Chave[]
  resgates          Resgate[]
  logsEventos       LogEvento[]
  criadoEm         DateTime        @default(now())
  atualizadoEm     DateTime        @updatedAt
  @@map("campanhas")
}

model LoteChave {
  id            String        @id @default(cuid())
  campanhaId    String
  lojaId        String
  descricao     String?
  quantidade    Int
  geradoPorId   String?
  formatoSaida  FormatoSaida  @default(A4)
  arquivoUrl    String?       @db.Text
  status        LoteStatus    @default(GERADO)
  campanha      Campanha      @relation(fields: [campanhaId], references: [id])
  loja          Loja          @relation(fields: [lojaId], references: [id])
  geradoPor     User?         @relation("GeradoPor", fields: [geradoPorId], references: [id])
  chaves        Chave[]
  criadoEm     DateTime      @default(now())
  @@map("lotes_chaves")
}

model Chave {
  id             String      @id @default(cuid())
  codigo         String      @unique      // XXXX-XXXX-XXXX-XXXX
  loteId         String
  campanhaId     String
  lojaId         String
  clienteId      String?
  status         ChaveStatus @default(GERADA)
  qrcodeUrl      String?     @db.Text
  landingUrl     String?     @db.Text
  ativadaEm      DateTime?
  resgatadaEm    DateTime?
  expiradaEm     DateTime?
  canceladaEm    DateTime?
  canceladoPorId String?
  lote           LoteChave   @relation(fields: [loteId], references: [id])
  campanha       Campanha    @relation(fields: [campanhaId], references: [id])
  loja           Loja        @relation(fields: [lojaId], references: [id])
  cliente        Cliente?    @relation(fields: [clienteId], references: [id])
  canceladoPor   User?       @relation("CanceladoPor", fields: [canceladoPorId], references: [id])
  resgate        Resgate?
  logsEventos    LogEvento[]
  criadoEm      DateTime    @default(now())
  atualizadoEm  DateTime    @updatedAt
  @@map("chaves")
}

model Cliente {
  id           String      @id @default(cuid())
  telefone     String?
  email        String?
  nome         String?
  documento    String?
  ipCadastro   String?
  canalOrigem  CanalOrigem @default(WEB)
  chaves       Chave[]
  resgates     Resgate[]
  logsEventos  LogEvento[]
  criadoEm    DateTime    @default(now())
  atualizadoEm DateTime   @updatedAt
  @@map("clientes")
}

model Resgate {
  id                String        @id @default(cuid())
  chaveId           String        @unique         // 1:1 com Chave
  campanhaId        String
  lojaId            String
  clienteId         String?
  operadorId        String?
  canal             CanalResgate  @default(BALCAO)
  statusResgate     StatusResgate @default(CONFIRMADO)
  beneficioEntregue String?       @db.Text
  observacao        String?       @db.Text
  ipOrigem          String?
  chave             Chave         @relation(fields: [chaveId], references: [id])
  campanha          Campanha      @relation(fields: [campanhaId], references: [id])
  loja              Loja          @relation(fields: [lojaId], references: [id])
  cliente           Cliente?      @relation(fields: [clienteId], references: [id])
  operador          User?         @relation(fields: [operadorId], references: [id])
  resgatadoEm      DateTime      @default(now())
  @@map("resgates")
}

model LogEvento {
  id         String     @id @default(cuid())
  tipoEvento TipoEvento
  chaveId    String?
  campanhaId String?
  lojaId     String?
  clienteId  String?
  operadorId String?
  canal      String?
  ipOrigem   String?
  userAgent  String?    @db.Text
  payload    Json?
  // relações omitidas para brevidade
  criadoEm  DateTime   @default(now())
  @@map("logs_eventos")
}
```

---

## Enums

```prisma
enum Role            { ADMIN, OPERADOR, VISUALIZADOR }
enum LojaStatus      { ATIVA, SUSPENSA, CANCELADA }
enum Plano           { ESSENCIAL, PROFISSIONAL, EMPRESARIAL }
enum TipoBeneficio   { DESCONTO_PERCENTUAL, DESCONTO_FIXO, BRINDE, SORTEIO, FRETE_GRATIS, CASHBACK }
enum CampanhaStatus  { RASCUNHO, ATIVA, PAUSADA, ENCERRADA, CANCELADA }
enum FormatoSaida    { A4, ETIQUETA, ADESIVO, CSV, DIGITAL }
enum LoteStatus      { GERADO, EXPORTADO, DISTRIBUIDO }
enum ChaveStatus     { GERADA, CONSULTADA, ATIVADA, RESGATADA, EXPIRADA, CANCELADA }
enum CanalOrigem     { WEB, QRCODE, MANUAL }
enum CanalResgate    { BALCAO, QRCODE, WEB, APP, MANUAL }
enum StatusResgate   { CONFIRMADO, RECUSADO, ESTORNADO }
enum TipoEvento      {
  CHAVE_GERADA, CHAVE_CONSULTADA, CHAVE_ATIVADA, CHAVE_RESGATADA,
  CHAVE_EXPIRADA, CHAVE_CANCELADA, TENTATIVA_INVALIDA, TENTATIVA_REUSO,
  RESGATE_RECUSADO, CAMPANHA_CRIADA, CAMPANHA_ENCERRADA,
  LOTE_GERADO, LOTE_EXPORTADO, USUARIO_LOGIN, USUARIO_LOGOUT
}
```

---

## Queries Comuns

### Buscar chave por código (landing page)
```typescript
const chave = await db.chave.findUnique({
  where: { codigo },
  include: {
    campanha: { select: { nome: true, tipoBeneficio: true, expiraEm: true, regrasUso: true } },
    loja: { select: { nome: true, logoUrl: true, corPrimaria: true, nomeExibicao: true } },
    cliente: { select: { telefone: true, email: true } },
  }
})
```

### Verificar plano ativo da loja
```typescript
const loja = await db.loja.findUnique({
  where: { id: lojaId },
  select: { plano: true, stripeCurrentPeriodEnd: true }
})
const planoAtivo = loja?.plano ?? "ESSENCIAL"
```

### Métricas de campanha
```typescript
const metricas = await db.chave.groupBy({
  by: ["status"],
  where: { campanhaId },
  _count: { status: true }
})
```

### Histórico de resgates da loja
```typescript
const resgates = await db.resgate.findMany({
  where: { lojaId },
  include: {
    chave: { select: { codigo: true } },
    campanha: { select: { nome: true } },
    cliente: { select: { telefone: true, email: true } },
    operador: { select: { name: true } },
  },
  orderBy: { resgatadoEm: "desc" },
  take: 50,
})
```

---

## Cuidados com o Banco

1. **`codigo` da chave é `@unique`** — sempre verificar duplicata antes de persistir
2. **`chaveId` em `Resgate` é `@unique`** — resgate 1:1 com chave, nunca duplicar
3. **`Resgate` é imutável** — nunca atualizar um registro de resgate após criado
4. **Nunca `findMany()` sem `select`** em produção — retorna dados desnecessários
5. **Relation mode `prisma`** — cascades precisam ser feitas manualmente

---

## Scripts de Banco

```bash
npx prisma generate      # Regenerar client após mudar schema
npx prisma db push       # Sincronizar schema (dev)
npx prisma migrate dev   # Criar migration
npx prisma studio        # GUI visual do banco
npm run db:seed          # Popular dados iniciais
```

---

*Criado em: 2026-05-02 | Schema baseado na especificação técnica do Courtesyfy*
