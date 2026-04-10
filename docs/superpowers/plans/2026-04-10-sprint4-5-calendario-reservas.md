# Sprint 4+5 — Calendário de Ocupação + Fluxo de Reservas: Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar os 3 mapas de ocupação por tipo de veículo e o fluxo completo de reservas (criação pelo vendedor + aprovação pelo gerente).

**Architecture:** Server Actions para mutações e queries pesadas; componentes client para interatividade (tabelas, steppers, sheets). Lógica pura de calendário isolada em `lib/calendario/` para testabilidade. Reutiliza padrões existentes: `ActionState`, `Sheet`, `Table`, `useActionState`.

**Tech Stack:** Next.js 14 App Router, Supabase (server client), Tailwind CSS, shadcn/ui (@base-ui/react), Vitest, Lucide React

---

## Mapa de arquivos

**Criados:**
- `src/lib/calendario/colunas.ts` — funções puras: gerar colunas bissemanas/meses, determinar cor de célula
- `src/lib/calendario/colunas.test.ts` → `src/__tests__/lib/calendario-colunas.test.ts`
- `src/lib/reservas/validacoes-action.ts` — validação de campos do form de nova reserva
- `src/app/actions/reservas.ts` — server actions: criar, aprovar, rejeitar, cancelar reserva
- `src/components/calendario/mapa-ocupacao.tsx` — tabela base reutilizada pelos 3 mapas
- `src/components/calendario/celula-reserva.tsx` — célula colorida por status/tipo
- `src/components/calendario/filtros-mapa.tsx` — seletor de período + busca
- `src/components/reservas/stepper-reserva.tsx` — container dos 3 passos
- `src/components/reservas/passo1-ponto.tsx` — lista + filtros de pontos
- `src/components/reservas/passo2-periodo.tsx` — seletor de período por tipo
- `src/components/reservas/passo3-confirmar.tsx` — resumo + cliente/campanha + submit
- `src/components/reservas/reserva-table.tsx` — tabela de reservas (minhas + todas)
- `src/components/reservas/sheet-aprovacao.tsx` — detalhes + aprovar/rejeitar
- `src/components/aprovacoes/aprovacoes-client.tsx` — página de fila com sheet
- `src/components/dashboard/widget-aprovacoes.tsx` — card de pendências para gerente

**Modificados:**
- `src/components/layout/nav-items.ts` — adicionar submenu calendário + reservas
- `src/components/layout/office-sidebar.tsx` — suporte a subitens (submenu expansível)
- `src/app/(dashboard)/calendario/page.tsx` → deletado, substituído por subpastas
- `src/app/(dashboard)/calendario/led/page.tsx` — novo
- `src/app/(dashboard)/calendario/frontlight/page.tsx` — novo
- `src/app/(dashboard)/calendario/outdoor/page.tsx` — novo
- `src/app/(dashboard)/reservas/page.tsx` — substituir placeholder por página real (todas as reservas)
- `src/app/(dashboard)/reservas/minhas/page.tsx` — novo
- `src/app/(dashboard)/reservas/nova/page.tsx` — novo
- `src/app/(dashboard)/aprovacoes/page.tsx` — novo
- `src/app/(dashboard)/page.tsx` — adicionar widget de aprovações para gerente/admin
- `src/types/index.ts` — adicionar `ReservaComJoins`
- `src/__tests__/lib/nav-items.test.ts` — atualizar testes para novos hrefs
- `src/__tests__/lib/reservas-actions.test.ts` — novo

---

## Task 1: Lógica pura de colunas do calendário (TDD)

**Files:**
- Create: `app-src/src/lib/calendario/colunas.ts`
- Create: `app-src/src/__tests__/lib/calendario-colunas.test.ts`

- [ ] **Step 1: Escrever testes**

```ts
// app-src/src/__tests__/lib/calendario-colunas.test.ts
import { describe, it, expect } from 'vitest'
import {
  gerarColunasBissemanas,
  gerarColunasMeses,
  labelBissemana,
  labelMes,
  corCelulaOutdoor,
  corCelulaFrontlight,
  corCelulaLed,
} from '@/lib/calendario/colunas'

describe('gerarColunasBissemanas', () => {
  it('gera 2 colunas para um único mês', () => {
    const cols = gerarColunasBissemanas(2026, 1, 2026, 1)
    expect(cols).toHaveLength(2)
    expect(cols[0]).toEqual({ ano: 2026, mes: 1, quinzena: 1, inicio: '2026-01-01', fim: '2026-01-15' })
    expect(cols[1]).toEqual({ ano: 2026, mes: 1, quinzena: 2, inicio: '2026-01-16', fim: '2026-01-31' })
  })

  it('gera 4 colunas para dois meses', () => {
    const cols = gerarColunasBissemanas(2026, 1, 2026, 2)
    expect(cols).toHaveLength(4)
    expect(cols[2].inicio).toBe('2026-02-01')
    expect(cols[3].fim).toBe('2026-02-28')
  })

  it('fim de fevereiro em ano não-bissexto = dia 28', () => {
    const cols = gerarColunasBissemanas(2026, 2, 2026, 2)
    expect(cols[1].fim).toBe('2026-02-28')
  })

  it('fim de fevereiro em ano bissexto = dia 29', () => {
    const cols = gerarColunasBissemanas(2024, 2, 2024, 2)
    expect(cols[1].fim).toBe('2024-02-29')
  })
})

describe('gerarColunasMeses', () => {
  it('gera 3 meses', () => {
    const cols = gerarColunasMeses(2026, 1, 2026, 3)
    expect(cols).toHaveLength(3)
    expect(cols[0]).toEqual({ ano: 2026, mes: 1, label: 'Jan/26' })
    expect(cols[2]).toEqual({ ano: 2026, mes: 3, label: 'Mar/26' })
  })

  it('atravessa ano corretamente', () => {
    const cols = gerarColunasMeses(2025, 11, 2026, 2)
    expect(cols).toHaveLength(4)
    expect(cols[2].ano).toBe(2026)
    expect(cols[2].mes).toBe(1)
  })
})

describe('labelBissemana', () => {
  it('retorna "1ª Jan/26" para quinzena 1 do mês 1', () => {
    expect(labelBissemana(2026, 1, 1)).toBe('1ª Jan/26')
  })
  it('retorna "2ª Dez/25" para quinzena 2 do mês 12', () => {
    expect(labelBissemana(2025, 12, 2)).toBe('2ª Dez/25')
  })
})

describe('labelMes', () => {
  it('retorna "Abr/26" para mês 4', () => {
    expect(labelMes(2026, 4)).toBe('Abr/26')
  })
})

describe('corCelulaOutdoor', () => {
  it('sem reserva → branco', () => {
    expect(corCelulaOutdoor(null)).toBe('livre')
  })
  it('status ativa → vermelho', () => {
    expect(corCelulaOutdoor('ativa')).toBe('ativa')
  })
  it('status solicitada → azul', () => {
    expect(corCelulaOutdoor('solicitada')).toBe('solicitada')
  })
})

describe('corCelulaLed', () => {
  it('sem reserva → livre', () => {
    expect(corCelulaLed(null, '2026-04-01', '2026-04-30', '2026-04-15')).toBe('livre')
  })
  it('ativa dentro do período → veiculando', () => {
    expect(corCelulaLed('ativa', '2026-04-01', '2026-04-30', '2026-04-15')).toBe('veiculando')
  })
  it('ativa fora do período (vencida) → vencida', () => {
    expect(corCelulaLed('ativa', '2026-01-01', '2026-02-28', '2026-04-15')).toBe('vencida')
  })
  it('solicitada → solicitada independente de data', () => {
    expect(corCelulaLed('solicitada', '2026-04-01', '2026-04-30', '2026-04-15')).toBe('solicitada')
  })
})
```

- [ ] **Step 2: Rodar para confirmar falha**

```bash
cd app-src && npx vitest run src/__tests__/lib/calendario-colunas.test.ts
```
Expected: FAIL — módulo não encontrado

- [ ] **Step 3: Implementar**

```ts
// app-src/src/lib/calendario/colunas.ts

const MESES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

export interface ColunaBissemana {
  ano: number
  mes: number      // 1-12
  quinzena: number // 1 ou 2
  inicio: string   // YYYY-MM-DD
  fim: string      // YYYY-MM-DD
}

export interface ColunaMes {
  ano: number
  mes: number // 1-12
  label: string
}

function ultimoDiaMes(ano: number, mes: number): number {
  return new Date(ano, mes, 0).getDate() // mes já é 1-based, Date usa 0-based
}

function pad(n: number): string {
  return String(n).padStart(2, '0')
}

export function gerarColunasBissemanas(
  anoInicio: number, mesInicio: number,
  anoFim: number, mesFim: number
): ColunaBissemana[] {
  const cols: ColunaBissemana[] = []
  let ano = anoInicio
  let mes = mesInicio
  while (ano < anoFim || (ano === anoFim && mes <= mesFim)) {
    const ultimo = ultimoDiaMes(ano, mes)
    cols.push({
      ano, mes, quinzena: 1,
      inicio: `${ano}-${pad(mes)}-01`,
      fim: `${ano}-${pad(mes)}-15`,
    })
    cols.push({
      ano, mes, quinzena: 2,
      inicio: `${ano}-${pad(mes)}-16`,
      fim: `${ano}-${pad(mes)}-${pad(ultimo)}`,
    })
    mes++
    if (mes > 12) { mes = 1; ano++ }
  }
  return cols
}

export function gerarColunasMeses(
  anoInicio: number, mesInicio: number,
  anoFim: number, mesFim: number
): ColunaMes[] {
  const cols: ColunaMes[] = []
  let ano = anoInicio
  let mes = mesInicio
  while (ano < anoFim || (ano === anoFim && mes <= mesFim)) {
    cols.push({ ano, mes, label: labelMes(ano, mes) })
    mes++
    if (mes > 12) { mes = 1; ano++ }
  }
  return cols
}

export function labelBissemana(ano: number, mes: number, quinzena: number): string {
  return `${quinzena}ª ${MESES[mes - 1]}/${String(ano).slice(2)}`
}

export function labelMes(ano: number, mes: number): string {
  return `${MESES[mes - 1]}/${String(ano).slice(2)}`
}

export type CorCelula = 'livre' | 'ativa' | 'solicitada' | 'veiculando' | 'vencida'

export function corCelulaOutdoor(status: string | null): CorCelula {
  if (!status) return 'livre'
  if (status === 'solicitada') return 'solicitada'
  return 'ativa'
}

export function corCelulaFrontlight(status: string | null): CorCelula {
  return corCelulaOutdoor(status)
}

export function corCelulaLed(
  status: string | null,
  dataInicio: string,
  dataFim: string,
  hoje: string
): CorCelula {
  if (!status) return 'livre'
  if (status === 'solicitada') return 'solicitada'
  // ativa: veiculando se hoje está dentro do período, vencida se passou
  if (dataFim < hoje) return 'vencida'
  return 'veiculando'
}
```

