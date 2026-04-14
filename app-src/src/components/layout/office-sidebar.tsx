'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getNavSections } from '@/components/layout/nav-items'
import type { NavItem, NavSection } from '@/components/layout/nav-items'
import type { PerfilUsuario } from '@/types'

function NavItemRow({ item }: { item: NavItem }) {
  const pathname = usePathname()
  const hasChildren = item.children && item.children.length > 0
  const isActive = pathname === item.href
  const isChildActive = item.children?.some(c => pathname === c.href) ?? false
  const [open, setOpen] = useState(isChildActive)

  useEffect(() => {
    if (isChildActive) setOpen(true)
  }, [isChildActive])

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
              <NavItemRow key={child.href} item={child} />
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
