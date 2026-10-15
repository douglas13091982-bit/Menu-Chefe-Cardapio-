import { describe, it, expect } from 'vitest'
import { errorPt } from '../lib/errors-pt'

describe('errorPt', () => {
  it('traduz senha fraca (texto e código)', () => {
    expect(errorPt({ message: 'Password is known to be weak and easy to guess, please choose a different one.' })).toMatch(/senha é fraca/)
    expect(errorPt({ code: 'weak_password', message: 'x' })).toMatch(/senha é fraca/)
  })
  it('traduz erros comuns', () => {
    expect(errorPt({ message: 'Invalid login credentials' })).toBe('E-mail ou senha incorretos.')
    expect(errorPt({ message: 'Password should be at least 8 characters.' })).toBe('A senha precisa ter pelo menos 8 caracteres.')
    expect(errorPt({ message: 'User already registered' })).toBe('Este e-mail já tem cadastro.')
    expect(errorPt({ message: 'new row violates row-level security policy for table "orders"' })).toMatch(/Sem permissão/)
    expect(errorPt({ message: 'Failed to fetch' })).toMatch(/Sem conexão/)
    expect(errorPt({ message: 'email rate limit exceeded' })).toMatch(/Aguarde/)
  })
  it('mantém mensagens que já estão em português e usa o texto padrão quando não há mensagem', () => {
    expect(errorPt({ message: 'Esse e-mail já tem conta.' })).toBe('Esse e-mail já tem conta.')
    expect(errorPt(null, 'padrão')).toBe('padrão')
  })
})