- [ ] **Step 4: Rodar testes**

```bash
cd app-src && npx vitest run src/__tests__/lib/calendario-colunas.test.ts
```
Expected: todos passando

- [ ] **Step 5: Commit**

```bash
cd app-src && git add src/lib/calendario/colunas.ts src/__tests__/lib/calendario-colunas.test.ts
git commit -m "feat(calendario): funções puras de colunas e cores de célula"
```

---

## Task 2: Tipo `ReservaComJoins` + nav-items atualizado

**Files:**
- Modify: `app-src/src/types/index.ts`
- Modify: `app-src/src/components/layout/nav-items.ts`
- Modify: `app-src/src/components/layout/office-sidebar.tsx`
- Modify: `app-src/src/__tests__/lib/nav-items.test.ts`

- [ ] **Step 1: Adicionar tipo em `types/index.ts`**

Após a interface `Reserva` existente, adicionar:

```ts
export interface ReservaComJoins extends Reserva {
  ponto: PontoMidia
  campanha: Campanha & { cliente: Cliente }
  vendedor: Usuario
}
```

- [ ] **Step 2: Atualizar `nav-items.ts`**

Substituir o conteúdo completo por:

```ts
import {
  LayoutDashboard,
  MapPin,
  Building2,
  Megaphone,
  CalendarCheck,
  Calendar,
  CalendarSearch,
  ClipboardList,
  FileImage,
  Users,
  Settings,
  Tv2,
  Lightbulb,
  PanelTop,
  CheckSquare,
  PlusCircle,
  List,
  Clock,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { PerfilUsuario } from '@/types'

export type NavItem = {
  label: string
  href: string
  icon: LucideIcon
  children?: NavItem[]
}

export type NavSection = {
  title?: string
  items: NavItem[]
}

const ALL_SECTIONS: NavSection[] = [
  {
    items: [
      { label: 'Dashboard',       href: '/',               icon: LayoutDashboard },
      { label: 'Inventário',      href: '/inventario',     icon: MapPin },
      { label: 'Clientes',        href: '/clientes',       icon: Building2 },
      { label: 'Campanhas',       href: '/campanhas',      icon: Megaphone },
      {
        label: 'Mapa/Calendário', href: '/calendario',     icon: Calendar,
        children: [
          { label: 'LED',                href: '/calendario/led',        icon: Tv2 },
          { label: 'Frontlight & Empena',href: '/calendario/frontlight', icon: Lightbulb },
          { label: 'Outdoor',            href: '/calendario/outdoor',    icon: PanelTop },
        ],
      },
      {
        label: 'Reservas',        href: '/reservas',       icon: CalendarCheck,
        children: [
          { label: 'Nova Reserva',       href: '/reservas/nova',    icon: PlusCircle },
          { label: 'Minhas Reservas',    href: '/reservas/minhas',  icon: List },
          { label: 'Todas as Reservas',  href: '/reservas',         icon: CalendarCheck },
          { label: 'Fila de Aprovação',  href: '/aprovacoes',       icon: CheckSquare },
        ],
      },
      { label: 'Disponibilidade', href: '/disponibilidade',icon: CalendarSearch },
    ],
  },
  {
    title: 'Operacional',
    items: [
      { label: 'Ordens de Serviço', href: '/os',            icon: ClipboardList },
      { label: 'Relatórios',        href: '/relatorios',    icon: FileImage },
      { label: 'Usuários',          href: '/usuarios',      icon: Users },
      { label: 'Configurações',     href: '/configuracoes', icon: Settings },
    ],
  },
]

const ALLOWED: Record<PerfilUsuario, string[]> = {
  admin:    ['/', '/inventario', '/clientes', '/campanhas', '/calendario', '/calendario/led', '/calendario/frontlight', '/calendario/outdoor', '/reservas', '/reservas/nova', '/reservas/minhas', '/aprovacoes', '/disponibilidade', '/os', '/relatorios', '/usuarios', '/configuracoes'],
  gerente:  ['/', '/inventario', '/clientes', '/campanhas', '/calendario', '/calendario/led', '/calendario/frontlight', '/calendario/outdoor', '/reservas', '/reservas/nova', '/reservas/minhas', '/aprovacoes', '/disponibilidade', '/os', '/relatorios', '/usuarios', '/configuracoes'],
  vendedor: ['/', '/clientes', '/campanhas', '/calendario', '/calendario/led', '/calendario/frontlight', '/calendario/outdoor', '/reservas', '/reservas/nova', '/reservas/minhas', '/disponibilidade', '/relatorios', '/configuracoes'],
  midia:    ['/', '/inventario', '/clientes', '/campanhas', '/reservas', '/os', '/relatorios', '/configuracoes'],
  funcionario: [],
  checkin:     [],
}

function filterItems(items: NavItem[], allowed: Set<string>): NavItem[] {
  return items
    .filter(item => allowed.has(item.href))
    .map(item => ({
      ...item,
      children: item.children ? filterItems(item.children, allowed) : undefined,
    }))
}

export function getNavSections(perfil: PerfilUsuario): NavSection[] {
  const allowed = new Set(ALLOWED[perfil])
  return ALL_SECTIONS
    .map(section => ({ ...section, items: filterItems(section.items, allowed) }))
    .filter(section => section.items.length > 0)
}

export function getNavItems(perfil: PerfilUsuario): NavItem[] {
  return getNavSections(perfil).flatMap(s => s.items)
}
```

- [ ] **Step 3: Atualizar `office-sidebar.tsx` para renderizar subitens**

```tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getNavSections } from '@/components/layout/nav-items'
import type { NavItem, NavSection } from '@/components/layout/nav-items'
import type { PerfilUsuario } from '@/types'

function NavItemRow({ item, depth = 0 }: { item: NavItem; depth?: number }) {
  const pathname = usePathname()
  const hasChildren = item.children && item.children.length > 0
  const isActive = pathname === item.href
  const isChildActive = item.children?.some(c => pathname === c.href) ?? false
  const [open, setOpen] = useState(isChildActive)

  if (hasChildren) {
    return (
      <div>
        <button
          onClick={() => setOpen(o => !o)}
          className={cn(
            'flex w-full items-center gap-3 rounded-md mx-2 px-3 py-2 text-sm transition-colors',
            isChildActive
              ? 'bg-accent text-accent-foreground font-medium'
              : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
          )}
        >
          <item.icon className="h-4 w-4 shrink-0" />
          <span className="flex-1 text-left">{item.label}</span>
          {open ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        </button>
        {open && (
          <div className="ml-4">
            {item.children!.map(child => (
              <NavItemRow key={child.href} item={child} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <Link
      href={item.href}
      className={cn(
        'flex items-center gap-3 rounded-md mx-2 px-3 py-2 text-sm transition-colors',
        isActive
          ? 'bg-accent text-accent-foreground font-medium'
          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
      )}
    >
      <item.icon className="h-4 w-4 shrink-0" />
      {item.label}
    </Link>
  )
}

export function OfficeSidebar({ perfil }: { perfil: PerfilUsuario }) {
  const sections = getNavSections(perfil)

  return (
    <aside className="flex h-full w-60 flex-col border-r bg-background">
      <div className="flex h-14 items-center border-b px-4">
        <span className="text-sm font-bold tracking-tight">OOH Manager</span>
      </div>
      <nav className="flex-1 overflow-y-auto py-3">
        {sections.map((section: NavSection, i: number) => (
          <div key={i} className="mb-2">
            {section.title && (
              <p className="mb-1 px-4 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                {section.title}
              </p>
            )}
            {section.items.map(item => (
              <NavItemRow key={item.href} item={item} />
            ))}
          </div>
        ))}
      </nav>
    </aside>
  )
}
```

- [ ] **Step 4: Atualizar testes de nav-items**

Substituir o conteúdo de `app-src/src/__tests__/lib/nav-items.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { getNavItems, getNavSections } from '@/components/layout/nav-items'

describe('getNavItems', () => {
  it('admin recebe todos os itens de nível raiz incluindo calendário e reservas', () => {
    const hrefs = getNavItems('admin').map(i => i.href)
    expect(hrefs).toContain('/')
    expect(hrefs).toContain('/inventario')
    expect(hrefs).toContain('/clientes')
    expect(hrefs).toContain('/campanhas')
    expect(hrefs).toContain('/calendario')
    expect(hrefs).toContain('/reservas')
    expect(hrefs).toContain('/os')
    expect(hrefs).toContain('/relatorios')
    expect(hrefs).toContain('/usuarios')
    expect(hrefs).toContain('/configuracoes')
  })

  it('admin tem subitens de calendário', () => {
    const items = getNavItems('admin')
    const cal = items.find(i => i.href === '/calendario')
    expect(cal?.children?.map(c => c.href)).toEqual(
      expect.arrayContaining(['/calendario/led', '/calendario/frontlight', '/calendario/outdoor'])
    )
  })

  it('admin tem subitens de reservas incluindo aprovações', () => {
    const items = getNavItems('admin')
    const res = items.find(i => i.href === '/reservas')
    const hrefs = res?.children?.map(c => c.href) ?? []
    expect(hrefs).toContain('/reservas/nova')
    expect(hrefs).toContain('/reservas/minhas')
    expect(hrefs).toContain('/aprovacoes')
  })

  it('vendedor não tem /aprovacoes nem /inventario', () => {
    const items = getNavItems('vendedor')
    const res = items.find(i => i.href === '/reservas')
    const subHrefs = res?.children?.map(c => c.href) ?? []
    expect(subHrefs).not.toContain('/aprovacoes')
    const allHrefs = items.map(i => i.href)
    expect(allHrefs).not.toContain('/inventario')
  })

  it('vendedor tem subitem minhas reservas', () => {
    const items = getNavItems('vendedor')
    const res = items.find(i => i.href === '/reservas')
    expect(res?.children?.map(c => c.href)).toContain('/reservas/minhas')
  })

  it('midia não tem calendário', () => {
    const hrefs = getNavItems('midia').map(i => i.href)
    expect(hrefs).not.toContain('/calendario')
  })

  it('funcionario e checkin retornam lista vazia', () => {
    expect(getNavItems('funcionario')).toHaveLength(0)
    expect(getNavItems('checkin')).toHaveLength(0)
  })
})

describe('getNavSections', () => {
  it('retorna seções sem itens vazios', () => {
    const sections = getNavSections('vendedor')
    sections.forEach(section => {
      expect(section.items.length).toBeGreaterThan(0)
    })
  })
})
```

