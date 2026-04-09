import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function PerfilPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('usuarios')
    .select('nome, email, perfil')
    .eq('id', user.id)
    .single()

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Meu Perfil</h1>
      <div className="rounded-lg border p-4 space-y-2 text-sm">
        <p><span className="text-muted-foreground">Nome:</span> {profile?.nome}</p>
        <p><span className="text-muted-foreground">Email:</span> {profile?.email}</p>
        <p><span className="text-muted-foreground">Perfil:</span> {profile?.perfil}</p>
      </div>
    </div>
  )
}
