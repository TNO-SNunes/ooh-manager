// app-src/src/components/reservas/stepper-reserva.tsx
'use client'

import { useState } from 'react'
import { Passo1EscolhaPonto } from './passo1-ponto'
import { Passo2Periodo } from './passo2-periodo'
import { Passo3Confirmar } from './passo3-confirmar'
import type { PontoMidia, Cliente, Campanha } from '@/types'

const PASSOS = ['Escolher ponto', 'Período', 'Confirmar']

interface StepperReservaProps {
  pontos: PontoMidia[]
  clientes: Cliente[]
  campanhasPorCliente: Record<string, Campanha[]>
}

export function StepperReserva({ pontos, clientes, campanhasPorCliente }: StepperReservaProps) {
  const [passo, setPasso] = useState(0)
  const [ponto, setPonto] = useState<PontoMidia | null>(null)
  const [dataInicio, setDataInicio] = useState('')
  const [dataFim, setDataFim] = useState('')
  const [slotNumero, setSlotNumero] = useState<number | null>(null)

  return (
    <div className="space-y-6">
      {/* Indicador de passos */}
      <div className="flex items-center gap-2">
        {PASSOS.map((label, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium ${
              i === passo
                ? 'bg-primary text-primary-foreground'
                : i < passo
                ? 'bg-primary/30 text-primary'
                : 'bg-muted text-muted-foreground'
            }`}>
              {i + 1}
            </div>
            <span className={`text-sm ${i === passo ? 'font-medium' : 'text-muted-foreground'}`}>
              {label}
            </span>
            {i < PASSOS.length - 1 && <div className="h-px w-8 bg-border" />}
          </div>
        ))}
      </div>

      {passo === 0 && (
        <Passo1EscolhaPonto
          pontos={pontos}
          pontoSelecionado={ponto}
          onSelecionar={setPonto}
          onProximo={() => setPasso(1)}
        />
      )}
      {passo === 1 && ponto && (
        <Passo2Periodo
          ponto={ponto}
          dataInicio={dataInicio}
          dataFim={dataFim}
          slotNumero={slotNumero}
          onDataInicio={setDataInicio}
          onDataFim={setDataFim}
          onSlot={setSlotNumero}
          onVoltar={() => setPasso(0)}
          onProximo={() => setPasso(2)}
        />
      )}
      {passo === 2 && ponto && (
        <Passo3Confirmar
          ponto={ponto}
          dataInicio={dataInicio}
          dataFim={dataFim}
          slotNumero={slotNumero}
          clientes={clientes}
          campanhasPorCliente={campanhasPorCliente}
          onVoltar={() => setPasso(1)}
        />
      )}
    </div>
  )
}
