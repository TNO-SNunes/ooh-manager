'use client'

import { Lightbulb, MapPin, Pencil } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { nomeLegivel } from '@/lib/pontos/actions'
import type { PontoMidia } from '@/types'

const TIPO_LABEL: Record<PontoMidia['tipo'], string> = {
  outdoor: 'Outdoor',
  frontlight: 'Frontlight',
  empena: 'Empena',
  led: 'LED/DOOH',
}

const STATUS_LABEL: Record<PontoMidia['status'], string> = {
  ativo: 'Ativo',
  manutencao: 'Manutenção',
  inativo: 'Inativo',
}

const STATUS_VARIANT: Record<PontoMidia['status'], 'default' | 'secondary' | 'outline'> = {
  ativo: 'default',
  manutencao: 'secondary',
  inativo: 'outline',
}

interface PontoSheetDetalheProps {
  ponto: PontoMidia
  open: boolean
  onClose: () => void
  onEditar: () => void
  podeEditar: boolean
}

export function PontoSheetDetalhe({
  ponto,
  open,
  onClose,
  onEditar,
  podeEditar,
}: PontoSheetDetalheProps) {
  const localizacaoParts = [ponto.municipio, ponto.cidade, ponto.estado].filter(Boolean)

  return (
    <Sheet open={open} onOpenChange={(isOpen) => { if (!isOpen) onClose() }}>
      <SheetContent side="right" className="sm:max-w-[480px] overflow-y-auto flex flex-col gap-0 p-0">
        <SheetHeader className="border-b p-4 pb-3">
          <div className="pr-8 space-y-0.5">
            <span className="font-mono text-xs text-muted-foreground">{ponto.codigo}</span>
            <SheetTitle className="text-base">{nomeLegivel(ponto)}</SheetTitle>
          </div>
          <div className="flex gap-1.5 flex-wrap">
            <Badge variant="outline">{TIPO_LABEL[ponto.tipo]}</Badge>
            <Badge variant={STATUS_VARIANT[ponto.status]}>{STATUS_LABEL[ponto.status]}</Badge>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {/* Localização */}
          <section className="space-y-1">
            <h2 className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
              <MapPin className="size-4" />
              Localização
            </h2>
            <div className="space-y-0.5 text-sm">
              {ponto.endereco && <p>{ponto.endereco}</p>}
              {ponto.sentido && <p className="text-muted-foreground">Sentido: {ponto.sentido}</p>}
              {ponto.bairro && <p className="text-muted-foreground">{ponto.bairro}</p>}
              {localizacaoParts.length > 0 && (
                <p className="text-muted-foreground">{localizacaoParts.join(' / ')}</p>
              )}
            </div>
            {ponto.latitude != null && ponto.longitude != null && (
              <p className="text-xs text-muted-foreground font-mono">
                {ponto.latitude.toFixed(6)}, {ponto.longitude.toFixed(6)}
              </p>
            )}
          </section>

          {/* Características */}
          <section className="space-y-2">
            <h2 className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
              <Lightbulb className="size-4" />
              Características
            </h2>
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
              {ponto.largura_m != null && ponto.altura_m != null && (
                <>
                  <dt className="text-muted-foreground">Dimensões</dt>
                  <dd>{ponto.largura_m} × {ponto.altura_m} m</dd>
                </>
              )}
              <dt className="text-muted-foreground">Iluminação</dt>
              <dd>{ponto.iluminacao ? 'Sim' : 'Não'}</dd>
              {ponto.tipo === 'outdoor' && ponto.numero_painel != null && (
                <>
                  <dt className="text-muted-foreground">Tabuleta Nº</dt>
                  <dd>{ponto.numero_painel}</dd>
                </>
              )}
              {(ponto.tipo === 'frontlight' || ponto.tipo === 'empena') && ponto.numero_painel != null && (
                <>
                  <dt className="text-muted-foreground">Painel Nº</dt>
                  <dd>{ponto.numero_painel}</dd>
                </>
              )}
              {ponto.tipo === 'led' && (
                <>
                  {ponto.slots_totais != null && (
                    <>
                      <dt className="text-muted-foreground">Cotas totais</dt>
                      <dd>{ponto.slots_totais}</dd>
                    </>
                  )}
                  {ponto.slot_duracao_s != null && (
                    <>
                      <dt className="text-muted-foreground">Duração da cota</dt>
                      <dd>{ponto.slot_duracao_s} segundos</dd>
                    </>
                  )}
                  {ponto.resolucao && (
                    <>
                      <dt className="text-muted-foreground">Resolução</dt>
                      <dd>{ponto.resolucao}</dd>
                    </>
                  )}
                </>
              )}
            </dl>
          </section>

          {/* Observações */}
          {ponto.observacoes && (
            <section className="space-y-1">
              <h2 className="text-sm font-medium text-muted-foreground">Observações</h2>
              <p className="text-sm whitespace-pre-wrap">{ponto.observacoes}</p>
            </section>
          )}
        </div>

        {podeEditar && (
          <div className="border-t p-4">
            <Button className="w-full" onClick={onEditar}>
              <Pencil className="size-4 mr-2" />
              Editar
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