- [ ] **Step 5: Rodar testes**

```bash
cd app-src && npx vitest run src/__tests__/lib/nav-items.test.ts
```
Expected: todos passando

- [ ] **Step 6: Commit**

```bash
cd app-src && git add src/types/index.ts src/components/layout/nav-items.ts src/components/layout/office-sidebar.tsx src/__tests__/lib/nav-items.test.ts
git commit -m "feat(nav): submenu calendário e reservas + sidebar expansível"
```

---

## Task 3: Server Action de reservas

**Files:**
- Create: `app-src/src/lib/reservas/validacoes-action.ts`
- Create: `app-src/src/app/actions/reservas.ts`
- Create: `app-src/src/__tests__/lib/reservas-actions.test.ts`

- [ ] **Step 1: Criar validações de form**

```ts
// app-src/src/lib/reservas/validacoes-action.ts

export interface CamposReserva {
  ponto_id?: string
  campanha_id?: string
  data_inicio?: string
  data_fim?: string
  slot_numero?: number | null
  observacoes?: string | null
}

export function validarCamposReserva(campos: CamposReserva): Record<string, string> | null {
  const erros: Record<string, string> = {}

  if (!campos.ponto_id) erros.ponto_id = 'Ponto é obrigatório.'
  if (!campos.campanha_id) erros.campanha_id = 'Campanha é obrigatória.'
  if (!campos.data_inicio) erros.data_inicio = 'Data de início é obrigatória.'
  if (!campos.data_fim) erros.data_fim = 'Data de fim é obrigatória.'

  if (campos.data_inicio && campos.data_fim && campos.data_fim < campos.data_inicio) {
    erros.data_fim = 'Data de fim deve ser posterior à data de início.'
  }

  return Object.keys(erros).length > 0 ? erros : null
}
```

- [ ] **Step 2: Escrever testes das validações**

```ts
// app-src/src/__tests__/lib/reservas-actions.test.ts
import { describe, it, expect } from 'vitest'
import { validarCamposReserva } from '@/lib/reservas/validacoes-action'

describe('validarCamposReserva', () => {
  const base = {
    ponto_id: 'p1',
    campanha_id: 'c1',
    data_inicio: '2026-05-01',
    data_fim: '2026-05-15',
  }

  it('campos completos → null', () => {
    expect(validarCamposReserva(base)).toBeNull()
  })

  it('sem ponto_id → erro ponto_id', () => {
    const r = validarCamposReserva({ ...base, ponto_id: undefined })
    expect(r?.ponto_id).toBeDefined()
  })

  it('sem campanha_id → erro campanha_id', () => {
    const r = validarCamposReserva({ ...base, campanha_id: undefined })
    expect(r?.campanha_id).toBeDefined()
  })

  it('data_fim antes de data_inicio → erro data_fim', () => {
    const r = validarCamposReserva({ ...base, data_inicio: '2026-05-15', data_fim: '2026-05-01' })
    expect(r?.data_fim).toBeDefined()
  })
})
```

- [ ] **Step 3: Rodar testes para confirmar passagem**

```bash
cd app-src && npx vitest run src/__tests__/lib/reservas-actions.test.ts
```
Expected: todos passando

- [ ] **Step 4: Criar server action**

```ts
// app-src/src/app/actions/reservas.ts
'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { validarPeriodoPorTipo } from '@/lib/reservas/validacoes'
import { validarCamposReserva } from '@/lib/reservas/validacoes-action'
import type { TipoPonto } from '@/types'

export type ActionState = {
  error?: string
  fieldErrors?: Record<string, string>
  ok?: boolean
}

export async function criarReservaAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: perfil } = await supabase
    .from('usuarios')
    .select('empresa_id, perfil')
    .eq('id', user.id)
    .single()

  if (!perfil || !['admin', 'gerente', 'vendedor'].includes(perfil.perfil)) {
    return { error: 'Sem permissão para criar reservas.' }
  }

  const campos = {
    ponto_id: formData.get('ponto_id') as string || undefined,
    campanha_id: formData.get('campanha_id') as string || undefined,
    data_inicio: formData.get('data_inicio') as string || undefined,
    data_fim: formData.get('data_fim') as string || undefined,
    slot_numero: formData.get('slot_numero') ? Number(formData.get('slot_numero')) : null,
    observacoes: formData.get('observacoes') as string || null,
  }

  const fieldErrors = validarCamposReserva(campos)
  if (fieldErrors) return { fieldErrors }

  // Buscar tipo do ponto para validar período
  const { data: ponto } = await supabase
    .from('pontos_midia')
    .select('tipo')
    .eq('id', campos.ponto_id!)
    .eq('empresa_id', perfil.empresa_id)
    .single()

  if (!ponto) return { error: 'Ponto não encontrado.' }

  const validacao = validarPeriodoPorTipo(ponto.tipo as TipoPonto, {
    data_inicio: new Date(campos.data_inicio!),
    data_fim: new Date(campos.data_fim!),
  })
  if (!validacao.valido) return { error: validacao.erro }

  const { error } = await supabase.from('reservas').insert({
    empresa_id: perfil.empresa_id,
    ponto_id: campos.ponto_id,
    campanha_id: campos.campanha_id,
    vendedor_id: user.id,
    data_inicio: campos.data_inicio,
    data_fim: campos.data_fim,
    slot_numero: campos.slot_numero,
    observacoes: campos.observacoes,
    status: 'solicitada',
  })

  if (error) return { error: error.message }

  revalidatePath('/reservas')
  revalidatePath('/aprovacoes')
  return { ok: true }
}

export async function aprovarReservaAction(id: string): Promise<ActionState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: perfil } = await supabase
    .from('usuarios')
    .select('empresa_id, perfil')
    .eq('id', user.id)
    .single()

  if (!perfil || !['admin', 'gerente'].includes(perfil.perfil)) {
    return { error: 'Sem permissão para aprovar reservas.' }
  }

  const { error } = await supabase
    .from('reservas')
    .update({ status: 'ativa', aprovador_id: user.id, aprovado_em: new Date().toISOString() })
    .eq('id', id)
    .eq('empresa_id', perfil.empresa_id)
    .eq('status', 'solicitada')

  if (error) return { error: error.message }

  revalidatePath('/aprovacoes')
  revalidatePath('/reservas')
  return { ok: true }
}

export async function rejeitarReservaAction(
  id: string,
  motivo: string
): Promise<ActionState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  if (!motivo.trim()) return { error: 'Motivo de rejeição é obrigatório.' }

  const { data: perfil } = await supabase
    .from('usuarios')
    .select('empresa_id, perfil')
    .eq('id', user.id)
    .single()

  if (!perfil || !['admin', 'gerente'].includes(perfil.perfil)) {
    return { error: 'Sem permissão para rejeitar reservas.' }
  }

  const { error } = await supabase
    .from('reservas')
    .update({
      status: 'rejeitada',
      aprovador_id: user.id,
      aprovado_em: new Date().toISOString(),
      motivo_rejeicao: motivo.trim(),
    })
    .eq('id', id)
    .eq('empresa_id', perfil.empresa_id)
    .eq('status', 'solicitada')

  if (error) return { error: error.message }

  revalidatePath('/aprovacoes')
  revalidatePath('/reservas')
  return { ok: true }
}

export async function cancelarReservaAction(id: string): Promise<ActionState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: perfil } = await supabase
    .from('usuarios')
    .select('empresa_id, perfil')
    .eq('id', user.id)
    .single()

  if (!perfil) redirect('/login')

  // vendedor só cancela as próprias; gerente/admin cancela qualquer uma
  let query = supabase
    .from('reservas')
    .update({ status: 'cancelada' })
    .eq('id', id)
    .eq('empresa_id', perfil.empresa_id)
    .eq('status', 'solicitada')

  if (perfil.perfil === 'vendedor') {
    query = query.eq('vendedor_id', user.id)
  }

  const { error } = await query
  if (error) return { error: error.message }

  revalidatePath('/reservas')
  revalidatePath('/aprovacoes')
  return { ok: true }
}

export async function getReservasComJoins(
  empresaId: string,
  filtros: { vendedorId?: string; status?: string[] } = {}
) {
  const supabase = await createClient()

  let query = supabase
    .from('reservas')
    .select(`
      *,
      ponto:pontos_midia(*),
      campanha:campanhas(*, cliente:clientes(*)),
      vendedor:usuarios!reservas_vendedor_id_fkey(id, nome, perfil)
    `)
    .eq('empresa_id', empresaId)
    .order('solicitado_em', { ascending: false })

  if (filtros.vendedorId) query = query.eq('vendedor_id', filtros.vendedorId)
  if (filtros.status?.length) query = query.in('status', filtros.status)

  const { data, error } = await query
  if (error) throw error
  return data ?? []
}
```

- [ ] **Step 5: Commit**

```bash
cd app-src && git add src/lib/reservas/validacoes-action.ts src/app/actions/reservas.ts src/__tests__/lib/reservas-actions.test.ts
git commit -m "feat(reservas): server actions criar/aprovar/rejeitar/cancelar"
```

---

## Task 4: Server Action de dados dos mapas

**Files:**
- Create: `app-src/src/app/actions/mapa.ts`

- [ ] **Step 1: Criar**

```ts
// app-src/src/app/actions/mapa.ts
'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { TipoPonto, PontoMidia, ReservaComJoins } from '@/types'

export interface DadosMapa {
  pontos: PontoMidia[]
  reservas: ReservaComJoins[]
}

export async function getDadosMapa(
  tipo: TipoPonto | TipoPonto[],
  dataInicio: string,
  dataFim: string,
  busca?: string
): Promise<DadosMapa> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: perfil } = await supabase
    .from('usuarios')
    .select('empresa_id, perfil')
    .eq('id', user.id)
    .single()

  if (!perfil) redirect('/login')

  const tipos = Array.isArray(tipo) ? tipo : [tipo]

  let pontosQuery = supabase
    .from('pontos_midia')
    .select('*')
    .eq('empresa_id', perfil.empresa_id)
    .eq('status', 'ativo')
    .in('tipo', tipos)
    .order('codigo')

  if (busca) {
    pontosQuery = pontosQuery.or(`codigo.ilike.%${busca}%,nome.ilike.%${busca}%,endereco.ilike.%${busca}%`)
  }

  const { data: pontos } = await pontosQuery
  if (!pontos || pontos.length === 0) return { pontos: [], reservas: [] }

  const pontoIds = pontos.map(p => p.id)

  const { data: reservas } = await supabase
    .from('reservas')
    .select(`
      *,
      ponto:pontos_midia(*),
      campanha:campanhas(*, cliente:clientes(*)),
      vendedor:usuarios!reservas_vendedor_id_fkey(id, nome, perfil)
    `)
    .eq('empresa_id', perfil.empresa_id)
    .in('ponto_id', pontoIds)
    .in('status', ['solicitada', 'ativa', 'finalizada'])
    .lte('data_inicio', dataFim)
    .gte('data_fim', dataInicio)
    .order('data_inicio')

  return {
    pontos: pontos as PontoMidia[],
    reservas: (reservas ?? []) as unknown as ReservaComJoins[],
  }
}
```

