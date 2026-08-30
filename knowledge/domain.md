# Courtesyfy — Conhecimento de Domínio

## Vocabulário do Domínio

| Termo no Sistema | Significado no Mundo Real |
|-----------------|--------------------------|
| `Loja` | Empresa ou lojista que usa a plataforma para criar campanhas |
| `Campanha` | Ação promocional com tipo de benefício, validade e quantidade de chaves |
| `LoteChave` | Conjunto de chaves geradas de uma vez para uma campanha |
| `Chave` | Código único (`XXXX-XXXX-XXXX-XXXX`) que dá direito a um benefício |
| `QR Code` | Imagem vinculada à chave que aponta para `/c/[codigo]` |
| `Landing page` | Página pública da chave — exibida ao cliente ao escanear o QR |
| `Cliente` | Pessoa que recebeu e ativou uma chave (portador) |
| `Ativação` | Momento em que o cliente vincula a chave ao seu tel/email |
| `Resgate` | Momento em que o operador valida a chave e entrega o benefício |
| `Operador` | Funcionário da loja que valida chaves no balcão |
| `Benefício` | O que o cliente recebe: desconto, brinde, sorteio, etc. |
| `Expiração` | Chave que passou da data de validade da campanha (automático) |
| `LogEvento` | Registro imutável de cada ação relevante no sistema |

---

## Estados da Chave e Transições

```
         GERADA  ──► (cliente acessa landing) ──► CONSULTADA
            │                                           │
            │         (cliente informa tel/email)       │
            └──────────────────────────────────►  ATIVADA
                                                        │
                                         (operador valida)
                                                        │
                                                   RESGATADA  ← IMUTÁVEL

Transições paralelas:
  GERADA   ──► EXPIRADA   (quando expiraEm < hoje)
  GERADA   ──► CANCELADA  (lojista cancela manualmente)
  ATIVADA  ──► EXPIRADA   (quando expiraEm < hoje)
  ATIVADA  ──► CANCELADA  (lojista cancela manualmente)

RESGATADA e CANCELADA nunca transitam para outro estado.
```

---

## Fluxo Completo

### Perspectiva do Lojista
```
1. Cadastra a loja e configura identidade visual
2. Cria uma campanha com tipo de benefício e validade
3. Gera lote de chaves com QR codes
4. Exporta para impressão (A4, etiqueta, adesivo) ou digital (CSV, WhatsApp)
5. Distribui as chaves aos clientes
6. Acompanha métricas no dashboard
```

### Perspectiva do Cliente
```
1. Recebe chave física (embalagem, cartão) ou digital (WhatsApp, email)
2. Escaneia o QR code ou acessa /c/[codigo] manualmente
3. Vê o benefício disponível, regras e validade
4. Clica "Ativar minha chave" → informa telefone ou e-mail
5. Chave fica vinculada ao seu identificador
6. No momento do uso, apresenta a chave ao operador (QR ou código)
```

### Perspectiva do Operador
```
1. Acessa a tela de validação rápida (/chaves/validar)
2. Digita o código ou escaneia o QR da chave do cliente
3. Sistema exibe: benefício, portador, validade, status
4. Operador confirma a entrega do benefício
5. Sistema registra o resgate e bloqueia reutilização
```

### Perspectiva do Sistema
```
1. Verifica existência e unicidade da chave
2. Valida status: gerada, ativada, resgatada, expirada ou cancelada
3. Se cliente não existe, cria registro básico na ativação
4. No resgate, registra data, hora, operador, IP e resultado
5. Impede reutilização de chaves já resgatadas
6. Registra LogEvento em toda ação relevante
7. Job de cron expira chaves automaticamente após a validade
```

---

## Regras de Negócio Críticas

1. **Toda chave é única no banco** — gerada com entropia segura, sem chars ambíguos (O, 0, I, 1, S, 5)
2. **Toda chave pertence a uma única campanha** — não pode ser reatribuída
3. **Uma chave só pode ser vinculada a um único cliente** — no momento da ativação
4. **Uma chave RESGATADA nunca muda de estado** — imutável
5. **O QR code aponta para `/c/[codigo]`** — URL pública, não o painel
6. **Ações relevantes geram LogEvento** — auditoria completa
7. **Chaves expiram automaticamente** — via cron job comparando `expiraEm` da campanha

---

## Planos da Loja

| Plano | Funcionalidades |
|-------|----------------|
| **ESSENCIAL** | Campanhas básicas, limite de chaves/mês, exportação A4 |
| **PROFISSIONAL** | Campanhas ilimitadas, landing page personalizada, todos os formatos de exportação |
| **EMPRESARIAL** | White-label, multi-unidade, API de integração, domínio customizado |

---

## Hierarquia de Usuários

```
Super Admin da Plataforma (acesso total via /admin)
    └── Admin da Loja (gerencia campanhas, usuários, configurações)
        └── Operador (valida chaves no balcão)
            └── Visualizador (apenas leitura de métricas)

Cliente / Portador (sem login — acessa /c/[codigo])
```

---

## Localização e Idioma

- **Idioma:** Português Brasileiro (pt-BR)
- **Moeda:** Real (BRL)
- **Formatação de datas:** `date-fns` com locale `pt-BR`
- **Telefone:** formato brasileiro `(XX) XXXXX-XXXX`

---

## Terminologia em Português (UI)

- `campanha` (não "campaign")
- `chave` (não "key" ou "code")
- `resgate` (não "redemption")
- `portador` (não "holder")
- `lojista` (não "merchant")
- `lote` (não "batch")
- `benefício` (não "benefit")
- `validade` (não "expiration")

---

*Criado em: 2026-05-02 | Baseado na especificação técnica do Courtesyfy*
