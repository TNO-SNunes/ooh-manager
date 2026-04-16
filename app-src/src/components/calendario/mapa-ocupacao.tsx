import { cn } from '@/lib/utils'

export interface ColunaMapa {
  key: string
  label: string
}

export interface LinhaMapa {
  key: string
  label: string
  sublabel?: string
  cells: React.ReactNode[]
}

export interface MapaOcupacaoProps {
  colunas: ColunaMapa[]
  linhas: LinhaMapa[]
  titulo?: string
}

export function MapaOcupacao({ colunas, linhas, titulo }: MapaOcupacaoProps) {
  if (linhas.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
        Nenhum ponto encontrado para os filtros selecionados.
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-muted/50">
            <th className="sticky left-0 z-10 bg-muted/80 border px-3 py-2 text-left font-medium min-w-[200px]">
              {titulo ?? 'Localização'}
            </th>
            {colunas.map(col => (
              <th key={col.key} className="border px-2 py-2 text-center font-medium whitespace-nowrap min-w-[120px]">
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {linhas.map(linha => (
            <tr key={linha.key} className="hover:bg-muted/20">
              <td className="sticky left-0 z-10 bg-background border px-3 py-2 align-top">
                <div className="font-medium text-xs">{linha.label}</div>
                {linha.sublabel && (
                  <div className="text-[10px] text-muted-foreground mt-0.5">{linha.sublabel}</div>
                )}
              </td>
              {linha.cells}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