- [ ] **Step 2: Commit**

```bash
cd app-src && git add src/app/actions/mapa.ts
git commit -m "feat(mapa): server action getDadosMapa"
```

---

## Task 5: Componentes base do calendário

**Files:**
- Create: `app-src/src/components/calendario/celula-reserva.tsx`
- Create: `app-src/src/components/calendario/filtros-mapa.tsx`
- Create: `app-src/src/components/calendario/mapa-ocupacao.tsx`

- [ ] **Step 1: `celula-reserva.tsx`**

```tsx
// app-src/src/components/calendario/celula-reserva.tsx
import { cn } from '@/lib/utils'
import type { CorCelula } from '@/lib/calendario/colunas'

const COR_CLASSES: Record<CorCelula, string> = {
  livre:      'bg-white dark:bg-background text-muted-foreground',
  ativa:      'bg-red-500 text-white',
  solicitada: 'bg-blue-200 text-blue-900',
  veiculando: 'bg-green-500 text-white',
  vencida:    'bg-red-500 text-white',
}

interface CelulaReservaProps {
  cor: CorCelula
  linhas?: string[]
  className?: string
}

export function CelulaReserva({ cor, linhas, className }: CelulaReservaProps) {
  if (cor === 'livre' || !linhas?.length) {
    return (
      <td className={cn('border px-2 py-1 text-xs text-center text-muted-foreground', className)}>
        —
      </td>
    )
  }

  return (
    <td className={cn('border px-2 py-1 text-xs align-top', COR_CLASSES[cor], className)}>
      {linhas.map((linha, i) => (
        <div key={i}>{linha}</div>
      ))}
    </td>
  )
}
```

- [ ] **Step 2: `filtros-mapa.tsx`**

```tsx
// app-src/src/components/calendario/filtros-mapa.tsx
'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useCallback, useRef, useTransition } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'

const MESES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

function monthOptions() {
  return MESES.map((m, i) => ({ value: String(i + 1), label: m }))
}

function yearOptions() {
  const now = new Date().getFullYear()
  return [now - 1, now, now + 1, now + 2].map(y => ({ value: String(y), label: String(y) }))
}

interface FiltrosMapaProps {
  mesInicio: number
  anoInicio: number
  mesFim: number
  anoFim: number
}

export function FiltrosMapa({ mesInicio, anoInicio, mesFim, anoFim }: FiltrosMapaProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const push = useCallback((updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString())
    for (const [k, v] of Object.entries(updates)) params.set(k, v)
    startTransition(() => router.push(`${pathname}?${params.toString()}`))
  }, [pathname, router, searchParams])

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm text-muted-foreground">De</span>
      <select
        className="h-8 rounded-md border px-2 text-sm"
        value={mesInicio}
        onChange={e => push({ mesInicio: e.target.value })}
        disabled={isPending}
      >
        {monthOptions().map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <select
        className="h-8 rounded-md border px-2 text-sm"
        value={anoInicio}
        onChange={e => push({ anoInicio: e.target.value })}
        disabled={isPending}
      >
        {yearOptions().map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>

      <span className="text-sm text-muted-foreground">até</span>
      <select
        className="h-8 rounded-md border px-2 text-sm"
        value={mesFim}
        onChange={e => push({ mesFim: e.target.value })}
        disabled={isPending}
      >
        {monthOptions().map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <select
        className="h-8 rounded-md border px-2 text-sm"
        value={anoFim}
        onChange={e => push({ anoFim: e.target.value })}
        disabled={isPending}
      >
        {yearOptions().map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>

      <Input
        placeholder="Buscar ponto…"
        defaultValue={searchParams.get('q') ?? ''}
        className="h-8 w-48"
        onChange={e => {
          if (debounceRef.current) clearTimeout(debounceRef.current)
          debounceRef.current = setTimeout(() => push({ q: e.target.value }), 400)
        }}
        disabled={isPending}
      />
    </div>
  )
}
```

- [ ] **Step 3: `mapa-ocupacao.tsx`**

```tsx
// app-src/src/components/calendario/mapa-ocupacao.tsx
import { cn } from '@/lib/utils'

export interface ColunaMapa {
  key: string
  label: string
}

export interface LinhaMapa {
  key: string
  label: string
  sublabel?: string
  cells: React.ReactNode[]
}

interface MapaOcupacaoProps {
  colunas: ColunaMapa[]
  linhas: LinhaMapa[]
  titulo?: string
}

export function MapaOcupacao({ colunas, linhas, titulo }: MapaOcupacaoProps) {
  if (linhas.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
        Nenhum ponto encontrado para os filtros selecionados.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-muted/50">
            <th className="sticky left-0 z-10 bg-muted/80 border px-3 py-2 text-left font-medium min-w-[200px]">
              {titulo ?? 'Localização'}
            </th>
            {colunas.map(col => (
              <th key={col.key} className="border px-2 py-2 text-center font-medium whitespace-nowrap min-w-[120px]">
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {linhas.map(linha => (
            <tr key={linha.key} className="hover:bg-muted/20">
              <td className="sticky left-0 z-10 bg-background border px-3 py-2 align-top">
                <div className="font-medium text-xs">{linha.label}</div>
                {linha.sublabel && (
                  <div className="text-[10px] text-muted-foreground mt-0.5">{linha.sublabel}</div>
                )}
              </td>
              {linha.cells}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
```

- [ ] **Step 4: Commit**

```bash
cd app-src && git add src/components/calendario/
git commit -m "feat(calendario): componentes base MapaOcupacao, CelulaReserva, FiltrosMapa"
```

---

## Task 6: Páginas dos 3 mapas

**Files:**
- Delete (via substituição): `app-src/src/app/(dashboard)/calendario/page.tsx`
- Create: `app-src/src/app/(dashboard)/calendario/led/page.tsx`
- Create: `app-src/src/app/(dashboard)/calendario/frontlight/page.tsx`
- Create: `app-src/src/app/(dashboard)/calendario/outdoor/page.tsx`

- [ ] **Step 1: Substituir `calendario/page.tsx` por redirect**

```tsx
// app-src/src/app/(dashboard)/calendario/page.tsx
import { redirect } from 'next/navigation'
export default function CalendarioPage() {
  redirect('/calendario/led')
}
```

- [ ] **Step 2: Criar `calendario/led/page.tsx`**

```tsx
// app-src/src/app/(dashboard)/calendario/led/page.tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getDadosMapa } from '@/app/actions/mapa'
import { gerarColunasMeses, labelMes, corCelulaLed } from '@/lib/calendario/colunas'
import { MapaOcupacao } from '@/components/calendario/mapa-ocupacao'
import { CelulaReserva } from '@/components/calendario/celula-reserva'
import { FiltrosMapa } from '@/components/calendario/filtros-mapa'
import type { ReservaComJoins, PontoMidia } from '@/types'

interface SearchParams {
  mesInicio?: string; anoInicio?: string
  mesFim?: string;    anoFim?: string
  q?: string
}

export default async function CalendarioLedPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const params = await searchParams
  const hoje = new Date()
  const mesInicio = parseInt(params.mesInicio ?? String(hoje.getMonth() + 1))
  const anoInicio = parseInt(params.anoInicio ?? String(hoje.getFullYear()))
  const mesFim    = parseInt(params.mesFim    ?? String(hoje.getMonth() + 3 > 12 ? 3 : hoje.getMonth() + 3))
  const anoFim    = parseInt(params.anoFim    ?? String(hoje.getFullYear()))

  const dataInicio = `${anoInicio}-${String(mesInicio).padStart(2,'0')}-01`
  const dataFim    = `${anoFim}-${String(mesFim).padStart(2,'0')}-31`
  const hojeStr    = hoje.toISOString().slice(0, 10)

  const { pontos, reservas } = await getDadosMapa('led', dataInicio, dataFim, params.q)
  const colunasMes = gerarColunasMeses(anoInicio, mesInicio, anoFim, mesFim)

  // Montar linhas: um ponto pode ter N slots
  const linhas = pontos.flatMap((ponto: PontoMidia) => {
    const slots = ponto.slots_totais ?? 1
    return Array.from({ length: slots }, (_, i) => {
      const slotNum = i + 1
      const cells = colunasMes.map(col => {
        const reserva = reservas.find((r: ReservaComJoins) =>
          r.ponto_id === ponto.id &&
          r.slot_numero === slotNum &&
          r.data_inicio.slice(0, 7) <= `${col.ano}-${String(col.mes).padStart(2,'0')}` &&
          r.data_fim.slice(0, 7) >= `${col.ano}-${String(col.mes).padStart(2,'0')}`
        )
        const cor = corCelulaLed(
          reserva?.status ?? null,
          reserva?.data_inicio ?? '',
          reserva?.data_fim ?? '',
          hojeStr
        )
        const vendedorNome = reserva?.vendedor?.nome?.split(' ')[0] ?? ''
        const linhasTexto = reserva ? [
          `${reserva.campanha?.cliente?.nome ?? '—'}`,
          reserva.campanha?.nome ?? '',
          `${reserva.data_inicio.slice(5).replace('-','/')} – ${reserva.data_fim.slice(5).replace('-','/')}`,
          vendedorNome,
        ].filter(Boolean) : []
        return <CelulaReserva key={col.key} cor={cor} linhas={linhasTexto} />
      })
      return {
        key: `${ponto.id}-slot${slotNum}`,
        label: `${ponto.codigo} — Slot ${slotNum}`,
        sublabel: ponto.endereco ?? ponto.nome,
        cells,
      }
    })
  })

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Mapa LED</h1>
      <FiltrosMapa
        mesInicio={mesInicio} anoInicio={anoInicio}
        mesFim={mesFim} anoFim={anoFim}
      />
      <MapaOcupacao
        titulo="Ponto / Slot"
        colunas={colunasMes.map(c => ({ key: `${c.ano}-${c.mes}`, label: c.label }))}
        linhas={linhas}
      />
    </div>
  )
}
```

