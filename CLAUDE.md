# OOH Manager — Briefing para Claude Code

## O que é este projeto

SaaS para empresas de mídia exterior (OOH/DOOH) gerenciarem inventário de pontos publicitários, reservas, ordens de serviço e comprovação fotográfica de veiculação para clientes.

**GitHub:** https://github.com/TNO-SNunes/ooh-manager  
**Conta:** TNO-SNunes  
**gh CLI:** `C:\Program Files\GitHub CLI\gh.exe` (não está no PATH do bash — sempre usar `powershell.exe -Command "& 'C:\Program Files\GitHub CLI\gh.exe' ..."`)

---

## Stack

| Camada | Tecnologia |
|---|---|
| Frontend | Next.js 14 (App Router), pasta `/app-src/` |
| Estilo | Tailwind CSS + shadcn/ui |
| Backend | Next.js API Routes |
| Banco | PostgreSQL via Supabase (com RLS) |
| Auth | Supabase Auth |
| Storage | Supabase Storage (fotos das OS) |
| Realtime | Supabase Realtime |
| PDF | @react-pdf/renderer |
| Offline | IndexedDB (`idb`) + hook `useOfflineSync` |
| Deploy | Vercel + Supabase Cloud |

---

## Estrutura do repositório

```
/docs/              ← documentação técnica completa
  ARCHITECTURE.md   ← stack, camadas, fluxo offline, RBAC
  DATABASE.md       ← SQL completo, RLS, triggers
  SCREENS.md        ← mapa de telas por perfil
  ROADMAP.md        ← sprints MVP/V1/V2 com critérios de aceite
  BUSINESS_RULES.md ← todas as regras de negócio críticas
  RISKS.md          ← decisões de arquitetura e riscos

/app-src/           ← aplicação Next.js 14
  src/
    app/
      (auth)/login/           ← tela de login
      (dashboard)/            ← rotas protegidas (layout com auth check)
    components/ui/            ← shadcn/ui
    hooks/
      useAuth.ts              ← usuário logado + perfil
      useOfflineSync.ts       ← sync de fotos offline (Checkin)
    lib/
      supabase/client.ts      ← cliente browser
      supabase/server.ts      ← cliente server (SSR)
      offline/queue.ts        ← fila IndexedDB para upload offline
      reservas/validacoes.ts  ← regras de bissemana, 30d, slots LED
    middleware.ts             ← proteção de rotas via JWT
    types/index.ts            ← todos os tipos TypeScript centrais
  supabase/migrations/
    001_initial_schema.sql    ← schema completo com RLS
```

---

## Os 4 pilares do sistema

1. **Inventário** — pontos de mídia: Outdoor, Frontlight, Empena, LED/DOOH
2. **Calendário de reservas** — regras por tipo:
   - Outdoor: bissemanas obrigatórias (1-15 e 16-último do mês)
   - Frontlight/Empena: mínimo 30 dias
   - LED: qualquer período, múltiplos clientes por slots
3. **Fluxo de reservas** — Vendedor solicita → Gerente aprova/rejeita
4. **Photo Checking / OS** — Checkin tira foto (offline OK) → Mídia audita → PDF para cliente

## Perfis de usuário

| Perfil | Acesso |
|---|---|
| Admin | Tudo |
| Gerente | CRUD geral, aprovações, OS, auditoria |
| Vendedor | Disponibilidade, solicitar reservas, próprios clientes |
| Funcionário | Apenas suas OS (colagem, manutenção, instalação) |
| Checkin | Apenas suas OS de LED, câmera + GPS, funciona offline |
| Mídia | Fila de auditoria de fotos |

---

## Status de desenvolvimento

### Sprint 0 — CONCLUÍDO
- [x] Documentação completa em `/docs/`
- [x] Scaffold Next.js com Supabase, Tailwind, shadcn/ui
- [x] Tipos TypeScript centrais
- [x] Middleware de auth
- [x] Validações de reserva por tipo de ponto
- [x] Fila offline IndexedDB para Checkin
- [x] Migration SQL completa com RLS por perfil
- [x] Repositório GitHub criado e com push

### Sprint 1 — CONCLUÍDO
- [x] Auth flow: login, logout, reset de senha, middleware de proteção
- [x] AuthContext com AuthProvider + useAuthContext
- [x] OfficeLayout: sidebar fixa 240px (desktop) + Sheet mobile, header com toggle dark/light e avatar
- [x] FieldLayout: header com badge online/offline (Checkin), 2 bottom tabs
- [x] Navegação filtrada por perfil (nav-items.ts, TDD — 9 testes)
- [x] ThemeProvider (next-themes) — Light padrão, toggle persistido
- [x] Dashboard por perfil + 8 rotas placeholder
- [x] Migration 002: Mídia pode aprovar/rejeitar reservas
- [x] PR: https://github.com/TNO-SNunes/ooh-manager/pull/1 (branch: feat/sprint-1-auth-layout)

**Nota técnica:** shadcn/ui neste projeto usa `@base-ui/react` (não Radix UI). `asChild` não existe — usar `render` prop nos triggers.

**Pendente (aplicar no Supabase):**
- `supabase/migrations/001_initial_schema.sql` (schema inicial)
- `supabase/migrations/002_rls_midia_reservas.sql` (Mídia aprovação)

### Sprint 2 — PRÓXIMO
Ver `docs/ROADMAP.md` para detalhes do Sprint 2 (Inventário de pontos).

---

## Regras de negócio críticas (resumo)

- **Outdoor**: `data_inicio` deve ser dia 1 ou 16; `data_fim` deve ser dia 15 ou último do mês
- **Frontlight/Empena**: mínimo 30 dias, sem restrição de dia
- **LED**: múltiplos clientes por slots; verificar `SUM(slots_quantidade) < slots_totais` no período
- **Bloqueio de período**: reserva com status `solicitada` já bloqueia o período para outros vendedores
- **Rejeição obrigatória**: `motivo_rejeicao` obrigatório ao rejeitar reserva ou reprovar OS
- **Fotos do Checkin**: `latitude` e `longitude` obrigatórios
- **PDF**: apenas fotos com `status = 'aprovada'` entram no relatório

## Decisões de arquitetura fixadas

- Upload offline: IndexedDB + sync ao reconectar (não BackgroundSync — iOS Safari não suporta)
- Slots LED: numerados fixos (`slot_numero` na tabela reservas)
- PDF: `@react-pdf/renderer` na API Route (não no browser, para não travar)
- URLs de fotos: sempre assinadas (expiração 1h), nunca públicas
- Race condition reservas: `UNIQUE INDEX` no banco (não apenas validação na API)
- RLS: dupla camada — middleware Next.js + policies Supabase

---

## Como retomar o trabalho

1. Leia o status acima para saber em qual sprint estamos
2. Veja os documentos em `/docs/` para detalhes de qualquer módulo
3. Antes de codar qualquer módulo, leia `docs/BUSINESS_RULES.md` — as regras de negócio impactam diretamente o código
4. Para dúvidas de arquitetura, consulte `docs/RISKS.md`
5. Sempre trabalhar em branches: `feat/sprint-N-descricao`, PR para `main`
