import { describe, it, expect } from 'vitest'
import { getNavItems, getNavSections } from '@/components/layout/nav-items'

describe('getNavItems', () => {
  it('admin recebe todos os itens incluindo usuários e configurações', () => {
    const hrefs = getNavItems('admin').map(i => i.href)
    expect(hrefs).toContain('/')
    expect(hrefs).toContain('/inventario')
    expect(hrefs).toContain('/clientes')
    expect(hrefs).toContain('/campanhas')
    expect(hrefs).toContain('/reservas')
    expect(hrefs).toContain('/os')
    expect(hrefs).toContain('/relatorios')
    expect(hrefs).toContain('/usuarios')
    expect(hrefs).toContain('/configuracoes')
  })

  it('vendedor recebe clientes e campanhas mas não inventario, os ou usuarios', () => {
    const hrefs = getNavItems('vendedor').map(i => i.href)
    expect(hrefs).not.toContain('/inventario')
    expect(hrefs).not.toContain('/os')
    expect(hrefs).not.toContain('/usuarios')
    expect(hrefs).toContain('/clientes')
    expect(hrefs).toContain('/campanhas')
    expect(hrefs).toContain('/reservas')
    expect(hrefs).toContain('/relatorios')
    expect(hrefs).toContain('/configuracoes')
  })

  it('midia recebe inventario, clientes, campanhas, reservas, os e relatorios', () => {
    const hrefs = getNavItems('midia').map(i => i.href)
    expect(hrefs).toContain('/inventario')
    expect(hrefs).toContain('/clientes')
    expect(hrefs).toContain('/campanhas')
    expect(hrefs).toContain('/reservas')
    expect(hrefs).toContain('/os')
    expect(hrefs).toContain('/relatorios')
    expect(hrefs).not.toContain('/usuarios')
    expect(hrefs).not.toContain('/calendario')
  })

  it('funcionario e checkin retornam lista vazia (usam FieldLayout)', () => {
    expect(getNavItems('funcionario')).toHaveLength(0)
    expect(getNavItems('checkin')).toHaveLength(0)
  })

  it('gerente recebe itens iguais ao admin exceto configurações de empresa', () => {
    const hrefs = getNavItems('gerente').map(i => i.href)
    expect(hrefs).toContain('/usuarios')
    expect(hrefs).toContain('/configuracoes')
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
