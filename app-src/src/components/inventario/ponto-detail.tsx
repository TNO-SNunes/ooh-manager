'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, Pencil, MapPin, Lightbulb } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DeleteDialog } from '@/components/inventario/delete-dialog'
import { alterarFotoPonto, excluirPonto } from '@/app/actions/pontos'
import { nomeLegivel } from '@/lib/pontos/actions'
import type { PontoMidia, PerfilUsuario } from '@/types'

interface PontoDetailProps {
  ponto: PontoMidia
  perfil: PerfilUsuario
}

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

export function PontoDetail({ ponto, perfil }: PontoDetailProps) {
  const boundAlterarFoto = alterarFotoPonto.bind(null, ponto.id)
  const [fotoState, fotoAction, fotoPending] = useActionState(boundAlterarFoto, {})

  const podeEditar = perfil === 'admin' || perfil === 'gerente'
  const podeExcluir = perfil === 'admin'

  const localizacaoParts = [
    ponto.municipio,
    ponto.cidade,
    ponto.estado,
  ].filter(Boolean)

  return (
    <div className="space-y-6">
      {/* Top action bar */}
      <div className="flex items-center gap-2 flex-wrap">
        <Button variant="ghost" size="sm" nativeButton={false} render={<Link href="/inventario" />}>
          <ArrowLeft className="size-4 mr-1" />
          Voltar
        </Button>

        <div className="flex-1" />

        {podeEditar && (
          <Button variant="outline" size="sm" nativeButton={false} render={<Link href={`/inventario/${ponto.id}/editar`} />}>
            <Pencil className="size-4 mr-1" />
            Editar
          </Button>
        )}

        {podeExcluir && (
          <DeleteDialog
            id={ponto.id}
            nome={nomeLegivel(ponto)}
            excluirPonto={excluirPonto}
          />
        )}
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
        {/* Column 1 — Foto */}
        <div className="space-y-3">
          {ponto.fotos_urls?.[0] ? (
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg border">
              <Image
                src={ponto.fotos_urls[0]}
                alt={`Foto de ${nomeLegivel(ponto)}`}
                fill
                className="object-cover"
              />
            </div>
          ) : (
            <div className="flex aspect-[4/3] w-full items-center justify-center rounded-lg border border-dashed text-muted-foreground text-sm">
              Sem foto
            </div>
          )}

          {podeEditar && (
            <form action={fotoAction} className="space-y-2">
              <input
                type="file"
                name="foto"
                accept="image/*"
                className="block w-full text-sm text-muted-foreground file:mr-2 file:rounded file:border file:border-border file:bg-background file:px-2 file:py-1 file:text-xs"
              />
              {fotoState?.error && (
                <p className="text-xs text-destructive">{fotoState.error}</p>
              )}
              <Button type="submit" variant="outline" size="sm" disabled={fotoPending} className="w-full">
                {fotoPending ? 'Enviando…' : 'Alterar foto'}
              </Button>
            </form>
          )}
        </div>

        {/* Column 2 — Dados */}
        <div className="space-y-5">
          {/* Header */}
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-sm text-muted-foreground">{ponto.codigo}</span>
              <Badge variant="outline">{TIPO_LABEL[ponto.tipo]}</Badge>
              <Badge variant={STATUS_VARIANT[ponto.status]}>{STATUS_LABEL[ponto.status]}</Badge>
            </div>
            <h1 className="text-2xl font-semibold">{nomeLegivel(ponto)}</h1>
          </div>

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
      </div>
    </div>
  )
}
