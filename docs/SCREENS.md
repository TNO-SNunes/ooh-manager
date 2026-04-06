# Mapa de Telas por Perfil — OOH Manager

## Convenções

- `[ALL]` = todos os perfis autenticados
- `[A]` = Admin
- `[G]` = Gerente
- `[V]` = Vendedor
- `[F]` = Funcionário
- `[C]` = Checkin
- `[M]` = Mídia

---

## Telas públicas (sem autenticação)

| Rota | Tela | Descrição |
|---|---|---|
| `/login` | Login | Email + senha, link "esqueci senha" |
| `/login/reset` | Redefinir senha | Email para reset |

---

## Layout base (autenticado)

Sidebar responsiva com itens filtrados por perfil. Em mobile: bottom tab bar.

```
Header: logo empresa | nome usuário | notificações (sino) | logout
Sidebar/Tabs: navegação principal filtrada por perfil
Content: área principal
```

---

## Admin

| Rota | Tela | Conteúdo principal |
|---|---|---|
| `/` | Dashboard Admin | KPIs: receita, ocupação, OS abertas, reservas do mês |
| `/inventario` | Lista de Pontos | Tabela/grid com filtros. Botão "Novo Ponto" |
| `/inventario/[id]` | Detalhe do Ponto | Dados, fotos, calendário de ocupação, histórico |
| `/inventario/novo` | Cadastrar Ponto | Form completo com tipo, localização, dimensões |
| `/clientes` | Lista de Clientes | Todos os clientes da empresa |
| `/clientes/[id]` | Detalhe do Cliente | Dados, campanhas, reservas, histórico |
| `/campanhas` | Lista de Campanhas | Todas as campanhas |
| `/reservas` | Lista de Reservas | Todas as reservas + status |
| `/reservas/[id]` | Detalhe da Reserva | Dados completos, OS vinculadas |
| `/calendario` | Calendário Global | Visão macro de todos os pontos |
| `/disponibilidade` | Consulta Disponibilidade | Filtros + resultados exportáveis |
| `/os` | Lista de OS | Todas as OS da empresa |
| `/os/[id]` | Detalhe da OS | Dados, fotos, histórico de status |
| `/relatorios` | Relatórios | Export PDF comprovação, relatório de ocupação |
| `/usuarios` | Gestão de Usuários | CRUD de usuários da empresa |
| `/configuracoes` | Configurações | Dados da empresa, plano, integrações |

---

## Gerente [G]

Acessa tudo do Admin exceto `/configuracoes` (financeiro) e `/usuarios` (criação de outros gerentes).

| Rota | Diferenças vs Admin |
|---|---|
| `/usuarios` | Pode criar Vendedor, Funcionário, Checkin, Mídia. Não cria Admin/Gerente |
| `/reservas` | Vê fila de "Solicitadas" com ação de aprovar/rejeitar em destaque |
| `/os/nova` | Pode criar OS e atribuir para Funcionário ou Checkin |
| `/midia` | Fila de auditoria de fotos (igual ao perfil Mídia) |

---

## Vendedor [V]

| Rota | Tela | Conteúdo |
|---|---|---|
| `/` | Dashboard Vendedor | Minhas reservas ativas, minhas solicitações pendentes |
| `/disponibilidade` | Consulta Disponibilidade | Filtros por tipo/cidade/período. Ver livres/ocupados |
| `/clientes` | Meus Clientes | Lista dos próprios clientes |
| `/clientes/novo` | Cadastrar Cliente | Form básico |
| `/clientes/[id]` | Detalhe do Cliente | Campanhas, reservas do cliente |
| `/campanhas/nova` | Nova Campanha | Vinculada ao cliente selecionado |
| `/reservas` | Minhas Reservas | Apenas as próprias (solicitadas + ativas + histórico) |
| `/reservas/nova` | Solicitar Reserva | 3 passos: 1. Escolher ponto 2. Período 3. Campanha |
| `/reservas/[id]` | Detalhe da Reserva | Status atual, motivo de rejeição se houver |
| `/checkins` | Checkins das minhas campanhas | Leitura: ver fotos aprovadas das próprias campanhas |

**Fluxo principal do Vendedor:**
```
Dashboard → Consulta Disponibilidade → Escolhe ponto
→ Solicitar Reserva (3 steps) → Aguarda aprovação → Notificado
```

---

## Funcionário [F]

Interface simplificada, 100% mobile-first.

