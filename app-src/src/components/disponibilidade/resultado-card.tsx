import Link from 'next/link'
import { MapPin } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { DisponibilidadePonto } from '@/types'

const STATUS_LABEL = {
  livre: 'Livre',
  parcial: 'Parcial',
  ocupado: 'Ocupado',
} as const

const STATUS_VARIANT: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  livre: 'default',
  parcial: 'secondary',
  ocupado: 'destructive',
}

const TIPO_LABEL: Record<string, string> = {
  outdoor: 'Outdoor',
  frontlight: 'Frontlight',
  empena: 'Empena',
  led: 'LED',
}

interface ResultadoCardProps {
  item: DisponibilidadePonto
}

export function ResultadoCard({ item }: ResultadoCardProps) {
  const { ponto, status, slots_livres, slots_totais } = item

  return (
    <div className="rounded-lg border p-4 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-0.5">
          <p className="font-medium text-sm">{ponto.nome}</p>
          <p className="text-xs text-muted-foreground font-mono">{ponto.codigo}</p>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <Badge variant="outline">{TIPO_LABEL[ponto.tipo]}</Badge>
          <Badge variant={STATUS_VARIANT[status]}>{STATUS_LABEL[status]}</Badge>
        </div>
      </div>

      {ponto.tipo === 'led' && slots_totais != null && (
        <p className="text-xs text-muted-foreground">
          {slots_livres} de {slots_totais} slot{slots_totais > 1 ? 's' : ''} livre{(slots_livres ?? 0) !== 1 ? 's' : ''}
        </p>
      )}

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <MapPin className="size-3" />
        <span>{[ponto.municipio, ponto.cidade, ponto.estado].filter(Boolean).join(' / ')}</span>
      </div>

      <div className="flex gap-2 pt-1">
        <Button variant="outline" size="sm" className="h-7 text-xs" nativeButton={false} render={<Link href={`/inventario/${ponto.id}`} />}>
          Ver ponto
        </Button>
      </div>
    </div>
  )
}
