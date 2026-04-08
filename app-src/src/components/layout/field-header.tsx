'use client'

import { LogOut } from 'lucide-react'
import { useOfflineSync } from '@/hooks/useOfflineSync'
import { createClient } from '@/lib/supabase/client'
import { cn } from '@/lib/utils'
import type { PerfilUsuario } from '@/types'

export function FieldHeader({ perfil }: { perfil: PerfilUsuario }) {
  const { isOnline, pendingCount } = useOfflineSync()
  const isCheckin = perfil === 'checkin'

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <header className="flex h-14 items-center justify-between border-b bg-background px-4">
      <span className="text-sm font-bold">OOH Manager</span>

      <div className="flex items-center gap-3">
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

        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Sair"
        >
          <LogOut className="h-4 w-4" />
          Sair
        </button>
      </div>
    </header>
  )
}
