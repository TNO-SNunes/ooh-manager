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
