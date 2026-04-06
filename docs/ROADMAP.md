# Roadmap e Plano de Execução — OOH Manager

## Fases

| Fase | Objetivo | Duração estimada |
|---|---|---|
| **MVP** | Core funcional: inventário + reservas + OS básica | ~8 semanas |
| **V1** | Photo Checking completo + PDF + Realtime | ~4 semanas |
| **V2** | Relatórios gerenciais + multi-tenant + integrações | ~4 semanas |

---

## MVP — 8 sprints de 1 semana

### Sprint 1 — Fundação (5 dias)
**Objetivo:** Projeto rodando com auth e estrutura base

| Tarefa | Esforço |
|---|---|
| Setup Next.js 14 + Tailwind + shadcn/ui | 0.5d |
| Setup Supabase (projeto, auth, storage) | 0.5d |
| Migrations: empresas, usuarios | 1d |
| Auth flow: login, logout, sessão, middleware | 1d |
| Layout base + sidebar + bottom tabs mobile | 1d |
| CI/CD: deploy Vercel + preview branches | 0.5d |
| Seed de dados de teste | 0.5d |

**Critério de aceite:** Usuário faz login, vê layout correto para seu perfil, logout funciona. Deploy automático no Vercel.

---

### Sprint 2 — Inventário de pontos (5 dias)
**Objetivo:** CRUD completo de pontos de mídia

| Tarefa | Esforço |
|---|---|
| Migration: pontos_midia, bloqueios_manutencao | 0.5d |
| RLS: pontos (select todos, CUD gerente/admin) | 0.5d |
| API: CRUD pontos | 1d |
| Tela: lista de pontos com filtros (tipo/cidade/status) | 1d |
| Tela: form cadastro/edição de ponto | 1d |
| Tela: detalhe do ponto | 0.5d |
| Upload de fotos do ponto (Supabase Storage) | 0.5d |

**Critério de aceite:** Gerente cadastra ponto Outdoor com fotos. Vendedor vê lista mas não pode editar. Ponto aparece com tipo correto.

---

### Sprint 3 — Clientes, Campanhas e Disponibilidade (5 dias)
**Objetivo:** Estrutura comercial + consulta de disponibilidade

| Tarefa | Esforço |
|---|---|
| Migration: clientes, campanhas | 0.5d |
| RLS: clientes (vendedor vê só os próprios) | 0.5d |
| API: CRUD clientes e campanhas | 1d |
| Telas: lista e form de clientes | 0.5d |
| Telas: lista e form de campanhas | 0.5d |
| Tela: consulta de disponibilidade (filtros + resultado) | 1.5d |
| Lógica de disponibilidade por tipo (bissemana, 30d, slots LED) | 0.5d |

**Critério de aceite:** Vendedor cria cliente, cria campanha. Consulta disponibilidade retorna pontos livres/ocupados corretamente para cada tipo.

---

### Sprint 4 — Calendário de reservas (5 dias)
**Objetivo:** Visualização de ocupação por ponto

| Tarefa | Esforço |
|---|---|
| Componente CalendarioReservas (base) | 1.5d |
| Lógica de renderização por tipo (outdoor=bissemana, led=slots) | 1d |
| Integração com dados reais (reservas, bloqueios) | 0.5d |
| Tela detalhe do ponto com calendário | 0.5d |
| Calendário global (visão gerente/admin) | 1d |
| Export CSV da disponibilidade | 0.5d |

**Critério de aceite:** Gerente vê no calendário do ponto as ocupações por cliente/campanha com cores distintas. Período de manutenção aparece hachurado.

---

### Sprint 5 — Fluxo de reservas (5 dias)
**Objetivo:** Solicitação e aprovação de reservas

| Tarefa | Esforço |
|---|---|
| Migration: reservas | 0.5d |
| RLS: reservas (vendedor vê só as próprias) | 0.5d |
| API: criar reserva (validação por tipo) | 1.5d |
| API: aprovar/rejeitar reserva | 0.5d |
| Tela: solicitar reserva (3 steps) | 1d |
| Tela: fila de aprovação (gerente) | 0.5d |
| Tela: minhas reservas (vendedor) | 0.5d |

**Critério de aceite:** Vendedor solicita Outdoor para bissemana válida. Sistema rejeita datas inválidas. Gerente aprova com 1 clique. Vendedor é notificado por UI (sem realtime ainda). LED permite múltiplos clientes até slots_totais.

---

### Sprint 6 — Usuários e gestão de equipe (4 dias)
**Objetivo:** CRUD de usuários + perfis corretos

| Tarefa | Esforço |
|---|---|
| RLS: usuarios | 0.5d |
| API: CRUD usuários (Admin/Gerente) | 1d |
| Tela: gestão de usuários | 1d |
| Invite por email (Supabase Auth invite) | 1d |
| Ajuste de sidebar/tabs por perfil | 0.5d |

