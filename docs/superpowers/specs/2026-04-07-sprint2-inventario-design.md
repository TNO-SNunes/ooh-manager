# Sprint 2 — Inventário de Pontos: Design Spec

**Data:** 2026-04-07  
**Status:** Aprovado  
**Próximo passo:** Implementação via writing-plans

---

## Escopo

CRUD completo de pontos de mídia (`pontos_midia`) com 4 tipos: Outdoor, Frontlight, Empena e LED/DOOH. Inclui lista com filtros e paginação, formulário único com campos condicionais por tipo, página de detalhe, upload de 1 foto por ponto, importação via Excel e exportação para Excel.

**Fora do escopo:** calendário de ocupação (entra no Sprint de reservas), múltiplas fotos por ponto, mapa interativo de pontos (futuro).

---

## 1. Migration 003

Adicionar campos que faltam na tabela `pontos_midia`. Os campos `sentido`, `bairro`, `municipio`, `numero_painel` já foram aplicados manualmente. Apenas `resolucao` foi adicionado depois.

O arquivo de migration documenta o estado completo:

```sql
-- app-src/supabase/migrations/003_pontos_campos_extras.sql
-- Campos adicionados ao pontos_midia para o Sprint 2
-- ATENÇÃO: sentido, bairro, municipio, numero_painel e resolucao
-- já foram aplicados manualmente no Supabase. Esta migration é
-- apenas documentação — NÃO executar novamente.

ALTER TABLE pontos_midia
  ADD COLUMN IF NOT EXISTS sentido       TEXT,
  ADD COLUMN IF NOT EXISTS bairro        TEXT,
  ADD COLUMN IF NOT EXISTS municipio     TEXT,
  ADD COLUMN IF NOT EXISTS numero_painel INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS resolucao     TEXT;
```

---

## 2. Arquitetura

- **Lista e detalhe** → Server Components (leitura direta do Supabase server-side)
- **Formulário** → Client Component (interatividade: campos condicionais por tipo, preview de foto)
- **Ações de criar/editar/excluir/importar/exportar** → Server Actions em `src/app/actions/pontos.ts`
- **Upload de foto** → Server Action que faz upload no Supabase Storage (bucket `pontos`) e salva a URL no registro
- **Import/Export Excel** → biblioteca `xlsx` (instalada como dependência)

---

## 3. Permissões por perfil

| Ação | Admin | Gerente | Mídia | Vendedor |
|---|:---:|:---:|:---:|:---:|
| Listar pontos | ✓ | ✓ | ✓ | — |
| Ver detalhe | ✓ | ✓ | ✓ | — |
| Criar ponto | ✓ | ✓ | — | — |
| Editar ponto | ✓ | ✓ | — | — |
| Excluir ponto | ✓ | — | — | — |
| Importar Excel | ✓ | ✓ | — | — |
| Exportar Excel | ✓ | ✓ | ✓ | — |

Vendedor acessa pontos apenas via `/disponibilidade` (Sprint 3).  
Funcionário e Checkin não têm acesso ao inventário.

---

## 4. Lista de pontos (`/inventario`)

### Filtros
- **Tipo** — select: Todos / Outdoor / Frontlight / Empena / LED
- **Município** — select populado com os municípios existentes no banco
- **Status** — select: Todos / Ativo / Inativo / Manutenção
- **Busca** — input de texto: filtra por código ou nome fantasia (ILIKE)

### Tabela

Colunas: **Código | Nome Fantasia | Tipo | Município | Status | Ações**

- **Nome Fantasia exibido** é gerado para leitura:
  - Outdoor: `{nome} - Tab. {numero_painel}`
  - Frontlight/Empena: `{nome} - Painel {numero_painel}`
  - LED: `{nome}`
- **Status** exibido como badge: verde (ativo), amarelo (manutenção), cinza (inativo)
- **Ações por perfil:**
  - Admin/Gerente: "Ver" + "Editar"
  - Mídia: apenas "Ver"

