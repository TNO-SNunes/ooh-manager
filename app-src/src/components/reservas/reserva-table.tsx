'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from '@/components/ui/table'
import { cancelarReservaAction, aprovarReservaAction, rejeitarReservaAction } from '@/app/actions/reservas'
import type { ReservaComJoins, PerfilUsuario } from '@/types'

interface ReservaTableProps {
  reservas: ReservaComJoins[]
  perfilUsuario: PerfilUsuario
  mostrarVendedor?: boolean
}

const STATUS_LABELS: Record<string, string> = {
  solicitada: 'Solicitada',
  ativa: 'Ativa',
  rejeitada: 'Rejeitada',
  cancelada: 'Cancelada',
  finalizada: 'Finalizada',
}

const STATUS_CLASSES: Record<string, string> = {
  solicitada: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  ativa: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  rejeitada: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  cancelada: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  finalizada: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
}

function formatDate(iso: string) {
  return new Date(iso + 'T12:00:00').toLocaleDateString('pt-BR')
}

export function ReservaTable({ reservas, perfilUsuario, mostrarVendedor = false }: ReservaTableProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [pendingRowId, setPendingRowId] = useState<string | null>(null)

  // Rejection dialog state
  const [rejeicaoRowId, setRejeicaoRowId] = useState<string | null>(null)
  const [motivoRejeicao, setMotivoRejeicao] = useState('')
  const [rejeicaoError, setRejeicaoError] = useState('')

  const podeCancelar = ['admin', 'gerente', 'vendedor'].includes(perfilUsuario)
  const podeAprovar = ['admin', 'gerente', 'midia'].includes(perfilUsuario)
  const podeRejeitar = ['admin', 'gerente', 'midia'].includes(perfilUsuario)

  function handleCancelar(id: string) {
    setPendingRowId(id)
    startTransition(async () => {
      await cancelarReservaAction(id)
      setPendingRowId(null)
      router.refresh()
    })
  }

  function handleAprovar(id: string) {
    setPendingRowId(id)
    startTransition(async () => {
      await aprovarReservaAction(id)
      setPendingRowId(null)
      router.refresh()
    })
  }

  function abrirRejeicao(id: string) {
    setRejeicaoRowId(id)
    setMotivoRejeicao('')
    setRejeicaoError('')
  }

  function fecharRejeicao() {
    setRejeicaoRowId(null)
    setMotivoRejeicao('')
    setRejeicaoError('')
  }

  function handleConfirmarRejeicao() {
    if (!rejeicaoRowId) return
    if (motivoRejeicao.trim().length < 10) {
      setRejeicaoError('Motivo deve ter pelo menos 10 caracteres.')
      return
    }
    const id = rejeicaoRowId
    const motivo = motivoRejeicao.trim()
    setPendingRowId(id)
    setRejeicaoRowId(null)
    startTransition(async () => {
      await rejeitarReservaAction(id, motivo)
      setPendingRowId(null)
      router.refresh()
    })
  }

  if (reservas.length === 0) {
    return (
      <div className="py-12 text-center text-sm text-muted-foreground">
        Nenhuma reserva encontrada.
      </div>
    )
  }

  const colSpan = mostrarVendedor ? 6 : 5

  return (
    <>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ponto</TableHead>
              <TableHead>Período</TableHead>
              <TableHead>Cliente / Campanha</TableHead>
              {mostrarVendedor && <TableHead>Vendedor</TableHead>}
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reservas.map((r) => {
              const isRowPending = isPending && pendingRowId === r.id
              return (
                <TableRow key={r.id} className={isRowPending ? 'opacity-60 pointer-events-none' : ''}>
                  {/* Ponto */}
                  <TableCell className="text-sm">
                    <div className="font-medium">
                      {r.ponto.codigo} ({r.ponto.tipo})
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {r.ponto.endereco ?? r.ponto.nome}
                    </div>
                  </TableCell>

                  {/* Período */}
                  <TableCell className="text-sm whitespace-nowrap">
                    {formatDate(r.data_inicio)} → {formatDate(r.data_fim)}
                  </TableCell>

                  {/* Cliente / Campanha */}
                  <TableCell className="text-sm">
                    <div className="font-semibold">{r.campanha.cliente.nome}</div>
                    <div className="text-xs text-muted-foreground">{r.campanha.nome}</div>
                  </TableCell>

                  {/* Vendedor — condicional */}
                  {mostrarVendedor && (
                    <TableCell className="text-sm">{r.vendedor.nome}</TableCell>
                  )}

                  {/* Status */}
                  <TableCell>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_CLASSES[r.status] ?? ''}`}
                    >
                      {STATUS_LABELS[r.status] ?? r.status}
                    </span>
                  </TableCell>

                  {/* Ações */}
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      {r.status === 'solicitada' && podeCancelar && (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={isRowPending}
                          onClick={() => handleCancelar(r.id)}
                        >
                          Cancelar
                        </Button>
                      )}
                      {r.status === 'solicitada' && podeAprovar && (
                        <Button
                          variant="default"
                          size="sm"
                          disabled={isRowPending}
                          onClick={() => handleAprovar(r.id)}
                        >
                          Aprovar
                        </Button>
                      )}
                      {r.status === 'solicitada' && podeRejeitar && (
                        <Button
                          variant="destructive"
                          size="sm"
                          disabled={isRowPending}
                          onClick={() => abrirRejeicao(r.id)}
                        >
                          Rejeitar
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      {/* Rejection dialog */}
      {rejeicaoRowId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={(e) => { if (e.target === e.currentTarget) fecharRejeicao() }}
        >
          <div className="w-full max-w-md rounded-lg border bg-background p-6 shadow-lg">
            <h2 className="mb-1 text-base font-semibold">Rejeitar reserva</h2>
            <p className="mb-4 text-sm text-muted-foreground">
              Informe o motivo da rejeição (obrigatório, mínimo 10 caracteres).
            </p>
            <textarea
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              rows={4}
              placeholder="Descreva o motivo da rejeição…"
              value={motivoRejeicao}
              onChange={(e) => {
                setMotivoRejeicao(e.target.value)
                if (rejeicaoError) setRejeicaoError('')
              }}
            />
            {rejeicaoError && (
              <p className="mt-1 text-xs text-destructive">{rejeicaoError}</p>
            )}
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={fecharRejeicao}>
                Cancelar
              </Button>
              <Button
                variant="destructive"
                size="sm"
                disabled={motivoRejeicao.trim().length < 10}
                onClick={handleConfirmarRejeicao}
              >
                Confirmar rejeição
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
