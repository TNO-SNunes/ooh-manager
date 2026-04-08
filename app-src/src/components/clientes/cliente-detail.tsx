'use client'

import Link from 'next/link'
import { ArrowLeft, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from '@/components/ui/table'
import { excluirCliente } from '@/app/actions/clientes'
import type { Cliente, Campanha, PerfilUsuario } from '@/types'

interface ClienteDetailProps {
  cliente: Cliente
  campanhas: Campanha[]
  perfil: PerfilUsuario
}

export function ClienteDetail({ cliente, campanhas, perfil }: ClienteDetailProps) {
  const podeEditar = perfil === 'admin' || perfil === 'gerente' || perfil === 'vendedor'
  const podeExcluir = perfil === 'admin' || perfil === 'gerente'

  async function handleExcluir() {
    if (!confirm(`Excluir cliente "${cliente.nome}"? Isso também excluirá todas as campanhas sem reservas.`)) return
    const result = await excluirCliente(cliente.id)
    if (result?.error) alert(result.error)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 flex-wrap">
        <Button variant="ghost" size="sm" nativeButton={false} render={<Link href="/clientes" />}>
          <ArrowLeft className="size-4 mr-1" />
          Voltar
        </Button>
        <div className="flex-1" />
        {podeEditar && (
          <Button variant="outline" size="sm" nativeButton={false} render={<Link href={`/clientes/${cliente.id}/editar`} />}>
            <Pencil className="size-4 mr-1" />
            Editar
          </Button>
        )}
        {podeExcluir && (
          <Button variant="destructive" size="sm" onClick={handleExcluir}>
            Excluir
          </Button>
        )}
      </div>

      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">{cliente.nome}</h1>
        {!cliente.ativo && <Badge variant="outline">Inativo</Badge>}
      </div>

      <div className="rounded-lg border p-4 space-y-2 text-sm max-w-md">
        {cliente.cnpj && (
          <p><span className="text-muted-foreground">CNPJ:</span> {cliente.cnpj}</p>
        )}
        {cliente.contato && (
          <p><span className="text-muted-foreground">Contato:</span> {cliente.contato}</p>
        )}
        {cliente.telefone && (
          <p><span className="text-muted-foreground">Telefone:</span> {cliente.telefone}</p>
        )}
        {cliente.email && (
          <p><span className="text-muted-foreground">Email:</span> {cliente.email}</p>
        )}
      </div>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">Campanhas</h2>
          {podeEditar && (
            <Button size="sm" nativeButton={false} render={<Link href={`/campanhas/nova?cliente_id=${cliente.id}`} />}>
              Nova campanha
            </Button>
          )}
        </div>
        {campanhas.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma campanha cadastrada.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Início</TableHead>
                <TableHead>Fim</TableHead>
                <TableHead className="text-right">Ver</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {campanhas.map((camp) => (
                <TableRow key={camp.id}>
                  <TableCell>{camp.nome}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {camp.data_inicio
                      ? new Date(camp.data_inicio + 'T00:00:00').toLocaleDateString('pt-BR')
                      : '—'}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {camp.data_fim
                      ? new Date(camp.data_fim + 'T00:00:00').toLocaleDateString('pt-BR')
                      : '—'}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" nativeButton={false} render={<Link href={`/campanhas/${camp.id}`} />}>
                      Ver
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </section>
    </div>
  )
}
