'use client'

import { useActionState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { criarClienteAction, editarClienteAction, type ActionState } from '@/app/actions/clientes'
import type { Cliente } from '@/types'

interface ClienteSheetFormProps {
  cliente?: Cliente
  open: boolean
  onClose: () => void
}

export function ClienteSheetForm({ cliente, open, onClose }: ClienteSheetFormProps) {
  const router = useRouter()
  const isEdit = Boolean(cliente)

  const action = isEdit
    ? (_prev: ActionState, formData: FormData) => editarClienteAction(cliente!.id, _prev, formData)
    : criarClienteAction

  const [state, formAction, pending] = useActionState<ActionState, FormData>(action, {})

  useEffect(() => {
    if (state.ok) {
      onClose()
      router.refresh()
    }
  }, [state.ok, onClose, router])

  const err = (campo: string) => state.fieldErrors?.[campo]

  return (
    <Sheet open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose() }}>
      <SheetContent side="right" className="sm:max-w-[420px] flex flex-col gap-0 p-0">
        <SheetHeader className="border-b p-4 pb-3">
          <SheetTitle className="pr-8 text-base">
            {isEdit ? `Editar — ${cliente!.nome}` : 'Novo cliente'}
          </SheetTitle>
        </SheetHeader>

        <form
          id="cliente-sheet-form"
          action={formAction}
          className="flex-1 overflow-y-auto p-4 space-y-4"
        >
          {state.error && (
            <div className="rounded-lg border border-destructive bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {state.error}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="csf-nome">
              Nome <span className="text-destructive">*</span>
            </Label>
            <Input
              id="csf-nome"
              name="nome"
              defaultValue={cliente?.nome}
              placeholder="Razão social ou nome fantasia"
              disabled={pending}
            />
            {err('nome') && <p className="text-xs text-destructive">{err('nome')}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="csf-cnpj">CNPJ</Label>
            <Input
              id="csf-cnpj"
              name="cnpj"
              defaultValue={cliente?.cnpj ?? ''}
              placeholder="00.000.000/0000-00"
              disabled={pending}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="csf-contato">Nome do contato</Label>
            <Input
              id="csf-contato"
              name="contato"
              defaultValue={cliente?.contato ?? ''}
              disabled={pending}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="csf-telefone">Telefone</Label>
            <Input
              id="csf-telefone"
              name="telefone"
              defaultValue={cliente?.telefone ?? ''}
              disabled={pending}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="csf-email">Email</Label>
            <Input
              id="csf-email"
              name="email"
              type="email"
              defaultValue={cliente?.email ?? ''}
              disabled={pending}
            />
          </div>
        </form>

        <SheetFooter className="border-t p-4">
          <Button type="submit" form="cliente-sheet-form" disabled={pending} className="w-full">
            {pending ? 'Salvando…' : isEdit ? 'Salvar alterações' : 'Criar cliente'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