- [ ] **Step 3: Criar `calendario/frontlight/page.tsx`**

```tsx
// app-src/src/app/(dashboard)/calendario/frontlight/page.tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getDadosMapa } from '@/app/actions/mapa'
import { gerarColunasMeses, corCelulaFrontlight } from '@/lib/calendario/colunas'
import { MapaOcupacao } from '@/components/calendario/mapa-ocupacao'
import { CelulaReserva } from '@/components/calendario/celula-reserva'
import { FiltrosMapa } from '@/components/calendario/filtros-mapa'
import type { ReservaComJoins, PontoMidia } from '@/types'

interface SearchParams {
  mesInicio?: string; anoInicio?: string
  mesFim?: string;    anoFim?: string
  q?: string
}

export default async function CalendarioFrontlightPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const params = await searchParams
  const hoje = new Date()
  const mesInicio = parseInt(params.mesInicio ?? String(hoje.getMonth() + 1))
  const anoInicio = parseInt(params.anoInicio ?? String(hoje.getFullYear()))
  const mesFim    = parseInt(params.mesFim    ?? String(hoje.getMonth() + 3 > 12 ? 3 : hoje.getMonth() + 3))
  const anoFim    = parseInt(params.anoFim    ?? String(hoje.getFullYear()))

  const dataInicio = `${anoInicio}-${String(mesInicio).padStart(2,'0')}-01`
  const dataFim    = `${anoFim}-${String(mesFim).padStart(2,'0')}-31`

  const { pontos, reservas } = await getDadosMapa(['frontlight', 'empena'], dataInicio, dataFim, params.q)
  const colunasMes = gerarColunasMeses(anoInicio, mesInicio, anoFim, mesFim)

  const linhas = pontos.map((ponto: PontoMidia) => {
    const cells = colunasMes.map(col => {
      const colInicio = `${col.ano}-${String(col.mes).padStart(2,'0')}-01`
      const colFim    = `${col.ano}-${String(col.mes).padStart(2,'0')}-31`

      // Pode haver múltiplas reservas sobrepostas ao mês
      const reservasMes = reservas.filter((r: ReservaComJoins) =>
        r.ponto_id === ponto.id &&
        r.data_inicio <= colFim &&
        r.data_fim >= colInicio
      )

      if (reservasMes.length === 0) {
        return <CelulaReserva key={col.key} cor="livre" />
      }

      // Mostrar a de maior prioridade como cor da célula (solicitada > ativa)
      const cor = reservasMes.some(r => r.status === 'solicitada')
        ? corCelulaFrontlight('solicitada')
        : corCelulaFrontlight('ativa')

      const linhasTexto = reservasMes.flatMap(r => [
        `${r.data_inicio.slice(5).replace('-','/')}–${r.data_fim.slice(5).replace('-','/')}`,
        `${r.campanha?.cliente?.nome ?? '—'}`,
        r.vendedor?.nome?.split(' ')[0] ?? '',
      ])

      return <CelulaReserva key={col.key} cor={cor} linhas={linhasTexto} />
    })

    return {
      key: ponto.id,
      label: `${ponto.codigo} (${ponto.tipo})`,
      sublabel: ponto.endereco ?? ponto.nome,
      cells,
    }
  })

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Mapa Frontlight & Empena</h1>
      <FiltrosMapa
        mesInicio={mesInicio} anoInicio={anoInicio}
        mesFim={mesFim} anoFim={anoFim}
      />
      <MapaOcupacao
        colunas={colunasMes.map(c => ({ key: `${c.ano}-${c.mes}`, label: c.label }))}
        linhas={linhas}
      />
    </div>
  )
}
```

- [ ] **Step 4: Criar `calendario/outdoor/page.tsx`**

```tsx
// app-src/src/app/(dashboard)/calendario/outdoor/page.tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getDadosMapa } from '@/app/actions/mapa'
import { gerarColunasBissemanas, labelBissemana, corCelulaOutdoor } from '@/lib/calendario/colunas'
import { MapaOcupacao } from '@/components/calendario/mapa-ocupacao'
import { CelulaReserva } from '@/components/calendario/celula-reserva'
import { FiltrosMapa } from '@/components/calendario/filtros-mapa'
import type { ReservaComJoins, PontoMidia } from '@/types'

interface SearchParams {
  mesInicio?: string; anoInicio?: string
  mesFim?: string;    anoFim?: string
  q?: string
}

export default async function CalendarioOutdoorPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const params = await searchParams
  const hoje = new Date()
  const mesInicio = parseInt(params.mesInicio ?? String(hoje.getMonth() + 1))
  const anoInicio = parseInt(params.anoInicio ?? String(hoje.getFullYear()))
  const mesFim    = parseInt(params.mesFim    ?? String(hoje.getMonth() + 3 > 12 ? 3 : hoje.getMonth() + 3))
  const anoFim    = parseInt(params.anoFim    ?? String(hoje.getFullYear()))

  const dataInicio = `${anoInicio}-${String(mesInicio).padStart(2,'0')}-01`
  const dataFim    = `${anoFim}-${String(mesFim).padStart(2,'0')}-31`

  const { pontos, reservas } = await getDadosMapa('outdoor', dataInicio, dataFim, params.q)
  const colunasBissemanas = gerarColunasBissemanas(anoInicio, mesInicio, anoFim, mesFim)

  const linhas = pontos.map((ponto: PontoMidia) => {
    const cells = colunasBissemanas.map(col => {
      const reserva = reservas.find((r: ReservaComJoins) =>
        r.ponto_id === ponto.id &&
        r.data_inicio === col.inicio &&
        r.data_fim === col.fim
      )
      const cor = corCelulaOutdoor(reserva?.status ?? null)
      const vendedorNome = reserva?.vendedor?.nome?.split(' ')[0] ?? ''
      const linhasTexto = reserva ? [
        reserva.campanha?.cliente?.nome ?? '—',
        `PI ${(reserva.campanha as any)?.numero_pi ?? '—'}`,
        vendedorNome,
      ].filter(Boolean) : []
      return <CelulaReserva key={col.inicio} cor={cor} linhas={linhasTexto} />
    })

    return {
      key: ponto.id,
      label: ponto.codigo,
      sublabel: ponto.endereco ?? ponto.nome,
      cells,
    }
  })

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Mapa Outdoor</h1>
      <FiltrosMapa
        mesInicio={mesInicio} anoInicio={anoInicio}
        mesFim={mesFim} anoFim={anoFim}
      />
      <MapaOcupacao
        colunas={colunasBissemanas.map(c => ({
          key: c.inicio,
          label: labelBissemana(c.ano, c.mes, c.quinzena),
        }))}
        linhas={linhas}
      />
    </div>
  )
}
```

- [ ] **Step 5: Commit**

```bash
cd app-src && git add src/app/\(dashboard\)/calendario/
git commit -m "feat(calendario): páginas LED, Frontlight/Empena e Outdoor"
```

---

## Task 7: Stepper de nova reserva

**Files:**
- Create: `app-src/src/components/reservas/passo1-ponto.tsx`
- Create: `app-src/src/components/reservas/passo2-periodo.tsx`
- Create: `app-src/src/components/reservas/passo3-confirmar.tsx`
- Create: `app-src/src/components/reservas/stepper-reserva.tsx`
- Create: `app-src/src/app/(dashboard)/reservas/nova/page.tsx`

- [ ] **Step 1: `passo1-ponto.tsx`**

```tsx
// app-src/src/components/reservas/passo1-ponto.tsx
'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { PontoMidia } from '@/types'

const TIPO_LABEL: Record<string, string> = {
  outdoor: 'Outdoor', frontlight: 'Frontlight', empena: 'Empena', led: 'LED',
}

interface Passo1Props {
  pontos: PontoMidia[]
  pontoSelecionado: PontoMidia | null
  onSelecionar: (ponto: PontoMidia) => void
  onProximo: () => void
}

export function Passo1EscolhaPonto({ pontos, pontoSelecionado, onSelecionar, onProximo }: Passo1Props) {
  const [busca, setBusca] = useState('')
  const [tipoFiltro, setTipoFiltro] = useState<string>('todos')

  const filtrados = pontos.filter(p => {
    const matchTipo = tipoFiltro === 'todos' || p.tipo === tipoFiltro
    const matchBusca = !busca || 
      p.codigo.toLowerCase().includes(busca.toLowerCase()) ||
      (p.endereco ?? '').toLowerCase().includes(busca.toLowerCase()) ||
      (p.nome ?? '').toLowerCase().includes(busca.toLowerCase())
    return matchTipo && matchBusca
  })

  return (
    <div className="space-y-4">
      <h2 className="font-medium">Passo 1 — Escolher ponto</h2>

      <div className="flex flex-wrap gap-2">
        {['todos','outdoor','frontlight','empena','led'].map(t => (
          <Button
            key={t}
            variant={tipoFiltro === t ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTipoFiltro(t)}
          >
            {t === 'todos' ? 'Todos' : TIPO_LABEL[t]}
          </Button>
        ))}
      </div>

      <Input
        placeholder="Buscar por código ou endereço…"
        value={busca}
        onChange={e => setBusca(e.target.value)}
        className="h-8 max-w-sm"
      />

      <div className="max-h-[400px] overflow-y-auto rounded-lg border divide-y">
        {filtrados.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            Nenhum ponto encontrado.
          </div>
        ) : filtrados.map(ponto => (
          <button
            key={ponto.id}
            onClick={() => onSelecionar(ponto)}
            className={`w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors ${
              pontoSelecionado?.id === ponto.id ? 'bg-accent' : ''
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm">{ponto.codigo}</span>
              <Badge variant="outline" className="text-xs">{TIPO_LABEL[ponto.tipo]}</Badge>
              {ponto.slots_totais && (
                <Badge variant="outline" className="text-xs">{ponto.slots_totais} slots</Badge>
              )}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              {ponto.endereco ?? ponto.nome}
            </div>
          </button>
        ))}
      </div>

      <div className="flex justify-end">
        <Button onClick={onProximo} disabled={!pontoSelecionado}>
          Próximo
        </Button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: `passo2-periodo.tsx`**

