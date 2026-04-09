# Spec — Inventário: Sheet Lateral + Prefixo de Tipo no Código

**Data:** 2026-04-09  
**Status:** Aprovado para implementação

---

## Contexto

O inventário de pontos hoje navega para páginas separadas ao clicar em Ver (`/inventario/[id]`) ou Editar (`/inventario/[id]/editar`). O usuário perde o contexto da tabela (filtros, página). Além disso, o código gerado automaticamente não diferencia o tipo do ponto — todos seguem o padrão `MUN-001` independentemente de ser Outdoor, Frontlight, Empena ou LED.

Este spec cobre dois módulos independentes entregues na mesma sprint.

---

## Módulo 1 — Sheet Lateral na Tabela de Inventário

### Comportamento

Os botões **Ver** (ícone olho) e **Editar** (ícone lápis) na `PontoTable` deixam de navegar para outra página e passam a abrir um Sheet lateral sobre a tabela. A tabela permanece visível atrás do painel.

As rotas `/inventario/[id]` e `/inventario/[id]/editar` **continuam existindo** para acesso via URL direta (links externos, bookmarks).

### Sheet de Visualização

- Aberto pelo botão **Ver**
- Exibe os dados do ponto em modo somente leitura: código, nome, tipo, status, município, cidade, estado, endereço, latitude/longitude, face, formato, iluminação, slots totais (somente LED)
- Inclui botão **"Editar"** que fecha o Sheet de visualização e abre o Sheet de edição
- Fecha com Esc ou clicando fora do painel (overlay)

### Sheet de Edição

- Aberto pelo botão **Editar** na tabela, ou pelo botão "Editar" dentro do Sheet de visualização
- Exibe o formulário completo de edição (mesmo campos do `ponto-form.tsx` existente, adaptado para Sheet)
- Ao salvar com sucesso: Sheet fecha + `router.refresh()` atualiza os dados da tabela sem recarregar a página
- Em caso de erro de validação ou servidor: mensagem de erro aparece dentro do Sheet, sem fechar

### Gerenciamento de estado

`PontoTable` (Client Component) mantém estado local:

```typescript
type SheetMode = 'ver' | 'editar' | null
const [sheetPonto, setSheetPonto] = useState<PontoMidia | null>(null)
const [sheetMode, setSheetMode] = useState<SheetMode>(null)
```

- Botão Ver → `setSheetPonto(ponto); setSheetMode('ver')`
- Botão Editar → `setSheetPonto(ponto); setSheetMode('editar')`
- Fechar qualquer Sheet → `setSheetMode(null)` (mantém `sheetPonto` para animação de saída)
- "Editar" dentro do Sheet de Ver → `setSheetMode('editar')`

### Componentes novos

| Arquivo | Responsabilidade |
|---|---|
| `app-src/src/components/inventario/ponto-sheet-detalhe.tsx` | Client Component — Sheet de visualização somente leitura |
| `app-src/src/components/inventario/ponto-sheet-edicao.tsx` | Client Component — Sheet de edição com `useActionState` |

### Componente modificado

| Arquivo | Mudança |
|---|---|
| `app-src/src/components/inventario/ponto-table.tsx` | Adiciona estado `sheetPonto`/`sheetMode`; botões Ver/Editar disparam estado em vez de navegar; renderiza os dois Sheet components |

### O que NÃO muda

- `app-src/src/app/(dashboard)/inventario/[id]/page.tsx` — sem alteração
- `app-src/src/app/(dashboard)/inventario/[id]/editar/page.tsx` — sem alteração
- `app-src/src/app/actions/pontos.ts` — sem alteração
- `app-src/src/components/inventario/ponto-form.tsx` — sem alteração

### Nota sobre reúso de formulário

