'use client'

import { useState } from 'react'
import { PontoTable } from '@/components/inventario/ponto-table'
import { ImportModal } from '@/components/inventario/import-modal'
import { importarPontos } from '@/app/actions/pontos'
import type { PontoMidia, PerfilUsuario } from '@/types'

interface InventarioClientProps {
  pontos: PontoMidia[]
  total: number
  pagina: number
  municipios: string[]
  perfil: PerfilUsuario
}

export function InventarioClient({ pontos, total, pagina, municipios, perfil }: InventarioClientProps) {
  const [importOpen, setImportOpen] = useState(false)
  const podeImportar = perfil === 'admin' || perfil === 'gerente'

  return (
    <>
      <PontoTable
        pontos={pontos}
        total={total}
        pagina={pagina}
        municipios={municipios}
        perfil={perfil}
        onImportar={podeImportar ? () => setImportOpen(true) : undefined}
      />
      {podeImportar && (
        <ImportModal
          open={importOpen}
          onOpenChange={setImportOpen}
          importarPontos={importarPontos}
        />
      )}
    </>
  )
}
