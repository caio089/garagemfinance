# Garagem Finance

Sistema financeiro mobile-first para controle de caixa do lava-jato **Garagem Federal**.

## Funcionalidades

- **Iniciar/Finalizar Dia** — controle diário do caixa com valor inicial e relatório completo
- **Entradas** — lavagens (Hatch/Sedan, SUV, Camionete), polimento e alimentação (itens cadastrados)
- **Saídas** — cozinha, funcionário e lava-jato
- **Dashboard** — métricas em tempo real, gráficos e movimentações recentes
- **Mobile-first** — navegação inferior fixa, botões grandes e interface intuitiva

## Stack

- Next.js 15 + React + TypeScript
- TailwindCSS + Shadcn/UI
- Framer Motion
- Recharts
- Supabase (PostgreSQL)

## Configuração

### 1. Instalar dependências

```bash
npm install
```

### 2. Configurar Supabase

1. Crie um projeto em [supabase.com](https://supabase.com)
2. No SQL Editor, execute o conteúdo de `supabase/migrations/001_initial_schema.sql`
3. Copie as credenciais do projeto

### 3. Variáveis de ambiente

```bash
cp .env.example .env.local
```

Preencha no `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon
```

### 4. Executar

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000)

## Deploy no Render (Static Site)

O projeto está configurado para export estático (`output: "export"`). A pasta gerada é `out/`.

### Opção 1 — Blueprint (`render.yaml`)

1. Faça push do repositório no GitHub
2. No [Render](https://render.com), crie um **Static Site** conectado ao repo
3. O `render.yaml` já define build e publish path

### Opção 2 — Configuração manual

| Campo | Valor |
|-------|-------|
| **Build Command** | `npm ci && npm run build` |
| **Publish Directory** | `out` |
| **Node Version** | `20` |

### Variáveis de ambiente no Render

Configure **antes do build** (são embutidas no bundle):

```
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon
```

> Use a chave **anon** ou **publishable** do Supabase. Não exponha a `service_role` nem a senha do banco.

### Testar build local

```bash
npm run build
# arquivos estáticos em ./out
```

## Estrutura

```
src/
├── app/                  # Páginas (dashboard, entrada, saída)
├── components/           # UI components
│   ├── dashboard/        # Cards, gráficos, movimentações
│   ├── entrada/          # Formulário de entradas
│   ├── saida/            # Formulário de saídas
│   ├── modals/           # Iniciar/Finalizar dia
│   └── layout/           # Header, navegação inferior
├── services/             # Camada de dados Supabase
│   ├── dias.service.ts
│   ├── entradas.service.ts
│   └── saidas.service.ts
├── lib/                  # Supabase client, formatação
└── types/                # Tipos TypeScript
```

## Preços configurados

| Serviço        | Valor  |
|----------------|--------|
| Hatch/Sedan    | R$ 55 (editável) |
| SUV            | R$ 70 (editável) |
| Camionete      | R$ 80 (editável) |
| Polimento      | +R$ 10 (editável)|
| Alimentação    | Itens cadastrados |

## Fluxo de uso

1. Abrir o app pela manhã
2. Clicar em **INICIAR DIA** e informar o caixa inicial
3. Registrar entradas (lavagens, PF) e saídas (gastos) ao longo do dia
4. Ao final, clicar em **FINALIZAR DIA** para ver o relatório completo
