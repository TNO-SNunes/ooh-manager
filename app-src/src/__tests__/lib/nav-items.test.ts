import { describe, it, expect } from 'vitest'
import { getNavItems, getNavSections } from '@/components/layout/nav-items'

describe('getNavItems', () => {
  it('admin recebe todos os itens de nível raiz incluindo calendário e reservas', () => {
    const hrefs = getNavItems('admin').map(i => i.href)
    expect(hrefs).toContain('/')
    expect(hrefs).toContain('/inventario')
    expect(hrefs).toContain('/clientes')
    expect(hrefs).toContain('/campanhas')
    expect(hrefs).toContain('/calendario')
    expect(hrefs).toContain('/reservas')
    expect(hrefs).toContain('/os')
    expect(hrefs).toContain('/relatorios')
    expect(hrefs).toContain('/usuarios')
    expect(hrefs).toContain('/configuracoes')
  })

  it('admin tem subitens de calendário', () => {
    const items = getNavItems('admin')
    const cal = items.find(i => i.href === '/calendario')
    expect(cal?.children?.map(c => c.href)).toEqual(
      expect.arrayContaining(['/calendario/led', '/calendario/frontlight', '/calendario/outdoor'])
    )
  })

  it('admin tem subitens de reservas e aprovações como item raiz', () => {
    const items = getNavItems('admin')
    const res = items.find(i => i.href === '/reservas')
    const hrefs = res?.children?.map(c => c.href) ?? []
    expect(hrefs).toContain('/reservas/nova')
    expect(hrefs).toContain('/reservas/minhas')
    // aprovações agora é item raiz, não subitem de reservas
    const allHrefs = items.map(i => i.href)
    expect(allHrefs).toContain('/aprovacoes')
  })

  it('vendedor não tem /aprovacoes nem /inventario', () => {
    const items = getNavItems('vendedor')
    const res = items.find(i => i.href === '/reservas')
    const subHrefs = res?.children?.map(c => c.href) ?? []
    expect(subHrefs).not.toContain('/aprovacoes')
    const allHrefs = items.map(i => i.href)
    expect(allHrefs).not.toContain('/inventario')
  })

  it('vendedor tem subitem minhas reservas', () => {
    const items = getNavItems('vendedor')
    const res = items.find(i => i.href === '/reservas')
    expect(res?.children?.map(c => c.href)).toContain('/reservas/minhas')
  })

  it('midia não tem calendário', () => {
    const hrefs = getNavItems('midia').map(i => i.href)
    expect(hrefs).not.toContain('/calendario')
  })

  it('funcionario e checkin retornam lista vazia', () => {
    expect(getNavItems('funcionario')).toHaveLength(0)
    expect(getNavItems('checkin')).toHaveLength(0)
  })

  it('gerente tem /aprovacoes como item raiz e /usuarios', () => {
    const items = getNavItems('gerente')
    const hrefs = items.map(i => i.href)
    expect(hrefs).toContain('/aprovacoes')
    expect(hrefs).toContain('/usuarios')
  })

  it('vendedor não vê Todas as Reservas (/reservas/todas)', () => {
    const res = getNavItems('vendedor').find(i => i.href === '/reservas')
    const subHrefs = res?.children?.map(c => c.href) ?? []
    expect(subHrefs).not.toContain('/reservas/todas')
  })
})

describe('getNavSections', () => {
  it('retorna seções sem itens vazios', () => {
    const sections = getNavSections('vendedor')
    sections.forEach(section => {
      expect(section.items.length).toBeGreaterThan(0)
    })
  })
})
