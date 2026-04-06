# OOH Manager — SaaS para Gestão de Mídia Exterior

Sistema SaaS completo para empresas de mídia exterior (OOH/DOOH) gerenciarem inventário de pontos, reservas, ordens de serviço e comprovação fotográfica de veiculação.

## Problema resolvido

Empresas do setor gerenciam reservas em planilhas, trocam fotos por WhatsApp, não têm rastreabilidade do processo de comprovação e não conseguem dar visibilidade organizada para clientes e vendedores.

## Os 4 pilares

1. **Inventário** — Cadastro e gestão de pontos de mídia (Outdoor, Frontlight, Empena, LED/DOOH)
2. **Calendário de reservas** — Disponibilidade visual por ponto, com regras por tipo
3. **Fluxo de reservas com aprovação** — Solicitação pelo vendedor → aprovação pelo gerente
4. **Photo Checking / OS** — Ordens de serviço com upload de fotos, auditoria e relatório de comprovação em PDF

## Stack

| Camada | Tecnologia |
|---|---|
| Frontend | Next.js 14 (App Router) |
| Estilo | Tailwind CSS + shadcn/ui |
| Backend | Next.js API Routes + Supabase |
| Banco de dados | PostgreSQL (Supabase) |
| Auth | Supabase Auth |
| Storage | Supabase Storage |
| Realtime | Supabase Realtime |
| PDF | @react-pdf/renderer |
| Offline/PWA | next-pwa + Workbox |
| Deploy | Vercel + Supabase Cloud |

## Perfis de usuário

| Perfil | Descrição |
|---|---|
| Admin | Dono/diretor — acesso total |
| Gerente | Operacional interno — CRUD geral, aprovações, OS |
| Vendedor | Comercial — consulta disponibilidade, solicita reservas |
| Funcionário | Campo técnico — executa OS de colagem/manutenção |
| Checkin | Campo fotográfico — executa OS de LED com câmera/GPS offline |
| Mídia | Auditoria interna — aprova/reprova fotos |

## Documentação

- [Arquitetura](docs/ARCHITECTURE.md)
- [Banco de dados](docs/DATABASE.md)
- [Mapa de telas](docs/SCREENS.md)
- [Roadmap e sprints](docs/ROADMAP.md)
- [Regras de negócio](docs/BUSINESS_RULES.md)
- [Riscos e decisões](docs/RISKS.md)

## Setup local

```bash
# Pré-requisitos: Node 20+, pnpm, conta Supabase

git clone https://github.com/SEU_USER/ooh-manager.git
cd ooh-manager
pnpm install
cp .env.example .env.local
# Preencha as variáveis do Supabase no .env.local
pnpm dev
```

## Estrutura do projeto

```
src/
  app/                  # Next.js App Router
    (auth)/             # Rotas públicas (login)
    (dashboard)/        # Rotas protegidas
      inventario/
      reservas/
      calendario/
      os/
      checkin/
      midia/
      relatorios/
      configuracoes/
  components/           # Componentes reutilizáveis
    ui/                 # shadcn/ui base
    calendar/           # Calendário de reservas
    map/                # Mapa GPS
    photo/              # Câmera e galeria
  lib/
    supabase/           # Cliente Supabase
    pdf/                # Geração de PDF
    offline/            # Fila offline IndexedDB
  hooks/                # React hooks customizados
  types/                # TypeScript types
supabase/
  migrations/           # SQL migrations
  seed.sql              # Dados iniciais
docs/                   # Documentação técnica
```
