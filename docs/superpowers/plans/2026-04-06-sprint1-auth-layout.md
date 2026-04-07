# Sprint 1 — Auth + Layout Base: Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar autenticação funcional com Supabase e dois layouts distintos por grupo de perfil (OfficeLayout e FieldLayout), com navegação filtrada por perfil e toggle dark/light.

**Architecture:** O `(dashboard)/layout.tsx` faz o check de auth server-side, busca o perfil do usuário e renderiza condicionalmente `OfficeLayout` (Admin/Gerente/Vendedor/Mídia) ou `FieldLayout` (Funcionário/Checkin). A config de navegação por perfil fica em `lib/nav-items.ts` como dado puro, testável independentemente dos componentes.

**Tech Stack:** Next.js 16 App Router, Supabase SSR, next-themes, Tailwind CSS 4, shadcn/ui (Sheet, DropdownMenu, Avatar), lucide-react, vitest + @testing-library/react.

---

## Pré-requisito obrigatório antes de começar

Crie o arquivo `app-src/.env.local` com suas credenciais do Supabase:

```
NEXT_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key
SUPABASE_SERVICE_ROLE_KEY=sua-service-role-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Se ainda não aplicou a migration, execute no SQL Editor do Supabase:
`app-src/supabase/migrations/001_initial_schema.sql`

---

## Mapa de arquivos

```
app-src/src/
  __tests__/
    lib/nav-items.test.ts         ← testes da config de navegação
    contexts/auth-context.test.tsx ← testes do AuthContext
  test/
    setup.ts                      ← setup do vitest
  app/
    providers.tsx                 ← ThemeProvider + AuthProvider (client)
    layout.tsx                    ← MODIFICAR: adicionar Providers
    (auth)/login/reset/
      page.tsx                    ← CRIAR: tela de reset de senha
    (dashboard)/
      layout.tsx                  ← MODIFICAR: auth check + branch Office/Field
      page.tsx                    ← MODIFICAR: dashboard por perfil + redirect Field
      os/page.tsx                 ← CRIAR: placeholder
      inventario/page.tsx         ← CRIAR: placeholder
      reservas/page.tsx           ← CRIAR: placeholder
      calendario/page.tsx         ← CRIAR: placeholder
      disponibilidade/page.tsx    ← CRIAR: placeholder
      relatorios/page.tsx         ← CRIAR: placeholder
      usuarios/page.tsx           ← CRIAR: placeholder
      configuracoes/page.tsx      ← CRIAR: placeholder
  contexts/
    auth-context.tsx              ← CRIAR: Provider + useAuthContext
  components/
    theme-toggle.tsx              ← CRIAR: botão sol/lua
    layout/
      nav-items.ts                ← CRIAR: config de nav por perfil
      office-layout.tsx           ← CRIAR: composição Office
      office-sidebar.tsx          ← CRIAR: sidebar fixa com nav
      office-header.tsx           ← CRIAR: header com sheet mobile + notif + avatar
      field-layout.tsx            ← CRIAR: composição Field
      field-header.tsx            ← CRIAR: header minimal + badge offline
      field-bottom-tabs.tsx       ← CRIAR: 2 bottom tabs
app-src/
  vitest.config.ts                ← CRIAR
app-src/supabase/migrations/
  002_rls_midia_reservas.sql      ← CRIAR: Mídia pode aprovar reservas
```

---

## Task 1: Instalar dependências e configurar testes

**Files:**
- Modify: `app-src/package.json`
- Create: `app-src/vitest.config.ts`
- Create: `app-src/src/test/setup.ts`

- [ ] **Step 1: Instalar next-themes e dependências de teste**

```bash
cd app-src
npm install next-themes
npm install -D vitest @vitejs/plugin-react @testing-library/react @testing-library/jest-dom jsdom
```

Expected: exit code 0, packages adicionados a package.json

- [ ] **Step 2: Criar vitest.config.ts**

```ts
// app-src/vitest.config.ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

