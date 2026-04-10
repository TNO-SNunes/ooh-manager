# Sprint 4+5 — Calendário de Ocupação + Fluxo de Reservas: Design Spec

**Data:** 2026-04-10  
**Status:** Aprovado  
**Próximo passo:** Implementação via writing-plans

---

## Escopo

Dois módulos integrados entregues num ciclo:

1. **Mapas de Ocupação** — visualização do calendário de reservas separado por tipo de veículo (Outdoor, Frontlight/Empena, LED)
2. **Fluxo de Reservas** — criação de reserva pelo vendedor (stepper 3 passos) + fila de aprovação pelo gerente

**Fora do escopo:** ordens de serviço (Sprint 6), comprovação fotográfica, relatório PDF, seed data de exemplo.

---

## 1. Navegação

Dois novos grupos de submenu no sidebar (arquivo `nav-items.ts`), visibilidade filtrada por perfil:

```
Mapa/Calendário                     → todos os perfis exceto Checkin/Funcionário
  ├── LED                           → /calendario/led
  ├── Frontlight & Empena           → /calendario/frontlight
  └── Outdoor                       → /calendario/outdoor

Reservas
  ├── Nova Reserva                  → /reservas/nova       (vendedor, gerente, admin)
  ├── Minhas Reservas               → /reservas/minhas     (vendedor)
  ├── Todas as Reservas             → /reservas            (gerente, admin)
  └── Fila de Aprovação             → /aprovacoes          (gerente, admin)
```

---

## 2. Mapas de Ocupação

### 2.1 Estrutura comum

Todas as três páginas compartilham:
- Filtros no topo: **período** (mês/ano início → fim) e **busca por ponto** (código ou endereço)
- Tabela com scroll horizontal para muitas colunas
- Coluna esquerda fixa (sticky) com nome/endereço do ponto
- Células renderizadas client-side a partir dos dados carregados via Server Action

### 2.2 Mapa Outdoor (`/calendario/outdoor`)

- **Colunas:** bissemanas do período filtrado — label `"1ª Jan/26"` / `"2ª Jan/26"` etc.
  - Geradas via `getBissemanasMes()` já existente em `validacoes.ts`
- **Linhas:** pontos do tipo `outdoor`
- **Célula ocupada:** fundo colorido por status + `[Cliente] · PI [numero] · [1º nome vendedor]`
- **Célula livre:** fundo branco

### 2.3 Mapa Frontlight & Empena (`/calendario/frontlight`)

- **Colunas:** meses do período filtrado — label `"Jan/26"`, `"Fev/26"` etc.
- **Linhas:** pontos do tipo `frontlight` e `empena` (juntos, com badge de tipo)
- **Célula:** pode conter múltiplos blocos quando uma campanha termina e outra começa no mesmo mês
  - Cada bloco: `[data_inicio]–[data_fim] · [Cliente] · PI [numero] · [1º nome vendedor]`
  - Célula livre exibe `LIBERADO` em verde

### 2.4 Mapa LED (`/calendario/led`)

- **Colunas:** meses do período filtrado
- **Linhas:** agrupadas por ponto → cada slot é uma linha (ex: ponto com 4 slots = 4 linhas com cabeçalho de grupo)
- **Célula:** `[Cliente · campanha] · [duração]min · [data_inicio]–[data_fim] · [1º nome vendedor]`

### 2.5 Esquema de cores

| Cor | Outdoor / Frontlight / Empena | LED |
|-----|-------------------------------|-----|
| Branco | Livre | Livre (sem reserva) |
| Verde | — | Veiculando (dentro do período contratado) |
| Vermelho | Reserva ativa (`ativa`) | Vencido (período encerrado) |
| Azul claro | Solicitada (`solicitada`) | Solicitada (`solicitada`) |
| Verde / "LIBERADO" | Célula livre (Frontlight/Empena) | — |

> **Nota:** Para o mapa LED, o sistema determina "veiculando" vs "vencido" comparando `data_fim` com a data atual no momento da renderização.

### 2.6 Server Action de dados dos mapas

Uma única server action `getOcupacaoMapa(tipo, dataInicio, dataFim)` que retorna:

```ts
{
  pontos: PontoMidia[]
  reservas: Reserva[]  // com joins: campanha → cliente, vendedor
}
```

Usa as RPCs existentes `ocupacoes_periodo` e `bloqueios_no_periodo` de `004_disponibilidade_rpc.sql` quando disponíveis, fallback para query direta via Supabase client server.

---

## 3. Fluxo de Nova Reserva (`/reservas/nova`)

Página dedicada com stepper de 3 passos. Estado do stepper gerenciado localmente com `useState` (não persiste em URL — complexidade desnecessária).

### Passo 1 — Escolher ponto

