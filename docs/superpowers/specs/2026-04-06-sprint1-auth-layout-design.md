# Sprint 1 — Auth + Layout Base: Design Spec

**Data:** 2026-04-06  
**Status:** Aprovado  
**Próximo passo:** Implementação via writing-plans

---

## Escopo

Implementar o shell completo da aplicação: autenticação funcional com Supabase e dois layouts distintos por grupo de perfil, com navegação filtrada e tema light/dark.

Fora do escopo deste sprint: design visual refinado da tela de login, conteúdo real nos dashboards (apenas placeholders), módulos de inventário/reservas/OS.

---

## 1. Auth Flow

### Login (`/login`)
- Tela centralizada, design simples (funcional, sem refinamento visual por ora)
- Campos: email + senha, botão "Entrar"
- Erro de credenciais: mensagem inline
- Ao autenticar: Supabase cria sessão em cookie via `@supabase/ssr`

### Reset de senha (`/login/reset`)
- Campo de email, chama `supabase.auth.resetPasswordForEmail()`
- Exibe mensagem de confirmação após envio

### Middleware (`src/middleware.ts`) — já existe
- Rotas protegidas sem sessão → redirect `/login`
- `/login` com sessão ativa → redirect `/`

### AuthContext (`src/contexts/auth-context.tsx`)
- Provider no root layout
- Expõe: `user`, `profile` (registro da tabela `usuarios`), `loading`
- Carrega perfil da tabela `usuarios` por `user.id` após login
- Se usuário não existe em `usuarios`: exibe tela de erro "Conta não configurada — contate o administrador"

---

## 2. OfficeLayout

**Perfis:** Admin, Gerente, Vendedor, Mídia

### Estrutura desktop (≥ 768px)
- Header fixo no topo: logo/nome da empresa | espaço | sino notificações (badge) | toggle dark/light | avatar com dropdown (nome, perfil, logout)
- Sidebar fixa à esquerda (240px): logo do app + itens de navegação com ícone + label, agrupados por seção
- Conteúdo: área restante com scroll independente

### Estrutura mobile (< 768px)
- Header com botão menu hambúrguer (abre sidebar como Sheet/gaveta lateral)
- Sem bottom tabs — hambúrguer é suficiente para o volume de itens
- Sheet fecha ao navegar

### Itens de navegação por perfil

| Item | Rota | Admin | Gerente | Vendedor | Mídia |
|---|---|:---:|:---:|:---:|:---:|
| Dashboard | `/` | ✓ | ✓ | ✓ | ✓ |
| Inventário | `/inventario` | ✓ | ✓ | — | ✓ |
| Reservas | `/reservas` | ✓ | ✓ | ✓ | ✓ |
| Calendário | `/calendario` | ✓ | ✓ | ✓ | — |
| Disponibilidade | `/disponibilidade` | ✓ | ✓ | ✓ | — |
| Ordens de Serviço | `/os` | ✓ | ✓ | — | ✓ |
| Relatórios | `/relatorios` | ✓ | ✓ | ✓* | ✓ |
| Usuários | `/usuarios` | ✓ | ✓ | — | — |
| Configurações | `/configuracoes` | ✓ | ✓ | ✓ | ✓ |

*Vendedor vê apenas relatórios dos próprios clientes (filtrado na página, não no layout).

### Configurações por perfil
- **Admin:** acesso total — dados da empresa, logo, plano
- **Gerente / Vendedor / Mídia / Funcionário / Checkin:** apenas telefone de contato e foto de perfil

---

## 3. FieldLayout

**Perfis:** Funcionário, Checkin

### Filosofia
Interface de foco total. Sem sidebar. Tudo grande e óbvio — o usuário está na rua, com sol na tela.

### Estrutura (mobile-first, sem versão desktop significativa)
- Header simples: logo pequeno | badge de status offline (Checkin only)
- Conteúdo em tela cheia com scroll
- Bottom tabs fixos (2 itens):
  - **Minhas OS** → `/os`
  - **Perfil** → `/perfil`

