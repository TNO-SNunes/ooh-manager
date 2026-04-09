'use client'

import { useActionState, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { criarCampanha, editarCampanha, type ActionState } from '@/app/actions/campanhas'
import type { Campanha, Cliente } from '@/types'

interface CampanhaFormProps {
  campanha?: Campanha
  clientes: Cliente[]
  clientePreSelecionado?: string
  voltarHref: string
}

export function CampanhaForm({
  campanha,
  clientes,
  clientePreSelecionado,
  voltarHref,
}: CampanhaFormProps) {
  const isEdit = Boolean(campanha)
  const [clienteId, setClienteId] = useState<string>(
    campanha?.cliente_id ?? clientePreSelecionado ?? ''
  )

  const action = isEdit
    ? (_prev: ActionState, formData: FormData) => editarCampanha(campanha!.id, _prev, formData)
    : criarCampanha

  const [state, formAction, pending] = useActionState<ActionState, FormData>(action, {})

  const err = (campo: string) => state.fieldErrors?.[campo]

  return (
    <form action={formAction} className="space-y-5 max-w-lg">
      <input type="hidden" name="cliente_id" value={clienteId} />

      <div className="space-y-1.5">
        <Label>Cliente <span className="text-destructive">*</span></Label>
        <Select value={clienteId} onValueChange={(v) => setClienteId(v ?? '')} disabled={pending || isEdit}>
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
        <Label htmlFor="nome">Nome da campanha <span className="text-destructive">*</span></Label>
        <Input
          id="nome"
          name="nome"
          defaultValue={campanha?.nome}
          placeholder="Ex: Verão 2024"
          disabled={pending}
        />
        {err('nome') && <p className="text-xs text-destructive">{err('nome')}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="descricao">Descrição</Label>
        <Textarea
          id="descricao"
          name="descricao"
          defaultValue={campanha?.descricao ?? ''}
          rows={3}
          disabled={pending}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="data_inicio">Data início</Label>
          <Input
            id="data_inicio"
            name="data_inicio"
            type="date"
            defaultValue={campanha?.data_inicio ?? ''}
            disabled={pending}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="data_fim">Data fim</Label>
          <Input
            id="data_fim"
            name="data_fim"
            type="date"
            defaultValue={campanha?.data_fim ?? ''}
            disabled={pending}
          />
          {err('data_fim') && <p className="text-xs text-destructive">{err('data_fim')}</p>}
        </div>
      </div>

      {state.error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{state.error}</p>
      )}

      <div className="flex gap-2 pt-2">
        <Button type="submit" disabled={pending}>
          {pending ? 'Salvando…' : isEdit ? 'Salvar alterações' : 'Criar campanha'}
        </Button>
        <Button variant="ghost" nativeButton={false} render={<Link href={voltarHref} />}>
          <ArrowLeft className="mr-1 size-4" />
          Cancelar
        </Button>
      </div>
    </form>
  )
}
