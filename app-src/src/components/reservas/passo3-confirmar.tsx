// app-src/src/components/reservas/passo3-confirmar.tsx
'use client'

import { useState, useActionState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { criarReservaAction, type ActionState } from '@/app/actions/reservas'
import type { PontoMidia, Cliente, Campanha } from '@/types'

interface Passo3Props {
  ponto: PontoMidia
  dataInicio: string
  dataFim: string
  slotNumero: number | null
  clientes: Cliente[]
  campanhasPorCliente: Record<string, Campanha[]>
  onVoltar: () => void
}

export function Passo3Confirmar({
  ponto, dataInicio, dataFim, slotNumero,
  clientes, campanhasPorCliente, onVoltar,
}: Passo3Props) {
  const router = useRouter()
  const [clienteSelecionado, setClienteSelecionado] = useState('')
  const [campanhaSelecionada, setCampanhaSelecionada] = useState('')
  const [campanhas, setCampanhas] = useState<Campanha[]>([])

  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    criarReservaAction,
    {}
  )

  useEffect(() => {
    if (state.ok) {
      router.push('/reservas/minhas')
    }
  }, [state.ok, router])

  function handleClienteChange(id: string) {
    setClienteSelecionado(id)
    setCampanhaSelecionada('')
    setCampanhas(campanhasPorCliente[id] ?? [])
  }

  return (
    <div className="space-y-4">
      <h2 className="font-medium">Passo 3 — Confirmar reserva</h2>

      <div className="rounded-lg border p-4 space-y-1 text-sm">
        <div><span className="text-muted-foreground">Ponto:</span> {ponto.codigo} — {ponto.tipo}</div>
        <div><span className="text-muted-foreground">Endereço:</span> {ponto.endereco ?? ponto.nome}</div>
        <div><span className="text-muted-foreground">Período:</span> {dataInicio} → {dataFim}</div>
        {slotNumero && <div><span className="text-muted-foreground">Slot:</span> {slotNumero}</div>}
      </div>

      <form action={formAction} className="space-y-4">
        <input type="hidden" name="ponto_id" value={ponto.id} />
        <input type="hidden" name="data_inicio" value={dataInicio} />
        <input type="hidden" name="data_fim" value={dataFim} />
        {slotNumero && <input type="hidden" name="slot_numero" value={slotNumero} />}

        {state.error && (
          <div className="rounded-lg border border-destructive bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {state.error}
          </div>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="p3-cliente">Cliente <span className="text-destructive">*</span></Label>
          <select
            id="p3-cliente"
            className="h-9 w-full rounded-md border px-3 text-sm"
            value={clienteSelecionado}
            onChange={e => handleClienteChange(e.target.value)}
            disabled={pending}
          >
            <option value="">Selecione…</option>
            {clientes.map(c => (
              <option key={c.id} value={c.id}>{c.nome}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="p3-campanha">Campanha <span className="text-destructive">*</span></Label>
          <select
            id="p3-campanha"
            name="campanha_id"
            className="h-9 w-full rounded-md border px-3 text-sm"
            value={campanhaSelecionada}
            onChange={e => setCampanhaSelecionada(e.target.value)}
            required
            disabled={!clienteSelecionado || pending}
          >
            <option value="">Selecione…</option>
            {campanhas.map(c => (
              <option key={c.id} value={c.id}>{c.nome}</option>
            ))}
          </select>
          {state.fieldErrors?.campanha_id && (
            <p className="text-xs text-destructive">{state.fieldErrors.campanha_id}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="p3-obs">Observações</Label>
          <Textarea id="p3-obs" name="observacoes" rows={2} disabled={pending} />
        </div>

        <div className="flex justify-between">
          <Button type="button" variant="outline" onClick={onVoltar} disabled={pending}>
            Voltar
          </Button>
          <Button type="submit" disabled={pending || !clienteSelecionado || !campanhaSelecionada}>
            {pending ? 'Solicitando…' : 'Solicitar Reserva'}
          </Button>
        </div>
      </form>
    </div>
  )
}