### Especificações de acessibilidade de campo
- Fonte base: mínimo 16px
- Área de toque de botões: mínimo 48×48px
- Sem tabelas — apenas cards empilhados
- Tema: Light fixo (sem toggle — legibilidade ao sol é prioridade)

### Diferença Funcionário × Checkin
- **Funcionário:** header sem badge offline
- **Checkin:** header com badge "Online" (verde) / "Offline" (vermelho) sempre visível + banner de sync quando há fotos na fila (`useOfflineSync`)

---

## 4. Dashboards por perfil

| Perfil | Comportamento em `/` |
|---|---|
| Admin | KPIs: total pontos, ocupação %, reservas ativas, OS abertas. Atalhos para aprovações e OS pendentes |
| Gerente | Igual Admin + fila de reservas aguardando aprovação em destaque |
| Vendedor | Reservas ativas, solicitações pendentes, atalho para disponibilidade |
| Mídia | Contagem de OS aguardando auditoria + reservas pendentes de aprovação |
| Funcionário | Redirect direto para `/os` |
| Checkin | Redirect direto para `/os` |

Conteúdo dos KPIs neste sprint: **placeholders com dados estáticos** — as queries reais entram nos sprints dos módulos correspondentes.

---

## 5. Tema dark/light

- Biblioteca: `next-themes`
- Toggle: ícone sol/lua no header do OfficeLayout
- Persistência: `localStorage`
- Padrão: **Light**
- FieldLayout: Light fixo, sem toggle

### Implementação
- `ThemeProvider` do `next-themes` no root layout
- CSS variables do shadcn/ui já cobrem dark/light nativamente
- Nenhuma classe manual necessária — apenas `dark:` utilities do Tailwind onde necessário

---

## 6. Mudança de regra de negócio — aprovação de reservas

**Antes:** apenas Gerente e Admin podiam aprovar/rejeitar reservas.  
**Agora:** **Mídia também pode aprovar e rejeitar** reservas solicitadas pelo Vendedor.

Impacto técnico:
- Atualizar RLS policy `reservas_gerente_update` em `001_initial_schema.sql` para incluir `'midia'`
- Atualizar middleware/check de perfil nas API Routes de aprovação
- Atualizar `docs/BUSINESS_RULES.md` seção 3

---

## 7. Arquivos a criar / modificar

```
src/
  contexts/
    auth-context.tsx          ← novo: Provider com user + profile
  app/
    layout.tsx                ← modificar: ThemeProvider + AuthProvider
    (auth)/
      login/
        page.tsx              ← já existe (manter simples)
        login-form.tsx        ← já existe
      login/reset/
        page.tsx              ← novo
    (dashboard)/
      layout.tsx              ← modificar: branch OfficeLayout vs FieldLayout
    (office)/                 ← novo route group
      layout.tsx              ← novo: OfficeLayout
    (field)/                  ← novo route group
      layout.tsx              ← novo: FieldLayout
  components/
    layout/
      office-sidebar.tsx      ← novo
      office-header.tsx       ← novo
      field-header.tsx        ← novo
      field-bottom-tabs.tsx   ← novo
      nav-items.ts            ← novo: config de navegação por perfil
    theme-toggle.tsx          ← novo
supabase/
  migrations/
    002_rls_midia_reservas.sql ← novo: atualiza policy de aprovação
```

---

## Critérios de aceite

- [ ] Login com email/senha funciona, sessão persiste ao recarregar
- [ ] Logout limpa sessão e redireciona para `/login`
- [ ] Cada perfil vê apenas os itens de nav corretos
- [ ] Funcionário/Checkin veem FieldLayout; demais veem OfficeLayout
- [ ] Toggle dark/light funciona e persiste no reload
- [ ] FieldLayout não tem toggle de tema (Light fixo)
- [ ] Sidebar vira Sheet no mobile (OfficeLayout)
- [ ] Badge offline visível no FieldLayout do Checkin
- [ ] Usuário sem registro em `usuarios` vê mensagem de erro adequada
- [ ] `/configuracoes` acessível a todos; campos restritos por perfil
