// app-src/src/components/reservas/passo1-ponto.tsx
'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { PontoMidia, TipoPonto } from '@/types'

const TIPO_LABEL: Record<TipoPonto, string> = {
  outdoor: 'Outdoor', frontlight: 'Frontlight', empena: 'Empena', led: 'LED',
}

interface Passo1Props {
  pontos: PontoMidia[]
  pontoSelecionado: PontoMidia | null
  onSelecionar: (ponto: PontoMidia) => void
  onProximo: () => void
}

export function Passo1EscolhaPonto({ pontos, pontoSelecionado, onSelecionar, onProximo }: Passo1Props) {
  const [busca, setBusca] = useState('')
  const [tipoFiltro, setTipoFiltro] = useState<string>('todos')

  const filtrados = pontos.filter(p => {
    const matchTipo = tipoFiltro === 'todos' || p.tipo === tipoFiltro
    const matchBusca = !busca ||
      p.codigo.toLowerCase().includes(busca.toLowerCase()) ||
      (p.endereco ?? '').toLowerCase().includes(busca.toLowerCase()) ||
      (p.nome ?? '').toLowerCase().includes(busca.toLowerCase())
    return matchTipo && matchBusca
  })

  return (
    <div className="space-y-4">
      <h2 className="font-medium">Passo 1 — Escolher ponto</h2>

      <div className="flex flex-wrap gap-2">
        {['todos','outdoor','frontlight','empena','led'].map(t => (
          <Button
            key={t}
            type="button"
            variant={tipoFiltro === t ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTipoFiltro(t)}
          >
            {t === 'todos' ? 'Todos' : TIPO_LABEL[t as TipoPonto]}
          </Button>
        ))}
      </div>

      <Input
        placeholder="Buscar por código ou endereço…"
        value={busca}
        onChange={e => setBusca(e.target.value)}
        className="h-8 max-w-sm"
      />

      <div className="max-h-[400px] overflow-y-auto rounded-lg border divide-y">
        {filtrados.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            Nenhum ponto encontrado.
          </div>
        ) : filtrados.map(ponto => (
          <button
            key={ponto.id}
            type="button"
            onClick={() => onSelecionar(ponto)}
            className={`w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors ${
              pontoSelecionado?.id === ponto.id ? 'bg-accent' : ''
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm">{ponto.codigo}</span>
              <Badge variant="outline" className="text-xs">{TIPO_LABEL[ponto.tipo]}</Badge>
              {ponto.slots_totais && (
                <Badge variant="outline" className="text-xs">{ponto.slots_totais} slots</Badge>
              )}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              {ponto.endereco ?? ponto.nome}
            </div>
          </button>
        ))}
      </div>

      <div className="flex justify-end">
        <Button type="button" onClick={onProximo} disabled={!pontoSelecionado}>
          Próximo
        </Button>
      </div>
    </div>
  )
}
