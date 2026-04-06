# Arquitetura do Sistema — OOH Manager

## Visão geral

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENTE                              │
│  Browser / PWA instalado (mobile-first)                     │
│  Next.js App Router — SSR + Client Components               │
│  Tailwind CSS + shadcn/ui                                   │
│  Service Worker (Workbox) — cache e fila offline            │
│  IndexedDB — armazenamento local offline                    │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTPS
┌────────────────────────▼────────────────────────────────────┐
│                   NEXT.JS API ROUTES                        │
│  /api/...  — endpoints REST                                 │
│  Middleware de autenticação (Supabase JWT)                  │
│  Middleware de autorização por perfil (RBAC)               │
└────────────────────────┬────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────┐
│                      SUPABASE                               │
│  PostgreSQL — banco de dados principal                      │
│  Row Level Security (RLS) — isolamento por perfil           │
│  Supabase Auth — JWT, sessões, perfis                       │
│  Supabase Storage — fotos e vídeos das OS                   │
│  Supabase Realtime — atualizações de status em tempo real   │
└─────────────────────────────────────────────────────────────┘
```

## Stack tecnológica — justificativas

### Next.js 14 (App Router)
- PWA nativo via `next-pwa` + Workbox
- Server Components para listagens pesadas (calendário, filas de OS)
- Client Components apenas onde há interação (formulários, câmera, mapa)
- API Routes substituem um backend separado — menor complexidade operacional
- Deploy trivial no Vercel com preview automático por branch

### Supabase
- PostgreSQL com Row Level Security (RLS) resolve o isolamento por perfil diretamente no banco, sem precisar filtrar na API
- Supabase Auth gera JWT com `user_id` e `role` — o RLS usa diretamente
- Supabase Storage com políticas de acesso: funcionário só vê fotos das próprias OS
- Supabase Realtime via WebSocket para atualizar fila de OS sem polling
- Supabase Edge Functions (se necessário) para tarefas assíncronas pesadas

### Tailwind CSS + shadcn/ui
- Mobile-first por design (utility classes)
- shadcn/ui fornece componentes acessíveis sem overhead de bundle
- Personalização sem wrapper components

### PWA + Service Worker (Workbox)
- `next-pwa` gera o service worker automaticamente
- Estratégia de cache: `CacheFirst` para assets estáticos, `NetworkFirst` para dados
- Fila offline: `BackgroundSync` do Workbox para upload de fotos quando reconectar
- IndexedDB via `idb` para armazenar fotos localmente antes do upload

### @react-pdf/renderer
- Geração de PDF no browser sem servidor dedicado
- Alternativa: Puppeteer em API Route (mais fiel ao HTML, mais pesado)
- Decisão: react-pdf para MVP (simples), Puppeteer se o cliente exigir layout mais rico

### Vercel
- Deploy com zero configuração para Next.js
- Preview deployments por PR
- Edge Network para baixa latência no Brasil

---

## Fluxo de upload offline (Checkin)

```
[Checkin tira foto no campo]
         │
         ▼
[Service Worker intercepta o fetch para /api/os/fotos]
         │
    Sem internet?
    ┌────┴─────┐
   SIM        NÃO
    │           │
    ▼           ▼
[Salva foto  [Upload
 no IndexedDB direto]
 + enfileira
 no BackgroundSync]
    │
    ▼
[Quando reconectar,
 BackgroundSync dispara
 upload automático]
    │
    ▼
[Supabase Storage recebe
 foto + metadata:
 lat, lng, timestamp]
```

---

## Controle de acesso (RBAC + RLS)

### Camadas de proteção

1. **Middleware Next.js** — verifica JWT, redireciona para login se expirado
2. **API Routes** — verifica `role` no JWT antes de executar qualquer operação
3. **Supabase RLS** — políticas no banco garantem que mesmo uma query direta ao Supabase retorne apenas os dados permitidos

### Roles no JWT

```json
{
  "sub": "uuid-do-usuario",
  "role": "vendedor",
  "empresa_id": "uuid-da-empresa",
  "email": "vendedor@empresa.com"
}
```

A claim `empresa_id` garante isolamento multi-tenant: cada empresa só vê seus próprios dados.

---

## Multi-tenancy

O sistema é projetado para servir múltiplas empresas no mesmo banco. A coluna `empresa_id` está presente em todas as tabelas principais. O RLS filtra automaticamente por `empresa_id` usando a claim do JWT.

---

## Realtime

Casos de uso com Supabase Realtime:

| Canal | Evento | Quem escuta |
|---|---|---|
| `os:empresa_id` | INSERT/UPDATE em `ordens_servico` | Gerente, Mídia |
| `reservas:empresa_id` | INSERT em `reservas` (status=solicitada) | Gerente |
| `os_fotos:os_id` | INSERT em `os_fotos` | Mídia (fila de aprovação) |

Implementação: `supabase.channel()` no Client Component, cleanup no unmount.

---

## Geração de PDF de comprovação

Fluxo:
1. Gerente clica em "Exportar PDF" na OS aprovada
2. Client Component usa `@react-pdf/renderer` para montar o documento
3. Dados: fotos aprovadas + lat/lng + timestamp + dados da campanha + logo da empresa
4. PDF gerado no browser e baixado diretamente (sem servidor)

Se o volume de fotos for grande (>50 por OS), mover para API Route que usa `@react-pdf/renderer` no servidor para evitar travar o browser.
