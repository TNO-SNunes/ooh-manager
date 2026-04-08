'use client'

import { useActionState, useRef } from 'react'
import { DownloadIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { gerarTemplateExcel } from '@/lib/pontos/excel'
import type { ActionState } from '@/app/actions/pontos'

type ImportState = ActionState & { importados?: number; erros?: string[] }

interface ImportModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  importarPontos: (prev: ImportState, formData: FormData) => Promise<ImportState>
}

const initialState: ImportState = {}

export function ImportModal({ open, onOpenChange, importarPontos }: ImportModalProps) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [state, formAction, pending] = useActionState(importarPontos, initialState)

  function handleDownloadTemplate() {
    const base64 = gerarTemplateExcel()
    const byteCharacters = atob(base64)
    const byteNumbers = new Uint8Array(byteCharacters.length)
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i)
    }
    const blob = new Blob([byteNumbers], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'template_pontos.xlsx'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => onOpenChange(isOpen)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Importar pontos via Excel</DialogTitle>
          <DialogDescription>
            Faça upload de uma planilha Excel com os dados dos pontos de mídia.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <Button
            variant="outline"
            size="sm"
            className="w-fit"
            onClick={handleDownloadTemplate}
            type="button"
          >
            <DownloadIcon />
            Baixar template
          </Button>

          <form id="import-form" action={formAction} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="planilha" className="text-sm font-medium">
                Arquivo Excel
              </label>
              <input
                ref={fileRef}
                id="planilha"
                name="planilha"
                type="file"
                accept=".xlsx,.xls"
                className="text-sm file:mr-3 file:rounded-md file:border-0 file:bg-muted file:px-3 file:py-1.5 file:text-sm file:font-medium hover:file:bg-muted/80"
              />
            </div>

            {state?.importados !== undefined && state.importados > 0 && (
              <p className="text-sm text-green-700 dark:text-green-400 rounded-md bg-green-50 dark:bg-green-950/30 px-3 py-2">
                {state.importados} ponto(s) importado(s) com sucesso.
              </p>
            )}

            {state?.error && (
              <p className="text-sm text-destructive rounded-md bg-destructive/10 px-3 py-2">
                {state.error}
              </p>
            )}

            {state?.erros && state.erros.length > 0 && (
              <div className="rounded-md bg-amber-50 dark:bg-amber-950/30 px-3 py-2">
                <p className="text-sm font-medium text-amber-700 dark:text-amber-400 mb-1">
                  Erros encontrados:
                </p>
                <ul className="text-sm text-amber-700 dark:text-amber-400 list-disc list-inside space-y-0.5">
                  {state.erros.map((erro, i) => (
                    <li key={i}>{erro}</li>
                  ))}
                </ul>
              </div>
            )}
          </form>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            type="button"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            form="import-form"
            disabled={pending}
          >
            {pending ? 'Importando…' : 'Importar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