### Ações da página
- Botão **"Novo Ponto"** — Admin/Gerente apenas → `/inventario/novo`
- Botão **"Importar"** — Admin/Gerente → abre modal de upload Excel
- Botão **"Exportar"** — Admin/Gerente/Mídia → baixa Excel com pontos filtrados

### Paginação
20 pontos por página. Controles: anterior / próxima / número da página.

---

## 5. Formulário de cadastro/edição

**Rotas:**
- Criar: `/inventario/novo`
- Editar: `/inventario/[id]/editar`

Mesmo componente `PontoForm`. No modo edição, os campos são pré-populados.

### Bloco 1 — Identificação
- **Tipo** (select obrigatório — determina campos condicionais abaixo)
- **Nome Fantasia** (obrigatório)
- **Código** — gerado automaticamente ao digitar o município: `{3 letras município em maiúsculo}-{sequencial}` (ex: `RIO-001`, `SAO-003`, `NIT-001`). Editável.
- **Status** (select: Ativo / Inativo / Manutenção — padrão: Ativo)

### Bloco 2 — Localização
- Endereço (obrigatório)
- Sentido (ex: "sentido RJ", "sentido Jacarepaguá")
- Bairro
- Município (obrigatório)
- Cidade (obrigatório)
- Estado (obrigatório, 2 letras)
- Latitude (opcional, decimal — ex: -22.9068)
- Longitude (opcional, decimal — ex: -43.1729)

### Bloco 3 — Características (condicionais por tipo)

**Todos os tipos:**
- Largura (m) e Altura (m)
- Iluminação (toggle sim/não)

**Somente Outdoor:**
- Tabuleta Nº (numero_painel, inteiro ≥ 1, padrão 1)

**Somente Frontlight e Empena:**
- Painel Nº (numero_painel, inteiro ≥ 1, padrão 1)

**Somente LED:**
- Cotas totais (slots_totais, inteiro ≥ 1)
- Duração da cota — select: 10 segundos / 15 segundos (slot_duracao_s)
- Resolução (texto livre, ex: "1920x1080")

### Bloco 4 — Foto
- Upload de 1 imagem (JPG/PNG, máx 5MB)
- Preview após seleção
- Campo opcional
- Armazenada no bucket `pontos` do Supabase Storage
- URL salva em `fotos_urls[0]`

### Bloco 5 — Observações
- Textarea livre

### Validação server-side (Server Action)
- Obrigatórios: tipo, nome, endereco, municipio, cidade, estado
- LED: slots_totais ≥ 1; slot_duracao_s deve ser 10 ou 15
- Outdoor/Frontlight/Empena: numero_painel ≥ 1
- Código único por empresa (UNIQUE constraint no banco)
- Latitute/longitude: se um for preenchido, o outro também deve ser

### Comportamento pós-submit
- Sucesso: redirect para `/inventario/[id]`
- Erro: exibe mensagens inline por campo

---

## 6. Página de detalhe (`/inventario/[id]`)

**Layout:** duas colunas em desktop (foto à esquerda, dados à direita), coluna única em mobile.

### Coluna esquerda — Foto
- Foto do ponto em destaque (se existir)
- Placeholder "Sem foto cadastrada" se não houver
- Botão "Alterar foto" — Admin/Gerente apenas

### Coluna direita — Dados
- Código, Nome Fantasia, Tipo (badge), Status (badge colorido)
- Endereço completo: Endereço, Sentido, Bairro, Município, Cidade/Estado
- Dimensões (L × A m), Iluminação
- Tabuleta Nº ou Painel Nº (conforme tipo, se aplicável)
- Se LED: Cotas totais, Duração da cota, Resolução
- Coordenadas (se preenchidas)
- Observações

### Ações no topo
- **"← Voltar"** → `/inventario`
- **"Editar"** → `/inventario/[id]/editar` — Admin/Gerente
- **"Excluir"** — Admin apenas, abre modal de confirmação

### Regra de exclusão
Antes de excluir, verificar se existem reservas com `status IN ('solicitada', 'ativa')`:
- Se existir → erro: *"Este ponto não pode ser excluído pois possui reservas ativas ou pendentes."*
- Se não existir → deletar registro (e foto do Storage, se houver)

