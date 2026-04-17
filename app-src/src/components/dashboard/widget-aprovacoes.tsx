import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { CheckSquare } from 'lucide-react'
import type { ReservaComJoins } from '@/types'

interface WidgetAprovacoesProps {
  reservas: ReservaComJoins[]
}

export function WidgetAprovacoes({ reservas }: WidgetAprovacoesProps) {
  const visiveis = reservas.slice(0, 5)
  const total = reservas.length

  return (
    <div className="rounded-lg border p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <CheckSquare className="h-4 w-4 text-muted-foreground" />
        <span className="font-medium text-sm">Aguardando Aprovação</span>
        <span className="ml-auto rounded-full bg-primary text-primary-foreground text-xs px-2 py-0.5">
          {total}
        </span>
      </div>

      {/* List */}
      {total === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhuma reserva pendente</p>
      ) : (
        <ul className="space-y-2">
          {visiveis.map((r) => {
            const diaInicio = r.data_inicio.slice(8, 10)
            const mesInicio = r.data_inicio.slice(5, 7)
            const diaFim = r.data_fim.slice(8, 10)
            const mesFim = r.data_fim.slice(5, 7)
            const vendedorNome = r.vendedor?.nome?.split(' ')[0] ?? ''

            return (
              <li key={r.id} className="text-sm flex items-center justify-between gap-2">
                <span className="font-medium truncate">
                  {r.ponto?.codigo} — {r.campanha?.cliente?.nome ?? '—'}
                </span>
                <span className="text-muted-foreground whitespace-nowrap text-xs">
                  {diaInicio}/{mesInicio} → {diaFim}/{mesFim}
                </span>
                <span className="text-muted-foreground whitespace-nowrap text-xs">
                  {vendedorNome}
                </span>
              </li>
            )
          })}
        </ul>
      )}

      {/* Ver todas link */}
      {total > 5 && (
        <Link
          href="/aprovacoes"
          className="text-xs text-primary hover:underline"
        >
          Ver todas ({total})
        </Link>
      )}

      {/* Footer */}
      <div className="pt-1">
        <Button render={<Link href="/aprovacoes" />} variant="outline" size="sm">
          Ver fila completa
        </Button>
      </div>
    </div>
  )
}
