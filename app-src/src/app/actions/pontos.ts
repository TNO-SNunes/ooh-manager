'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { gerarCodigo, validarPonto } from '@/lib/pontos/actions'
import { parsearImportacao, gerarExportacao } from '@/lib/pontos/excel'
import type { PontoMidia, TipoPonto, StatusPonto } from '@/types'

export type ActionState = {
  error?: string
  fieldErrors?: Record<string, string>
}

// ─── helpers ────────────────────────────────────────────────

function formDataToPonto(formData: FormData): Partial<PontoMidia> {
  const get = (key: string) => {
    const val = formData.get(key)
    return val ? String(val).trim() : undefined
  }
  const getNum = (key: string) => {
    const val = get(key)
    if (!val) return undefined
    const n = parseFloat(val)
    return isNaN(n) ? undefined : n
  }
  const getInt = (key: string) => {
    const val = get(key)
    if (!val) return undefined
    const n = parseInt(val, 10)
    return isNaN(n) ? undefined : n
  }

  return {
    tipo: get('tipo') as TipoPonto | undefined,
    nome: get('nome'),
    codigo: get('codigo') || undefined,
    status: (get('status') as StatusPonto | undefined) ?? 'ativo',
    endereco: get('endereco'),
    sentido: get('sentido'),
    bairro: get('bairro'),
    municipio: get('municipio'),
    cidade: get('cidade'),
    estado: get('estado'),
    latitude: getNum('latitude'),
    longitude: getNum('longitude'),
    largura_m: getNum('largura_m'),
    altura_m: getNum('altura_m'),
    iluminacao: formData.get('iluminacao') === 'true',
    numero_painel: getInt('numero_painel'),
    slots_totais: getInt('slots_totais'),
    slot_duracao_s: getInt('slot_duracao_s'),
    resolucao: get('resolucao'),
    observacoes: get('observacoes'),
  }
}

async function uploadFoto(
  supabase: Awaited<ReturnType<typeof createClient>>,
  empresaId: string,
  pontoId: string,
  file: File
): Promise<string | null> {
  if (file.size === 0) return null
  if (file.size > 5 * 1024 * 1024) throw new Error('Foto deve ter no máximo 5MB')

  const ext = file.name.split('.').pop() ?? 'jpg'
  const path = `${empresaId}/${pontoId}/foto.${ext}`
  const { error } = await supabase.storage
    .from('pontos')
    .upload(path, file, { upsert: true })

  if (error) throw new Error(`Erro no upload: ${error.message}`)

  const { data } = supabase.storage.from('pontos').getPublicUrl(path)
  return data.publicUrl
}

// ─── Server Actions ────────────────────────────────────────

export async function criarPonto(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autorizado' }

  const { data: perfil } = await supabase
    .from('usuarios')
    .select('empresa_id, perfil')
    .eq('id', user.id)
    .single()

  if (!perfil || !['admin', 'gerente'].includes(perfil.perfil)) {
    return { error: 'Sem permissão' }
  }

  const dados = formDataToPonto(formData)
  const erros = validarPonto(dados)
  if (erros.length > 0) {
    const fieldErrors: Record<string, string> = {}
    erros.forEach(e => { fieldErrors[e.campo] = e.mensagem })
    return { fieldErrors }
  }

  if (!dados.codigo && dados.municipio) {
    const { data: existentes } = await supabase
      .from('pontos_midia')
      .select('codigo')
      .eq('empresa_id', perfil.empresa_id)
    const codigos = (existentes ?? []).map((p: { codigo: string }) => p.codigo)
    dados.codigo = gerarCodigo(dados.municipio, codigos)
  }

  const { data: ponto, error } = await supabase
    .from('pontos_midia')
    .insert({ ...dados, empresa_id: perfil.empresa_id })
    .select('id')
    .single()

  if (error) {
    if (error.code === '23505') return { error: 'Código já existe para esta empresa' }
    return { error: error.message }
  }

  const foto = formData.get('foto') as File | null
  if (foto && foto.size > 0) {
    try {
      const url = await uploadFoto(supabase, perfil.empresa_id, ponto.id, foto)
      if (url) {
        await supabase
          .from('pontos_midia')
          .update({ fotos_urls: [url] })
          .eq('id', ponto.id)
      }
    } catch (e) {
      console.error('Upload foto falhou:', e)
    }
  }

  redirect(`/inventario/${ponto.id}`)
}

export async function editarPonto(
  id: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autorizado' }

  const { data: perfil } = await supabase
    .from('usuarios')
    .select('empresa_id, perfil')
    .eq('id', user.id)
    .single()

  if (!perfil || !['admin', 'gerente'].includes(perfil.perfil)) {
    return { error: 'Sem permissão' }
  }

  const dados = formDataToPonto(formData)
  const erros = validarPonto(dados)
  if (erros.length > 0) {
    const fieldErrors: Record<string, string> = {}
    erros.forEach(e => { fieldErrors[e.campo] = e.mensagem })
    return { fieldErrors }
  }

  const { error } = await supabase
    .from('pontos_midia')
    .update(dados)
    .eq('id', id)
    .eq('empresa_id', perfil.empresa_id)

  if (error) {
    if (error.code === '23505') return { error: 'Código já existe para esta empresa' }
    return { error: error.message }
  }

  const foto = formData.get('foto') as File | null
  if (foto && foto.size > 0) {
    try {
      const url = await uploadFoto(supabase, perfil.empresa_id, id, foto)
      if (url) {
        await supabase
          .from('pontos_midia')
          .update({ fotos_urls: [url] })
          .eq('id', id)
      }
    } catch (e) {
      console.error('Upload foto falhou:', e)
    }
  }

  redirect(`/inventario/${id}`)
}