| Rota | Tela | Conteúdo |
|---|---|---|
| `/` | Minhas OS | Lista de OS atribuídas. Filtro: Pendentes / Em execução / Concluídas |
| `/os/[id]` | Executar OS | Detalhes da OS, checklist de atividades, upload de fotos |
| `/os/[id]/fotos` | Galeria de fotos da OS | Fotos já enviadas, botão câmera |

**Fluxo principal do Funcionário:**
```
Login → Lista de OS → Abre OS → Inicia execução
→ Faz atividades → Upload de fotos (antes/durante/depois)
→ Marca como concluído → Status vai para auditoria
```

**Tela de OS `/os/[id]` — detalhes:**
- Nome do ponto + endereço + mapa estático
- Descrição do serviço
- Botão "Iniciar" (muda status para em_execucao)
- Seção de fotos: botão câmera nativo + galeria das enviadas
- Botão "Concluir e enviar para aprovação" (muda status para aguardando_auditoria)
- Desabilitado se não houver pelo menos 1 foto

---

## Checkin [C]

Interface ultra-simplificada. Câmera + GPS + mapa. Funciona offline.

| Rota | Tela | Conteúdo |
|---|---|---|
| `/` | Minhas OS de LED | Lista de OS checkin_led atribuídas. Badge offline/online |
| `/os/[id]` | Executar Checkin | Dados do ponto, botão GPS/Mapa, câmera, galeria |
| `/os/[id]/mapa` | Navegação GPS | Mapa com rota até o ponto (integra com Google Maps ou Apple Maps) |
| `/os/[id]/camera` | Câmera integrada | Câmera nativa do device, preview, confirmar envio |

**Fluxo principal do Checkin:**
```
Login → Lista OS → Abre OS → Vai ao mapa (GPS)
→ Chega no ponto → Abre câmera → Tira fotos/vídeo
→ [offline: salva local, sincroniza depois]
→ [online: upload imediato]
→ Conclui OS → Status vai para auditoria
```

**Comportamento offline:**
- Badge verde "Online" / vermelho "Offline" sempre visível
- Fotos na fila de sync exibem indicador "Aguardando envio"
- Ao reconectar: banner "X fotos sincronizadas com sucesso"

---

## Mídia [M]

Interface focada em auditoria visual.

| Rota | Tela | Conteúdo |
|---|---|---|
| `/` | Fila de Auditoria | Lista de OS com status aguardando_auditoria + contagem de fotos |
| `/midia/os/[id]` | Auditar OS | Galeria de fotos, comparação com arte da campanha, aprovar/reprovar |

**Tela de auditoria `/midia/os/[id]`:**
- Dados: cliente, campanha, ponto, período
- Arte da campanha (referência) lado a lado com fotos enviadas
- Cada foto mostra: thumbnail, data/hora, GPS, tipo (antes/durante/depois/checkin)
- Opção: aprovar tudo de uma vez OU selecionar fotos individuais para reprovar
- Botão "Aprovar OS" → confirma aprovação de todas as fotos
- Botão "Reprovar OS" → modal com textarea obrigatória para motivo
- Após ação: OS some da fila, aparece próxima

---

## Componentes compartilhados

| Componente | Usado em | Descrição |
|---|---|---|
| `CalendarioReservas` | Inventário, Detalhe do Ponto | Calendário visual por ponto com ocupação por tipo |
| `DisponibilidadeFiltros` | Consulta disponibilidade | Filtros + resultado em grid |
| `FotoUpload` | OS Funcionário, OS Checkin | Câmera nativa + drag-drop + preview + progresso |
| `MapaNavegacao` | OS Checkin | Mapa com pino do ponto + botão "Abrir no GPS" |
| `StatusBadge` | Reservas, OS | Chip colorido por status |
| `NotificacoesSino` | Header | Dropdown com notificações em tempo real |
| `PDFExportButton` | Detalhe OS | Gera e baixa o PDF de comprovação |
| `OfflineBanner` | Layout Checkin | Indicador de status de conexão + fila de sync |

---

## Navegação mobile (bottom tabs)

| Perfil | Tab 1 | Tab 2 | Tab 3 | Tab 4 |
|---|---|---|---|---|
| Admin/Gerente | Dashboard | Pontos | Reservas | OS |
| Vendedor | Dashboard | Disponibilidade | Reservas | Clientes |
| Funcionário | Minhas OS | — | — | Perfil |
| Checkin | Minhas OS | — | — | Perfil |
| Mídia | Fila Auditoria | — | — | Perfil |
