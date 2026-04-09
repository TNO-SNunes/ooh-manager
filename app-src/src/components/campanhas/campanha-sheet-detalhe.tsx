'use client'

import { CalendarRange, Pencil, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import type { Campanha } from '@/types'

function formatDate(d?: string | null) {
  if (!d) return '—'
  return new Date(d + 'T00:00:00').toLocaleDateString('pt-BR')
}

interface CampanhaSheetDetalheProps {
  campanha: Campanha
  open: boolean
  onClose: () => void
  onEditar: () => void
  podeEditar: boolean
}

export function CampanhaSheetDetalhe({
  campanha,
  open,
  onClose,
  onEditar,
  podeEditar,
}: CampanhaSheetDetalheProps) {
  return (
    <Sheet open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose() }}>
      <SheetContent side="right" className="sm:max-w-[420px] overflow-y-auto flex flex-col gap-0 p-0">
        <SheetHeader className="border-b p-4 pb-3">
          <div className="pr-8">
            <SheetTitle className="text-base">{campanha.nome}</SheetTitle>
            {campanha.cliente?.nome && (
              <p className="text-sm text-muted-foreground mt-0.5">{campanha.cliente.nome}</p>
            )}
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          <section className="space-y-2">
            <h2 className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
              <CalendarRange className="size-4" />
              Período
            </h2>
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
              <dt className="text-muted-foreground">Início</dt>
              <dd>{formatDate(campanha.data_inicio)}</dd>
              <dt className="text-muted-foreground">Fim</dt>
              <dd>{formatDate(campanha.data_fim)}</dd>
            </dl>
          </section>

          {campanha.cliente?.nome && (
            <section className="space-y-2">
              <h2 className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
                <User className="size-4" />
                Cliente
              </h2>
              <p className="text-sm">{campanha.cliente.nome}</p>
            </section>
          )}

          {campanha.descricao && (
            <section className="space-y-1">
              <h2 className="text-sm font-medium text-muted-foreground">Descrição</h2>
              <p className="text-sm whitespace-pre-wrap">{campanha.descricao}</p>
            </section>
          )}
        </div>

        {podeEditar && (
          <div className="border-t p-4">
            <Button className="w-full" onClick={onEditar}>
              <Pencil className="size-4 mr-2" />
              Editar
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
