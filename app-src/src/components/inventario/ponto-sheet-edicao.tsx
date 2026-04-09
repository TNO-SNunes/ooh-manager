'use client'

import { useActionState, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { editarPontoAction } from '@/app/actions/pontos'
import { nomeLegivel } from '@/lib/pontos/actions'
import type { PontoMidia, TipoPonto, StatusPonto } from '@/types'

interface PontoSheetEdicaoProps {
  ponto: PontoMidia
  open: boolean
  onClose: () => void
}

export function PontoSheetEdicao({ ponto, open, onClose }: PontoSheetEdicaoProps) {
  const router = useRouter()
  const action = editarPontoAction.bind(null, ponto.id)
  const [state, formAction, pending] = useActionState(action, {})

  const [tipo, setTipo] = useState<TipoPonto | ''>(ponto.tipo)
  const [status, setStatus] = useState<StatusPonto>(ponto.status)
  const [iluminacao, setIluminacao] = useState<boolean>(ponto.iluminacao ?? false)
  const [slotDuracao, setSlotDuracao] = useState<string>(
    ponto.slot_duracao_s ? String(ponto.slot_duracao_s) : ''
  )

  useEffect(() => {
    if (state.ok) {
      onClose()
      router.refresh()
    }
  }, [state.ok])

  const err = (campo: string) => state.fieldErrors?.[campo]
  const isOutdoor = tipo === 'outdoor'
  const isFrontlightOrEmpena = tipo === 'frontlight' || tipo === 'empena'
  const isLed = tipo === 'led'

  return (
    <Sheet open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose() }}>
      <SheetContent side="right" className="sm:max-w-[480px] flex flex-col gap-0 p-0">
        <SheetHeader className="border-b p-4 pb-3">
          <SheetTitle className="pr-8 text-base">
            Editar — {nomeLegivel(ponto)}
          </SheetTitle>
        </SheetHeader>

        <form
          id="sheet-edit-form"
          action={formAction}
          className="flex-1 overflow-y-auto p-4 space-y-4"
        >
          {state.error && (
            <div className="rounded-lg border border-destructive bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {state.error}
            </div>
          )}

          {/* Tipo + Status */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="se-tipo">
                Tipo <span className="text-destructive">*</span>
              </Label>
              <Select
                value={tipo}
                onValueChange={(val) => setTipo(val as TipoPonto)}
                name="tipo"
              >
                <SelectTrigger id="se-tipo" className="w-full" aria-invalid={Boolean(err('tipo'))}>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="outdoor">Outdoor</SelectItem>
                  <SelectItem value="frontlight">Frontlight</SelectItem>
                  <SelectItem value="empena">Empena</SelectItem>
                  <SelectItem value="led">LED / DOOH</SelectItem>
                </SelectContent>
              </Select>
              {err('tipo') && <p className="text-xs text-destructive">{err('tipo')}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="se-status">Status</Label>
              <Select
                value={status}
                onValueChange={(val) => setStatus(val as StatusPonto)}
                name="status"
              >
                <SelectTrigger id="se-status" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ativo">Ativo</SelectItem>
                  <SelectItem value="inativo">Inativo</SelectItem>
                  <SelectItem value="manutencao">Em manutenção</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Código */}
          <div className="space-y-1.5">
            <Label htmlFor="se-codigo">Código</Label>
            <Input
              id="se-codigo"
              name="codigo"
              defaultValue={ponto.codigo}
              aria-invalid={Boolean(err('codigo'))}
            />
            {err('codigo') && <p className="text-xs text-destructive">{err('codigo')}</p>}
          </div>

          {/* Nome */}
          <div className="space-y-1.5">
            <Label htmlFor="se-nome">
              Nome Fantasia <span className="text-destructive">*</span>
            </Label>
            <Input
              id="se-nome"
              name="nome"
              required
              defaultValue={ponto.nome}
              aria-invalid={Boolean(err('nome'))}
            />
            {err('nome') && <p className="text-xs text-destructive">{err('nome')}</p>}
          </div>

          {/* Endereço */}
          <div className="space-y-1.5">
            <Label htmlFor="se-endereco">
              Endereço <span className="text-destructive">*</span>
            </Label>
            <Input
              id="se-endereco"
              name="endereco"
              required
              defaultValue={ponto.endereco}
              aria-invalid={Boolean(err('endereco'))}
            />
            {err('endereco') && <p className="text-xs text-destructive">{err('endereco')}</p>}
          </div>

          {/* Sentido + Bairro */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="se-sentido">Sentido</Label>
              <Input id="se-sentido" name="sentido" defaultValue={ponto.sentido ?? ''} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="se-bairro">Bairro</Label>
              <Input id="se-bairro" name="bairro" defaultValue={ponto.bairro ?? ''} />
            </div>
          </div>

          {/* Município + Cidade */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="se-municipio">
                Município <span className="text-destructive">*</span>
              </Label>
              <Input
                id="se-municipio"
                name="municipio"
                required
                defaultValue={ponto.municipio ?? ''}
                aria-invalid={Boolean(err('municipio'))}
              />
              {err('municipio') && <p className="text-xs text-destructive">{err('municipio')}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="se-cidade">
                Cidade <span className="text-destructive">*</span>
              </Label>
              <Input
                id="se-cidade"
                name="cidade"
                required
                defaultValue={ponto.cidade ?? ''}
                aria-invalid={Boolean(err('cidade'))}
              />
              {err('cidade') && <p className="text-xs text-destructive">{err('cidade')}</p>}
            </div>
          </div>

          {/* Estado */}
          <div className="space-y-1.5">
            <Label htmlFor="se-estado">
              Estado <span className="text-destructive">*</span>
            </Label>
            <Input
              id="se-estado"
              name="estado"
              required
              maxLength={2}
              defaultValue={ponto.estado ?? ''}
              placeholder="RJ"
              className="uppercase w-24"
              aria-invalid={Boolean(err('estado'))}
            />
            {err('estado') && <p className="text-xs text-destructive">{err('estado')}</p>}
          </div>

          {/* Latitude + Longitude */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="se-latitude">Latitude</Label>
              <Input
                id="se-latitude"
                name="latitude"
                type="number"
                step="any"
                defaultValue={ponto.latitude ?? ''}
                aria-invalid={Boolean(err('latitude'))}
                placeholder="-22.9068"
              />
              {err('latitude') && <p className="text-xs text-destructive">{err('latitude')}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="se-longitude">Longitude</Label>
              <Input
                id="se-longitude"
                name="longitude"
                type="number"
                step="any"
                defaultValue={ponto.longitude ?? ''}
                aria-invalid={Boolean(err('longitude'))}
                placeholder="-43.1729"
              />
              {err('longitude') && <p className="text-xs text-destructive">{err('longitude')}</p>}
            </div>
          </div>

          {/* Largura + Altura */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="se-largura">Largura (m)</Label>
              <Input
                id="se-largura"
                name="largura_m"
                type="number"
                step="any"
                min="0"
                defaultValue={ponto.largura_m ?? ''}
                placeholder="9.0"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="se-altura">Altura (m)</Label>
              <Input
                id="se-altura"
                name="altura_m"
                type="number"
                step="any"
                min="0"
                defaultValue={ponto.altura_m ?? ''}
                placeholder="3.0"
              />
            </div>
          </div>

          {/* Iluminação */}
          <div className="flex items-center gap-3">
            <Label htmlFor="se-iluminacao">Iluminação</Label>
            <input type="hidden" name="iluminacao" value={iluminacao ? 'true' : 'false'} />
            <Switch
              id="se-iluminacao"
              checked={iluminacao}
              onCheckedChange={setIluminacao}
            />
            <span className="text-sm text-muted-foreground">
              {iluminacao ? 'Sim' : 'Não'}
            </span>
          </div>

          {/* Tabuleta (Outdoor) */}
          {isOutdoor && (
            <div className="space-y-1.5">
              <Label htmlFor="se-painel">Tabuleta Nº</Label>
              <Input
                id="se-painel"
                name="numero_painel"
                type="number"
                min={1}
                defaultValue={ponto.numero_painel ?? 1}
              />
            </div>
          )}

          {/* Painel (Frontlight / Empena) */}
          {isFrontlightOrEmpena && (
            <div className="space-y-1.5">
              <Label htmlFor="se-painel">Painel Nº</Label>
              <Input
                id="se-painel"
                name="numero_painel"
                type="number"
                min={1}
                defaultValue={ponto.numero_painel ?? 1}
              />
            </div>
          )}

          {/* LED */}
          {isLed && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="se-slots">
                    Cotas totais <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="se-slots"
                    name="slots_totais"
                    type="number"
                    min={1}
                    required
                    defaultValue={ponto.slots_totais ?? ''}
                    aria-invalid={Boolean(err('slots_totais'))}
                  />
                  {err('slots_totais') && (
                    <p className="text-xs text-destructive">{err('slots_totais')}</p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="se-duracao">
                    Duração da cota <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={slotDuracao}
                    onValueChange={(val) => setSlotDuracao(val ?? '')}
                    name="slot_duracao_s"
                  >
                    <SelectTrigger
                      id="se-duracao"
                      className="w-full"
                      aria-invalid={Boolean(err('slot_duracao_s'))}
                    >
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10 segundos</SelectItem>
                      <SelectItem value="15">15 segundos</SelectItem>
                    </SelectContent>
                  </Select>
                  {err('slot_duracao_s') && (
                    <p className="text-xs text-destructive">{err('slot_duracao_s')}</p>
                  )}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="se-resolucao">Resolução</Label>
                <Input
                  id="se-resolucao"
                  name="resolucao"
                  defaultValue={ponto.resolucao ?? ''}
                  placeholder="ex: 1920x1080"
                />
              </div>
            </>
          )}
        </form>

        <SheetFooter className="border-t p-4">
          <Button variant="outline" type="button" onClick={onClose} disabled={pending}>
            Cancelar
          </Button>
          <Button type="submit" form="sheet-edit-form" disabled={pending}>
            {pending ? 'Salvando…' : 'Salvar alterações'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
