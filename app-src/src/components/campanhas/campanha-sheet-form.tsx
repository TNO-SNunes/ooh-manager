'use client'

import { useActionState, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { criarCampanhaAction, editarCampanhaAction, type ActionState } from '@/app/actions/campanhas'
import type { Campanha, Cliente } from '@/types'

interface CampanhaSheetFormProps {
  campanha?: Campanha
  clientes: Cliente[]
  open: boolean
  onClose: () => void
}

export function CampanhaSheetForm({ campanha, clientes, open, onClose }: CampanhaSheetFormProps) {
  const router = useRouter()
  const isEdit = Boolean(campanha)

  const [clienteId, setClienteId] = useState<string>(campanha?.cliente_id ?? '')

  const action = isEdit
    ? (_prev: ActionState, formData: FormData) => editarCampanhaAction(campanha!.id, _prev, formData)
    : criarCampanhaAction

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
            {isEdit ? `Editar — ${campanha!.nome}` : 'Nova campanha'}
          </SheetTitle>
        </SheetHeader>

        <form
          id="campanha-sheet-form"
          action={formAction}
          className="flex-1 overflow-y-auto p-4 space-y-4"
        >
          <input type="hidden" name="cliente_id" value={clienteId} />

          {state.error && (
            <div className="rounded-lg border border-destructive bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {state.error}
            </div>
          )}

          <div className="space-y-1.5">
            <Label>Cliente <span className="text-destructive">*</span></Label>
            <Select
              value={clienteId}
              onValueChange={(v) => setClienteId(v ?? '')}
              disabled={pending || isEdit}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um cliente" />
              </SelectTrigger>
              <SelectContent>
                {clientes.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {err('cliente_id') && <p className="text-xs text-destructive">{err('cliente_id')}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="csf-nome">
              Nome da campanha <span className="text-destructive">*</span>
            </Label>
            <Input
              id="csf-nome"
              name="nome"
              defaultValue={campanha?.nome}
              placeholder="Ex: Verão 2024"
              disabled={pending}
            />
            {err('nome') && <p className="text-xs text-destructive">{err('nome')}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="csf-descricao">Descrição</Label>
            <Textarea
              id="csf-descricao"
              name="descricao"
              defaultValue={campanha?.descricao ?? ''}
              rows={3}
              disabled={pending}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="csf-data-inicio">Data início</Label>
              <Input
                id="csf-data-inicio"
                name="data_inicio"
                type="date"
                defaultValue={campanha?.data_inicio ?? ''}
                disabled={pending}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="csf-data-fim">Data fim</Label>
              <Input
                id="csf-data-fim"
                name="data_fim"
                type="date"
                defaultValue={campanha?.data_fim ?? ''}
                disabled={pending}
              />
              {err('data_fim') && <p className="text-xs text-destructive">{err('data_fim')}</p>}
            </div>
          </div>
        </form>

        <SheetFooter className="border-t p-4">
          <Button type="submit" form="campanha-sheet-form" disabled={pending} className="w-full">
            {pending ? 'Salvando…' : isEdit ? 'Salvar alterações' : 'Criar campanha'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