- [ ] **Step 3: Criar src/test/setup.ts**

```ts
// app-src/src/test/setup.ts
import '@testing-library/jest-dom'
```

- [ ] **Step 4: Adicionar script de teste ao package.json**

No `app-src/package.json`, adicionar dentro de `"scripts"`:
```json
"test": "vitest",
"test:run": "vitest run"
```

- [ ] **Step 5: Verificar que o ambiente de teste funciona**

```bash
cd app-src
npm run test:run
```

Expected: `No test files found` (sem erro de configuração)

- [ ] **Step 6: Commit**

```bash
cd ..
git add app-src/vitest.config.ts app-src/src/test/setup.ts app-src/package.json app-src/package-lock.json
git commit -m "chore: add next-themes and vitest test setup"
```

---

## Task 2: Config de navegação por perfil (TDD)

**Files:**
- Create: `app-src/src/components/layout/nav-items.ts`
- Create: `app-src/src/__tests__/lib/nav-items.test.ts`

- [ ] **Step 1: Criar o arquivo de teste**

```ts
// app-src/src/__tests__/lib/nav-items.test.ts
import { describe, it, expect } from 'vitest'
import { getNavItems, getNavSections } from '@/components/layout/nav-items'

describe('getNavItems', () => {
  it('admin recebe todos os itens incluindo usuários e configurações', () => {
    const hrefs = getNavItems('admin').map(i => i.href)
    expect(hrefs).toContain('/')
    expect(hrefs).toContain('/inventario')
    expect(hrefs).toContain('/reservas')
    expect(hrefs).toContain('/os')
    expect(hrefs).toContain('/relatorios')
    expect(hrefs).toContain('/usuarios')
    expect(hrefs).toContain('/configuracoes')
  })

  it('vendedor não recebe inventario, os ou usuarios', () => {
    const hrefs = getNavItems('vendedor').map(i => i.href)
    expect(hrefs).not.toContain('/inventario')
    expect(hrefs).not.toContain('/os')
    expect(hrefs).not.toContain('/usuarios')
    expect(hrefs).toContain('/reservas')
    expect(hrefs).toContain('/relatorios')
    expect(hrefs).toContain('/configuracoes')
  })

  it('midia recebe inventario, reservas, os e relatorios', () => {
    const hrefs = getNavItems('midia').map(i => i.href)
    expect(hrefs).toContain('/inventario')
    expect(hrefs).toContain('/reservas')
    expect(hrefs).toContain('/os')
    expect(hrefs).toContain('/relatorios')
    expect(hrefs).not.toContain('/usuarios')
    expect(hrefs).not.toContain('/calendario')
  })

  it('funcionario e checkin retornam lista vazia (usam FieldLayout)', () => {
    expect(getNavItems('funcionario')).toHaveLength(0)
    expect(getNavItems('checkin')).toHaveLength(0)
  })

  it('gerente recebe itens iguais ao admin exceto configurações de empresa', () => {
    const hrefs = getNavItems('gerente').map(i => i.href)
    expect(hrefs).toContain('/usuarios')
    expect(hrefs).toContain('/configuracoes')
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

- [ ] **Step 2: Rodar o teste — deve FALHAR**

```bash
cd app-src && npm run test:run
```

Expected: FAIL — `Cannot find module '@/components/layout/nav-items'`

- [ ] **Step 3: Criar nav-items.ts**

```ts
// app-src/src/components/layout/nav-items.ts
import {
  LayoutDashboard,
  MapPin,
  CalendarCheck,
  Calendar,
  CalendarSearch,
  ClipboardList,
  FileImage,
  Users,
  Settings,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { PerfilUsuario } from '@/types'

export type NavItem = {
  label: string
  href: string
  icon: LucideIcon
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
      { label: 'Reservas',        href: '/reservas',       icon: CalendarCheck },
      { label: 'Calendário',      href: '/calendario',     icon: Calendar },
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
  admin:       ['/', '/inventario', '/reservas', '/calendario', '/disponibilidade', '/os', '/relatorios', '/usuarios', '/configuracoes'],
  gerente:     ['/', '/inventario', '/reservas', '/calendario', '/disponibilidade', '/os', '/relatorios', '/usuarios', '/configuracoes'],
  vendedor:    ['/', '/reservas', '/calendario', '/disponibilidade', '/relatorios', '/configuracoes'],
  midia:       ['/', '/inventario', '/reservas', '/os', '/relatorios', '/configuracoes'],
  funcionario: [],
  checkin:     [],
}

export function getNavSections(perfil: PerfilUsuario): NavSection[] {
  const allowed = new Set(ALLOWED[perfil])
  return ALL_SECTIONS
    .map(section => ({ ...section, items: section.items.filter(item => allowed.has(item.href)) }))
    .filter(section => section.items.length > 0)
}

export function getNavItems(perfil: PerfilUsuario): NavItem[] {
  return getNavSections(perfil).flatMap(s => s.items)
}
```

- [ ] **Step 4: Rodar os testes — devem PASSAR**

```bash
cd app-src && npm run test:run
```

Expected: PASS — todos os testes de nav-items

- [ ] **Step 5: Commit**

```bash
cd ..
git add app-src/src/components/layout/nav-items.ts app-src/src/__tests__/lib/nav-items.test.ts
git commit -m "feat: navigation config per user profile with tests"
```

---

## Task 3: AuthContext

**Files:**
- Create: `app-src/src/contexts/auth-context.tsx`
- Create: `app-src/src/__tests__/contexts/auth-context.test.tsx`

- [ ] **Step 1: Criar o teste**

```tsx
// app-src/src/__tests__/contexts/auth-context.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AuthProvider, useAuthContext } from '@/contexts/auth-context'
import type { Usuario } from '@/types'

const mockProfile: Usuario = {
  id: 'user-1',
  empresa_id: 'empresa-1',
  nome: 'Sergio',
  email: 'sergio@test.com',
  perfil: 'admin',
  ativo: true,
  criado_em: '2026-01-01',
}

function TestConsumer() {
  const { profile, loading } = useAuthContext()
  if (loading) return <div>loading</div>
  if (!profile) return <div>no profile</div>
  return <div>{profile.nome}</div>
}

it('exibe loading enquanto busca perfil', () => {
  render(
    <AuthProvider initialProfile={null} loading={true}>
      <TestConsumer />
    </AuthProvider>
  )
  expect(screen.getByText('loading')).toBeInTheDocument()
})

it('exibe nome do usuário após carregar', () => {
  render(
    <AuthProvider initialProfile={mockProfile} loading={false}>
      <TestConsumer />
    </AuthProvider>
  )
  expect(screen.getByText('Sergio')).toBeInTheDocument()
})

it('exibe no profile quando não há usuário', () => {
  render(
    <AuthProvider initialProfile={null} loading={false}>
      <TestConsumer />
    </AuthProvider>
  )
  expect(screen.getByText('no profile')).toBeInTheDocument()
})
```

- [ ] **Step 2: Rodar — deve FALHAR**

```bash
cd app-src && npm run test:run
```

Expected: FAIL — `Cannot find module '@/contexts/auth-context'`

- [ ] **Step 3: Criar auth-context.tsx**

```tsx
// app-src/src/contexts/auth-context.tsx
'use client'

import { createContext, useContext } from 'react'
import type { Usuario } from '@/types'

type AuthContextValue = {
  profile: Usuario | null
  loading: boolean
}

const AuthContext = createContext<AuthContextValue>({
  profile: null,
  loading: true,
})

export function AuthProvider({
  children,
  initialProfile,
  loading,
}: {
  children: React.ReactNode
  initialProfile: Usuario | null
  loading: boolean
}) {
  return (
    <AuthContext.Provider value={{ profile: initialProfile, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuthContext(): AuthContextValue {
  return useContext(AuthContext)
}
```

- [ ] **Step 4: Rodar — deve PASSAR**

```bash
cd app-src && npm run test:run
```

Expected: PASS — todos os testes passam

- [ ] **Step 5: Commit**

```bash
cd ..
git add app-src/src/contexts/auth-context.tsx app-src/src/__tests__/contexts/auth-context.test.tsx
git commit -m "feat: AuthContext with profile and loading state"
```

---

## Task 4: Providers e root layout

**Files:**
- Create: `app-src/src/app/providers.tsx`
- Modify: `app-src/src/app/layout.tsx`

- [ ] **Step 1: Criar providers.tsx**

```tsx
// app-src/src/app/providers.tsx
'use client'

import { ThemeProvider } from 'next-themes'
import { AuthProvider } from '@/contexts/auth-context'
import type { Usuario } from '@/types'

export function Providers({
  children,
  initialProfile = null,
}: {
  children: React.ReactNode
  initialProfile?: Usuario | null
}) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      disableTransitionOnChange
    >
      <AuthProvider initialProfile={initialProfile} loading={false}>
        {children}
      </AuthProvider>
    </ThemeProvider>
  )
}
```

- [ ] **Step 2: Modificar layout.tsx**

Substituir o conteúdo de `app-src/src/app/layout.tsx` por:

```tsx
// app-src/src/app/layout.tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' })

export const metadata: Metadata = {
  title: 'OOH Manager',
  description: 'Gestão de mídia exterior',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={inter.variable} suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
```

- [ ] **Step 3: Verificar que o app compila**

```bash
cd app-src && npm run build 2>&1 | tail -20
```

Expected: build sem erros TypeScript

- [ ] **Step 4: Commit**

```bash
cd ..
git add app-src/src/app/providers.tsx app-src/src/app/layout.tsx
git commit -m "feat: ThemeProvider and AuthProvider in root layout"
```

---

## Task 5: ThemeToggle

**Files:**
- Create: `app-src/src/components/theme-toggle.tsx`

- [ ] **Step 1: Criar theme-toggle.tsx**

```tsx
// app-src/src/components/theme-toggle.tsx
'use client'

import { useTheme } from 'next-themes'
import { Sun, Moon } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      aria-label="Alternar tema"
    >
      <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
    </Button>
  )
}
```

- [ ] **Step 2: Commit**

```bash
cd ..
git add app-src/src/components/theme-toggle.tsx
git commit -m "feat: ThemeToggle component (sun/moon)"
```

---

## Task 6: OfficeSidebar

**Files:**
- Create: `app-src/src/components/layout/office-sidebar.tsx`

- [ ] **Step 1: Instalar componente Avatar do shadcn**

```bash
cd app-src && npx shadcn@latest add avatar 2>&1 | tail -5
```

Expected: Avatar component created

- [ ] **Step 2: Criar office-sidebar.tsx**

```tsx
// app-src/src/components/layout/office-sidebar.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { getNavSections } from '@/components/layout/nav-items'
import type { PerfilUsuario } from '@/types'

export function OfficeSidebar({ perfil }: { perfil: PerfilUsuario }) {
  const pathname = usePathname()
  const sections = getNavSections(perfil)

  return (
    <aside className="flex h-full w-60 flex-col border-r bg-background">
      {/* Logo */}
      <div className="flex h-14 items-center border-b px-4">
        <span className="text-sm font-bold tracking-tight">OOH Manager</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3">
        {sections.map((section, i) => (
          <div key={i} className="mb-2">
            {section.title && (
              <p className="mb-1 px-4 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                {section.title}
              </p>
            )}
            {section.items.map(item => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
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
            })}
          </div>
        ))}
      </nav>
    </aside>
  )
}
```

- [ ] **Step 3: Commit**

```bash
cd ..
git add app-src/src/components/layout/office-sidebar.tsx app-src/src/components/ui/avatar.tsx
git commit -m "feat: OfficeSidebar with filtered nav per profile"
```

---

## Task 7: OfficeHeader

**Files:**
- Create: `app-src/src/components/layout/office-header.tsx`

- [ ] **Step 1: Criar office-header.tsx**

```tsx
// app-src/src/components/layout/office-header.tsx
'use client'

import { useState } from 'react'
import { Menu, Bell, LogOut, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ThemeToggle } from '@/components/theme-toggle'
import { OfficeSidebar } from '@/components/layout/office-sidebar'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { Usuario } from '@/types'

const PERFIL_LABEL: Record<string, string> = {
  admin: 'Admin',
  gerente: 'Gerente',
  vendedor: 'Vendedor',
  midia: 'Mídia',
}

function getInitials(nome: string): string {
  return nome
    .split(' ')
    .slice(0, 2)
    .map(n => n[0])
    .join('')
    .toUpperCase()
}

export function OfficeHeader({ profile }: { profile: Usuario }) {
  const router = useRouter()
  const [sheetOpen, setSheetOpen] = useState(false)

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <header className="flex h-14 items-center gap-2 border-b bg-background px-4">
      {/* Hamburger — mobile only */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-60">
          <OfficeSidebar perfil={profile.perfil} />
        </SheetContent>
      </Sheet>

      {/* Logo — mobile only */}
      <span className="text-sm font-bold md:hidden">OOH Manager</span>

      <div className="flex-1" />

      {/* Notificações */}
      <Button variant="ghost" size="icon" aria-label="Notificações">
        <Bell className="h-4 w-4" />
      </Button>

      {/* Toggle tema */}
      <ThemeToggle />

      {/* Avatar dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 rounded-full p-0">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-xs">
                {getInitials(profile.nome)}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuLabel className="font-normal">
            <p className="text-sm font-medium">{profile.nome}</p>
            <p className="text-xs text-muted-foreground">
              {PERFIL_LABEL[profile.perfil] ?? profile.perfil}
            </p>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <a href="/configuracoes" className="flex items-center gap-2">
              <User className="h-4 w-4" /> Meu perfil
            </a>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={handleLogout}
            className="flex items-center gap-2 text-destructive focus:text-destructive"
          >
            <LogOut className="h-4 w-4" /> Sair
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
```

- [ ] **Step 2: Commit**

```bash
cd ..
git add app-src/src/components/layout/office-header.tsx
git commit -m "feat: OfficeHeader with mobile sheet, notifications, theme toggle, avatar"
```

---

## Task 8: OfficeLayout

**Files:**
- Create: `app-src/src/components/layout/office-layout.tsx`

- [ ] **Step 1: Criar office-layout.tsx**

```tsx
// app-src/src/components/layout/office-layout.tsx
import { OfficeSidebar } from '@/components/layout/office-sidebar'
import { OfficeHeader } from '@/components/layout/office-header'
import type { Usuario } from '@/types'

export function OfficeLayout({
  children,
  profile,
}: {
  children: React.ReactNode
  profile: Usuario
}) {
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar — desktop only */}
      <div className="hidden md:flex md:shrink-0">
        <OfficeSidebar perfil={profile.perfil} />
      </div>

      {/* Main area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <OfficeHeader profile={profile} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
cd ..
git add app-src/src/components/layout/office-layout.tsx
git commit -m "feat: OfficeLayout composing sidebar + header + main"
```

---

## Task 9: FieldLayout

**Files:**
- Create: `app-src/src/components/layout/field-header.tsx`
- Create: `app-src/src/components/layout/field-bottom-tabs.tsx`
- Create: `app-src/src/components/layout/field-layout.tsx`

- [ ] **Step 1: Criar field-header.tsx**

```tsx
// app-src/src/components/layout/field-header.tsx
'use client'

import { useOfflineSync } from '@/hooks/useOfflineSync'
import { cn } from '@/lib/utils'
import type { PerfilUsuario } from '@/types'

export function FieldHeader({ perfil }: { perfil: PerfilUsuario }) {
  const { isOnline, pendingCount } = useOfflineSync()
  const isCheckin = perfil === 'checkin'

  return (
    <header className="flex h-14 items-center justify-between border-b bg-background px-4">
      <span className="text-sm font-bold">OOH Manager</span>

      {isCheckin && (
        <div className="flex items-center gap-1.5">
          {pendingCount > 0 && (
            <span className="text-xs text-muted-foreground">
              {pendingCount} foto{pendingCount > 1 ? 's' : ''} na fila
            </span>
          )}
          <span
            className={cn(
              'flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
              isOnline
                ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
            )}
          >
            <span
              className={cn(
                'h-1.5 w-1.5 rounded-full',
                isOnline ? 'bg-green-500' : 'bg-red-500'
              )}
            />
            {isOnline ? 'Online' : 'Offline'}
          </span>
        </div>
      )}
    </header>
  )
}
```

- [ ] **Step 2: Criar field-bottom-tabs.tsx**

```tsx
// app-src/src/components/layout/field-bottom-tabs.tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ClipboardList, User } from 'lucide-react'
import { cn } from '@/lib/utils'

const TABS = [
  { label: 'Minhas OS', href: '/os',     icon: ClipboardList },
  { label: 'Perfil',    href: '/perfil', icon: User },
]

export function FieldBottomTabs() {
  const pathname = usePathname()

  return (
    <nav className="flex border-t bg-background">
      {TABS.map(tab => {
        const isActive = pathname.startsWith(tab.href)
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              'flex flex-1 flex-col items-center justify-center gap-1 py-2 text-xs transition-colors min-h-[56px]',
              isActive
                ? 'text-primary'
                : 'text-muted-foreground hover:text-primary'
            )}
          >
            <tab.icon className="h-5 w-5" />
            {tab.label}
          </Link>
        )
      })}
    </nav>
  )
}
```

- [ ] **Step 3: Criar field-layout.tsx**

```tsx
// app-src/src/components/layout/field-layout.tsx
import { FieldHeader } from '@/components/layout/field-header'
import { FieldBottomTabs } from '@/components/layout/field-bottom-tabs'
import type { Usuario } from '@/types'

export function FieldLayout({
  children,
  profile,
}: {
  children: React.ReactNode
  profile: Usuario
}) {
  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <FieldHeader perfil={profile.perfil} />
      <main className="flex-1 overflow-y-auto p-4 text-base">
        {children}
      </main>
      <FieldBottomTabs />
    </div>
  )
}
```

- [ ] **Step 4: Commit**

```bash
cd ..
git add app-src/src/components/layout/field-header.tsx \
        app-src/src/components/layout/field-bottom-tabs.tsx \
        app-src/src/components/layout/field-layout.tsx
git commit -m "feat: FieldLayout with offline badge and bottom tabs"
```

---

## Task 10: Atualizar (dashboard)/layout.tsx

**Files:**
- Modify: `app-src/src/app/(dashboard)/layout.tsx`

- [ ] **Step 1: Substituir o conteúdo do layout**

```tsx
// app-src/src/app/(dashboard)/layout.tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { OfficeLayout } from '@/components/layout/office-layout'
import { FieldLayout } from '@/components/layout/field-layout'

const FIELD_PROFILES = ['funcionario', 'checkin'] as const
type FieldProfile = typeof FIELD_PROFILES[number]

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('usuarios')
    .select('*')
    .eq('id', user.id)
    .single()

  if (!profile) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <p className="text-center text-sm text-muted-foreground">
          Conta não configurada — contate o administrador.
        </p>
      </div>
    )
  }

  if (FIELD_PROFILES.includes(profile.perfil as FieldProfile)) {
    return <FieldLayout profile={profile}>{children}</FieldLayout>
  }

  return <OfficeLayout profile={profile}>{children}</OfficeLayout>
}
```

- [ ] **Step 2: Verificar que compila**

```bash
cd app-src && npm run build 2>&1 | tail -20
```

Expected: build sem erros

- [ ] **Step 3: Commit**

```bash
cd ..
git add app-src/src/app/\(dashboard\)/layout.tsx
git commit -m "feat: dashboard layout branches Office/Field by user profile"
```

---

## Task 11: Dashboard pages por perfil + placeholders

**Files:**
- Modify: `app-src/src/app/(dashboard)/page.tsx`
- Create: `app-src/src/app/(dashboard)/os/page.tsx`
- Create: `app-src/src/app/(dashboard)/inventario/page.tsx`
- Create: `app-src/src/app/(dashboard)/reservas/page.tsx`
- Create: `app-src/src/app/(dashboard)/calendario/page.tsx`
- Create: `app-src/src/app/(dashboard)/disponibilidade/page.tsx`
- Create: `app-src/src/app/(dashboard)/relatorios/page.tsx`
- Create: `app-src/src/app/(dashboard)/usuarios/page.tsx`
- Create: `app-src/src/app/(dashboard)/configuracoes/page.tsx`

- [ ] **Step 1: Atualizar dashboard page.tsx**

```tsx
// app-src/src/app/(dashboard)/page.tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('usuarios').select('perfil, nome').eq('id', user.id).single()

  // Campo vai direto para OS
  if (profile?.perfil === 'funcionario' || profile?.perfil === 'checkin') {
    redirect('/os')
  }

  const DASH_LABELS: Record<string, string> = {
    admin: 'Visão geral da empresa',
    gerente: 'Painel operacional',
    vendedor: 'Minhas reservas e clientes',
    midia: 'Fila de auditoria',
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">
        Olá, {profile?.nome?.split(' ')[0]}
      </h1>
      <p className="text-sm text-muted-foreground">
        {DASH_LABELS[profile?.perfil ?? ''] ?? 'Dashboard'}
      </p>
      <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
        Dashboard em construção — Sprint 2
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Criar páginas placeholder (uma de cada vez)**

Conteúdo idêntico para cada rota — apenas o título muda:

`app-src/src/app/(dashboard)/os/page.tsx`:
```tsx
export default function OSPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Ordens de Serviço</h1>
      <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
        Em construção — Sprint 7
      </div>
    </div>
  )
}
```

`app-src/src/app/(dashboard)/inventario/page.tsx`:
```tsx
export default function InventarioPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Inventário</h1>
      <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
        Em construção — Sprint 2
      </div>
    </div>
  )
}
```

`app-src/src/app/(dashboard)/reservas/page.tsx`:
```tsx
export default function ReservasPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Reservas</h1>
      <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
        Em construção — Sprint 5
      </div>
    </div>
  )
}
```

`app-src/src/app/(dashboard)/calendario/page.tsx`:
```tsx
export default function CalendarioPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Calendário</h1>
      <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
        Em construção — Sprint 4
      </div>
    </div>
  )
}
```

`app-src/src/app/(dashboard)/disponibilidade/page.tsx`:
```tsx
export default function DisponibilidadePage() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Disponibilidade</h1>
      <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
        Em construção — Sprint 3
      </div>
    </div>
  )
}
```

`app-src/src/app/(dashboard)/relatorios/page.tsx`:
```tsx
export default function RelatoriosPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Relatórios</h1>
      <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
        Em construção — Sprint 11
      </div>
    </div>
  )
}
```

`app-src/src/app/(dashboard)/usuarios/page.tsx`:
```tsx
export default function UsuariosPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Usuários</h1>
      <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
        Em construção — Sprint 6
      </div>
    </div>
  )
}
```

`app-src/src/app/(dashboard)/configuracoes/page.tsx`:
```tsx
export default function ConfiguracoesPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Configurações</h1>
      <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
        Em construção — Sprint 6
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
cd ..
git add app-src/src/app/\(dashboard\)/
git commit -m "feat: dashboard per profile + placeholder routes for all modules"
```

---

## Task 12: Página de reset de senha

**Files:**
- Create: `app-src/src/app/(auth)/login/reset/page.tsx`

- [ ] **Step 1: Criar reset page**

```tsx
// app-src/src/app/(auth)/login/reset/page.tsx
'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'

export default function ResetPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/login/update-password`,
    })
    setSent(true)
    setLoading(false)
  }

  if (sent) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-sm space-y-4 text-center">
          <p className="text-sm text-muted-foreground">
            Se este email estiver cadastrado, você receberá um link para redefinir sua senha.
          </p>
          <Link href="/login" className="text-sm underline underline-offset-4">
            Voltar ao login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-1">
          <h1 className="text-xl font-semibold">Redefinir senha</h1>
          <p className="text-sm text-muted-foreground">
            Digite seu email para receber o link de redefinição.
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Enviando...' : 'Enviar link'}
          </Button>
        </form>
        <p className="text-center text-sm">
          <Link href="/login" className="underline underline-offset-4 text-muted-foreground">
            Voltar ao login
          </Link>
        </p>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Adicionar link de reset no login-form.tsx**

Em `app-src/src/app/(auth)/login/login-form.tsx`, após o campo de senha adicionar:

```tsx
<div className="text-right">
  <Link href="/login/reset" className="text-xs text-muted-foreground underline underline-offset-4">
    Esqueci minha senha
  </Link>
</div>
```

E importar `Link` do `next/link` no topo do arquivo.

- [ ] **Step 3: Commit**

```bash
cd ..
git add app-src/src/app/\(auth\)/login/reset/page.tsx \
        app-src/src/app/\(auth\)/login/login-form.tsx
git commit -m "feat: password reset page and forgot password link"
```

---

## Task 13: Migration — Mídia pode aprovar reservas

**Files:**
- Create: `app-src/supabase/migrations/002_rls_midia_reservas.sql`

- [ ] **Step 1: Criar migration**

```sql
-- app-src/supabase/migrations/002_rls_midia_reservas.sql
-- Atualiza policy de update de reservas para incluir perfil 'midia'
-- Mídia passou a poder aprovar/rejeitar reservas solicitadas por vendedores

DROP POLICY IF EXISTS "reservas_gerente_update" ON reservas;

CREATE POLICY "reservas_gerente_update" ON reservas
  FOR UPDATE
  USING (
    empresa_id = auth_empresa_id()
    AND auth_perfil() IN ('admin', 'gerente', 'midia')
  );
```

- [ ] **Step 2: Aplicar no Supabase**

No SQL Editor do Supabase, execute o conteúdo do arquivo acima.

Expected: `Success. No rows returned`

- [ ] **Step 3: Commit**

```bash
cd ..
git add app-src/supabase/migrations/002_rls_midia_reservas.sql
git commit -m "fix: allow midia profile to approve/reject reservations (RLS)"
```

---

## Task 14: Build final, testes e push

- [ ] **Step 1: Rodar todos os testes**

```bash
cd app-src && npm run test:run
```

Expected: todos os testes PASS

- [ ] **Step 2: Build de produção**

```bash
npm run build 2>&1 | tail -30
```

Expected: `Route (app)` table sem erros, `✓ Compiled successfully`

- [ ] **Step 3: Smoke test local**

```bash
npm run dev
```

Abrir http://localhost:3000 e verificar:
- Redireciona para `/login` sem sessão ✓
- Login com credenciais válidas funciona ✓
- Admin/Gerente veem OfficeLayout com sidebar ✓
- Sidebar móvel abre como Sheet ✓
- Toggle dark/light funciona ✓
- Logout redireciona para `/login` ✓

- [ ] **Step 4: Atualizar CLAUDE.md com status do Sprint 1**

Em `/CLAUDE.md`, atualizar a seção de status:
- Marcar Sprint 1 como `[x] CONCLUÍDO`
- Atualizar "Próximo passo" para Sprint 2

- [ ] **Step 5: Push final**

```bash
cd ..
git add CLAUDE.md
git commit -m "docs: mark Sprint 1 as complete in CLAUDE.md"
git push
```
