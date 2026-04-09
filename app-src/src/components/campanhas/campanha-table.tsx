'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useCallback, useTransition, useRef } from 'react'
import { Eye, Pencil, Plus } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from '@/components/ui/table'
import type { Campanha, PerfilUsuario } from '@/types'

const ITENS_POR_PAGINA = 20

interface CampanhaTableProps {
  campanhas: Campanha[]
  total: number
  pagina: number
  perfil: PerfilUsuario
  porPagina?: number
}

export function CampanhaTable({ campanhas, total, pagina, perfil, porPagina = ITENS_POR_PAGINA }: CampanhaTableProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const podeGerenciar = ['admin', 'gerente', 'vendedor'].includes(perfil)
  const totalPaginas = Math.max(1, Math.ceil(total / porPagina))
  const q = searchParams.get('q') ?? ''

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

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <Input
          placeholder="Buscar por nome…"
          defaultValue={q}
          onChange={handleSearchChange}
          className="h-8 w-56"
        />
        {podeGerenciar && (
          <Button size="sm" nativeButton={false} render={<Link href="/campanhas/nova" />}>
            <Plus className="mr-1 size-4" />
            Nova Campanha
          </Button>
        )}
      </div>

      <div className={isPending ? 'opacity-60 pointer-events-none' : ''}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Início</TableHead>
              <TableHead>Fim</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {campanhas.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
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
                  <TableCell className="text-sm">{formatDate(c.data_inicio)}</TableCell>
                  <TableCell className="text-sm">{formatDate(c.data_fim)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="sm" nativeButton={false} render={<Link href={`/campanhas/${c.id}`} />}>
                        <Eye className="size-4" />
                        <span className="sr-only">Ver</span>
                      </Button>
                      {podeGerenciar && (
                        <Button variant="ghost" size="sm" nativeButton={false} render={<Link href={`/campanhas/${c.id}/editar`} />}>
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
    </div>
  )
}
