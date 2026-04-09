import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { ArrowLeft, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { excluirCampanha } from '@/app/actions/campanhas'
import type { Campanha, PerfilUsuario } from '@/types'

export default async function CampanhaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: perfil } = await supabase
    .from('usuarios')
    .select('empresa_id, perfil')
    .eq('id', user.id)
    .single()

  if (!perfil) redirect('/login')
  if (['funcionario', 'checkin'].includes(perfil.perfil)) redirect('/')

  const { data: campanha } = await supabase
    .from('campanhas')
    .select('*, cliente:clientes(id, nome)')
    .eq('id', id)
    .eq('empresa_id', perfil.empresa_id)
    .single()

  if (!campanha) notFound()

  const c = campanha as Campanha
  const podeEditar = ['admin', 'gerente', 'vendedor'].includes(perfil.perfil)
  const podeExcluir = ['admin', 'gerente'].includes(perfil.perfil)

  function formatDate(d?: string | null) {
    if (!d) return '—'
    return new Date(d + 'T00:00:00').toLocaleDateString('pt-BR')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 flex-wrap">
        <Button variant="ghost" size="sm" nativeButton={false} render={<Link href="/campanhas" />}>
          <ArrowLeft className="size-4 mr-1" />
          Voltar
        </Button>
        <div className="flex-1" />
        {podeEditar && (
          <Button variant="outline" size="sm" nativeButton={false} render={<Link href={`/campanhas/${id}/editar`} />}>
            <Pencil className="size-4 mr-1" />
            Editar
          </Button>
        )}
        {podeExcluir && (
          <form action={async () => { 'use server'; await excluirCampanha(id) }}>
            <Button type="submit" variant="destructive" size="sm">Excluir</Button>
          </form>
        )}
      </div>

      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">{c.nome}</h1>
        {c.cliente && (
          <p className="text-sm text-muted-foreground">
            Cliente:{' '}
            <Link href={`/clientes/${c.cliente.id}`} className="underline underline-offset-2">
              {c.cliente.nome}
            </Link>
          </p>
        )}
      </div>

      <div className="rounded-lg border p-4 space-y-2 text-sm max-w-md">
        {c.descricao && <p className="text-muted-foreground">{c.descricao}</p>}
        <p><span className="text-muted-foreground">Início:</span> {formatDate(c.data_inicio)}</p>
        <p><span className="text-muted-foreground">Fim:</span> {formatDate(c.data_fim)}</p>
      </div>
    </div>
  )
}