`ponto-sheet-edicao.tsx` **não importa** `ponto-form.tsx`. O `ponto-form.tsx` foi projetado para páginas standalone (com `redirect` após salvar). O Sheet usa o mesmo Server Action `editarPontoAction`, mas declara os campos diretamente e trata o sucesso fechando o Sheet + `router.refresh()` em vez de redirecionar.

### Componente Sheet disponível

O projeto usa `@base-ui/react`. O Sheet é implementado com o componente `Dialog` do base-ui, configurado para ancorar na lateral direita:

```tsx
// Padrão já existente no projeto (ver import-modal.tsx para referência)
import * as Dialog from '@base-ui-components/react/dialog'
```

O Sheet ocupa largura fixa de `480px` em desktop, tela cheia em mobile. Usa `position: fixed`, `right: 0`, `top: 0`, `height: 100vh`, com animação de entrada `translate-x`.

---

## Módulo 2 — Prefixo de Tipo no Código do Ponto

### Regra de geração

O código gerado automaticamente passa a seguir o formato `{PREFIXO}-{MUN}-{SEQ}`:

| Tipo | Prefixo | Exemplo | Sequência numérica |
|---|---|---|---|
| Outdoor | `T` | `T-RIO-001` | Independente por município |
| Frontlight | `F` | `F-RIO-001` | Compartilhada com Empena |
| Empena | `F` | `F-RIO-002` | Compartilhada com Frontlight |
| LED | `L` | `L-RIO-001` | Independente por município |

A sequência é por prefixo + município. Exemplo: `F-RIO-001` (frontlight) → próxima empena no Rio é `F-RIO-002`. LED no Rio é `L-RIO-001` (contador próprio). Outdoor no Rio é `T-RIO-001` (contador próprio).

### Função modificada

`gerarCodigo` em `app-src/src/lib/pontos/actions.ts` recebe um parâmetro adicional:

```typescript
// Antes
gerarCodigo(municipio: string, existentes: string[]): string

// Depois
gerarCodigo(municipio: string, tipo: TipoPonto, existentes: string[]): string
```

Mapa de prefixos (interno à função):

```typescript
const TIPO_PREFIXO: Record<TipoPonto, string> = {
  outdoor: 'T',
  frontlight: 'F',
  empena: 'F',
  led: 'L',
}
```

A filtragem de `existentes` usa o padrão `{PREFIXO}-{MUN}-` (ex: `F-RIO-`).

### Chamadores modificados

- `app-src/src/app/actions/pontos.ts` — `criarPontoAction` e `importarPontosAction` passam `dados.tipo` para `gerarCodigo`

### Pontos existentes

Pontos já cadastrados **não são alterados**. Apenas novos pontos criados após o deploy recebem o novo formato.

### Testes

Os testes existentes em `app-src/src/__tests__/lib/pontos-actions.test.ts` são atualizados para a nova assinatura. Novos casos adicionados:

- Outdoor gera `T-RIO-001`
- Frontlight gera `F-RIO-001`; Empena seguinte no mesmo município gera `F-RIO-002`
- LED gera `L-RIO-001`; não conflita com `F-RIO-001`
- Sequência independente: `T-RIO-001` e `F-RIO-001` podem coexistir sem conflito

---

## Critérios de aceite

1. Clicar em Ver na tabela abre Sheet lateral com dados somente leitura; tabela permanece visível atrás
2. Clicar em Editar abre Sheet com formulário; salvar fecha o Sheet e atualiza a tabela sem reload completo
3. "Editar" dentro do Sheet de visualização abre o Sheet de edição sem piscar
4. `/inventario/[id]` e `/inventario/[id]/editar` continuam funcionando normalmente
5. Novo ponto Outdoor criado em São Paulo recebe código `T-SAO-001`
6. Frontlight e Empena no mesmo município compartilham a sequência `F-`
7. LED em qualquer município recebe código `L-{MUN}-{SEQ}` independente dos outros tipos
8. Todos os testes passam: `cd app-src && npx vitest run`
9. Build limpo: `cd app-src && npm run build`
