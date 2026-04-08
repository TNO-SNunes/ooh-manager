import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PontoForm } from '@/components/inventario/ponto-form'

export default async function NovoPontoPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: perfil } = await supabase
    .from('usuarios')
    .select('empresa_id, perfil')
    .eq('id', user.id)
    .single()

  if (!perfil || !['admin', 'gerente'].includes(perfil.perfil)) {
    redirect('/inventario')
  }

  const { data: codigosData } = await supabase
    .from('pontos_midia')
    .select('codigo')
    .eq('empresa_id', perfil.empresa_id)

  const codigos = (codigosData ?? []).map(p => p.codigo)

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-semibold">Novo Ponto</h1>
        <p className="text-sm text-muted-foreground">Cadastre um novo ponto de mídia.</p>
      </div>
      <PontoForm codigosExistentes={codigos} />
    </div>
  )
}
