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