export async function excluirPonto(id: string): Promise<ActionState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autorizado' }

  const { data: perfil } = await supabase
    .from('usuarios')
    .select('empresa_id, perfil')
    .eq('id', user.id)
    .single()

  if (!perfil || perfil.perfil !== 'admin') {
    return { error: 'Apenas Admin pode excluir pontos' }
  }

  const { count } = await supabase
    .from('reservas')
    .select('id', { count: 'exact', head: true })
    .eq('ponto_id', id)
    .in('status', ['solicitada', 'ativa'])

  if (count && count > 0) {
    return { error: 'Este ponto não pode ser excluído pois possui reservas ativas ou pendentes.' }
  }

  const { data: ponto } = await supabase
    .from('pontos_midia')
    .select('fotos_urls, empresa_id')
    .eq('id', id)
    .single()

  const { error } = await supabase
    .from('pontos_midia')
    .delete()
    .eq('id', id)
    .eq('empresa_id', perfil.empresa_id)

  if (error) return { error: error.message }

  if (ponto?.fotos_urls?.[0]) {
    const urlPath = ponto.fotos_urls[0].split('/pontos/')[1]
    if (urlPath) {
      await supabase.storage.from('pontos').remove([urlPath])
    }
  }

  revalidatePath('/inventario')
  redirect('/inventario')
}

export async function importarPontos(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState & { importados?: number; erros?: string[] }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autorizado' }

  const { data: perfil } = await supabase
    .from('usuarios')
    .select('empresa_id, perfil')
    .eq('id', user.id)
    .single()

  if (!perfil || !['admin', 'gerente'].includes(perfil.perfil)) {
    return { error: 'Sem permissão' }
  }

  const arquivo = formData.get('planilha') as File | null
  if (!arquivo || arquivo.size === 0) return { error: 'Nenhum arquivo enviado' }

  const buffer = await arquivo.arrayBuffer()
  const linhas = parsearImportacao(buffer)

  const errosImportacao: string[] = []
  const validos: Partial<PontoMidia>[] = []

  const { data: existentes } = await supabase
    .from('pontos_midia')
    .select('codigo')
    .eq('empresa_id', perfil.empresa_id)
  const codigosExistentes = (existentes ?? []).map((p: { codigo: string }) => p.codigo)

  for (const linha of linhas) {
    if (linha.erro) {
      errosImportacao.push(linha.erro)
      continue
    }
    if (!linha.dados) continue

    const dados = linha.dados
    const erros = validarPonto(dados)
    if (erros.length > 0) {
      errosImportacao.push(`linha ${linha.linha} — ${erros.map(e => e.mensagem).join('; ')}`)
      continue
    }

    if (!dados.codigo && dados.municipio) {
      dados.codigo = gerarCodigo(dados.municipio, [...codigosExistentes, ...validos.map(v => v.codigo!).filter(Boolean)])
    }

    if (dados.codigo && codigosExistentes.includes(dados.codigo)) {
      errosImportacao.push(`linha ${linha.linha} — código "${dados.codigo}" já existe`)
      continue
    }

    validos.push({ ...dados, empresa_id: perfil.empresa_id })
  }

  if (validos.length > 0) {
    const { error } = await supabase.from('pontos_midia').insert(validos)
    if (error) return { error: `Erro ao inserir: ${error.message}`, erros: errosImportacao }
  }

  revalidatePath('/inventario')
  return { importados: validos.length, erros: errosImportacao }
}

export interface FiltrosPontos {
  tipo?: string
  municipio?: string
  status?: string
  q?: string
}

export async function exportarPontosAction(filtros: FiltrosPontos): Promise<string> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Não autorizado')

  const { data: perfil } = await supabase
    .from('usuarios')
    .select('empresa_id')
    .eq('id', user.id)
    .single()

  if (!perfil) throw new Error('Perfil não encontrado')

  let query = supabase
    .from('pontos_midia')
    .select('*')
    .eq('empresa_id', perfil.empresa_id)
    .order('codigo')

  if (filtros.tipo) query = query.eq('tipo', filtros.tipo)
  if (filtros.municipio) query = query.eq('municipio', filtros.municipio)
  if (filtros.status) query = query.eq('status', filtros.status)
  if (filtros.q) query = query.or(`codigo.ilike.%${filtros.q}%,nome.ilike.%${filtros.q}%`)

  const { data, error } = await query
  if (error) throw new Error(error.message)

  return gerarExportacao(data as PontoMidia[])
}

export async function alterarFotoPonto(
  id: string,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Não autorizado' }

  const { data: perfil } = await supabase
    .from('usuarios')
    .select('empresa_id, perfil')
    .eq('id', user.id)
    .single()

  if (!perfil || !['admin', 'gerente'].includes(perfil.perfil)) {
    return { error: 'Sem permissão' }
  }

  const foto = formData.get('foto') as File | null
  if (!foto || foto.size === 0) return { error: 'Nenhuma foto enviada' }

  try {
    const url = await uploadFoto(supabase, perfil.empresa_id, id, foto)
    if (url) {
      await supabase
        .from('pontos_midia')
        .update({ fotos_urls: [url] })
        .eq('id', id)
        .eq('empresa_id', perfil.empresa_id)
    }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Erro no upload' }
  }

  revalidatePath(`/inventario/${id}`)
  return {}
}
