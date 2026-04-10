'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useCallback, useTransition, useRef, useState } from 'react'
import { Eye, Pencil, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from '@/components/ui/table'
import { CampanhaSheetDetalhe } from '@/components/campanhas/campanha-sheet-detalhe'
import { CampanhaSheetForm } from '@/components/campanhas/campanha-sheet-form'
import type { Campanha, Cliente, PerfilUsuario } from '@/types'

const ITENS_POR_PAGINA = 20

const TIPOS_LABEL: Record<string, string> = {
  outdoor: 'Outdoor',
  frontlight_empena: 'Frontlight/Empena',
  led: 'LED',
}

interface CampanhaTableProps {
  campanhas: Campanha[]
  total: number
  pagina: number
  perfil: PerfilUsuario
  clientes: Cliente[]
  porPagina?: number
}

export function CampanhaTable({ campanhas, total, pagina, perfil, clientes, porPagina = ITENS_POR_PAGINA }: CampanhaTableProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [sheetCampanha, setSheetCampanha] = useState<Campanha | null>(null)
  const [sheetMode, setSheetMode] = useState<'ver' | 'editar' | 'nova' | null>(null)

  const podeGerenciar = ['admin', 'gerente', 'vendedor'].includes(perfil)
  const totalPaginas = Math.max(1, Math.ceil(total / porPagina))
  const q = searchParams.get('q') ?? ''
  const clienteFiltro = searchParams.get('cliente') ?? ''
  const statusFiltro = searchParams.get('status') ?? ''

  const buildUrl = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString())
      for (const [key, value] of Object.entries(updates)) {
        if (value) params.set(key, value)
        else params.delete(key)
      }
      if (!('pagina' in updates)) params.delete('pagina')
      return `${pathname}?${params.toString()}`
    },
    [pathname, searchParams]
  )

  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      startTransition(() => router.push(buildUrl({ q: value })))
    }, 400)
  }

  function handleClienteChange(value: string) {
    startTransition(() => router.push(buildUrl({ cliente: value === 'todos' ? '' : value })))
  }

  function handleStatusChange(value: string) {
    startTransition(() => router.push(buildUrl({ status: value === 'todas' ? '' : value })))
  }

  function handlePaginaAnterior() {
    if (pagina <= 1) return
    startTransition(() => router.push(buildUrl({ pagina: String(pagina - 1) })))
  }

  function handleProximaPagina() {
    if (pagina >= totalPaginas) return
    startTransition(() => router.push(buildUrl({ pagina: String(pagina + 1) })))
  }

  function formatDate(d?: string | null) {
    if (!d) return '—'
    return new Date(d + 'T00:00:00').toLocaleDateString('pt-BR')
  }

  function abrirVer(c: Campanha) { setSheetCampanha(c); setSheetMode('ver') }
  function abrirEditar(c: Campanha) { setSheetCampanha(c); setSheetMode('editar') }
  function abrirNova() { setSheetCampanha(null); setSheetMode('nova') }
  function fecharSheet() { setSheetMode(null); setSheetCampanha(null) }

  const clienteFiltroNome = clientes.find(c => c.id === clienteFiltro)?.nome

  return (
    <div className="flex flex-col gap-4">
      {/* Barra de ferramentas */}
      <div className="flex flex-wrap items-center gap-2">
        <Input
          placeholder="Buscar por nome…"
          defaultValue={q}
          onChange={handleSearchChange}
          className="h-8 w-48"
        />

        {/* Filtro por cliente */}
        <Select
          value={clienteFiltro || 'todos'}
          onValueChange={handleClienteChange}
          disabled={isPending}
        >
          <SelectTrigger className="h-8 w-44">
            <SelectValue placeholder="Todos os clientes">
              {clienteFiltro ? clienteFiltroNome : 'Todos os clientes'}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os clientes</SelectItem>
            {clientes.map((c) => (
              <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Filtro por status */}
        <Select
          value={statusFiltro || 'todas'}
          onValueChange={handleStatusChange}
          disabled={isPending}
        >
          <SelectTrigger className="h-8 w-36">
            <SelectValue placeholder="Todas">
              {statusFiltro === 'vigente' ? 'Vigentes' : statusFiltro === 'vencida' ? 'Vencidas' : 'Todas'}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas</SelectItem>
            <SelectItem value="vigente">Vigentes</SelectItem>
            <SelectItem value="vencida">Vencidas</SelectItem>
          </SelectContent>
        </Select>

        <div className="ml-auto">
          {podeGerenciar && (
            <Button size="sm" onClick={abrirNova}>
              <Plus className="mr-1 size-4" />
              Nova Campanha
            </Button>
          )}
        </div>
      </div>

      <div className={isPending ? 'opacity-60 pointer-events-none' : ''}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Tipos</TableHead>
              <TableHead>Início</TableHead>
              <TableHead>Fim</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {campanhas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                  Nenhuma campanha encontrada.
                </TableCell>
              </TableRow>
            ) : (
              campanhas.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.nome}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {c.cliente?.nome ?? '—'}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {c.tipos && c.tipos.length > 0
                      ? c.tipos.map(t => TIPOS_LABEL[t] ?? t).join(', ')
                      : '—'}
                  </TableCell>
                  <TableCell className="text-sm">{formatDate(c.data_inicio)}</TableCell>
                  <TableCell className="text-sm">{formatDate(c.data_fim)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => abrirVer(c)}>
                        <Eye className="size-4" />
                        <span className="sr-only">Ver</span>
                      </Button>
                      {podeGerenciar && (
                        <Button variant="ghost" size="sm" onClick={() => abrirEditar(c)}>
                          <Pencil className="size-4" />
                          <span className="sr-only">Editar</span>
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>{total} {total === 1 ? 'campanha' : 'campanhas'} · página {pagina} de {totalPaginas}</span>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled={pagina <= 1 || isPending} onClick={handlePaginaAnterior}>Anterior</Button>
          <Button variant="outline" size="sm" disabled={pagina >= totalPaginas || isPending} onClick={handleProximaPagina}>Próxima</Button>
        </div>
      </div>

      {sheetCampanha && (
        <CampanhaSheetDetalhe
          key={sheetCampanha.id}
          campanha={sheetCampanha}
          open={sheetMode === 'ver'}
          onClose={fecharSheet}
          onEditar={() => setSheetMode('editar')}
          podeEditar={podeGerenciar}
        />
      )}
      {sheetCampanha && (
        <CampanhaSheetForm
          key={`edit-${sheetCampanha.id}`}
          campanha={sheetCampanha}
          clientes={clientes}
          open={sheetMode === 'editar'}
          onClose={fecharSheet}
        />
      )}
      <CampanhaSheetForm
        clientes={clientes}
        open={sheetMode === 'nova'}
        onClose={fecharSheet}
      />
    </div>
  )
}
