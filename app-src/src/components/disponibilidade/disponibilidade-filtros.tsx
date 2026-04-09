'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useState } from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select, SelectContent, SelectItem,
  SelectTrigger, SelectValue,
} from '@/components/ui/select'

interface DisponibilidadeFiltrosProps {
  cidades: string[]
  dataInicio?: string
  dataFim?: string
  tipo?: string
  cidade?: string
}

export function DisponibilidadeFiltros({
  cidades,
  dataInicio,
  dataFim,
  tipo,
  cidade,
}: DisponibilidadeFiltrosProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [dataInicioVal, setDataInicio] = useState(dataInicio ?? '')
  const [dataFimVal, setDataFim] = useState(dataFim ?? '')
  const [tipoVal, setTipo] = useState(tipo ?? '')
  const [cidadeVal, setCidade] = useState(cidade ?? '')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const params = new URLSearchParams()
    if (dataInicioVal) params.set('data_inicio', dataInicioVal)
    if (dataFimVal) params.set('data_fim', dataFimVal)
    if (tipoVal && tipoVal !== 'todos') params.set('tipo', tipoVal)
    if (cidadeVal && cidadeVal !== 'todas') params.set('cidade', cidadeVal)
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap gap-3 items-end">
      <div className="space-y-1.5">
        <Label>Data início *</Label>
        <Input
          type="date"
          value={dataInicioVal}
          onChange={(e) => setDataInicio(e.target.value)}
          className="h-8 w-36"
          required
        />
      </div>
      <div className="space-y-1.5">
        <Label>Data fim *</Label>
        <Input
          type="date"
          value={dataFimVal}
          onChange={(e) => setDataFim(e.target.value)}
          className="h-8 w-36"
          required
        />
      </div>
      <div className="space-y-1.5">
        <Label>Tipo</Label>
        <Select value={tipoVal || 'todos'} onValueChange={(v) => setTipo(!v || v === 'todos' ? '' : v)}>
          <SelectTrigger size="sm" className="w-36">
            <SelectValue placeholder="Todos os tipos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os tipos</SelectItem>
            <SelectItem value="outdoor">Outdoor</SelectItem>
            <SelectItem value="frontlight">Frontlight</SelectItem>
            <SelectItem value="empena">Empena</SelectItem>
            <SelectItem value="led">LED</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1.5">
        <Label>Cidade</Label>
        <Select value={cidadeVal || 'todas'} onValueChange={(v) => setCidade(!v || v === 'todas' ? '' : v)}>
          <SelectTrigger size="sm" className="w-40">
            <SelectValue placeholder="Todas as cidades" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas as cidades</SelectItem>
            {cidades.map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button type="submit" size="sm">Consultar</Button>
    </form>
  )
}
