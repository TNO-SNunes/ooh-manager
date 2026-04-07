import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AuthProvider, useAuthContext } from '@/contexts/auth-context'
import type { Usuario } from '@/types'

const mockProfile: Usuario = {
  id: 'user-1',
  empresa_id: 'empresa-1',
  nome: 'Sergio',
  email: 'sergio@test.com',
  perfil: 'admin',
  ativo: true,
  criado_em: '2026-01-01',
}

function TestConsumer() {
  const { profile, loading } = useAuthContext()
  if (loading) return <div>loading</div>
  if (!profile) return <div>no profile</div>
  return <div>{profile.nome}</div>
}

it('exibe loading enquanto busca perfil', () => {
  render(
    <AuthProvider initialProfile={null} loading={true}>
      <TestConsumer />
    </AuthProvider>
  )
  expect(screen.getByText('loading')).toBeInTheDocument()
})

it('exibe nome do usuário após carregar', () => {
  render(
    <AuthProvider initialProfile={mockProfile} loading={false}>
      <TestConsumer />
    </AuthProvider>
  )
  expect(screen.getByText('Sergio')).toBeInTheDocument()
})

it('exibe no profile quando não há usuário', () => {
  render(
    <AuthProvider initialProfile={null} loading={false}>
      <TestConsumer />
    </AuthProvider>
  )
  expect(screen.getByText('no profile')).toBeInTheDocument()
})
