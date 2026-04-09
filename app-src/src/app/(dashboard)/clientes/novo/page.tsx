import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ClienteForm } from '@/components/clientes/cliente-form'

export default async function NovoClientePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: perfil } = await supabase
    .from('usuarios')
    .select('perfil')
    .eq('id', user.id)
    .single()

  if (!perfil || !['admin', 'gerente', 'vendedor'].includes(perfil.perfil)) {
    redirect('/clientes')
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-semibold">Novo Cliente</h1>
        <p className="text-sm text-muted-foreground">Cadastre um novo cliente.</p>
      </div>
      <ClienteForm voltarHref="/clientes" />
    </div>
  )
}
