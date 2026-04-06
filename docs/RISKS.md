# Riscos e Decisões de Arquitetura — OOH Manager

## Decisões que precisam ser tomadas antes de codar

---

### D1 — Estratégia de upload offline (Checkin)

**Contexto:** O Checkin tira fotos de LED em campo, frequentemente com sinal fraco ou sem internet.

**Opção A: BackgroundSync (Workbox)**
- Pros: nativo no navegador, funciona sem código extra, retry automático
- Contras: suporte limitado em iOS Safari (apenas Chrome/Android funciona bem)
- Risco: ~50% dos usuários iOS não terão upload offline funcional

**Opção B: IndexedDB + sync manual ao abrir o app**
- Pros: funciona em todos os browsers incluindo iOS Safari
- Contras: usuário precisa abrir o app com internet para disparar o sync

**Opção C: React Native / Capacitor**
- Pros: upload offline nativo, câmera com mais controle
- Contras: complexidade de build, App Store review, manutenção separada

**Decisão recomendada:** Opção B para MVP (IndexedDB + sync ao abrir) com fallback visual claro. Avaliar Capacitor na V2 se demanda de iOS for alta.

**Impacto no código:** `lib/offline/queue.ts` com IndexedDB. Hook `useOfflineQueue` que dispara sync no `window.online` event.

---

### D2 — Modelagem de slots LED

**Contexto:** Pontos LED aceitam múltiplos clientes simultâneos. Como modelar conflito de horário?

**Opção A: slots numerados fixos**
- `slot_numero` na tabela reservas (1, 2, 3... até slots_totais)
- Simples, fácil de visualizar no calendário
- Contras: e se o cliente quiser 2 slots? E se a duração for variável?

**Opção B: percentual de loop**
- Cada reserva tem `percentual_loop` (ex: 16.67% = 1/6 do loop)
- Mais flexível
- Contras: mais complexo de validar e exibir

**Decisão recomendada:** Opção A (slots numerados) para MVP. Simples e atende 95% dos casos. Adicionar `slots_quantidade` para o cliente reservar mais de 1 slot se necessário.

**Impacto:** campo `slot_numero` e `slots_quantidade` em reservas. Query de disponibilidade verifica `SUM(slots_quantidade) < pontos_midia.slots_totais`.

---

### D3 — Geração de PDF

**Contexto:** Relatório de comprovação com fotos. Pode ter 10-100 fotos por OS.

**Opção A: @react-pdf/renderer no browser**
- Pros: sem servidor dedicado, simples de implementar
- Contras: browser pode travar com muitas imagens grandes, sem suporte a HTML/CSS complexo

**Opção B: API Route com @react-pdf/renderer no servidor**
- Pros: não trava o browser, pode processar imagens server-side
- Contras: mais memória no servidor, tempo de resposta maior

**Opção C: Puppeteer (HTML → PDF)**
- Pros: layout perfeito (CSS real), mais fácil de customizar visualmente
- Contras: Puppeteer é pesado (~100MB), não roda bem no Vercel serverless

**Decisão recomendada:** Opção B para MVP (react-pdf na API Route com timeout de 30s). Se layout rico for necessário, mover para Opção C com servidor dedicado ou Browserless.io.

---

### D4 — Estratégia de RLS vs. filtros na API

**Contexto:** Isolamento de dados por perfil pode ser feito na API ou no banco (RLS).

**Decisão:** Dupla camada obrigatória:
1. API Route verifica perfil via JWT antes de executar query
2. RLS filtra no banco como backstop de segurança

Nunca confiar apenas na API. Nunca confiar apenas no RLS (para clareza do código).

**Impacto:** Todas as API Routes têm middleware `requireRole(['gerente', 'admin'])` antes da query.

---

### D5 — Concorrência no bloqueio de período (race condition)

**Contexto:** Dois vendedores podem tentar reservar o mesmo ponto ao mesmo tempo.

**Problema:** SELECT para verificar disponibilidade → INSERT da reserva. Entre as duas queries, outro vendedor pode inserir primeiro.

**Solução:** Usar transação com `SELECT FOR UPDATE` ou constraint de unicidade no banco.

```sql
-- Constraint de unicidade para pontos não-LED
-- (garante que não existem 2 reservas ativas para o mesmo ponto no mesmo período)
CREATE UNIQUE INDEX idx_reserva_exclusiva
  ON reservas (ponto_id, data_inicio, data_fim)
  WHERE status IN ('solicitada', 'ativa')
    AND slot_numero IS NULL;  -- apenas não-LED

-- Para LED: unicidade por slot
CREATE UNIQUE INDEX idx_reserva_led_slot
  ON reservas (ponto_id, slot_numero, data_inicio, data_fim)
  WHERE status IN ('solicitada', 'ativa')
    AND slot_numero IS NOT NULL;
```

Se a inserção violar o unique index, retornar erro 409 para o usuário.

---

### D6 — URLs de fotos assinadas vs. públicas

**Contexto:** Fotos de OS são dados sensíveis do cliente. Não devem ser acessíveis publicamente por URL.

**Decisão:** Usar URLs assinadas do Supabase Storage com expiração de 1 hora. Nunca armazenar URLs públicas na tabela `os_fotos`. Gerar sob demanda na API Route.

```typescript
// Nunca:
const url = supabase.storage.from('os-fotos').getPublicUrl(path)

// Sempre:
const { data } = await supabase.storage
  .from('os-fotos')
  .createSignedUrl(path, 3600) // 1 hora
```

**Impacto:** Campo `url_publica` em `os_fotos` é apenas cache temporário. A API sempre regenera.

---

## Riscos técnicos

| Risco | Probabilidade | Impacto | Mitigação |
|---|---|---|---|
| iOS Safari não suporta BackgroundSync | Alta | Alto (Checkin) | Usar IndexedDB sync manual (D1) |
| Supabase Storage lento no Brasil | Média | Médio | Testar latência cedo; alternativa: Cloudflare R2 |
| Muitas fotos travando geração de PDF | Média | Médio | Paginação no PDF, máximo de X fotos por página |
| Race condition em reservas concorrentes | Média | Alto | Unique index no banco (D5) |
| Vercel timeout 10s para PDFs pesados | Média | Médio | API Route com Vercel Pro (60s) ou Fluid compute |
| Volume de uploads simultâneos no campo | Baixa | Médio | Rate limiting + queue no Supabase |

---

## Riscos de produto

| Risco | Mitigação |
|---|---|
| Empresa não adota porque equipe de campo não usa smartphone | Garantir funcionalidade mínima em smartphones básicos Android |
| Cliente quer personalizar layout do PDF | Deixar template parametrizável desde o início (logo, cores) |
| Empresa tem centenas de pontos — calendário lento | Virtualização de lista + paginação no calendário |
| Múltiplas empresas precisam de isolamento total | RLS com `empresa_id` em todas as tabelas (já planejado) |
