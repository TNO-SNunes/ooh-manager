'use client'

import { useActionState, useState } from 'react'
import { TriangleAlertIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { ActionState } from '@/app/actions/pontos'

interface DeleteDialogProps {
  id: string
  nome: string
  excluirPonto: (id: string) => Promise<ActionState>
}

const initialState: ActionState = {}

export function DeleteDialog({ id, nome, excluirPonto }: DeleteDialogProps) {
  const [open, setOpen] = useState(false)
  const boundAction = excluirPonto.bind(null, id)
  const [state, formAction, pending] = useActionState(
    (_prev: ActionState, _formData: FormData) => boundAction(),
    initialState
  )

  return (
    <>
      <Button
        variant="destructive"
        size="sm"
        onClick={() => setOpen(true)}
      >
        Excluir
      </Button>

      <Dialog open={open} onOpenChange={(isOpen) => setOpen(isOpen)}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <TriangleAlertIcon className="size-5 text-destructive" />
              Excluir ponto
            </DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir o ponto{' '}
              <strong className="text-foreground">{nome}</strong>?
              Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>

          {state?.error && (
            <p className="text-sm text-destructive rounded-md bg-destructive/10 px-3 py-2">
              {state.error}
            </p>
          )}

          <DialogFooter>
            <DialogClose render={<Button variant="outline" />} onClick={() => setOpen(false)}>
              Cancelar
            </DialogClose>
            <form action={formAction}>
              <Button
                type="submit"
                variant="destructive"
                disabled={pending}
              >
                {pending ? 'Excluindo…' : 'Confirmar exclusão'}
              </Button>
            </form>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