> **Nota técnica Sprint 5:** o banco tem `ON DELETE RESTRICT` em `reservas.ponto_id`, que bloqueia exclusão mesmo com reservas finalizadas. Ao implementar o módulo de reservas, avaliar alterar para `ON DELETE NO ACTION` com a validação de negócio no app.

---

## 7. Importação via Excel

### Fluxo
1. Usuário clica em "Importar" na lista de pontos
2. Modal abre com dois botões: **"Baixar template"** e **"Enviar planilha"**
3. Usuário baixa o template `.xlsx`, preenche e reenvia
4. Server Action valida linha por linha e insere em lote
5. Resultado exibido: N pontos importados, lista de erros por linha (se houver)

### Template Excel — colunas (nessa ordem)
`tipo | nome | codigo | status | endereco | sentido | bairro | municipio | cidade | estado | latitude | longitude | largura_m | altura_m | iluminacao | numero_painel | slots_totais | slot_duracao_s | resolucao | observacoes`

- `tipo`: outdoor / frontlight / empena / led (minúsculo)
- `status`: ativo / inativo / manutencao
- `iluminacao`: sim / não (ou 1 / 0)
- `codigo`: opcional — se em branco, gerado automaticamente
- Campos não aplicáveis ao tipo: deixar em branco

### Validação de importação
- Linha com tipo inválido → erro: "linha N — tipo inválido"
- Campos obrigatórios ausentes → erro por campo
- Código duplicado → erro: "linha N — código já existe"
- Fotos: não importadas (serão adicionadas manualmente pelo detalhe do ponto)

---

## 8. Exportação para Excel

- Exporta os pontos **conforme os filtros ativos** na lista
- Colunas: as mesmas do template de importação + `criado_em`
- Arquivo: `pontos-{data}.xlsx`
- Disponível para Admin, Gerente e Mídia

---

## 9. Arquivos a criar/modificar

```
app-src/src/
  app/
    actions/
      pontos.ts                    ← CRIAR: Server Actions (criar, editar, excluir, importar, exportar)
    (dashboard)/
      inventario/
        page.tsx                   ← MODIFICAR: lista real (substituir placeholder)
        novo/
          page.tsx                 ← CRIAR: página de criação
        [id]/
          page.tsx                 ← CRIAR: página de detalhe
          editar/
            page.tsx               ← CRIAR: página de edição
  components/
    inventario/
      ponto-form.tsx               ← CRIAR: formulário client component
      ponto-table.tsx              ← CRIAR: tabela com filtros
      ponto-detail.tsx             ← CRIAR: layout de detalhe
      import-modal.tsx             ← CRIAR: modal de importação
      delete-dialog.tsx            ← CRIAR: confirmação de exclusão
  lib/
    pontos/
      actions.ts                   ← CRIAR: lógica de negócio (validação, código automático)
      excel.ts                     ← CRIAR: geração e parsing de Excel (biblioteca xlsx)
app-src/supabase/migrations/
  003_pontos_campos_extras.sql     ← CRIAR: documentação da migration (ADD COLUMN IF NOT EXISTS)
```

---

## 10. Critérios de aceite

- [ ] Admin/Gerente cadastra ponto Outdoor com tabuleta, foto e coordenadas
- [ ] Admin/Gerente cadastra ponto LED com cotas, duração e resolução
- [ ] Campos condicionais aparecem/somem ao trocar o tipo no formulário
- [ ] Código é gerado automaticamente ao digitar o município (ex: RIO-001)
- [ ] Lista filtra por tipo, município e status corretamente
- [ ] Mídia vê a lista mas não tem botões de criar/editar
- [ ] Ponto com reserva ativa não pode ser excluído
- [ ] Template Excel pode ser baixado, preenchido e reimportado com sucesso
- [ ] Erros de importação são exibidos por linha
- [ ] Exportação gera arquivo `.xlsx` com os pontos filtrados
- [ ] Foto é exibida no detalhe e pode ser alterada por Admin/Gerente
