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
          { label: 'Todas as Reservas',  href: '/reservas/todas',   icon: CalendarCheck },
        ],
      },
      { label: 'Fila de Aprovação',  href: '/aprovacoes',       icon: CheckSquare },
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
  admin:    ['/', '/inventario', '/clientes', '/campanhas', '/calendario', '/calendario/led', '/calendario/frontlight', '/calendario/outdoor', '/reservas/nova', '/reservas/minhas', '/reservas/todas', '/aprovacoes', '/disponibilidade', '/os', '/relatorios', '/usuarios', '/configuracoes'],
  gerente:  ['/', '/inventario', '/clientes', '/campanhas', '/calendario', '/calendario/led', '/calendario/frontlight', '/calendario/outdoor', '/reservas/nova', '/reservas/minhas', '/reservas/todas', '/aprovacoes', '/disponibilidade', '/os', '/relatorios', '/usuarios', '/configuracoes'],
  vendedor: ['/', '/clientes', '/campanhas', '/calendario', '/calendario/led', '/calendario/frontlight', '/calendario/outdoor', '/reservas/nova', '/reservas/minhas', '/disponibilidade', '/relatorios', '/configuracoes'],
  midia:    ['/', '/inventario', '/clientes', '/campanhas', '/aprovacoes', '/os', '/relatorios', '/configuracoes'],
  funcionario: [],
  checkin:     [],
}

function filterItems(items: NavItem[], allowed: Set<string>): NavItem[] {
  return items
    .filter(item => {
      if (item.children && item.children.length > 0) {
        // Grupo: visível se pelo menos um filho está em ALLOWED
        return item.children.some(c => allowed.has(c.href))
      }
      return allowed.has(item.href)
    })
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
