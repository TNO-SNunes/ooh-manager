'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useCallback, useTransition, useRef, useState } from 'react'
import { Eye, Pencil, Download, Plus, Upload, MapPin } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { nomeLegivel } from '@/lib/pontos/actions'
import { exportarPontosAction, type FiltrosPontos } from '@/app/actions/pontos'
import type { PontoMidia, PerfilUsuario, TipoPonto, StatusPonto } from '@/types'
import { PontoSheetDetalhe } from '@/components/inventario/ponto-sheet-detalhe'
import { PontoSheetEdicao } from '@/components/inventario/ponto-sheet-edicao'

const ITENS_POR_PAGINA = 20

const TIPO_LABELS: Record<TipoPonto, string> = {
  outdoor: 'Outdoor',
  frontlight: 'Frontlight',
  empena: 'Empena',
  led: 'LED',
}

const STATUS_LABELS: Record<StatusPonto, string> = {
  ativo: 'Ativo',
  manutencao: 'Manutenção',
  inativo: 'Inativo',
}

interface PontoTableProps {
  pontos: PontoMidia[]
  total: number
  pagina: number
  municipios: string[]
  perfil: PerfilUsuario
  onImportar?: () => void
}

export function PontoTable({
  pontos,
  total,
  pagina,
  municipios,
  perfil,
  onImportar,
}: PontoTableProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  type SheetMode = 'ver' | 'editar' | null
  const [sheetPonto, setSheetPonto] = useState<PontoMidia | null>(null)
  const [sheetMode, setSheetMode] = useState<SheetMode>(null)

  function abrirVer(ponto: PontoMidia) {
    setSheetPonto(ponto)
    setSheetMode('ver')
  }

  function abrirEditar(ponto: PontoMidia) {
    setSheetPonto(ponto)
    setSheetMode('editar')
  }

  function fecharSheet() {
    setSheetMode(null)
  }

  const podeAdminGerente = perfil === 'admin' || perfil === 'gerente'
  const podeExportar = perfil === 'admin' || perfil === 'gerente' || perfil === 'midia'

  const totalPaginas = Math.max(1, Math.ceil(total / ITENS_POR_PAGINA))

  // Current filter values from URL
  const q = searchParams.get('q') ?? ''
  const tipo = searchParams.get('tipo') ?? ''
  const municipio = searchParams.get('municipio') ?? ''
  const status = searchParams.get('status') ?? ''

  const buildUrl = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString())
      for (const [key, value] of Object.entries(updates)) {
        if (value) {
          params.set(key, value)
        } else {
          params.delete(key)
        }
      }
      // Reset to page 1 when filters change (unless updating page)
      if (!('pagina' in updates)) {
        params.delete('pagina')
      }
      return `${pathname}?${params.toString()}`
    },
    [pathname, searchParams]
  )

  function handleFilterChange(key: string, value: string) {
    startTransition(() => {
      router.push(buildUrl({ [key]: value }))
    })
  }

  function handleSearchChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      startTransition(() => {
        router.push(buildUrl({ q: value }))
      })
    }, 400)
  }

  async function handleExportar() {
    const filtros: FiltrosPontos = {
      tipo: tipo || undefined,
      municipio: municipio || undefined,
      status: status || undefined,
      q: q || undefined,
    }
    try {
      const base64 = await exportarPontosAction(filtros)
      const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0))
      const blob = new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `pontos-midia-${new Date().toISOString().slice(0, 10)}.xlsx`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Erro ao exportar:', err)
    }
  }

  function handlePaginaAnterior() {
    if (pagina <= 1) return
    startTransition(() => {
      router.push(buildUrl({ pagina: String(pagina - 1) }))
    })
  }

  function handleProximaPagina() {
    if (pagina >= totalPaginas) return
    startTransition(() => {
      router.push(buildUrl({ pagina: String(pagina + 1) }))
    })
  }

  function getStatusBadgeVariant(s: StatusPonto) {
    switch (s) {
      case 'ativo':
        return 'default' as const
      case 'manutencao':
        return 'secondary' as const
      case 'inativo':
        return 'outline' as const
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Top bar: filters + action buttons */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          <Input
            placeholder="Buscar código ou nome…"
            defaultValue={q}
            onChange={handleSearchChange}
            className="h-8 w-48"
          />

          <Select
            value={tipo || 'todos'}
            onValueChange={(val: string | null) =>
              handleFilterChange('tipo', !val || val === 'todos' ? '' : val)
            }
          >
            <SelectTrigger size="sm" className="w-36">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os tipos</SelectItem>
              <SelectItem value="outdoor">Outdoor</SelectItem>
              <SelectItem value="frontlight">Frontlight</SelectItem>
              <SelectItem value="empena">Empena</SelectItem>
              <SelectItem value="led">LED</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={municipio || 'todos'}
            onValueChange={(val: string | null) =>
              handleFilterChange('municipio', !val || val === 'todos' ? '' : val)
            }
          >
            <SelectTrigger size="sm" className="w-40">
              <SelectValue placeholder="Município" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os municípios</SelectItem>
              {municipios.map((m) => (
                <SelectItem key={m} value={m}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={status || 'todos'}
            onValueChange={(val: string | null) =>
              handleFilterChange('status', !val || val === 'todos' ? '' : val)
            }
          >
            <SelectTrigger size="sm" className="w-36">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os status</SelectItem>
              <SelectItem value="ativo">Ativo</SelectItem>
              <SelectItem value="manutencao">Manutenção</SelectItem>
              <SelectItem value="inativo">Inativo</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          {podeAdminGerente && (
            <>
              <Button size="sm" nativeButton={false} render={<Link href="/inventario/novo" />}>
                <Plus className="mr-1 size-4" />
                Novo Ponto
              </Button>
              <Button variant="outline" size="sm" onClick={onImportar}>
                <Upload className="mr-1 size-4" />
                Importar
              </Button>
            </>
          )}
          {podeExportar && (
            <Button variant="outline" size="sm" onClick={handleExportar}>
              <Download className="mr-1 size-4" />
              Exportar
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className={isPending ? 'opacity-60 pointer-events-none' : ''}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead>Nome Fantasia</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Município</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pontos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                  Nenhum ponto encontrado.
                </TableCell>
              </TableRow>
            ) : (
              pontos.map((ponto) => (
                <TableRow key={ponto.id}>
                  <TableCell className="font-mono text-xs">{ponto.codigo}</TableCell>
                  <TableCell>{nomeLegivel(ponto)}</TableCell>
                  <TableCell>{TIPO_LABELS[ponto.tipo]}</TableCell>
                  <TableCell>{ponto.municipio ?? ponto.cidade}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(ponto.status)}>
                      {STATUS_LABELS[ponto.status]}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => abrirVer(ponto)}
                      >
                        <Eye className="size-4" />
                        <span className="sr-only">Ver</span>
                      </Button>
                      {podeAdminGerente && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => abrirEditar(ponto)}
                        >
                          <Pencil className="size-4" />
                          <span className="sr-only">Editar</span>
                        </Button>
                      )}
                      {ponto.latitude && ponto.longitude ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          nativeButton={false}
                          render={<Link href={`https://www.google.com/maps?q=${ponto.latitude},${ponto.longitude}`} target="_blank" rel="noopener noreferrer" />}
                        >
                          <MapPin className="size-4" />
                          <span className="sr-only">Ver no mapa</span>
                        </Button>
                      ) : (
                        <Button variant="ghost" size="sm" disabled>
                          <MapPin className="size-4 opacity-30" />
                          <span className="sr-only">Sem coordenadas</span>
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

      {/* Pagination */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          {total} {total === 1 ? 'ponto' : 'pontos'} · página {pagina} de {totalPaginas}
        </span>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={pagina <= 1 || isPending}
            onClick={handlePaginaAnterior}
          >
            Anterior
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={pagina >= totalPaginas || isPending}
            onClick={handleProximaPagina}
          >
            Próxima
          </Button>
        </div>
      </div>
      {sheetPonto && (
        <PontoSheetDetalhe
          key={`detalhe-${sheetPonto.id}`}
          ponto={sheetPonto}
          open={sheetMode === 'ver'}
          onClose={fecharSheet}
          onEditar={() => setSheetMode('editar')}
          podeEditar={podeAdminGerente}
        />
      )}
      {sheetPonto && (
        <PontoSheetEdicao
          key={sheetPonto.id}
          ponto={sheetPonto}
          open={sheetMode === 'editar'}
          onClose={fecharSheet}
        />
      )}
    </div>
  )
}