- Filtros: tipo de veículo (tabs), busca por código/endereço
- Lista paginada de pontos com badge de status geral: **Livre** / **Com pendência** / **Ocupado**
  - Badge calculado a partir da disponibilidade no período já selecionado (se o usuário voltou do passo 2)
- Ao selecionar um ponto: mini-card confirma tipo, endereço, dimensões

### Passo 2 — Período e configuração

Varia por tipo do ponto selecionado:

**Outdoor:**
- Seletor de mês + duas bissemanas clicáveis (`1ª quinzena` / `2ª quinzena`)
- Múltiplas bissemanas selecionáveis (geram múltiplas reservas ou reserva multi-período — ver nota abaixo)
- Validação via `validarOutdoor()` já existente

**Frontlight / Empena:**
- Date picker de intervalo livre
- Validação via `validarMinimo30Dias()` já existente
- Feedback inline: "X dias selecionados (mínimo 30)"

**LED:**
- Date picker de intervalo livre
- Grade visual de slots disponíveis no período: cada slot numerado como botão toggle
  - Slot disponível: clicável / Slot ocupado: desabilitado com tooltip "Ocupado por [cliente]"
- Mínimo 1 slot deve ser selecionado

Conflitos exibidos em tempo real: se o período selecionado colide com reserva `solicitada` ou `ativa`, exibe alerta amarelo com detalhes.

> **Decisão:** uma reserva = um período contínuo + um ponto + um slot (LED) ou nenhum slot (outros). Para Outdoor com múltiplas bissemanas selecionadas, criar múltiplos registros de reserva na mesma submissão.

### Passo 3 — Confirmar

- Resumo: ponto, período, cliente/campanha (selecionáveis aqui se não preenchidos), vendedor logado
- Dropdown de cliente → campanha vinculada (filtra campanhas do cliente)
- Botão "Solicitar Reserva" → cria registro(s) com `status = 'solicitada'`
- Redireciona para `/reservas/minhas` com toast de sucesso

---

## 4. Minhas Reservas e Todas as Reservas

### `/reservas/minhas` (vendedor)

- Tabela: ponto, tipo, cliente, campanha, período, status com badge colorido, data solicitação
- Filtro por status
- Clica na linha → Sheet com detalhes + opção de cancelar (se ainda `solicitada`)

### `/reservas` (gerente, admin)

- Igual a Minhas Reservas + coluna vendedor + filtro por vendedor
- Clica na linha → Sheet com detalhes completos

---

## 5. Fila de Aprovação (`/aprovacoes`)

### Página principal

- Tabela com reservas `solicitadas`: ponto, tipo, cliente, campanha, vendedor, período, data solicitação
- Ordenação: mais antigas primeiro (mais urgentes no topo)
- Clica na linha → Sheet lateral

### Sheet lateral de aprovação

- Detalhes completos da reserva
- Mini-preview: linha do ponto no mapa de ocupação para o período solicitado (componente reutilizado dos mapas)
- **Botão Aprovar** → `status = 'ativa'`, `aprovador_id`, `aprovado_em`
- **Botão Rejeitar** → obrigatório preencher `motivo_rejeicao` (textarea) antes de confirmar
- Histórico: criado em / solicitado por / aprovado/rejeitado por (se aplicável)

### Widget no dashboard do gerente

- Card "Aguardando Aprovação" com contador de reservas `solicitadas`
- Lista as 5 mais antigas: ponto + cliente + data solicitação
- Link "Ver todas" → `/aprovacoes`

---

## 6. Migration necessária

Nenhuma migration nova — o schema de `reservas` já está completo em `001_initial_schema.sql`. As RPCs de disponibilidade estão em `004_disponibilidade_rpc.sql` (pendente de aplicação manual no Supabase).

---

## 7. Componentes novos

| Componente | Responsabilidade |
|-----------|-----------------|
| `MapaOcupacao` | Tabela base reutilizada pelos 3 mapas (colunas, scroll, sticky col) |
| `CelulaReserva` | Renderiza célula com cor por status e texto resumido |
| `StepperReserva` | Container dos 3 passos com navegação e estado |
| `Passo1EscolhaPonto` | Lista + filtros de pontos |
| `Passo2PeriodoSlots` | Seletor de período adaptado por tipo |
| `Passo3Confirmacao` | Resumo + seleção cliente/campanha + submit |
| `SheetAprovacao` | Detalhes + ações de aprovar/rejeitar |
| `WidgetAprovacoesPendentes` | Card do dashboard do gerente |

---

## 8. Testes

- Lógica de cálculo de colunas (bissemanas, meses) para os mapas
- Lógica de determinação de cor por status e data (especialmente LED: veiculando vs vencido)
- Validações de período já cobertas em `validacoes.ts` (não duplicar)
- Server actions: criação de reserva, aprovação, rejeição (com e sem motivo)
- Controle de acesso por perfil nas server actions