**Critério de aceite:** Admin convida novo Vendedor por email. Vendedor recebe link, define senha e acessa com perfil correto.

---

### Sprint 7 — Ordens de Serviço básica (5 dias)
**Objetivo:** CRUD de OS + execução pelo Funcionário

| Tarefa | Esforço |
|---|---|
| Migration: ordens_servico | 0.5d |
| RLS: OS (funcionário vê só as próprias) | 0.5d |
| API: CRUD OS + máquina de estados | 1d |
| Tela: lista e criação de OS (Gerente) | 0.5d |
| Tela: lista de OS do Funcionário (mobile-first) | 0.5d |
| Tela: executar OS + upload de fotos | 1.5d |
| Supabase Storage: upload fotos OS | 0.5d |

**Critério de aceite:** Gerente cria OS, atribui para Funcionário. Funcionário vê OS no celular, inicia, faz upload de foto, marca como concluído.

---

### Sprint 8 — Auditoria de fotos + polish MVP (5 dias)
**Objetivo:** Fechar o loop de Photo Checking + estabilização

| Tarefa | Esforço |
|---|---|
| Migration: os_fotos | 0.5d |
| RLS: fotos | 0.5d |
| Tela: fila de auditoria (Mídia) | 1d |
| Tela: auditar OS (galeria + aprovar/reprovar) | 1.5d |
| API: aprovar/reprovar OS | 0.5d |
| Notificações in-app (sem realtime: polling simples) | 0.5d |
| Testes E2E dos fluxos críticos | 0.5d |

**Critério de aceite:** Checkin envia fotos → Mídia vê na fila → Aprova → OS finalizada. Reprovar com motivo funciona. Ciclo completo testado.

---

## V1 — 4 sprints (semanas 9-12)

### Sprint 9 — Checkin PWA offline (6 dias)
- Setup next-pwa + Workbox
- Service Worker com BackgroundSync para upload offline
- IndexedDB via `idb` para fotos temporárias
- Interface Checkin com câmera nativa + indicador offline
- Geolocalização obrigatória nas fotos (Browser Geolocation API)
- Tela de mapa + botão "Abrir no GPS" (deep link Google/Apple Maps)

**Critério de aceite:** Checkin consegue tirar foto sem internet, fechar app, abrir e confirmar que foto está na fila. Ao reconectar, upload acontece automaticamente.

### Sprint 10 — Realtime + Notificações push (5 dias)
- Supabase Realtime para fila de OS e reservas pendentes
- Migration: notificacoes
- Sistema de notificações in-app com sino
- Push notifications via Web Push API (opcional para PWA)

**Critério de aceite:** Vendedor cria reserva → Gerente recebe notificação em <3s sem reload.

### Sprint 11 — PDF de comprovação (5 dias)
- Integração @react-pdf/renderer
- Template PDF com fotos + GPS + timestamp + logo
- Botão export no detalhe da OS
- Tela de relatórios (Admin/Gerente)

**Critério de aceite:** Gerente exporta PDF de OS aprovada. PDF tem fotos com data/hora/GPS. Abre corretamente no celular.

### Sprint 12 — Qualidade e performance (4 dias)
- Otimização de queries (índices adicionais)
- Lazy loading de imagens
- Testes de performance no mobile (Lighthouse PWA score >90)
- Documentação de API interna
- Ajustes UX baseados em feedback

---

## V2 — 4 sprints (semanas 13-16)

### Sprint 13 — Relatórios gerenciais
- Dashboard com gráficos (Recharts)
- Taxa de ocupação por ponto/período
- Faturamento por cliente/campanha (se integração financeira)
- Export Excel

### Sprint 14 — Multi-tenant admin
- Tela de super-admin para gerenciar empresas
- Onboarding de nova empresa
- Planos e limites (starter/pro/enterprise)
- Billing básico

### Sprint 15 — Integrações
- Webhooks para sistemas externos
- API pública (CRUD de reservas por API key)
- Integração com Google Calendar (reservas → eventos)

### Sprint 16 — Mobile nativo (opcional)
- Avaliar React Native / Capacitor se demanda de app store aparecer
- Push notifications nativas
- Câmera com mais controle

---

## Dependências entre módulos

```
Auth ──────────────────────── (base de tudo)
  └── Usuários
        └── Pontos de Mídia
              └── Disponibilidade/Calendário
                    └── Reservas
                          └── OS
                                └── Fotos OS
                                      └── Auditoria
                                            └── PDF
        └── Clientes
              └── Campanhas
                    └── Reservas
```

**Regra:** Nunca avançar para um módulo sem o anterior estar aprovado em staging.
