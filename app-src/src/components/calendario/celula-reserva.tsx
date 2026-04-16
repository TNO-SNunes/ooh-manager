import { cn } from '@/lib/utils'
import type { CorCelula } from '@/lib/calendario/colunas'

const COR_CLASSES: Record<CorCelula, string> = {
  livre:      'bg-white dark:bg-background text-muted-foreground',
  ativa:      'bg-red-500 text-white',
  solicitada: 'bg-blue-200 text-blue-900',
  veiculando: 'bg-green-500 text-white',
  vencida:    'bg-gray-300 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
}

export interface CelulaReservaProps {
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
