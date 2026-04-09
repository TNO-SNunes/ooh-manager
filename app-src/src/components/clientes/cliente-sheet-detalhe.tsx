'use client'

import { Mail, Pencil, Phone, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import type { Cliente } from '@/types'

interface ClienteSheetDetalheProps {
  cliente: Cliente
  open: boolean
  onClose: () => void
  onEditar: () => void
  podeEditar: boolean
}

export function ClienteSheetDetalhe({
  cliente,
  open,
  onClose,
  onEditar,
  podeEditar,
}: ClienteSheetDetalheProps) {
  return (
    <Sheet open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose() }}>
      <SheetContent side="right" className="sm:max-w-[420px] overflow-y-auto flex flex-col gap-0 p-0">
        <SheetHeader className="border-b p-4 pb-3">
          <div className="pr-8 space-y-0.5">
            {cliente.cnpj && (
              <span className="font-mono text-xs text-muted-foreground">{cliente.cnpj}</span>
            )}
            <SheetTitle className="text-base">{cliente.nome}</SheetTitle>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          <section className="space-y-2">
            <h2 className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
              <User className="size-4" />
              Contato
            </h2>
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
              {cliente.contato && (
                <>
                  <dt className="text-muted-foreground">Nome</dt>
                  <dd>{cliente.contato}</dd>
                </>
              )}
              {cliente.telefone && (
                <>
                  <dt className="text-muted-foreground flex items-center gap-1">
                    <Phone className="size-3" /> Telefone
                  </dt>
                  <dd>{cliente.telefone}</dd>
                </>
              )}
              {cliente.email && (
                <>
                  <dt className="text-muted-foreground flex items-center gap-1">
                    <Mail className="size-3" /> Email
                  </dt>
                  <dd className="break-all">{cliente.email}</dd>
                </>
              )}
              {!cliente.contato && !cliente.telefone && !cliente.email && (
                <dd className="col-span-2 text-muted-foreground italic">Sem informações de contato.</dd>
              )}
            </dl>
          </section>
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