```tsx
// app-src/src/components/reservas/passo2-periodo.tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { normalizarBissemana } from '@/lib/reservas/validacoes'
import { validarPeriodoPorTipo } from '@/lib/reservas/validacoes'
import type { PontoMidia } from '@/types'

interface Passo2Props {
  ponto: PontoMidia
  dataInicio: string
  dataFim: string
  slotNumero: number | null
  onDataInicio: (v: string) => void
  onDataFim: (v: string) => void
  onSlot: (v: number | null) => void
  onVoltar: () => void
  onProximo: () => void
  // slots ocupados no período: número do slot
  slotsOcupados?: number[]
}

export function Passo2Periodo({
  ponto, dataInicio, dataFim, slotNumero,
  onDataInicio, onDataFim, onSlot,
  onVoltar, onProximo, slotsOcupados = [],
}: Passo2Props) {
  const [erro, setErro] = useState<string | null>(null)

  function handleProximo() {
    const validacao = validarPeriodoPorTipo(ponto.tipo, {
      data_inicio: new Date(dataInicio),
      data_fim: new Date(dataFim),
    })
    if (!validacao.valido) { setErro(validacao.erro ?? 'Período inválido.'); return }
    if (ponto.tipo === 'led' && !slotNumero) { setErro('Selecione um slot.'); return }
    setErro(null)
    onProximo()
  }

  const diffDias = dataInicio && dataFim
    ? Math.ceil((new Date(dataFim).getTime() - new Date(dataInicio).getTime()) / 86400000) + 1
    : 0

  return (
    <div className="space-y-4">
      <h2 className="font-medium">Passo 2 — Período{ponto.tipo === 'led' ? ' e slot' : ''}</h2>
      <p className="text-sm text-muted-foreground">
        Ponto: <strong>{ponto.codigo}</strong> ({ponto.tipo})
      </p>

      {ponto.tipo === 'outdoor' ? (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Selecione uma bissemana (1–15 ou 16–último do mês):
          </p>
          <div className="flex gap-2">
            <div className="space-y-1.5">
              <Label>Data início</Label>
              <Input
                type="date"
                value={dataInicio}
                onChange={e => {
                  const d = new Date(e.target.value)
                  const bissemana = normalizarBissemana(d)
                  onDataInicio(bissemana.data_inicio.toISOString().slice(0,10))
                  onDataFim(bissemana.data_fim.toISOString().slice(0,10))
                }}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Data fim (auto)</Label>
              <Input type="date" value={dataFim} disabled />
            </div>
          </div>
        </div>
      ) : (
        <div className="flex gap-2">
          <div className="space-y-1.5">
            <Label>Data início</Label>
            <Input type="date" value={dataInicio} onChange={e => onDataInicio(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Data fim</Label>
            <Input type="date" value={dataFim} onChange={e => onDataFim(e.target.value)} />
          </div>
        </div>
      )}

      {(ponto.tipo === 'frontlight' || ponto.tipo === 'empena') && diffDias > 0 && (
        <p className={`text-sm ${diffDias >= 30 ? 'text-green-600' : 'text-destructive'}`}>
          {diffDias} dias selecionados (mínimo 30)
        </p>
      )}

      {ponto.tipo === 'led' && (ponto.slots_totais ?? 0) > 0 && (
        <div className="space-y-2">
          <Label>Slot</Label>
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: ponto.slots_totais! }, (_, i) => i + 1).map(n => {
              const ocupado = slotsOcupados.includes(n)
              return (
                <Button
                  key={n}
                  variant={slotNumero === n ? 'default' : 'outline'}
                  size="sm"
                  disabled={ocupado}
                  onClick={() => onSlot(n)}
                  title={ocupado ? 'Slot ocupado no período' : `Slot ${n}`}
                >
                  Slot {n}
                </Button>
              )
            })}
          </div>
        </div>
      )}

      {erro && (
        <p className="text-sm text-destructive">{erro}</p>
      )}

      <div className="flex justify-between">
        <Button variant="outline" onClick={onVoltar}>Voltar</Button>
        <Button onClick={handleProximo}>Próximo</Button>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: `passo3-confirmar.tsx`**

```tsx
// app-src/src/components/reservas/passo3-confirmar.tsx
'use client'

