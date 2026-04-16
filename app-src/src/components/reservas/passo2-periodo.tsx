// app-src/src/components/reservas/passo2-periodo.tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { normalizarBissemana, validarPeriodoPorTipo } from '@/lib/reservas/validacoes'
import type { PontoMidia } from '@/types'

interface Passo2Props {
  ponto: PontoMidia
  dataInicio: string
  dataFim: string
  slotNumero: number | null
  onDataInicio: (v: string) => void
  onDataFim: (v: string) => void
  onSlot: (v: number | null) => void
  onVoltar: () => void
  onProximo: () => void
  slotsOcupados?: number[]
}

export function Passo2Periodo({
  ponto, dataInicio, dataFim, slotNumero,
  onDataInicio, onDataFim, onSlot,
  onVoltar, onProximo, slotsOcupados = [],
}: Passo2Props) {
  const [erro, setErro] = useState<string | null>(null)

  function handleProximo() {
    if (!dataInicio || !dataFim) { setErro('Selecione o período.'); return }
    const validacao = validarPeriodoPorTipo(ponto.tipo, {
      data_inicio: new Date(dataInicio + 'T12:00:00'),
      data_fim: new Date(dataFim + 'T12:00:00'),
    })
    if (!validacao.valido) { setErro(validacao.erro ?? 'Período inválido.'); return }
    if (ponto.tipo === 'led' && !slotNumero) { setErro('Selecione um slot.'); return }
    setErro(null)
    onProximo()
  }

  const diffDias = dataInicio && dataFim
    ? Math.ceil((new Date(dataFim + 'T12:00:00').getTime() - new Date(dataInicio + 'T12:00:00').getTime()) / 86400000) + 1
    : 0

  return (
    <div className="space-y-4">
      <h2 className="font-medium">Passo 2 — Período{ponto.tipo === 'led' ? ' e slot' : ''}</h2>
      <p className="text-sm text-muted-foreground">
        Ponto: <strong>{ponto.codigo}</strong> ({ponto.tipo})
      </p>

      {ponto.tipo === 'outdoor' ? (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Selecione uma data — a bissemana será calculada automaticamente (1–15 ou 16–último do mês):
          </p>
          <div className="flex gap-4">
            <div className="space-y-1.5">
              <Label>Data (qualquer dia do mês)</Label>
              <Input
                type="date"
                onChange={e => {
                  if (!e.target.value) return
                  const d = new Date(e.target.value + 'T12:00:00')
                  const bissemana = normalizarBissemana(d)
                  onDataInicio(bissemana.data_inicio.toISOString().slice(0, 10))
                  onDataFim(bissemana.data_fim.toISOString().slice(0, 10))
                }}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Período calculado</Label>
              <div className="h-9 rounded-md border bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
                {dataInicio && dataFim ? `${dataInicio} → ${dataFim}` : 'Selecione uma data'}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex gap-4">
          <div className="space-y-1.5">
            <Label>Data início</Label>
            <Input type="date" value={dataInicio} onChange={e => onDataInicio(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Data fim</Label>
            <Input type="date" value={dataFim} onChange={e => onDataFim(e.target.value)} />
          </div>
        </div>
      )}

      {(ponto.tipo === 'frontlight' || ponto.tipo === 'empena') && diffDias > 0 && (
        <p className={`text-sm ${diffDias >= 30 ? 'text-green-600' : 'text-destructive'}`}>
          {diffDias} dias selecionados (mínimo 30)
        </p>
      )}

      {ponto.tipo === 'led' && (ponto.slots_totais ?? 0) > 0 && (
        <div className="space-y-2">
          <Label>Slot</Label>
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: ponto.slots_totais! }, (_, i) => i + 1).map(n => {
              const ocupado = slotsOcupados.includes(n)
              return (
                <Button
                  key={n}
                  variant={slotNumero === n ? 'default' : 'outline'}
                  size="sm"
                  disabled={ocupado}
                  onClick={() => onSlot(n)}
                  title={ocupado ? 'Slot ocupado no período' : `Slot ${n}`}
                >
                  Slot {n}
                </Button>
              )
            })}
          </div>
        </div>
      )}

      {erro && (
        <p className="text-sm text-destructive">{erro}</p>
      )}

      <div className="flex justify-between">
        <Button variant="outline" onClick={onVoltar}>Voltar</Button>
        <Button onClick={handleProximo}>Próximo</Button>
      </div>
    </div>
  )
}
