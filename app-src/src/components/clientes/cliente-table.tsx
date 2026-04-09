'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useCallback, useTransition, useRef, useState } from 'react'
import { Eye, Pencil, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from '@/components/ui/table'
import { ClienteSheetDetalhe } from '@/components/clientes/cliente-sheet-detalhe'
import { ClienteSheetForm } from '@/components/clientes/cliente-sheet-form'
import type { Cliente, PerfilUsuario } from '@/types'

interface ClienteTableProps {
  clientes: Cliente[]
  total: number
  pagina: number
  perfil: PerfilUsuario
  porPagina: number
}

export function ClienteTable({ clientes, total, pagina, perfil, porPagina }: ClienteTableProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [sheetCliente, setSheetCliente] = useState<Cliente | null>(null)
  const [sheetMode, setSheetMode] = useState<'ver' | 'editar' | 'novo' | null>(null)

  const podeGerenciar = perfil === 'admin' || perfil === 'gerente' || perfil === 'vendedor'
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

  function abrirVer(c: Cliente) { setSheetCliente(c); setSheetMode('ver') }
  function abrirEditar(c: Cliente) { setSheetCliente(c); setSheetMode('editar') }
  function abrirNovo() { setSheetCliente(null); setSheetMode('novo') }
  function fecharSheet() { setSheetMode(null); setSheetCliente(null) }

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
          <Button size="sm" onClick={abrirNovo}>
            <Plus className="mr-1 size-4" />
            Novo Cliente
          </Button>
        )}
      </div>

      <div className={isPending ? 'opacity-60 pointer-events-none' : ''}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>CNPJ</TableHead>
              <TableHead>Contato</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clientes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                  Nenhum cliente encontrado.
                </TableCell>
              </TableRow>
            ) : (
              clientes.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.nome}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{c.cnpj ?? '—'}</TableCell>
                  <TableCell className="text-sm">{c.contato ?? '—'}</TableCell>
                  <TableCell className="text-sm">{c.telefone ?? '—'}</TableCell>
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
        <span>{total} {total === 1 ? 'cliente' : 'clientes'} · página {pagina} de {totalPaginas}</span>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled={pagina <= 1 || isPending} onClick={handlePaginaAnterior}>Anterior</Button>
          <Button variant="outline" size="sm" disabled={pagina >= totalPaginas || isPending} onClick={handleProximaPagina}>Próxima</Button>
        </div>
      </div>

      {sheetCliente && (
        <ClienteSheetDetalhe
          key={sheetCliente.id}
          cliente={sheetCliente}
          open={sheetMode === 'ver'}
          onClose={fecharSheet}
          onEditar={() => setSheetMode('editar')}
          podeEditar={podeGerenciar}
        />
      )}
      {sheetCliente && (
        <ClienteSheetForm
          key={`edit-${sheetCliente.id}`}
          cliente={sheetCliente}
          open={sheetMode === 'editar'}
          onClose={fecharSheet}
        />
      )}
      <ClienteSheetForm
        open={sheetMode === 'novo'}
        onClose={fecharSheet}
      />
    </div>
  )
}