import { useActionState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { criarReservaAction, type ActionState } from '@/app/actions/reservas'
import type { PontoMidia, Cliente, Campanha } from '@/types'

interface Passo3Props {
  ponto: PontoMidia
  dataInicio: string
  dataFim: string
  slotNumero: number | null
  clientes: Cliente[]
  campanhasPorCliente: Record<string, Campanha[]>
  onVoltar: () => void
}

export function Passo3Confirmar({
  ponto, dataInicio, dataFim, slotNumero,
  clientes, campanhasPorCliente, onVoltar,
}: Passo3Props) {
  const router = useRouter()
  const [clienteSelecionado, setClienteSelecionado] = useStateString('')
  const [campanhas, setCampanhas] = useStateArray<Campanha>([])

  // Não podemos usar hooks condicionais — declarar todos no topo
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    criarReservaAction,
    {}
  )

  useEffect(() => {
    if (state.ok) {
      router.push('/reservas/minhas')
    }
  }, [state.ok, router])

  function handleClienteChange(id: string) {
    setClienteSelecionado(id)
    setCampanhas(campanhasPorCliente[id] ?? [])
  }

  return (
    <div className="space-y-4">
      <h2 className="font-medium">Passo 3 — Confirmar reserva</h2>

      <div className="rounded-lg border p-4 space-y-1 text-sm">
        <div><span className="text-muted-foreground">Ponto:</span> {ponto.codigo} — {ponto.tipo}</div>
        <div><span className="text-muted-foreground">Endereço:</span> {ponto.endereco ?? ponto.nome}</div>
        <div><span className="text-muted-foreground">Período:</span> {dataInicio} → {dataFim}</div>
        {slotNumero && <div><span className="text-muted-foreground">Slot:</span> {slotNumero}</div>}
      </div>

      <form action={formAction} className="space-y-4">
        <input type="hidden" name="ponto_id" value={ponto.id} />
        <input type="hidden" name="data_inicio" value={dataInicio} />
        <input type="hidden" name="data_fim" value={dataFim} />
        {slotNumero && <input type="hidden" name="slot_numero" value={slotNumero} />}

        {state.error && (
          <div className="rounded-lg border border-destructive bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {state.error}
          </div>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="p3-cliente">Cliente <span className="text-destructive">*</span></Label>
          <select
            id="p3-cliente"
            className="h-9 w-full rounded-md border px-3 text-sm"
            value={clienteSelecionado}
            onChange={e => handleClienteChange(e.target.value)}
            disabled={pending}
          >
            <option value="">Selecione…</option>
            {clientes.map(c => (
              <option key={c.id} value={c.id}>{c.nome}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="p3-campanha">Campanha <span className="text-destructive">*</span></Label>
          <select
            id="p3-campanha"
            name="campanha_id"
            className="h-9 w-full rounded-md border px-3 text-sm"
            disabled={!clienteSelecionado || pending}
          >
            <option value="">Selecione…</option>
            {campanhas.map(c => (
              <option key={c.id} value={c.id}>{c.nome}</option>
            ))}
          </select>
          {state.fieldErrors?.campanha_id && (
            <p className="text-xs text-destructive">{state.fieldErrors.campanha_id}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="p3-obs">Observações</Label>
          <Textarea id="p3-obs" name="observacoes" rows={2} disabled={pending} />
        </div>

        <div className="flex justify-between">
          <Button type="button" variant="outline" onClick={onVoltar} disabled={pending}>
            Voltar
          </Button>
          <Button type="submit" disabled={pending}>
            {pending ? 'Solicitando…' : 'Solicitar Reserva'}
          </Button>
        </div>
      </form>
    </div>
  )
}

// Mini helpers locais para evitar re-render bugs com useState genérico
function useStateString(initial: string) {
  const [v, set] = useState(initial)
  return [v, set] as const
}
function useStateArray<T>(initial: T[]) {
  const [v, set] = useState<T[]>(initial)
  return [v, set] as const
}
// Note: useState is imported from react — add to imports
import { useState } from 'react'
```

- [ ] **Step 4: `stepper-reserva.tsx`**

```tsx
// app-src/src/components/reservas/stepper-reserva.tsx
'use client'

import { useState } from 'react'
import { Passo1EscolhaPonto } from './passo1-ponto'
import { Passo2Periodo } from './passo2-periodo'
import { Passo3Confirmar } from './passo3-confirmar'
import type { PontoMidia, Cliente, Campanha } from '@/types'

const PASSOS = ['Escolher ponto', 'Período', 'Confirmar']

interface StepperReservaProps {
  pontos: PontoMidia[]
  clientes: Cliente[]
  campanhasPorCliente: Record<string, Campanha[]>
}

export function StepperReserva({ pontos, clientes, campanhasPorCliente }: StepperReservaProps) {
  const [passo, setPasso] = useState(0)
  const [ponto, setPonto] = useState<PontoMidia | null>(null)
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')
  const [slotNumero, setSlotNumero] = useState<number | null>(null)

  return (
    <div className="space-y-6">
      {/* Indicador de passos */}
      <div className="flex items-center gap-2">
        {PASSOS.map((label, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium ${
              i === passo
                ? 'bg-primary text-primary-foreground'
                : i < passo
                ? 'bg-primary/30 text-primary'
                : 'bg-muted text-muted-foreground'
            }`}>
              {i + 1}
            </div>
            <span className={`text-sm ${i === passo ? 'font-medium' : 'text-muted-foreground'}`}>
              {label}
            </span>
            {i < PASSOS.length - 1 && <div className="h-px w-8 bg-border" />}
          </div>
        ))}
      </div>

      {/* Conteúdo do passo */}
      {passo === 0 && (
        <Passo1EscolhaPonto
          pontos={pontos}
          pontoSelecionado={ponto}
          onSelecionar={setPonto}
          onProximo={() => setPasso(1)}
        />
      )}
      {passo === 1 && ponto && (
        <Passo2Periodo
          ponto={ponto}
          dataInicio={dataInicio}
          dataFim={dataFim}
          slotNumero={slotNumero}
          onDataInicio={setDataInicio}
          onDataFim={setDataFim}
          onSlot={setSlotNumero}
          onVoltar={() => setPasso(0)}
          onProximo={() => setPasso(2)}
        />
      )}
      {passo === 2 && ponto && (
        <Passo3Confirmar
          ponto={ponto}
          dataInicio={dataInicio}
          dataFim={dataFim}
          slotNumero={slotNumero}
          clientes={clientes}
          campanhasPorCliente={campanhasPorCliente}
          onVoltar={() => setPasso(1)}
        />
      )}
    </div>
  )
}
```

- [ ] **Step 5: Página `/reservas/nova/page.tsx`**

```tsx
// app-src/src/app/(dashboard)/reservas/nova/page.tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { StepperReserva } from '@/components/reservas/stepper-reserva'
import type { PontoMidia, Cliente, Campanha } from '@/types'

export default async function NovaReservaPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: perfil } = await supabase
    .from('usuarios')
    .select('empresa_id, perfil')
    .eq('id', user.id)
    .single()

  if (!perfil) redirect('/login')
  if (!['admin', 'gerente', 'vendedor'].includes(perfil.perfil)) redirect('/')

  // Pontos ativos
  const { data: pontos } = await supabase
    .from('pontos_midia')
    .select('*')
    .eq('empresa_id', perfil.empresa_id)
    .eq('status', 'ativo')
    .order('codigo')

  // Clientes (vendedor só vê os seus)
  let clientesQuery = supabase
    .from('clientes')
    .select('*')
    .eq('empresa_id', perfil.empresa_id)
    .eq('ativo', true)
    .order('nome')
  if (perfil.perfil === 'vendedor') {
    clientesQuery = clientesQuery.eq('vendedor_id', user.id)
  }
  const { data: clientes } = await clientesQuery

  // Campanhas de todos os clientes encontrados
  const clienteIds = (clientes ?? []).map((c: Cliente) => c.id)
  const { data: campanhas } = clienteIds.length > 0
    ? await supabase
        .from('campanhas')
        .select('*')
        .eq('empresa_id', perfil.empresa_id)
        .eq('ativo', true)
        .in('cliente_id', clienteIds)
        .order('nome')
    : { data: [] }

  // Agrupar campanhas por cliente
  const campanhasPorCliente: Record<string, Campanha[]> = {}
  for (const c of campanhas ?? []) {
    if (!campanhasPorCliente[c.cliente_id]) campanhasPorCliente[c.cliente_id] = []
    campanhasPorCliente[c.cliente_id].push(c as Campanha)
  }

  return (
    <div className="space-y-4 max-w-2xl">
      <h1 className="text-xl font-semibold">Nova Reserva</h1>
      <StepperReserva
        pontos={(pontos ?? []) as PontoMidia[]}
        clientes={(clientes ?? []) as Cliente[]}
        campanhasPorCliente={campanhasPorCliente}
      />
    </div>
  )
}
```

- [ ] **Step 6: Commit**

```bash
cd app-src && git add src/components/reservas/ src/app/\(dashboard\)/reservas/nova/
git commit -m "feat(reservas): stepper de nova reserva (3 passos)"
```

---

## Task 8: Tabela de reservas + páginas Minhas/Todas

**Files:**
- Create: `app-src/src/components/reservas/reserva-table.tsx`
- Create: `app-src/src/app/(dashboard)/reservas/minhas/page.tsx`
- Modify: `app-src/src/app/(dashboard)/reservas/page.tsx`

- [ ] **Step 1: `reserva-table.tsx`**

```tsx
// app-src/src/components/reservas/reserva-table.tsx
'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { cancelarReservaAction } from '@/app/actions/reservas'
import type { ReservaComJoins, PerfilUsuario } from '@/types'

const STATUS_BADGE: Record<string, string> = {
  solicitada: 'bg-blue-100 text-blue-800',
  ativa:      'bg-green-100 text-green-800',
  rejeitada:  'bg-red-100 text-red-800',
  cancelada:  'bg-gray-100 text-gray-600',
  finalizada: 'bg-purple-100 text-purple-800',
}

const TIPO_LABEL: Record<string, string> = {
  outdoor: 'Outdoor', frontlight: 'Frontlight', empena: 'Empena', led: 'LED',
}

interface ReservaTableProps {
  reservas: ReservaComJoins[]
  perfil: PerfilUsuario
  mostrarVendedor?: boolean
}

export function ReservaTable({ reservas, perfil, mostrarVendedor = false }: ReservaTableProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  async function handleCancelar(id: string) {
    await cancelarReservaAction(id)
    startTransition(() => router.refresh())
  }

  if (reservas.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
        Nenhuma reserva encontrada.
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Ponto</TableHead>
          <TableHead>Tipo</TableHead>
          <TableHead>Cliente / Campanha</TableHead>
          {mostrarVendedor && <TableHead>Vendedor</TableHead>}
          <TableHead>Período</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Solicitado em</TableHead>
          <TableHead />
        </TableRow>
      </TableHeader>
      <TableBody>
        {reservas.map(r => (
          <TableRow key={r.id}>
            <TableCell className="font-medium text-sm">{r.ponto?.codigo ?? '—'}</TableCell>
            <TableCell className="text-sm">{TIPO_LABEL[r.ponto?.tipo ?? ''] ?? '—'}</TableCell>
            <TableCell className="text-sm">
              <div>{r.campanha?.cliente?.nome ?? '—'}</div>
              <div className="text-xs text-muted-foreground">{r.campanha?.nome ?? '—'}</div>
            </TableCell>
            {mostrarVendedor && (
              <TableCell className="text-sm">{r.vendedor?.nome?.split(' ')[0] ?? '—'}</TableCell>
            )}
            <TableCell className="text-sm whitespace-nowrap">
              {r.data_inicio} → {r.data_fim}
            </TableCell>
            <TableCell>
              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[r.status] ?? ''}`}>
                {r.status}
              </span>
            </TableCell>
            <TableCell className="text-sm text-muted-foreground">
              {new Date(r.solicitado_em).toLocaleDateString('pt-BR')}
            </TableCell>
            <TableCell>
              {r.status === 'solicitada' && (perfil === 'vendedor' || perfil === 'gerente' || perfil === 'admin') && (
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={isPending}
                  onClick={() => handleCancelar(r.id)}
                >
                  Cancelar
                </Button>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
```

- [ ] **Step 2: `/reservas/minhas/page.tsx`**

```tsx
// app-src/src/app/(dashboard)/reservas/minhas/page.tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getReservasComJoins } from '@/app/actions/reservas'
import { ReservaTable } from '@/components/reservas/reserva-table'
import type { PerfilUsuario, ReservaComJoins } from '@/types'

export default async function MinhasReservasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: perfil } = await supabase
    .from('usuarios')
    .select('empresa_id, perfil')
    .eq('id', user.id)
    .single()

  if (!perfil) redirect('/login')
  if (['funcionario', 'checkin'].includes(perfil.perfil)) redirect('/')

  const reservas = await getReservasComJoins(perfil.empresa_id, { vendedorId: user.id })

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Minhas Reservas</h1>
      <ReservaTable
        reservas={reservas as unknown as ReservaComJoins[]}
        perfil={perfil.perfil as PerfilUsuario}
      />
    </div>
  )
}
```

- [ ] **Step 3: `/reservas/page.tsx` (todas)**

```tsx
// app-src/src/app/(dashboard)/reservas/page.tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getReservasComJoins } from '@/app/actions/reservas'
import { ReservaTable } from '@/components/reservas/reserva-table'
import type { PerfilUsuario, ReservaComJoins } from '@/types'

export default async function TodasReservasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: perfil } = await supabase
    .from('usuarios')
    .select('empresa_id, perfil')
    .eq('id', user.id)
    .single()

  if (!perfil) redirect('/login')
  if (!['admin', 'gerente', 'midia'].includes(perfil.perfil)) redirect('/reservas/minhas')

  const reservas = await getReservasComJoins(perfil.empresa_id)

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Todas as Reservas</h1>
      <ReservaTable
        reservas={reservas as unknown as ReservaComJoins[]}
        perfil={perfil.perfil as PerfilUsuario}
        mostrarVendedor
      />
    </div>
  )
}
```

- [ ] **Step 4: Commit**

```bash
cd app-src && git add src/components/reservas/reserva-table.tsx src/app/\(dashboard\)/reservas/
git commit -m "feat(reservas): tabela de reservas + páginas minhas/todas"
```

---

## Task 9: Fila de aprovação

**Files:**
- Create: `app-src/src/components/reservas/sheet-aprovacao.tsx`
- Create: `app-src/src/components/aprovacoes/aprovacoes-client.tsx`
- Create: `app-src/src/app/(dashboard)/aprovacoes/page.tsx`

- [ ] **Step 1: `sheet-aprovacao.tsx`**

```tsx
// app-src/src/components/reservas/sheet-aprovacao.tsx
'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { aprovarReservaAction, rejeitarReservaAction } from '@/app/actions/reservas'
import type { ReservaComJoins } from '@/types'

interface SheetAprovacaoProps {
  reserva: ReservaComJoins | null
  open: boolean
  onClose: () => void
}

export function SheetAprovacao({ reserva, open, onClose }: SheetAprovacaoProps) {
  const router = useRouter()
  const [motivo, setMotivo] = useState('')
  const [mostrarRejeicao, setMostrarRejeicao] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleClose() {
    setMotivo('')
    setMostrarRejeicao(false)
    setErro(null)
    onClose()
  }

  async function handleAprovar() {
    if (!reserva) return
    startTransition(async () => {
      const result = await aprovarReservaAction(reserva.id)
      if (result.error) { setErro(result.error); return }
      router.refresh()
      handleClose()
    })
  }

  async function handleRejeitar() {
    if (!reserva) return
    if (!motivo.trim()) { setErro('Informe o motivo da rejeição.'); return }
    startTransition(async () => {
      const result = await rejeitarReservaAction(reserva.id, motivo)
      if (result.error) { setErro(result.error); return }
      router.refresh()
      handleClose()
    })
  }

  if (!reserva) return null

  return (
    <Sheet open={open} onOpenChange={isOpen => { if (!isOpen) handleClose() }}>
      <SheetContent side="right" className="sm:max-w-[480px] flex flex-col gap-0 p-0">
        <SheetHeader className="border-b p-4 pb-3">
          <SheetTitle className="text-base">Reserva — {reserva.ponto?.codigo}</SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {erro && (
            <div className="rounded-lg border border-destructive bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {erro}
            </div>
          )}

          <dl className="space-y-2 text-sm">
            <div className="flex gap-2">
              <dt className="text-muted-foreground min-w-[120px]">Ponto:</dt>
              <dd className="font-medium">{reserva.ponto?.codigo} — {reserva.ponto?.tipo}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-muted-foreground min-w-[120px]">Endereço:</dt>
              <dd>{reserva.ponto?.endereco ?? reserva.ponto?.nome}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-muted-foreground min-w-[120px]">Cliente:</dt>
              <dd>{reserva.campanha?.cliente?.nome ?? '—'}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-muted-foreground min-w-[120px]">Campanha:</dt>
              <dd>{reserva.campanha?.nome ?? '—'}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-muted-foreground min-w-[120px]">Período:</dt>
              <dd>{reserva.data_inicio} → {reserva.data_fim}</dd>
            </div>
            {reserva.slot_numero && (
              <div className="flex gap-2">
                <dt className="text-muted-foreground min-w-[120px]">Slot:</dt>
                <dd>{reserva.slot_numero}</dd>
              </div>
            )}
            <div className="flex gap-2">
              <dt className="text-muted-foreground min-w-[120px]">Vendedor:</dt>
              <dd>{reserva.vendedor?.nome ?? '—'}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-muted-foreground min-w-[120px]">Solicitado em:</dt>
              <dd>{new Date(reserva.solicitado_em).toLocaleDateString('pt-BR')}</dd>
            </div>
            {reserva.observacoes && (
              <div className="flex gap-2">
                <dt className="text-muted-foreground min-w-[120px]">Observações:</dt>
                <dd>{reserva.observacoes}</dd>
              </div>
            )}
          </dl>

          {mostrarRejeicao && (
            <div className="space-y-1.5">
              <Label htmlFor="sa-motivo">
                Motivo da rejeição <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="sa-motivo"
                rows={3}
                value={motivo}
                onChange={e => { setMotivo(e.target.value); setErro(null) }}
                placeholder="Descreva o motivo da rejeição…"
                disabled={isPending}
              />
            </div>
          )}
        </div>

        <SheetFooter className="border-t p-4 flex gap-2">
          {!mostrarRejeicao ? (
            <>
              <Button
                variant="outline"
                className="text-destructive hover:text-destructive"
                onClick={() => setMostrarRejeicao(true)}
                disabled={isPending}
              >
                Rejeitar
              </Button>
              <Button onClick={handleAprovar} disabled={isPending} className="flex-1">
                {isPending ? 'Aprovando…' : 'Aprovar'}
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={() => { setMostrarRejeicao(false); setErro(null) }} disabled={isPending}>
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={handleRejeitar}
                disabled={isPending || !motivo.trim()}
                className="flex-1"
              >
                {isPending ? 'Rejeitando…' : 'Confirmar Rejeição'}
              </Button>
            </>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
```

- [ ] **Step 2: `aprovacoes-client.tsx`**

```tsx
// app-src/src/components/aprovacoes/aprovacoes-client.tsx
'use client'

import { useState } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { SheetAprovacao } from '@/components/reservas/sheet-aprovacao'
import type { ReservaComJoins } from '@/types'

interface AprovacoesClientProps {
  reservas: ReservaComJoins[]
}

export function AprovacoesClient({ reservas }: AprovacoesClientProps) {
  const [reservaSelecionada, setReservaSelecionada] = useState<ReservaComJoins | null>(null)

  if (reservas.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
        Nenhuma reserva aguardando aprovação.
      </div>
    )
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Ponto</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Cliente / Campanha</TableHead>
            <TableHead>Vendedor</TableHead>
            <TableHead>Período</TableHead>
            <TableHead>Solicitado em</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {reservas.map(r => (
            <TableRow
              key={r.id}
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => setReservaSelecionada(r)}
            >
              <TableCell className="font-medium text-sm">{r.ponto?.codigo ?? '—'}</TableCell>
              <TableCell className="text-sm">{r.ponto?.tipo ?? '—'}</TableCell>
              <TableCell className="text-sm">
                <div>{r.campanha?.cliente?.nome ?? '—'}</div>
                <div className="text-xs text-muted-foreground">{r.campanha?.nome ?? '—'}</div>
              </TableCell>
              <TableCell className="text-sm">{r.vendedor?.nome?.split(' ')[0] ?? '—'}</TableCell>
              <TableCell className="text-sm whitespace-nowrap">
                {r.data_inicio} → {r.data_fim}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {new Date(r.solicitado_em).toLocaleDateString('pt-BR')}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <SheetAprovacao
        reserva={reservaSelecionada}
        open={!!reservaSelecionada}
        onClose={() => setReservaSelecionada(null)}
      />
    </>
  )
}
```

- [ ] **Step 3: `/aprovacoes/page.tsx`**

```tsx
// app-src/src/app/(dashboard)/aprovacoes/page.tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getReservasComJoins } from '@/app/actions/reservas'
import { AprovacoesClient } from '@/components/aprovacoes/aprovacoes-client'
import type { ReservaComJoins } from '@/types'

export default async function AprovacoesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: perfil } = await supabase
    .from('usuarios')
    .select('empresa_id, perfil')
    .eq('id', user.id)
    .single()

  if (!perfil) redirect('/login')
  if (!['admin', 'gerente'].includes(perfil.perfil)) redirect('/')

  const reservas = await getReservasComJoins(perfil.empresa_id, { status: ['solicitada'] })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Fila de Aprovação</h1>
        <span className="text-sm text-muted-foreground">
          {reservas.length} {reservas.length === 1 ? 'reserva' : 'reservas'} aguardando
        </span>
      </div>
      <AprovacoesClient reservas={reservas as unknown as ReservaComJoins[]} />
    </div>
  )
}
```

- [ ] **Step 4: Commit**

```bash
cd app-src && git add src/components/reservas/sheet-aprovacao.tsx src/components/aprovacoes/ src/app/\(dashboard\)/aprovacoes/
git commit -m "feat(aprovacoes): fila de aprovação com sheet aprovar/rejeitar"
```

---

## Task 10: Widget de aprovações no dashboard + build final

**Files:**
- Create: `app-src/src/components/dashboard/widget-aprovacoes.tsx`
- Modify: `app-src/src/app/(dashboard)/page.tsx`

- [ ] **Step 1: `widget-aprovacoes.tsx`**

```tsx
// app-src/src/components/dashboard/widget-aprovacoes.tsx
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import type { ReservaComJoins } from '@/types'

interface WidgetAprovacoesProps {
  reservas: ReservaComJoins[]
}

export function WidgetAprovacoes({ reservas }: WidgetAprovacoesProps) {
  const count = reservas.length
  const preview = reservas.slice(0, 5)

  return (
    <div className="rounded-lg border p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-medium text-sm">Aguardando aprovação</h2>
        <span className="rounded-full bg-blue-100 text-blue-800 px-2.5 py-0.5 text-xs font-medium">
          {count}
        </span>
      </div>

      {count === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhuma reserva pendente.</p>
      ) : (
        <ul className="space-y-1.5">
          {preview.map(r => (
            <li key={r.id} className="text-sm flex justify-between gap-2">
              <span className="font-medium">{r.ponto?.codigo ?? '—'}</span>
              <span className="text-muted-foreground truncate">
                {r.campanha?.cliente?.nome ?? '—'} · {r.vendedor?.nome?.split(' ')[0] ?? '—'}
              </span>
              <span className="text-muted-foreground whitespace-nowrap">
                {new Date(r.solicitado_em).toLocaleDateString('pt-BR')}
              </span>
            </li>
          ))}
        </ul>
      )}

      <Button variant="outline" size="sm" className="w-full" asChild>
        <Link href="/aprovacoes">Ver todas</Link>
      </Button>
    </div>
  )
}
```

- [ ] **Step 2: Atualizar `page.tsx` do dashboard**

```tsx
// app-src/src/app/(dashboard)/page.tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getReservasComJoins } from '@/app/actions/reservas'
import { WidgetAprovacoes } from '@/components/dashboard/widget-aprovacoes'
import type { ReservaComJoins } from '@/types'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('usuarios').select('perfil, nome, empresa_id').eq('id', user.id).single()

  if (profile?.perfil === 'funcionario' || profile?.perfil === 'checkin') {
    redirect('/os')
  }

  const DASH_LABELS: Record<string, string> = {
    admin: 'Visão geral da empresa',
    gerente: 'Painel operacional',
    vendedor: 'Minhas reservas e clientes',
    midia: 'Fila de auditoria',
  }

  const isGerenteOuAdmin = profile?.perfil === 'admin' || profile?.perfil === 'gerente'
  const reservasPendentes = isGerenteOuAdmin && profile?.empresa_id
    ? await getReservasComJoins(profile.empresa_id, { status: ['solicitada'] })
    : []

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">
        Olá, {profile?.nome?.split(' ')[0]}
      </h1>
      <p className="text-sm text-muted-foreground">
        {DASH_LABELS[profile?.perfil ?? ''] ?? 'Dashboard'}
      </p>

      {isGerenteOuAdmin && (
        <div className="max-w-md">
          <WidgetAprovacoes reservas={reservasPendentes as unknown as ReservaComJoins[]} />
        </div>
      )}

      {!isGerenteOuAdmin && (
        <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
          Métricas e resumos em breve.
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Rodar todos os testes**

```bash
cd app-src && npx vitest run
```
Expected: todos passando (57 existentes + novos testes de calendário e reservas)

- [ ] **Step 4: Build de produção**

```bash
cd app-src && npx next build
```
Expected: build limpo sem erros TypeScript

- [ ] **Step 5: Commit final**

```bash
cd app-src && git add src/components/dashboard/ src/app/\(dashboard\)/page.tsx
git commit -m "feat(dashboard): widget aprovações pendentes para gerente/admin"
```

---

## Self-Review

**Cobertura da spec:**

| Req. da spec | Task |
|---|---|
| Submenu Calendário (LED/Frontlight/Outdoor) no sidebar | Task 2 |
| Submenu Reservas (Nova/Minhas/Todas/Aprovações) | Task 2 |
| Funções puras de colunas bissemanas/meses | Task 1 |
| Esquema de cores por tipo (LED temporal, outros por status) | Task 1, Task 5 |
| Mapa LED: linhas por slot, células coloridas | Task 6 |
| Mapa Frontlight: múltiplas reservas por célula | Task 6 |
| Mapa Outdoor: colunas por bissemana | Task 6 |
| Filtros de período + busca em todos os mapas | Task 5, Task 6 |
| 1º nome do vendedor em todas as células | Task 6 |
| Stepper 3 passos para nova reserva | Task 7 |
| Passo 2 adaptado por tipo (bissemana/30dias/slot) | Task 7 |
| Validação de período via `validarPeriodoPorTipo` existente | Task 3, Task 7 |
| Server actions criar/aprovar/rejeitar/cancelar | Task 3 |
| Página /reservas/minhas | Task 8 |
| Página /reservas (todas — gerente/admin) | Task 8 |
| Fila de aprovação `/aprovacoes` | Task 9 |
| Sheet de aprovação com motivo obrigatório na rejeição | Task 9 |
| Widget no dashboard do gerente | Task 10 |

**Placeholder scan:** nenhum TBD ou TODO encontrado.

**Type consistency:** `ReservaComJoins` definido em Task 2, usado consistentemente nas Tasks 3, 8, 9, 10. `corCelulaLed`, `corCelulaOutdoor`, `corCelulaFrontlight` definidos em Task 1 e usados em Task 6. `getDadosMapa` definido em Task 4 e importado nas Tasks 6.
