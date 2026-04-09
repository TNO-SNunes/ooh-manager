'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { criarCliente, editarCliente, type ActionState } from '@/app/actions/clientes'
import type { Cliente } from '@/types'

interface ClienteFormProps {
  cliente?: Cliente
  voltarHref: string
}

export function ClienteForm({ cliente, voltarHref }: ClienteFormProps) {
  const isEdit = Boolean(cliente)

  const action = isEdit
    ? (_prev: ActionState, formData: FormData) => editarCliente(cliente!.id, _prev, formData)
    : criarCliente

  const [state, formAction, pending] = useActionState<ActionState, FormData>(action, {})

  const err = (campo: string) => state.fieldErrors?.[campo]

  return (
    <form action={formAction} className="space-y-5 max-w-lg">
      <div className="space-y-1.5">
        <Label htmlFor="nome">Nome <span className="text-destructive">*</span></Label>
        <Input
          id="nome"
          name="nome"
          defaultValue={cliente?.nome}
          placeholder="Razão social ou nome fantasia"
          disabled={pending}
        />
        {err('nome') && <p className="text-xs text-destructive">{err('nome')}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="cnpj">CNPJ</Label>
        <Input id="cnpj" name="cnpj" defaultValue={cliente?.cnpj ?? ''} placeholder="00.000.000/0000-00" disabled={pending} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="contato">Nome do contato</Label>
        <Input id="contato" name="contato" defaultValue={cliente?.contato ?? ''} disabled={pending} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="telefone">Telefone</Label>
          <Input id="telefone" name="telefone" defaultValue={cliente?.telefone ?? ''} disabled={pending} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" defaultValue={cliente?.email ?? ''} disabled={pending} />
        </div>
      </div>

      {state.error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{state.error}</p>
      )}

      <div className="flex gap-2 pt-2">
        <Button type="submit" disabled={pending}>
          {pending ? 'Salvando…' : isEdit ? 'Salvar alterações' : 'Criar cliente'}
        </Button>
        <Button variant="ghost" nativeButton={false} render={<Link href={voltarHref} />}>
          <ArrowLeft className="mr-1 size-4" />
          Cancelar
        </Button>
      </div>
    </form>
  )
}
