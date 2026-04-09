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
      { label: 'Clientes',        href: '/clientes',       icon: Building2 },
      { label: 'Campanhas',       href: '/campanhas',      icon: Megaphone },
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
  admin:       ['/', '/inventario', '/clientes', '/campanhas', '/reservas', '/calendario', '/disponibilidade', '/os', '/relatorios', '/usuarios', '/configuracoes'],
  gerente:     ['/', '/inventario', '/clientes', '/campanhas', '/reservas', '/calendario', '/disponibilidade', '/os', '/relatorios', '/usuarios', '/configuracoes'],
  vendedor:    ['/', '/clientes', '/campanhas', '/reservas', '/calendario', '/disponibilidade', '/relatorios', '/configuracoes'],
  midia:       ['/', '/inventario', '/clientes', '/campanhas', '/reservas', '/os', '/relatorios', '/configuracoes'],
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
